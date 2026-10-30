const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/learning-draft.js'),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'').replace(/export /g,'');
test('rapid draft changes skip obsolete queued writes and retry the newest state after quota failure',async()=>{
 const writes=[],button={hidden:true,disabled:false},status={textContent:'',retryButton:button};let release,limited=false;
 const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},doc:()=> 'draft',serverTimestamp:()=>1,
 setDoc:async(_,data)=>{writes.push(data.state.index);if(limited)throw Object.assign(Error('private service detail'),{code:'resource-exhausted'});await new Promise(resolve=>{release=resolve;});}});
 vm.runInContext(source,context);const draft=context.learningDraft('quiz','c1','m1',status);
 draft.save({index:1});await new Promise(resolve=>setImmediate(resolve));
 draft.save({index:2});draft.save({index:3});draft.save({index:4});
 limited=true;release();await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(writes,[1,4]);assert.match(status.textContent,/usage limit/);assert.doesNotMatch(status.textContent,/private service detail/);
 assert.equal(button.hidden,false);limited=false;button.onclick();await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(writes,[1,4,4]);assert.doesNotMatch(status.textContent,/place is saved/);
 release();await new Promise(resolve=>setImmediate(resolve));assert.match(status.textContent,/place is saved/);assert.equal(button.hidden,true);
});
test('draft writes serialize snapshots, recover failures and delete after pending saves',async()=>{
 const records=new Map(),status={textContent:''};let fail=true;
 const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},doc:(_,name,id)=>name+'/'+id,serverTimestamp:()=>1,
 getDocFromServer:async key=>({exists:()=>records.has(key),data:()=>records.get(key)}),
 setDoc:async(key,data)=>{if(fail){fail=false;throw Error('offline');}records.set(key,data);},deleteDoc:async key=>records.delete(key)});
 vm.runInContext(source,context);
 const draft=context.learningDraft('quiz','c1','m1',status);
 draft.save({index:1});await new Promise(resolve=>setImmediate(resolve));
 assert.match(status.textContent,/could not be saved/);
 const state={index:2};draft.save(state);state.index=99;
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal((await draft.read()).index,2);
 draft.save({index:3});await draft.clear();
 assert.equal(records.size,0);
 draft.save({index:4});await new Promise(resolve=>setImmediate(resolve));assert.equal(records.size,0);
 const closed=context.learningDraft('story','c1','m1',status);closed.save({sceneId:'s1'});closed.close();
 await new Promise(resolve=>setImmediate(resolve));assert.equal(records.size,0);
});

test('only the latest queued draft can report saved and closed cleanup cannot delete newer work',async()=>{
 const status={textContent:''},releases=[];let deleted=0;
 const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},doc:()=> 'draft',serverTimestamp:()=>1,
 setDoc:async()=>new Promise(resolve=>releases.push(resolve)),deleteDoc:async()=>{deleted++;}});
 vm.runInContext(source,context);
 const draft=context.learningDraft('quiz','c1','m1',status);
 draft.save({index:1});await new Promise(resolve=>setImmediate(resolve));
 draft.save({index:2});releases.shift()();await new Promise(resolve=>setImmediate(resolve));
 assert.match(status.textContent,/Saving/, 'Older response reported a newer answer as saved');
 releases.shift()();await new Promise(resolve=>setImmediate(resolve));
 assert.match(status.textContent,/place is saved/);
 draft.save({index:3});await new Promise(resolve=>setImmediate(resolve));
 const clearing=draft.clear();draft.close();releases.shift()();await clearing;
 assert.equal(deleted,0,'Cleanup from an abandoned session deleted the draft');
});

test('restart confirmation cancels cleanly and failed resets release interaction locks',async()=>{
 let click,confirmed=false,calls=0;
 const container={inert:false,prepend(){}},button={disabled:false,addEventListener:(_,fn)=>{click=fn;}};
 const context=vm.createContext({document:{createElement:()=>button},window:{confirm:()=>confirmed}});
 vm.runInContext(source,context);
 context.restartControl(container,'Restart',async()=>{calls++;throw Error('Offline');});
 await click();assert.equal(calls,0);assert.equal(container.inert,false);
 confirmed=true;await assert.rejects(click(),/Offline/);
 assert.equal(calls,1);assert.equal(button.disabled,false);assert.equal(container.inert,false);
});

