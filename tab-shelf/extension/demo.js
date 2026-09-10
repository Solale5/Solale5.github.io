// Synthetic, read-only layout fixtures. Never used inside the installed extension.
export const demoTabs = () => [
 [1,'A weekend in the mountains','https://example.com/travel',31],
 [2,'Understanding CSS grid','https://developer.mozilla.org/en-US/docs/Web/CSS/grid',14.3],
 [3,'Headphones comparison','https://example.com/headphones',8.7],
 [4,'Ideas for the next project','https://example.com/ideas',5.2],
 [5,'A recipe worth keeping','https://example.com/recipe',2.6],
 [6,'Current project','https://example.com/project',0.2]
].map(([id,title,url,h]) => ({id,title,url,lastAccessed:Date.now()-h*3600000,active:id===6,pinned:id===2,autoDiscardable:true,status:'complete',discarded:id===3}));
