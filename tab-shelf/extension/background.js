import {archiveTabs, restoreEntry, closeTabs} from './core.js';
let queue = Promise.resolve();
chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL('index.html');
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find(t => t.url === url);
  if (existing) {
    await chrome.tabs.update(existing.id, {active:true});
    await chrome.windows.update(existing.windowId, {focused:true});
  } else await chrome.tabs.create({url});
});
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL('index.html')) return;
  if (!['archive', 'close', 'restore', 'import'].includes(message.type)) return;
  const run = async () => {
    if (message.type === 'archive' || message.type === 'close') {
      if (!Array.isArray(message.tabs) || message.tabs.length > 500) throw new Error('Select at most 500 tabs per batch.');
      return message.type === 'close' ? closeTabs(chrome,message.tabs) : archiveTabs(chrome, message.tabs);
    }
    if (message.type === 'restore') return restoreEntry(chrome, message.id);
    const {safeUrl} = await import('./core.js');
    if (!Array.isArray(message.entries) || message.entries.length > 10000) throw new Error('Invalid backup (maximum 10,000 entries).');
    const {archive=[]} = await chrome.storage.local.get('archive');
    const urls = new Set(archive.map(x => x.url));
    const added=[];
    for (const row of message.entries) {
      if (!row || typeof row.url !== 'string' || !safeUrl(row.url) || urls.has(row.url)) continue;
      urls.add(row.url);
      added.push({id:crypto.randomUUID(),url:row.url,title:String(row.title || row.url).slice(0,2000),savedAt:Date.now(),status:'imported'});
    }
    await chrome.storage.local.set({archive:[...added,...archive]});
    return {added:added.length};
  };
  queue = queue.then(run,run);
  queue.then(result => respond({ok:true,result}), error => respond({ok:false,error:error.message}));
  return true;
});
