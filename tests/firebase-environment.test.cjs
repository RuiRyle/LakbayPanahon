const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../js/firebase-config.js'),'utf8').replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g,'').replace(/export \{[^}]+\};/g,'');
function run(environment,hostname='localhost'){
 const calls=[];const scope=vm.createContext({firebaseEnvironment:environment,location:{hostname},initializeExplorationPreview(){},initializeApp:options=>{calls.push(['app',options.projectId]);return{options};},getAuth:()=>({}),getFirestore:()=>({}),initializeFirestore:(_,options)=>{assert.equal(options.experimentalForceLongPolling,true);return{};},getFunctions:()=>({}),connectAuthEmulator:(_,url)=>calls.push(['auth',url]),connectFirestoreEmulator:(_,host,port)=>calls.push(['firestore',host,port]),connectFunctionsEmulator:(_,host,port)=>calls.push(['functions',host,port]),document:{readyState:'loading',addEventListener(){}}});
 vm.runInContext(source,scope);return calls;
}
test('normal pages use the main project even on localhost',()=>{
 const calls=run(null);assert.deepEqual(calls,[['app','lakbaypanahon-1797e']]);
});
test('dedicated emulator config routes core SDK services to loopback demo endpoints',()=>{
 const calls=run({mode:'emulator',projectId:'demo-lakbay-local'});assert.equal(calls[0][1],'demo-lakbay-local');assert.equal(calls.length,3);assert.equal(calls[2][2],8180);
});

test('optional callable SDK retains its region and local emulator boundary',()=>{
 const optional=fs.readFileSync(require.resolve('../js/firebase-functions.js'),'utf8').replace(/import[^;]+;/g,'').replace(/export \{[^}]+\};/g,'');
 for(const local of [false,true]){
  const calls=[];vm.runInNewContext(optional,{app:{},firebaseEnvironment:local?{mode:'emulator'}:null,getFunctions:(_,region)=>{assert.equal(region,'asia-southeast1');return{};},connectFunctionsEmulator:(_,host,port)=>calls.push([host,port])});
  assert.equal(calls.length,local?1:0);if(local)assert.deepEqual(calls[0],['127.0.0.1',5001]);
 }
 assert.doesNotMatch(fs.readFileSync(require.resolve('../js/firebase-config.js'),'utf8'),/firebase-functions\.js|getFunctions/);
});
test('emulator opt-in fails closed on a hosted domain or unexpected project',()=>{
 assert.throws(()=>run({mode:'emulator',projectId:'demo-lakbay-local'},'example.com'),/restricted/);
 assert.throws(()=>run({mode:'emulator',projectId:'lakbaypanahon-1797e'}),/restricted/);
});
