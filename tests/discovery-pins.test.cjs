const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const body=file=>fs.readFileSync(path.join(__dirname,'../js',file),'utf8').replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm,'').replace(/export /g,'');
function fixture(){const records=new Map();const storage={getItem:key=>records.get(key)||null,setItem:(key,value)=>records.set(key,value)};const context=vm.createContext({});vm.runInContext(body('discovery-pins.js'),context);return {context,records,storage};}
test('pins are isolated by account, bounded, deduplicated and contain references only',()=>{
 const {context:c,records,storage}=fixture();
 assert.equal(c.toggleDiscoveryPin('ana',{kind:'artifact',id:'a',title:'Never persist this'},storage).ok,true);
 assert.equal(c.readDiscoveryPins('ben',storage).pins.length,0);
 assert.deepEqual(JSON.parse(records.get(c.discoveryPinKey('ana'))),[{kind:'artifact',id:'a'}]);
 c.toggleDiscoveryPin('ana',{kind:'journal',id:'b'},storage);c.toggleDiscoveryPin('ana',{kind:'artifact',id:'c'},storage);
 assert.equal(c.toggleDiscoveryPin('ana',{kind:'artifact',id:'d'},storage).ok,false);
 assert.equal(c.toggleDiscoveryPin('ana',{kind:'artifact',id:'a'},storage).pinned,false);
 assert.equal(c.readDiscoveryPins('ana',storage).pins.length,2);
 assert.equal(c.toggleDiscoveryPin('ana',{kind:'journal',id:'../other'},storage).ok,false);
 assert.equal(c.toggleDiscoveryPin('',{kind:'artifact',id:'x'},storage).ok,false);
});
test('malformed and unavailable browser storage cannot invent a successful pin',()=>{
 const {context:c,records,storage}=fixture();
 records.set(c.discoveryPinKey('ana'),'not json');assert.equal(c.readDiscoveryPins('ana',storage).pins.length,0);
 records.set(c.discoveryPinKey('ana'),JSON.stringify([{kind:'artifact',id:'a'},{kind:'artifact',id:'a'},{kind:'unknown',id:'b'},{kind:'journal',id:'x/y'}]));
 assert.equal(c.readDiscoveryPins('ana',storage).pins.length,1);
 const denied={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
 assert.equal(c.readDiscoveryPins('ana',denied).available,false);
 assert.equal(c.toggleDiscoveryPin('ana',{kind:'artifact',id:'a'},denied).ok,false);
 const full={getItem:()=>null,setItem(){throw Error('quota');}};
 assert.equal(c.toggleDiscoveryPin('ana',{kind:'artifact',id:'a'},full).ok,false);
});
test('profile resolves pins only after matching ownership and active authored content',async()=>{
 const records=new Map(),reads=[];
 const context=vm.createContext({auth:{currentUser:{uid:'ana'}},db:{},document:{getElementById:()=>null},URLSearchParams,
  doc:(_,name,id)=>name+'/'+id,getDoc:async key=>{reads.push(key);return {id:key.split('/')[1],exists:()=>records.has(key),data:()=>records.get(key)};}});
 vm.runInContext(body('evidence-journal.js')+'\n'+body('discovery-wall-page.js'),context);
 records.set('studentArtifacts/ana_a',{userId:'ben',artifactId:'a',chapterId:'c'});
 records.set('artifacts/a',{status:'active',name:'A pot'});
 assert.equal(await context.pinnedDiscovery('ana',{kind:'artifact',id:'a'}),null);assert.equal(reads.length,1);
 records.set('studentArtifacts/ana_a',{userId:'ana',artifactId:'a',chapterId:'c'});
 assert.equal((await context.pinnedDiscovery('ana',{kind:'artifact',id:'a'})).title,'A pot');
 records.set('artifacts/a',{status:'inactive',name:'A pot'});assert.equal(await context.pinnedDiscovery('ana',{kind:'artifact',id:'a'}),null);
 records.set('studentEvidenceJournal/j',{userId:'ana',sceneId:'s',chapterId:'c',missionId:'m',clueIndex:0});
 records.set('storyScenes/s',{status:'active',missionId:'m',exploreItems:[{title:'A clue',discovery:'Authored explanation'}]});
 records.set('missions/m',{status:'active',chapterId:'c'});records.set('chapters/c',{status:'active'});
 assert.equal((await context.pinnedDiscovery('ana',{kind:'journal',id:'j'})).copy,'Authored explanation');
 records.set('chapters/c',{status:'inactive'});assert.equal(await context.pinnedDiscovery('ana',{kind:'journal',id:'j'}),null);
});
