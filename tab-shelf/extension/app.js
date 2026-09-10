import {visibleTabs,protection,lastUsed,formatAge,recommendations} from './core.js';
const $ = id => document.getElementById(id);
let tabs=[], archive=[], view='live', selected=new Set(), busy=false, suggested=false;
const available=Boolean(globalThis.chrome?.runtime?.id);
const say = text => { $('status').textContent=text; };
const age = formatAge;
function domain(url) {try{return new URL(url).hostname;}catch{return 'Browser page';}}
function element(tag,className,text){const el=document.createElement(tag);el.className=className;if(text!==undefined)el.textContent=text;return el;}
function results(){const recs=recommendations(tabs);const rows=visibleTabs(tabs,{hours:suggested?0:Number($('age').value),search:$('search').value,hideProtected:$('hideProtected').checked});return suggested?rows.filter(t=>recs.has(t.id)).sort((a,b)=>recs.get(a.id).rank-recs.get(b.id).rank || (lastUsed(a)-lastUsed(b))):rows;}
function updateSelection(){
  const eligible=results().filter(t=>!protection(t));
  $('selectionCount').textContent=`${selected.size} selected`;
  $('archive').disabled=busy || !selected.size || !available;
  $('justClose').disabled=$('archive').disabled;
  $('selectAll').checked=eligible.length>0 && eligible.every(t=>selected.has(t.id));
  $('selectAll').indeterminate=eligible.some(t=>selected.has(t.id)) && !$('selectAll').checked;
}
function render(){
  $('openCount').textContent=tabs.filter(t=>!t.url?.startsWith('chrome-extension:')&&!t.incognito).length;
  $('oldCount').textContent=visibleTabs(tabs,{hours:2}).length;
  $('savedCount').textContent=archive.length;
  $('quickFilters').hidden=view!=='live';
  $('suggestionNote').hidden=view!=='live'||!suggested;
  const recs=recommendations(tabs);
  $('suggested').querySelector('span').textContent=recs.size;
  $('suggested').classList.toggle('chosen',suggested);$('suggested').setAttribute('aria-pressed',suggested);
  for(const chip of document.querySelectorAll('[data-hours]')) {
    const active=!suggested && chip.dataset.hours===$('age').value;
    chip.classList.toggle('chosen',active);chip.setAttribute('aria-pressed',active);
    chip.querySelector('span').textContent=visibleTabs(tabs,{hours:Number(chip.dataset.hours),hideProtected:$('hideProtected').checked}).length;
  }
  $('liveTools').hidden=view!=='live';$('ageLabel').hidden=view!=='live'||suggested;
  $('liveView').classList.toggle('chosen',view==='live');$('savedView').classList.toggle('chosen',view==='saved');
  $('liveView').setAttribute('aria-pressed',view==='live');$('savedView').setAttribute('aria-pressed',view==='saved');
  $('listTitle').textContent=view==='live'?(suggested?'SUGGESTIONS · DUPLICATES FIRST':'OLDEST USED FIRST'):'SAVED MOST RECENTLY';
  const q=$('search').value.toLowerCase();
  const rows=view==='live'?results():archive.filter(e=>`${e.title} ${e.url}`.toLowerCase().includes(q));
  $('resultCount').textContent=`${rows.length} results`;
  $('list').replaceChildren();
  for(const item of rows){
    const row=element('div','row');if(selected.has(item.id))row.classList.add('selected');
    if(view==='live'){
      const check=element('input','');check.type='checkbox';check.checked=selected.has(item.id);check.disabled=busy||Boolean(protection(item))||!available;
      check.setAttribute('aria-label',`Select ${item.title||item.url}`);
      check.onchange=()=>{check.checked?selected.add(item.id):selected.delete(item.id);row.classList.toggle('selected',check.checked);updateSelection();};row.append(check);
    }
    row.append(element('div','tile',domain(item.url)[0]?.toUpperCase()||'·'));
    const details=element('div','details');const title=element('div','title',item.title||item.url);title.title=item.title||item.url;
    const url=element('div','url',domain(item.url));url.title=item.url;details.append(title,url);if(view==='live'&&recs.has(item.id)){const rec=recs.get(item.id);details.append(element('div','recommendation',`${rec.action==='close'?'Just close?':'Save for later?'} ${rec.reason}`));}row.append(details);
    const right=element('div','right');
    if(view==='live'){
      const date=element('div','lastUsed',age(lastUsed(item)));date.title=lastUsed(item)?new Date(item.lastAccessed).toLocaleString():'Chrome did not supply a last-used date';right.append(date);
      const note=protection(item)||(item.discarded?'Already sleeping':'');if(note)right.append(element('span','badge',note));
    }else{
      const button=element('button','', 'Open');button.disabled=busy||!available;
      button.onclick=()=>perform(async()=>{const r=await message({type:'restore',id:item.id});say(r.existing?'Switched to the existing tab.':'Opened in a background tab. The backup stays on your shelf.');});
      right.append(button,element('div','url',`Saved ${age(item.savedAt).toLowerCase()}`));
    }
    row.append(right);$('list').append(row);
  }
  if(!rows.length)$('list').append(element('div','empty',view==='live'?(suggested?'No suggestions right now. Try the hour filters to review more tabs.':'Nothing matches. Try a shorter time range.'):'Your saved tabs will appear here.'));
  updateSelection();
}
async function message(payload){const r=await chrome.runtime.sendMessage(payload);if(!r?.ok)throw new Error(r?.error||'The extension did not respond.');return r.result;}
async function refresh(){
  if(!available){if(new URLSearchParams(location.search).has('demo')){const {demoTabs}=await import('./demo.js');tabs=demoTabs();}say('Preview only · sample tabs. Install in Chrome to manage your real tabs.');render();return;}
  [tabs,{archive=[]}]=await Promise.all([chrome.tabs.query({}),chrome.storage.local.get('archive')]);
  tabs=tabs.filter(t=>t.url!==chrome.runtime.getURL('index.html'));
  selected=new Set([...selected].filter(id=>tabs.some(t=>t.id===id&&!protection(t))));render();
}
async function perform(fn){if(busy)return;busy=true;render();try{await fn();}catch(e){say(`Couldn’t finish: ${e.message}. Any saved copies remain on your shelf.`);}finally{busy=false;await refresh().catch(e=>say(e.message));}}
for(const id of ['search','age','hideProtected'])$(id).addEventListener(id==='search'?'input':'change',()=>{selected.clear();render();});
for(const chip of document.querySelectorAll('[data-hours]'))chip.onclick=()=>{suggested=false;$('age').value=chip.dataset.hours;selected.clear();render();};
$('suggested').onclick=()=>{suggested=true;selected.clear();render();};
$('selectAll').onchange=()=>{selected=new Set($('selectAll').checked?results().filter(t=>!protection(t)).map(t=>t.id):[]);render();};
$('liveView').onclick=()=>{view='live';selected.clear();render();};$('savedView').onclick=()=>{view='saved';selected.clear();render();};
$('refresh').onclick=()=>refresh().then(()=>say('Updated.')).catch(e=>say(e.message));
let pending=[], pendingAction='archive';
function confirmAction(action){
  pendingAction=action;pending=tabs.filter(t=>selected.has(t.id)).map(({id,url,lastAccessed})=>({id,url,lastAccessed}));
  const saving=action==='archive';
  $('confirmTitle').textContent=saving?`Save & close ${pending.length} tabs?`:`Close ${pending.length} tabs without saving?`;
  $('confirmText').textContent=saving?'The selected URLs will be stored on your shelf before their tabs close. Unsaved text and page state are not saved.':'These tabs will close without adding them to your shelf. Use this for disposable tabs. Unsaved text and page state will be lost; Tab Shelf will have no recovery copy.';
  $('confirmEyebrow').textContent=saving?'SAVE FIRST. CLOSE SECOND.':'NO SHELF COPY';
  $('confirmSave').textContent=saving?'Save & close':'Close without saving';
  $('confirm').showModal();
}
$('archive').onclick=()=>confirmAction('archive');$('justClose').onclick=()=>confirmAction('close');
$('confirm').addEventListener('close',()=>{if($('confirm').returnValue!=='save')return;perform(async()=>{const r=await message({type:pendingAction,tabs:pending});selected.clear();say(pendingAction==='close'?`Closed ${r.closed} without saving; skipped ${r.skipped}.`:`Saved ${r.saved}; closed ${r.closed}; skipped ${r.skipped}. ${r.saved-r.closed>0?'Some saved tabs stayed open.':''}`);});});
$('export').onclick=async()=>{try{if(available)({archive=[]}=await chrome.storage.local.get('archive'));const blob=new Blob([JSON.stringify({format:'tab-shelf-v1',entries:archive},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`tab-shelf-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);say('Backup exported. It contains saved titles and URLs; keep it private.');}catch(e){say(e.message);}};
$('import').onclick=()=>{if(available)$('importFile').click();};
$('importFile').onchange=()=>perform(async()=>{const file=$('importFile').files[0];if(!file)return;if(file.size>10000000)throw new Error('Backup must be smaller than 10 MB.');const data=JSON.parse(await file.text());if(data.format!=='tab-shelf-v1'||!Array.isArray(data.entries))throw new Error('Choose a Tab Shelf backup.');const r=await message({type:'import',entries:data.entries});say(`Imported ${r.added} new URLs.`);$('importFile').value='';});
if(available){chrome.tabs.onRemoved.addListener(()=>{if(!busy)refresh().catch(e=>say(e.message));});chrome.storage.onChanged.addListener(()=>{if(!busy)refresh().catch(e=>say(e.message));});}
refresh().then(()=>{if(available)say('Review the oldest tabs first. Nothing closes until you select it and confirm.');}).catch(e=>say(e.message));