test('explicit draft retry saves the failed snapshot and blocks duplicate retry clicks',async()=>{
 const button={hidden:true,disabled:false},status={textContent:'',retryButton:button};
 let fail=true,writes=0,saved;
 const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},doc:()=> 'draft',serverTimestamp:()=>1,
 setDoc:async(_,data)=>{writes++;if(fail)throw Error('Offline');saved=data;}});
 vm.runInContext(source,context);
 const draft=context.learningDraft('story','c1','m1',status);
 draft.save({sceneId:'s2'});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(button.hidden,false);assert.equal(button.disabled,false);
 fail=false;button.onclick();button.onclick();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(writes,2);assert.equal(saved.state.sceneId,'s2');assert.equal(button.hidden,true);
 fail=true;draft.save({sceneId:'s3'});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(button.hidden,false);draft.close();button.onclick();
 await new Promise(resolve=>setImmediate(resolve));assert.equal(writes,3);assert.equal(button.hidden,true);
});

test('unchanged restored or queued drafts do not write again but failed snapshots can retry',async()=>{
 let writes=0,fail=false;const status={textContent:''};
 const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},doc:()=> 'draft',serverTimestamp:()=>1,
 getDocFromServer:async()=>({exists:()=>true,data:()=>({state:{answers:{b:'B',a:'A'},index:1}})}),
 setDoc:async()=>{writes++;if(fail)throw Error('Offline');}});
 vm.runInContext(source,context);
 const draft=context.learningDraft('quiz','c1','m1',status);await draft.read();
 draft.save({index:1,answers:{a:'A',b:'B'}});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(writes,0,'Restored map ordering triggered a redundant write');
 draft.save({index:2});draft.save({index:2});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(writes,1,'Duplicate queued snapshots wrote twice');
 fail=true;draft.save({index:3});await new Promise(resolve=>setImmediate(resolve));
 fail=false;draft.save({index:3});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(writes,3,'Failed unchanged snapshot could not retry');
 assert.match(status.textContent,/place is saved/);
});

test('leaving warns only while the current draft is unsaved and removes its listener after save or close',async()=>{
 const listeners=new Map(),status={textContent:''};let release,fail=false;
 const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},doc:()=> 'draft',serverTimestamp:()=>1,
 addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),
 setDoc:async()=>{if(fail)throw Error('Offline');await new Promise(resolve=>{release=resolve;});}});
 vm.runInContext(source,context);
 const draft=context.learningDraft('quiz','c1','m1',status);draft.save({index:1});
 let prevented=false;const event={preventDefault:()=>{prevented=true;}};listeners.get('beforeunload')(event);
 assert.equal(prevented,true);assert.equal(event.returnValue,'');
 await new Promise(resolve=>setImmediate(resolve));release();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(listeners.size,0);
 fail=true;draft.save({index:2});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(listeners.has('beforeunload'),true,'Failed save lost leave protection');
 context.auth.currentUser=null;prevented=false;listeners.get('beforeunload')(event);assert.equal(prevented,false);
 draft.close();assert.equal(listeners.size,0);
});

test('offline drafts explain unsaved state, resume status on reconnect and preserve explicit failure retry',async()=>{
 const listeners=new Map(),status={textContent:''},navigator={onLine:false};let release,fail=false;
 const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},navigator,doc:()=> 'draft',serverTimestamp:()=>1,
 addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),
 setDoc:async()=>{if(fail)throw Error('Denied');await new Promise(resolve=>{release=resolve;});}});
 vm.runInContext(source,context);const draft=context.learningDraft('quiz','c1','m1',status);draft.save({index:1});
 assert.match(status.textContent,/offline.*has not been saved/);
 await new Promise(resolve=>setImmediate(resolve));navigator.onLine=true;listeners.get('online')();assert.match(status.textContent,/Saving your place/);
 navigator.onLine=false;listeners.get('offline')();assert.match(status.textContent,/offline/);
 release();await new Promise(resolve=>setImmediate(resolve));assert.match(status.textContent,/place is saved/);assert.equal(listeners.size,0);
 fail=true;draft.save({index:2});await new Promise(resolve=>setImmediate(resolve));navigator.onLine=true;listeners.get('online')();assert.match(status.textContent,/retry saving/,'Reconnect hid an explicit failure without retrying');
 draft.close();assert.equal(listeners.size,0);
});
