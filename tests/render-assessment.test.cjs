const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const {configuration,createApp}=require('../server/render/server.cjs'),express=require('../functions/node_modules/express');
const valid={ASSESSMENT_ENABLED:'true',GOOGLE_CLOUD_PROJECT:'lakbaypanahon-1797e',ASSESSMENT_ALLOWED_ORIGINS:'http://127.0.0.1:5500',GOOGLE_APPLICATION_CREDENTIALS:'/etc/secrets/firebase-service-account.json'};
test('activation requires intended project, secret file, explicit origins and no emulator bypass',()=>{assert.equal(configuration({}).enabled,false);assert.equal(configuration(valid).enabled,true);for(const patch of [{GOOGLE_CLOUD_PROJECT:'wrong'},{ASSESSMENT_ALLOWED_ORIGINS:'*'},{GOOGLE_APPLICATION_CREDENTIALS:'credentials.json'},{FUNCTIONS_EMULATOR:'true'},{FIREBASE_APPCHECK_DEBUG_TOKEN:'true'}])assert.throws(()=>configuration({...valid,...patch}));});
async function serve(config,callables,run,studentAccessConfig){const server=http.createServer(createApp({express,config,callables,studentAccessConfig}));await new Promise(r=>server.listen(0,'127.0.0.1',r));try{await run('http://127.0.0.1:'+server.address().port);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}}
test('disabled deployment is healthy without exposing grading or credentials',async()=>serve(configuration({}),{},async base=>{let r=await fetch(base+'/healthz');assert.deepEqual(await r.json(),{status:'ok',assessmentEnabled:false});r=await fetch(base+'/submitStudentActivity',{method:'POST'});assert.equal(r.status,503);}));
test('HTTP adapter bounds methods, origins, JSON, body size and routes',async()=>{let calls=0;const handler=(req,res)=>{calls++;res.json({result:{ok:!!req.rawBody&&req.body.data===1}});};const callables=Object.fromEntries(['startStudentAssessment','advanceStudentAssessment','resumeStudentAssessment','submitStudentActivity'].map(n=>[n,handler]));await serve(configuration(valid),callables,async base=>{const headers={origin:'http://127.0.0.1:5500','Content-Type':'application/json'};assert.equal((await fetch(base+'/startStudentAssessment',{method:'POST',headers,body:'{"data":1}'})).status,200);assert.equal(calls,1);assert.equal((await fetch(base+'/startStudentAssessment',{method:'POST',headers:{...headers,origin:'https://evil.example'},body:'{}'})).status,403);assert.equal((await fetch(base+'/startStudentAssessment',{method:'POST',headers,body:'bad'})).status,400);assert.equal((await fetch(base+'/startStudentAssessment',{headers})).status,405);assert.equal((await fetch(base+'/other')).status,404);assert.equal((await fetch(base+'/startStudentAssessment',{method:'POST',headers,body:JSON.stringify({data:'x'.repeat(70000)})})).status,413);assert.equal(calls,1);});});
test('actual Firebase callable wrapper rejects missing authentication/App Check before grading',async()=>{const {onCall}=require('node:module').createRequire(require('node:path').resolve('functions/package.json'))('firebase-functions/v2/https');let ran=false;const handler=onCall({enforceAppCheck:true,cors:valid.ASSESSMENT_ALLOWED_ORIGINS},()=>{ran=true;return {};});await serve(configuration(valid),{startStudentAssessment:handler},async base=>{const r=await fetch(base+'/startStudentAssessment',{method:'POST',headers:{origin:valid.ASSESSMENT_ALLOWED_ORIGINS,'Content-Type':'application/json'},body:'{"data":{}}'});assert.equal(r.status,401);assert.equal(ran,false);});});

test('username signup remains disabled until explicitly activated', async () => {
    await serve(configuration(valid), {}, async base => {
        const headers = { origin: valid.ASSESSMENT_ALLOWED_ORIGINS };
        const settings = await fetch(base + '/student-access-config', { headers });
        assert.equal(settings.status, 200);
        assert.deepEqual(await settings.json(), { enabled: false });
        const endpoint = await fetch(base + '/studentClassroomAccess', { method: 'POST', headers });
        assert.equal(endpoint.status, 404);
    });
});

test('Render exposes username signup configuration only to the allowed website and requires App Check for requests', async () => {
    const { onCall } = require('node:module').createRequire(require('node:path').resolve('functions/package.json'))('firebase-functions/v2/https');
    const config = configuration({ ...valid, STUDENT_ACCESS_ENABLED: 'true' });
    const origin = valid.ASSESSMENT_ALLOWED_ORIGINS;
    let invoked = false;
    let siteKey;
    const handler = onCall({ cors: config.origins, enforceAppCheck: true }, () => { invoked = true; });
    await serve(config, { studentClassroomAccess: handler }, async base => {
        const configUrl = base + '/student-access-config';
        assert.equal((await fetch(configUrl, { headers: { origin: 'https://other.example' } })).status, 403);
        const unconfigured = await fetch(configUrl, { headers: { origin } });
        assert.deepEqual(await unconfigured.json(), { enabled: false });
        siteKey = 'test-site-key';
        const configured = await fetch(configUrl, { headers: { origin } });
        assert.equal(configured.headers.get('access-control-allow-origin'), origin);
        assert.deepEqual(await configured.json(), { enabled: true, siteKey, selfSignup: true });
        const accessUrl = base + '/studentClassroomAccess';
        const preflight = await fetch(accessUrl, {
            method: 'OPTIONS', headers: { origin, 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type,x-firebase-appcheck' }
        });
        assert.equal(preflight.status, 204);
        assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
        const denied = await fetch(accessUrl, {
            method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{"data":{"action":"register"}}'
        });
        assert.equal(denied.status, 401);
        assert.equal(invoked, false);
    }, async () => siteKey);
});
