const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'build/priority3-release'),read=p=>fs.readFileSync(path.join(out,p),'utf8');
test('release overlays exactly seven files and preserves production AI/Firebase graph',()=>{
 const m=JSON.parse(read('manifest.json')),before=JSON.parse(read('baseline/file-map.json')),after=JSON.parse(read('hosting/file-map.json'));
 assert.equal(Object.keys(after).length,577);assert.equal(m.updates.length,7);assert.equal(m.preservedPaths,570);
 const uploads=m.inventory.filter(x=>x.file.startsWith('hosting/uploads/'));assert.equal(uploads.length,7);
 for(const payload of uploads)assert.ok(Object.values(after).includes(payload.sha256),payload.file);
 for(const [p,h]of Object.entries(before))if(!m.updates.some(u=>u.path===p))assert.equal(after[p],h,p);
 assert.match(read('hosting/public/js/firebase-config.js'),/export \{ app, auth, db, functions \}/);
 assert.match(read('hosting/public/js/ai-assistance-client.js'),/functions.*firebase-config/);
 assert.doesNotMatch(read('hosting/public/js/chapter-challenge.js'),/catch\{keepsake.replaceChildren/);
 assert.match(fs.readFileSync(path.join(root,'js/firebase-config.js'),'utf8'),/export \{ app, auth, db, functions \}/);
});
test('CSP changes only the exact callable connect origin and preserves all other headers',()=>{
 const before=JSON.parse(read('baseline/hosting-config.json')),after=JSON.parse(read('hosting/config.json'));
 const csp=after.headers.find(h=>h.headers?.['Content-Security-Policy']);
 csp.headers['Content-Security-Policy']=csp.headers['Content-Security-Policy'].replace(' https://asia-southeast1-lakbaypanahon-1797e.cloudfunctions.net','');
 assert.deepEqual(after,before);
 const generated=require('../functions/student-hosting-config.cjs').createHostingConfig().hosting.headers[0].headers.find(h=>h.key==='Content-Security-Policy').value;
 assert.match(generated,/connect-src [^;]*https:\/\/asia-southeast1-lakbaypanahon-1797e.cloudfunctions.net/);assert.doesNotMatch(generated,/https:\/\/\*\.cloudfunctions.net/);
});
test('release and rollback retain protected rules, disabled activation and only four secured endpoints',()=>{
 assert.equal(read('rules/firestore.rules'),read('rollback/firestore.rules'));
 assert.match(read('rules/firestore.rules'),/function rewardUpdate\(\) \{ return false; \}/);
 assert.equal(JSON.parse(read('policy/disabled-proposal.json')).enabled,false);
 const entry=read('functions/index.js');assert.equal((entry.match(/exports\.\w+=onCall/g)||[]).length,4);assert.doesNotMatch(entry,/getLearningAssistance|testStudentAuth/);assert.match(entry,/enforceAppCheck:process.env.FUNCTIONS_EMULATOR!=='true'/);
 assert.match(read('rollback/student-rewards-client.js'),/throw Error/);assert.doesNotMatch(read('rollback/student-rewards-client.js'),/runTransaction|setDoc/);
 const manifest=JSON.parse(read('manifest.json'));for(const item of manifest.inventory)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(out,item.file))).digest('hex'),item.sha256,item.file);
});
function productionTransport({token='fixture-token',existing=false}={}){
 let initialized=0,sent=0,requested=0;const ctx=vm.createContext({app:{},auth:{currentUser:{uid:'alice'}},db:{},firebaseEnvironment:{mode:'production'},sessionStorage:{getItem:()=>null,setItem:()=>{}},crypto:{randomUUID:crypto.randomUUID},getFunctions:()=>({}),doc:()=>({}),getDocFromServer:async()=>({data:()=>({appCheckSiteKey:'public-fixture-sitekey'})}),ReCaptchaEnterpriseProvider:class{},initializeAppCheck:()=>{initialized++;if(existing)throw Object.assign(Error('existing'),{code:'appCheck/already-initialized'});return{};},getToken:async()=>{requested++;return{token};},httpsCallable:()=>async()=>{sent++;return{data:{attemptId:'fixture',revision:0}};}});
 const source=read('hosting/public/js/student-assessment-client.js').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g,'').replace(/export /g,'');vm.runInContext(source,ctx);return{ctx,counts:()=>({initialized,sent,requested})};
}
test('production transport obtains an attestation before issuance; missing tokens fail closed',async()=>{
 const f=productionTransport();await f.ctx.beginAssessment({kind:'mission',missionId:'m1'});assert.deepEqual(f.counts(),{initialized:1,sent:1,requested:1});
 const missing=productionTransport({token:''});await assert.rejects(missing.ctx.beginAssessment({kind:'mission',missionId:'m1'}),/verification/);assert.equal(missing.counts().sent,0);
});
test('existing Bayani App Check initialization is preserved and SDK remains the transport authority',async()=>{
 const f=productionTransport({existing:true});await f.ctx.beginAssessment({kind:'mission',missionId:'m1'});assert.deepEqual(f.counts(),{initialized:1,sent:1,requested:0});
});
test('rollback callable package cannot read or write learner records',async()=>{
 const endpoints={},ctx=vm.createContext({exports:endpoints,process:{env:{}},require:name=>{assert.equal(name,'firebase-functions/v2/https');return{onCall:(_,handler)=>handler,HttpsError:class extends Error{constructor(code,message){super(message);this.code=code;}}};}});
 vm.runInContext(read('rollback/functions/index.js'),ctx);assert.equal(Object.keys(endpoints).length,4);
 for(const handler of Object.values(endpoints))await assert.rejects(handler({auth:{uid:'alice'},data:{score:100}}),/temporarily unavailable/);
});
test('runtime package drops unused conflicting test SDK and pins patched request parsers',()=>{
 const p=JSON.parse(read('functions/package.json')),lock=JSON.parse(read('functions/package-lock.json'));
 assert.equal(p.engines.node,'22');assert.equal(p.devDependencies,undefined);
 assert.equal(lock.packages['node_modules/firebase-admin'].version,'14.5.0');
 assert.equal(lock.packages['node_modules/firebase-functions'].version,'7.4.0');
 assert.equal(lock.packages['node_modules/body-parser'].version,'2.4.0');
 assert.equal(lock.packages['node_modules/qs'].version,'6.17.1');
});
