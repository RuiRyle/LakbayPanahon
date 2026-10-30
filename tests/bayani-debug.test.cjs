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

test('legacy, missing, unapproved and unknown providers fail before any App Check or model initialization',async()=>{
 for(const extra of [{provider:'anthropic',minorsUseApproved:false},{provider:'unknown-provider'},
  {provider:'gemini',minorsUseApproved:true},{minorsUseApproved:true},{provider:null,minorsUseApproved:true}]){
 const context=vm.createContext({app:{},auth:{currentUser:{uid:'student'}},db:{},
 location:{hostname:'localhost',href:'http://localhost:5500/pages/bayani-ai.html'},
 sessionStorage:{getItem:()=> 'true'},doc:()=>'',
 getDocFromServer:async()=>({exists:()=>true,data:()=>({enabled:true,model:'configured-model',
 systemInstruction:'Configured instructions',maxMessageCharacters:2000,appCheckSiteKey:'public-site-key',...extra})})});
 vm.runInContext(source,context);
 await assert.rejects(context.connectBayani(),/being prepared for student use/);
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
