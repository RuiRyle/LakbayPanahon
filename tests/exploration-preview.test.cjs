const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
function boot(hostname,setting){
 const storage=new Map(setting===undefined?[]:[['lakbayExplorationPreview',setting]]),nodes=[];
 const node=()=>({style:{},children:[],setAttribute(){},append(...children){this.children.push(...children);},addEventListener(name,fn){this[name]=fn;}});
 storage.set('unrelated-preference','keep');
 const context=vm.createContext({window:{location:{hostname,reload(){context.reloaded=true;}}},sessionStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:{getElementById:()=>null,createElement:()=>{const n=node();nodes.push(n);return n;},body:{style:{},append(){}}}});
 vm.runInContext(fs.readFileSync(require.resolve('../js/exploration-preview.js'),'utf8').replace(/export /g,''),context);context.initializeExplorationPreview();return{context,nodes,storage};
}
test('all student hosts use normal learning, ignore retired mode settings and expose no testing controls',()=>{
 for(const host of ['localhost','127.0.0.1','[::1]','lakbaypanahon-1797e.web.app','school.example','192.168.1.2'])for(const value of [undefined,'on','off']){
  const {context,nodes,storage}=boot(host,value);assert.equal(context.__lakbayExplorationPreview,false);assert.equal(storage.has('lakbayExplorationPreview'),false);assert.equal(storage.get('unrelated-preference'),'keep');assert.equal(nodes.length,0);assert.equal(context.document.body.style.paddingBottom,undefined);assert.equal(context.reloaded,undefined);
 }
});

test('retired mode stays disabled with blocked storage and removes a leftover testing bar',()=>{
 let removed=false;const context=vm.createContext({__lakbayExplorationPreview:true,sessionStorage:{removeItem(){throw Error('Storage unavailable');}},document:{getElementById:id=>id==='explorationPreviewBar'?{remove(){removed=true;}}:null}});
 vm.runInContext(fs.readFileSync(require.resolve('../js/exploration-preview.js'),'utf8').replace(/export /g,''),context);context.initializeExplorationPreview();assert.equal(context.__lakbayExplorationPreview,false);assert.equal(removed,true);
});

test('legacy preview drafts remain isolated from saved learning records in an older page',async()=>{
 const store=new Map(),status={};const context=vm.createContext({__lakbayExplorationPreview:true,auth:{currentUser:{uid:'s'}},sessionStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}});
 vm.runInContext(fs.readFileSync(require.resolve('../js/learning-draft.js'),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'').replace(/export /g,''),context);
 const draft=context.learningDraft('quiz','c','m',status);draft.save({answer:'A'});assert.match(status.textContent,/this tab only/);
 assert.equal((await draft.read()).answer,'A');context.auth.currentUser={uid:'other'};assert.equal(await draft.read(),null);
 context.auth.currentUser={uid:'s'};await draft.clear();assert.equal(store.size,0);
});
