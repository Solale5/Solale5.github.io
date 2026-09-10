import test from 'node:test';
import assert from 'node:assert/strict';
import {archiveTabs,restoreEntry,visibleTabs,protection,safeUrl} from '../core.js';
const now=1800000000000;
const makeTab=(id,extra={})=>({id,windowId:1,title:`Tab ${id}`,url:`https://example.com/${id}`,lastAccessed:now-id*86400000,active:false,pinned:false,audible:false,autoDiscardable:true,status:'complete',...extra});
function mock(tabs,failSave=false){
  let db={archive:[]}, writes=0;const removed=[],created=[],updated=[];
  const api={storage:{local:{get:async()=>structuredClone(db),set:async data=>{writes++;if(failSave===true || failSave===writes)throw Error('Storage full');db=structuredClone(data);}}},tabs:{get:async id=>{const t=tabs.find(t=>t.id===id&&!removed.includes(id));if(!t)throw Error('Missing');return structuredClone(t);},query:async()=>tabs.filter(t=>!removed.includes(t.id)),remove:async id=>{assert.ok(db.archive.some(x=>x.tabId===id),'persist before removal');removed.push(id);},create:async t=>{created.push(t);},update:async(...args)=>updated.push(args)},windows:{update:async()=>{}}};
  return {api,removed,created,updated,read:()=>db};
}
test('oldest-first filtering excludes unknown ages and private tabs',()=>{
  const tabs=[makeTab(1),makeTab(30),makeTab(7),makeTab(90,{incognito:true}),makeTab(5,{lastAccessed:undefined})];
  assert.deepEqual(visibleTabs(tabs,{days:7},now).map(t=>t.id),[30,7]);
  assert.deepEqual(visibleTabs(tabs,{},now).map(t=>t.id),[30,7,1,5]);
  assert.equal(visibleTabs(tabs,{search:'example.com/30'},now).length,1);
});
test('protects active, pinned, audible, loading, private and special tabs',()=>{
  for(const flags of [{active:true},{pinned:true},{audible:true},{status:'loading'},{pendingUrl:'https://x.test'},{incognito:true},{url:'chrome://settings'},{autoDiscardable:false}])assert.ok(protection(makeTab(1,flags)));
  assert.equal(protection(makeTab(1)), '');
  assert.equal(safeUrl('javascript:alert(1)'),false);
});
test('storage failure closes nothing',async()=>{
  const t=makeTab(1),m=mock([t],true);
  await assert.rejects(archiveTabs(m.api,[t]),/Storage full/);
  assert.deepEqual(m.removed,[]);
});
test('archives before close, deduplicates selected IDs, keeps recovery copies',async()=>{
  const t=makeTab(1),m=mock([t]);const r=await archiveTabs(m.api,[t,t],now);
  assert.equal(r.saved,1);assert.equal(r.closed,1);assert.deepEqual(m.removed,[1]);
  assert.equal(m.read().archive[0].url,t.url);assert.equal(m.read().archive[0].status,'closed');
});
test('changed URL or access time and protected tabs are skipped',async()=>{
  const old=makeTab(1),m=mock([makeTab(1,{url:'https://changed.test'}),makeTab(2,{active:true}),makeTab(3,{lastAccessed:now})]);
  const r=await archiveTabs(m.api,[old,makeTab(2),makeTab(3)],now);
  assert.equal(r.closed,0);assert.equal(r.skipped,3);
});
test('tab activated after save stays open with saved copy',async()=>{
  const t=makeTab(1),m=mock([t]);let reads=0;const get=m.api.tabs.get;
  m.api.tabs.get=async id=>{const result=await get(id);if(++reads>1)result.active=true;return result;};
  const r=await archiveTabs(m.api,[t],now);assert.equal(r.saved,1);assert.equal(r.closed,0);assert.equal(m.read().archive.length,1);
});
test('closing failure preserves the saved URL',async()=>{
  const t=makeTab(1),m=mock([t]);m.api.tabs.remove=async()=>{throw Error('Tab busy');};
  const r=await archiveTabs(m.api,[t],now);assert.equal(r.closed,0);assert.equal(m.read().archive[0].url,t.url);
});
test('second storage write failure still leaves durable recovery record',async()=>{
  const t=makeTab(1),m=mock([t],2);const r=await archiveTabs(m.api,[t],now);
  assert.equal(r.closed,1);assert.equal(m.read().archive[0].url,t.url);
});
test('restore opens a background tab and retains archive',async()=>{
  const t=makeTab(1),m=mock([t]);await archiveTabs(m.api,[t],now);
  await restoreEntry(m.api,m.read().archive[0].id);
  assert.deepEqual(m.created,[{url:t.url,active:false}]);assert.equal(m.read().archive.length,1);
});
test('restore focuses an existing URL without duplicating it',async()=>{
  const t=makeTab(1),m=mock([t]);await m.api.storage.local.set({archive:[{id:'saved',url:t.url}]});
  assert.equal((await restoreEntry(m.api,'saved')).existing,true);assert.equal(m.created.length,0);
});
test('unsafe restored URLs are rejected',async()=>{
  const m=mock([]);await m.api.storage.local.set({archive:[{id:'x',url:'javascript:alert(1)'}]});
  await assert.rejects(restoreEntry(m.api,'x'));assert.equal(m.created.length,0);
});

