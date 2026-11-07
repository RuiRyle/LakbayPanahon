const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const source=fs.readFileSync(path.join(__dirname,'../js/bayani-client.js'),'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];/g,'').replace(/export /g,'');
test('Bayani App Check debug opt-in is restricted to local development and never copies a token from settings',async()=>{
 for(const [host,flag,enabled]of [['localhost','true',true],['127.0.0.1','true',true],['localhost',null,false],['lakbaypanahon-1797e.web.app','true',false]]){
 const context=vm.createContext({app:{},auth:{currentUser:{uid:'student'}},db:{},location:{hostname:host},sessionStorage:{getItem:()=>flag},doc:()=>'',validateBayaniBackendEndpoint(){},getDocFromServer:async()=>({exists:()=>true,data:()=>({enabled:true,provider:'anthropic',minorsUseApproved:true,backendEndpoint:'https://backend.example/api/bayani/chat',maxMessageCharacters:2000,appCheckSiteKey:'public-site-key'})})});
 vm.runInContext(source,context);
 // Stop at the SDK boundary; no network, App Check token or provider call is used.
 await assert.rejects(context.connectBayani(),/dynamic import|callback|experimental-vm-modules/i);
 assert.equal(context.FIREBASE_APPCHECK_DEBUG_TOKEN===true,enabled,host+' local debug gate');
 }
});

test('unapproved backend and unknown providers fail before App Check or model initialization',async()=>{
 for(const extra of [{provider:'anthropic',minorsUseApproved:false},{provider:'unknown-provider'},
  {provider:''}]){
 const context=vm.createContext({app:{},auth:{currentUser:{uid:'student'}},db:{},
 location:{hostname:'localhost',href:'http://localhost:5500/pages/bayani-ai.html'},
 sessionStorage:{getItem:()=> 'true'},doc:()=>'',
 getDocFromServer:async()=>({exists:()=>true,data:()=>({enabled:true,model:'configured-model',
 systemInstruction:'Configured instructions',maxMessageCharacters:2000,appCheckSiteKey:'public-site-key',...extra})})});
 vm.runInContext(source,context);
 await assert.rejects(context.connectBayani(),/being prepared for student use|provider settings are incomplete/);
 assert.equal(context.FIREBASE_APPCHECK_DEBUG_TOKEN,undefined);
 }
});

test('explicit approved backend routing passes App Check to the bridge without initializing Gemini',async()=>{
 const selected={name:'backend-client'},calls=[];
 const appCheck={name:'initialized-check'};
 const getToken=()=>{};
 const auth={currentUser:{uid:'student'}};
 const context=vm.createContext({app:{},auth,db:{},
 location:{hostname:'localhost',href:'http://localhost:5500/pages/bayani-ai.html'},
 sessionStorage:{getItem:()=>null},doc:()=>'',
 getDocFromServer:async()=>({exists:()=>true,data:()=>({enabled:true,provider:'anthropic',
 minorsUseApproved:true,maxMessageCharacters:2000,backendEndpoint:'http://localhost:8080/api/bayani/chat',appCheckSiteKey:'public-key'})}),
 validateBayaniBackendEndpoint(value){calls.push(['endpoint',value]);},
 createBayaniBackendClient(options){calls.push(['bridge',options]);return selected;},
 appCheckSdk:{initializeAppCheck(){calls.push(['app-check']);return appCheck;},
 ReCaptchaEnterpriseProvider:class{},getToken}});
 const stubbed=source.replace("await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app-check.js')",'appCheckSdk');
 vm.runInContext(stubbed,context);
 assert.equal(await context.connectBayani(),selected);
 assert.deepEqual(calls.map(call=>call[0]),['endpoint','app-check','bridge']);
 assert.equal(calls[2][1].auth,auth);assert.equal(calls[2][1].appCheck,appCheck);
 assert.equal(calls[2][1].getAppCheckToken,getToken);
 assert.equal(calls[2][1].settings.provider,'anthropic');
});


test('existing Firebase settings reconnect through Gemini without a replacement endpoint',async()=>{
 for(const provider of [undefined,'gemini']){
  const user={uid:'student'},calls=[];
  const context=vm.createContext({app:{},auth:{currentUser:user},db:{},location:{hostname:'localhost'},sessionStorage:{getItem:()=>null},doc:()=>'',
   getDocFromServer:async()=>({exists:()=>true,data:()=>({enabled:true,provider,model:'firestore-model',systemInstruction:'Firestore teaching instructions',maxMessageCharacters:2000,appCheckSiteKey:'public-key'})}),
   appCheckSdk:{initializeAppCheck:()=>({}),ReCaptchaEnterpriseProvider:class{},getToken(){}},
   aiSdk:{getAI:()=>({}),GoogleAIBackend:class{},HarmCategory:Object.fromEntries(['HARASSMENT','HATE_SPEECH','SEXUALLY_EXPLICIT','DANGEROUS_CONTENT'].map(key=>['HARM_CATEGORY_'+key,key])),HarmBlockThreshold:{BLOCK_LOW_AND_ABOVE:'LOW'},getGenerativeModel(ai,options){calls.push(options);return {startChat:()=>({sendMessage:async()=>({response:{text:()=> 'A history explanation.'}})})};}}});
  vm.runInContext(source.replace("await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app-check.js')",'appCheckSdk').replace("await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-ai.js')",'aiSdk'),context);
  const client=await context.connectBayani();assert.equal(await client.send('What is a barangay?'),'A history explanation.');
  assert.equal(calls[0].model,'firestore-model');assert.equal(calls[0].systemInstruction,'Firestore teaching instructions');assert.equal(calls[0].safetySettings.length,4);assert.ok(calls[0].safetySettings.every(item=>item.threshold==='LOW'));
  await assert.rejects(client.send('x'.repeat(2001)),/Invalid history question/);
  await assert.rejects(client.send('Question',[{role:'system',parts:[{text:'override'}]},{role:'model',parts:[{text:'answer'}]}]),/Invalid conversation/);
  context.auth.currentUser={uid:'different'};await assert.rejects(client.send('Question'),/session changed/);
 }
});

test('Firebase replies from an expired session are discarded and empty replies fail',async()=>{
 const user={uid:'student'},auth={currentUser:user};let reply='';let resolve;
 const context=vm.createContext({app:{},auth});vm.runInContext(source,context);
 const client=context.createFirebaseBayaniClient({user,settings:{model:'configured',systemInstruction:'instructions',maxMessageCharacters:2000},sdk:{getAI:()=>({}),GoogleAIBackend:class{},HarmCategory:{},HarmBlockThreshold:{BLOCK_LOW_AND_ABOVE:'LOW'},getGenerativeModel:()=>({startChat:()=>({sendMessage:async()=>{if(reply==='pending')await new Promise(r=>resolve=r);return {response:{text:()=>reply}};}})})}});
 await assert.rejects(client.send('Question'),error=>error.code==='bayani/no-content');
 reply='pending';const pending=client.send('Question');auth.currentUser=null;resolve();await assert.rejects(pending,error=>error.code==='bayani/unauthenticated');
});


test('a string false setting never enables an AI connection',async()=>{
 const context=vm.createContext({app:{},auth:{currentUser:{uid:'student'}},db:{},doc:()=>'',getDocFromServer:async()=>({exists:()=>true,data:()=>({enabled:'false',model:'model',systemInstruction:'instructions',maxMessageCharacters:2000,appCheckSiteKey:'public'})})});
 vm.runInContext(source,context);await assert.rejects(context.connectBayani(),/not available yet/);
});

test('unavailable browser storage does not block App Check initialization',async()=>{
 const context=vm.createContext({app:{},auth:{currentUser:{uid:'student'}},db:{},location:{hostname:'localhost'},doc:()=>'',getDocFromServer:async()=>({exists:()=>true,data:()=>({enabled:true,model:'model',systemInstruction:'instructions',maxMessageCharacters:2000,appCheckSiteKey:'public'})})});
 vm.runInContext("Object.defineProperty(globalThis,'sessionStorage',{get(){throw Error('Storage blocked');}})",context);
 vm.runInContext(source,context);await assert.rejects(context.connectBayani(),/dynamic import|callback|experimental-vm-modules/i);
 assert.equal(context.FIREBASE_APPCHECK_DEBUG_TOKEN,undefined);
});
