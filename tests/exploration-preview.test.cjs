const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
function boot(hostname,setting){
 const storage=new Map(setting===undefined?[]:[['lakbayExplorationPreview',setting]]),nodes=[];
 const node=()=>({style:{},children:[],setAttribute(){},append(...children){this.children.push(...children);},addEventListener(name,fn){this[name]=fn;}});
 const context=vm.createContext({window:{location:{hostname,reload(){context.reloaded=true;}}},sessionStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},document:{getElementById:()=>null,createElement:()=>{const n=node();nodes.push(n);return n;},body:{style:{},append(){}}}});
 vm.runInContext(fs.readFileSync(require.resolve('../js/exploration-preview.js'),'utf8').replace(/export /g,''),context);context.initializeExplorationPreview();return{context,nodes,storage};
}
test('preview defaults on only for local development and its restore button persists normal locks',()=>{
 const {context,nodes,storage}=boot('127.0.0.1');assert.equal(context.__lakbayExplorationPreview,true);const button=nodes.find(n=>n.textContent==='Restore normal locks');button.click();assert.equal(storage.get('lakbayExplorationPreview'),'off');assert.equal(context.reloaded,true);assert.equal(boot('localhost','off').context.__lakbayExplorationPreview,false);
 for(const host of ['lakbaypanahon-1797e.web.app','school.example','192.168.1.2'])assert.equal(boot(host,'on').context.__lakbayExplorationPreview,false);
});

test('preview drafts stay in this tab and never read or overwrite normal cloud drafts',async()=>{
 const store=new Map(),status={};const context=vm.createContext({__lakbayExplorationPreview:true,auth:{currentUser:{uid:'s'}},sessionStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}});
 vm.runInContext(fs.readFileSync(require.resolve('../js/learning-draft.js'),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'').replace(/export /g,''),context);
 const draft=context.learningDraft('quiz','c','m',status);draft.save({answer:'A'});assert.match(status.textContent,/this tab only/);
 assert.equal((await draft.read()).answer,'A');context.auth.currentUser={uid:'other'};assert.equal(await draft.read(),null);
 context.auth.currentUser={uid:'s'};await draft.clear();assert.equal(store.size,0);
});