test('hour filters include the exact boundary and exclude newer/unknown timestamps',()=>{
  const tabs=[makeTab(1,{lastAccessed:now-7200000}),makeTab(2,{lastAccessed:now-7199999}),makeTab(3,{lastAccessed:now-1800000}),makeTab(4,{lastAccessed:undefined})];
  assert.deepEqual(visibleTabs(tabs,{hours:2},now).map(t=>t.id),[1]);
  assert.deepEqual(visibleTabs(tabs,{hours:0.5},now).map(t=>t.id),[1,2,3]);
});
test('relative ages distinguish minutes, hours and days',async()=>{
  const {formatAge}=await import('../core.js');
  assert.equal(formatAge(undefined,now),'Date unknown');
  assert.equal(formatAge(now+5000,now),'Just now');
  assert.equal(formatAge(now-30*60000,now),'30 min ago');
  assert.equal(formatAge(now-205*60000,now),'3h 25m ago');
  assert.equal(formatAge(now-25*3600000,now),'1d 1h ago');
});

test('suggestions preserve one duplicate and skip protected, recent, sleeping and unknown tabs',async()=>{
  const {recommendations}=await import('../core.js');
  const tabs=[makeTab(1,{url:'https://same.test',lastAccessed:now-10*3600000}),makeTab(2,{url:'https://same.test',lastAccessed:now-8*3600000}),makeTab(3,{lastAccessed:now-3600000}),makeTab(4,{pinned:true}),makeTab(5,{discarded:true}),makeTab(6,{lastAccessed:undefined}),makeTab(7,{lastAccessed:now-6*3600000})];
  const r=recommendations(tabs,now);
  assert.deepEqual([...r.keys()],[1,7]);assert.equal(r.get(1).action,'close');assert.equal(r.get(7).action,'save');
});
test('duplicate comparisons preserve full URLs including query and hash',async()=>{
  const {recommendations}=await import('../core.js');
  const a=makeTab(1,{url:'https://same.test?a=1',lastAccessed:now-3*3600000}),b=makeTab(2,{url:'https://same.test?a=2',lastAccessed:now-3*3600000});
  assert.equal(recommendations([a,b],now).size,0);
});
test('close-only stores nothing and rechecks changed/protected tabs',async()=>{
  const {closeTabs}=await import('../core.js');
  const a=makeTab(1),b=makeTab(2),c=makeTab(3),m=mock([a,{...b,active:true},{...c,url:'https://changed.test'}]);
  const closed=[];m.api.tabs.remove=async id=>closed.push(id);
  m.api.storage.local.set=async()=>{throw Error('Close-only must not save');};
  const r=await closeTabs(m.api,[a,a,b,c]);assert.deepEqual(closed,[1]);assert.deepEqual(r,{closed:1,skipped:2});assert.equal(m.read().archive.length,0);
});
