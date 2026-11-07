const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=file=>fs.readFileSync(require.resolve('../js/'+file),'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');
function element(){return {children:[],dataset:{},classList:{add(){}},append(...children){this.children.push(...children);},replaceChildren(){this.children=[];this.textContent='';},setAttribute(){},addEventListener(){},textContent:''};}
const text=node=>node.textContent+' '+node.children.map(text).join(' ');
function runtime(){
 const hosts={homeBadgePreview:element(),homeArtifactPreview:element(),refreshHomeCollections:element()},reads=[];
 const context=vm.createContext({console,Set,Map,URLSearchParams,Object,auth:{currentUser:{uid:'s'}},db:{},
  document:{getElementById:id=>hosts[id],createElement:element},window:{addEventListener(){}},onAuthStateChanged(){},
  collection:(_,name)=>({name}),where:(field,op,value)=>({field,value}),query:(ref,...filters)=>({...ref,filters}),
  instructionalSnapshot:(_,load)=>load(),getDocs:async ref=>{reads.push(ref);return{docs:[]};}
 });vm.runInContext(source('dashboard-collections.js'),context);return {context,hosts,reads};
}
test('collection previews use only the current student ownership and label locked catalog items',()=>{
 const {context}=runtime(),host=element(),catalog=[{id:'b1',status:'active',name:'<img src=x>',icon:'*'},{id:'b2',status:'active',name:'Second badge'}];
 context.renderDashboardCollection(host,catalog,[{userId:'s',badgeId:'b1'},{userId:'other',badgeId:'b2'}],'s',{key:'badgeId',catalog:'badges',label:'badge',fallback:'*'});
 assert.equal(host.children[0].dataset.state,'earned');assert.equal(host.children[1].dataset.state,'locked');assert.match(text(host),/<img src=x>/);assert.equal(host.children[0].children[0].textContent,'*');
});
test('legacy artifacts remain visible and missing catalog entries do not fabricate earned previews',()=>{
 const {context}=runtime(),host=element(),definition={key:'artifactId',catalog:'artifacts',label:'artifact',fallback:'*'};
 context.renderDashboardCollection(host,[{id:'a1',name:'Existing artifact'}],[{userId:'s',artifactId:'a1'}],'s',definition);assert.equal(host.children[0].dataset.state,'earned');
 context.renderDashboardCollection(host,[],[{userId:'s',artifactId:'retired'}],'s',definition);assert.match(text(host),/unavailable/);assert(!host.children.some(child=>child.dataset.state==='earned'));
});
test('preview loaders query owned records and keep failed sections separate',async()=>{
 const {context,hosts,reads}=runtime();context.getDocs=async ref=>{reads.push(ref);if(ref.name==='studentArtifacts')throw Error('offline');return{docs:[]};};
 await context.loadDashboardCollections(context.auth.currentUser);
 for(const name of ['studentBadges','studentArtifacts'])assert.equal(reads.find(ref=>ref.name===name).filters[0].value,'s');
 assert.match(hosts.homeArtifactPreview.textContent,/could not load/);assert.doesNotMatch(hosts.homeBadgePreview.textContent,/could not load/);assert.equal(hosts.refreshHomeCollections.disabled,false);
});
test('late collection loads cannot repaint after sign-out',async()=>{
 const {context,hosts}=runtime();let release;const gate=new Promise(resolve=>release=resolve);context.getDocs=async()=>{await gate;return{docs:[]};};
 const pending=context.loadDashboardCollections(context.auth.currentUser);context.auth.currentUser=null;await context.loadDashboardCollections(null);release();await pending;
 assert.match(hosts.homeBadgePreview.textContent,/Sign in/);assert.match(hosts.homeArtifactPreview.textContent,/Sign in/);
});
test('Bayani suggestions accept only named history prompts',()=>{
 const context=vm.createContext({URLSearchParams,Object});vm.runInContext(source('bayani-prompts.js'),context);
 assert.match(context.dashboardBayaniPrompt('?prompt=trade'),/seafaring/);assert.equal(context.dashboardBayaniPrompt('?prompt=__proto__'),'');assert.equal(context.dashboardBayaniPrompt('?prompt=%3Cscript%3E'),'');
});
test('Bayani prompt preparation fills an editable draft and never submits a message',()=>{
 let callback,submitted=0;const input={disabled:true,value:'',maxLength:2000,dispatchEvent(){},closest:()=>({prepend(){}})};
 const context=vm.createContext({URLSearchParams,Object,Event:class{},MutationObserver:class{constructor(fn){callback=fn;}observe(){}disconnect(){}},
  window:{location:{search:'?prompt=communities'},addEventListener(){}},document:{getElementById:()=>input,createElement:element},send(){submitted++;}});
 vm.runInContext(source('bayani-prompts.js')+'\n'+source('bayani-prompt-ui.js'),context);assert.equal(input.value,'');input.disabled=false;callback();assert.match(input.value,/early Filipino/);assert.equal(submitted,0);
 input.value='My own question';callback();assert.equal(input.value,'My own question');
});
