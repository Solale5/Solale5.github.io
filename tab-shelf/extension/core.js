export function safeUrl(url) {
  try { return ['https:', 'http:'].includes(new URL(url).protocol); } catch { return false; }
}
export function protection(tab) {
  if (tab.incognito) return 'Private tab';
  if (!safeUrl(tab.url)) return 'Browser / special page';
  if (tab.active) return 'Active in its window';
  if (tab.pinned) return 'Pinned';
  if (tab.audible) return 'Playing audio';
  if (tab.status === 'loading' || tab.pendingUrl) return 'Loading';
  if (tab.autoDiscardable === false) return 'Protected by Chrome';
  return '';
}
export function lastUsed(tab) {
  return Number.isFinite(tab.lastAccessed) && tab.lastAccessed > 0 ? tab.lastAccessed : null;
}
export function visibleTabs(tabs, {days = 0, hours = days * 24, search = '', hideProtected = false} = {}, now = Date.now()) {
  const term = search.toLowerCase();
  return tabs.filter(t => !t.incognito)
    .filter(t => !hideProtected || !protection(t))
    .filter(t => !hours || (lastUsed(t) !== null && now - lastUsed(t) >= hours * 3600000))
    .filter(t => `${t.title || ''} ${t.url || ''}`.toLowerCase().includes(term))
    .sort((a,b) => (lastUsed(a) ?? Infinity) - (lastUsed(b) ?? Infinity) || a.id - b.id);
}
// All mutations run through one service-worker queue. Persist the full recovery
// record before closing anything; recheck tab identity and protection afterward.
export async function archiveTabs(api, requests, now = Date.now()) {
  const {archive = []} = await api.storage.local.get('archive');
  const additions = [], skipped = [];
  for (const request of requests) {
    if (additions.some(x => x.tabId === request.id)) continue;
    try {
      const tab = await api.tabs.get(request.id);
      if (tab.url !== request.url || tab.lastAccessed !== request.lastAccessed || protection(tab)) {
        skipped.push(request.id); continue;
      }
      additions.push({id: crypto.randomUUID(), batch: now, savedAt: now,
        tabId: tab.id, title: tab.title || tab.url, url: tab.url,
        lastAccessed: lastUsed(tab), status: 'saved'});
    } catch { skipped.push(request.id); }
  }
  if (!additions.length) return {saved: 0, closed: 0, skipped: skipped.length};
  const next = [...additions, ...archive];
  await api.storage.local.set({archive: next});
  let closed = 0;
  for (const entry of additions) {
    try {
      const tab = await api.tabs.get(entry.tabId);
      if (tab.url !== entry.url || lastUsed(tab) !== entry.lastAccessed || protection(tab)) {
        entry.status = 'saved; left open'; continue;
      }
      await api.tabs.remove(entry.tabId);
      entry.status = 'closed'; closed++;
    } catch { entry.status = 'saved; closure unconfirmed'; }
  }
  // Even if this status update fails, the first write preserves every URL.
  try { await api.storage.local.set({archive: next}); } catch { /* recovery record already durable */ }
  return {saved: additions.length, closed, skipped: skipped.length};
}
export async function restoreEntry(api, id) {
  const {archive = []} = await api.storage.local.get('archive');
  const entry = archive.find(x => x.id === id);
  if (!entry || !safeUrl(entry.url)) throw new Error('This saved URL cannot be opened.');
  const tabs = await api.tabs.query({});
  const existing = tabs.find(t => !t.incognito && t.url === entry.url);
  if (existing) {
    await api.tabs.update(existing.id, {active:true});
    await api.windows.update(existing.windowId, {focused:true});
  } else await api.tabs.create({url: entry.url, active:false});
  return {existing: Boolean(existing)};
}

export function formatAge(time, now = Date.now()) {
  if (!Number.isFinite(time) || time <= 0) return 'Date unknown';
  const minutes = Math.max(0, Math.floor((now-time)/60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes/60), rest = minutes%60;
  if (hours < 24) return `${hours}h${rest ? ` ${rest}m` : ''} ago`;
  const days = Math.floor(hours/24);
  return `${days}d${hours%24 ? ` ${hours%24}h` : ''} ago`;
}

// Suggestions are transparent heuristics, never automatic closure decisions.
export function recommendations(tabs, now = Date.now()) {
  const result = new Map(), groups = new Map();
  for (const tab of tabs) {
    if (tab.incognito || !safeUrl(tab.url)) continue;
    if (!groups.has(tab.url)) groups.set(tab.url, []);
    groups.get(tab.url).push(tab);
  }
  const keep = new Set();
  for (const group of groups.values()) {
    group.sort((a,b) => Number(Boolean(protection(b)))-Number(Boolean(protection(a))) || (lastUsed(b)??Infinity)-(lastUsed(a)??Infinity) || a.id-b.id);
    if (group.length > 1) keep.add(group[0].id);
  }
  for (const tab of tabs) {
    if (protection(tab) || lastUsed(tab) === null) continue;
    const hours = (now-lastUsed(tab))/3600000;
    const duplicate = groups.get(tab.url)?.length > 1;
    if (duplicate && keep.has(tab.id)) continue;
    if (duplicate && hours >= 2) result.set(tab.id,{action:'close',reason:'Same URL open elsewhere · unused 2+ hours',rank:0});
    else if (hours >= 6 && !tab.discarded) result.set(tab.id,{action:'save',reason:'Unused 6+ hours · consider saving for later',rank:1});
  }
  return result;
}
export async function closeTabs(api, requests) {
  let closed=0, skipped=0;
  const seen=new Set();
  for (const request of requests) {
    if(seen.has(request.id))continue;seen.add(request.id);
    try {
      const tab=await api.tabs.get(request.id);
      if(tab.url!==request.url || tab.lastAccessed!==request.lastAccessed || protection(tab)){skipped++;continue;}
      await api.tabs.remove(tab.id);closed++;
    } catch {skipped++;}
  }
  return {closed,skipped};
}
