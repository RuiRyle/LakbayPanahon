const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('dashboard review discards old responses and reloads after same-account sign-in',async()=>{
 const container={textContent:''},button={disabled:false,addEventListener(){}};
 let listener,release,blocked=false,fail=false;
 const gate=new Promise(resolve=>{release=resolve;});
 const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},console:{warn(){}},
 document:{getElementById:id=>id==='studentReviewTopics'?container:button},
 onAuthStateChanged:(_,fn)=>{listener=fn;},collection:(_,name)=>({name}),where:()=>({}),query:ref=>ref,
 getDocs:async()=>{if(blocked)await gate;if(fail)throw Error('Offline');return{docs:[]};},
 missionReviewTopics:()=>[],renderReviewTopics:(_,topics,chapters,message)=>{container.textContent=message;}});
 const source=fs.readFileSync(path.join(__dirname,'../js/student-review.js'),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,'');
 vm.runInContext(fs.readFileSync(path.join(__dirname,"../js/review-question-catalog.js"),"utf8").replace(/export /g,""),context);
 vm.runInContext(source,context);
 blocked=true;listener(context.auth.currentUser);await Promise.resolve();
 context.auth.currentUser=null;listener(null);
 assert.equal(button.disabled,true);assert.match(container.textContent,/Sign in/);
 blocked=false;context.auth.currentUser={uid:'student'};listener(context.auth.currentUser);
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(container.textContent,/saved quizzes and practice/);assert.equal(button.disabled,false);
 const fresh=container.textContent;fail=true;release();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(container.textContent,fresh,'Old failed response replaced fresh review');
 await context.loadReview();assert.match(container.textContent,/could not load/);assert.equal(button.disabled,false);
});
test('review panel reports missing lesson events instead of resetting the lesson stage',async()=>{
 const container={textContent:''},button={disabled:false,addEventListener(){}};
 const context=vm.createContext({auth:{currentUser:{uid:'student'}},db:{},console:{warn(){}},
  document:{getElementById:id=>id==='studentReviewTopics'?container:button},onAuthStateChanged:()=>{},
  collection:(_,name)=>({name}),where:()=>({}),query:ref=>ref,
  getDocs:async ref=>{if(ref.name==='studentReviewEvents')throw Error('Unavailable');return{docs:[]};},
  missionReviewTopics:()=>{throw Error('Incomplete evidence was used');},renderReviewTopics:()=>{throw Error('Incomplete evidence was rendered');}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/review-question-catalog.js'),'utf8').replace(/export /g,''),context);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/student-review.js'),'utf8').replace(/import[\s\S]*?from\s+"[^"]+";/g,''),context);
 await context.loadReview();assert.match(container.textContent,/could not load your review topics/);assert.equal(button.disabled,false);
});
