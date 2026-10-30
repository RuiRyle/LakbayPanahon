'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const {EventEmitter} = require('node:events');
const {createBayaniProcessor, validateInput, validateSettings, containsContactDetails, allowedOrigin} = require('../server/bayani/core.cjs');
const {failure} = require('../server/bayani/errors.cjs');
const {createUsageReservation, usageDay} = require('../server/bayani/usage.cjs');
const {createAnthropicGenerator, API_ENDPOINT, API_VERSION} = require('../server/bayani/anthropic.cjs');
const {deploymentConfig, duplicateProtectedHeaders, readJson, createNodeHandler} = require('../server/bayani/server.cjs');

const ORIGIN = 'https://learning.example';
const policy = () => ({enabled:true, provider:'anthropic', minorsUseApproved:true, model:'configured-model',
    systemInstruction:'Approved Firestore teaching instructions', maxMessageCharacters:2000,
    maxOutputTokens:600, perMinuteLimit:3, perStudentDailyLimit:10, globalDailyLimit:100});
const request = (changes = {}) => ({method:'POST', path:'/api/bayani/chat',
    headers:{origin:ORIGIN, authorization:'Bearer verified.id.token', 'x-firebase-appcheck':'verified.app.token', 'content-type':'application/json'},
    body:{message:'What can a historical source tell us?', history:[]}, ...changes});

function fixture(overrides = {}, options = {}) {
    const calls = [];
    const deps = {
        verifyIdToken:async (token, revoked) => { calls.push(['auth', token, revoked]); return {uid:'student'}; },
        verifyAppCheck:async token => { calls.push(['appCheck', token]); return {app_id:'app'}; },
        getStudent:async uid => { calls.push(['student', uid]); return {role:'student', status:'active', firstName:'Private name'}; },
        getSettings:async () => { calls.push(['settings']); return policy(); },
        reserveUsage:async input => { calls.push(['reserve', input]); },
        generateAnswer:async input => { calls.push(['generate', input]); return 'Look at the source and the evidence it gives.'; },
        ...overrides
    };
    return {calls, deps, process:createBayaniProcessor(deps, {allowedOrigins:[ORIGIN], ...options})};
}
const generated = calls => calls.filter(call => call[0] === 'generate');
const flush = async () => { for (let index = 0; index < 8; index++) await Promise.resolve(); };

test('accepted chat verifies the revoked-token check, current student and server policy before reserving and generating', async () => {
    const f = fixture();
    const result = await f.process(request());
    assert.equal(result.status, 200);
    assert.equal(result.headers['Access-Control-Allow-Origin'], ORIGIN);
    assert.equal(result.headers['Cache-Control'], 'no-store');
    assert.equal(result.headers['Access-Control-Allow-Credentials'], undefined);
    assert.deepEqual(f.calls.map(call => call[0]), ['auth','appCheck','student','settings','reserve','generate']);
    assert.equal(f.calls[0][2], true);
    assert.equal(f.calls[2][1], 'student');
    const input = generated(f.calls)[0][1];
    assert.equal(input.settings.systemInstruction, policy().systemInstruction);
    assert.equal(Object.hasOwn(input, 'uid'), false);
    assert.equal(Object.hasOwn(input, 'firstName'), false);
    assert.equal(Object.hasOwn(input, 'model'), false);
});

test('untrusted, missing and non-string origins fail without credentials or data access', async () => {
    for (const origin of [undefined, null, 'null', '*', 'https://other.example', ORIGIN+'/', [ORIGIN], 'https://user:pass@learning.example']) {
        const f = fixture();
        const result = await f.process(request({headers:{...request().headers, origin}}));
        assert.equal(result.status, 403);
        assert.equal(result.headers['Access-Control-Allow-Origin'], undefined);
        assert.equal(f.calls.length, 0);
    }
    assert.equal(allowedOrigin('http://localhost:5500'), true);
    assert.equal(allowedOrigin('http://public.example'), false);
    assert.throws(() => createBayaniProcessor({}, {allowedOrigins:['*']}));
});

test('CORS preflight requires an allowed origin but never authenticates or generates', async () => {
    const f = fixture();
    const result = await f.process(request({method:'OPTIONS', body:undefined}));
    assert.equal(result.status, 204);
    assert.equal(result.body, undefined);
    assert.match(result.headers['Access-Control-Allow-Headers'], /X-Firebase-AppCheck/);
    assert.equal(f.calls.length, 0);
    assert.equal((await f.process(request({method:'GET'}))).status, 405);
    assert.equal((await f.process(request({path:'/api/other'}))).status, 404);
});

test('missing, malformed, revoked and unverified credentials cannot reach student data', async () => {
    for (const authorization of [undefined, '', ['Bearer token'], 'Basic token', 'Bearer token, other']) {
        const f = fixture();
        const result = await f.process(request({headers:{...request().headers, authorization}}));
        assert.equal(result.body.error.code, 'bayani/unauthenticated'); assert.equal(f.calls.length, 0);
    }
    const revoked = fixture({verifyIdToken:async () => { throw Error('Private revoked detail'); }});
    const result = await revoked.process(request());
    assert.equal(result.status, 401); assert.equal(result.body.error.code, 'bayani/unauthenticated');
    assert.doesNotMatch(JSON.stringify(result), /Private/);
    assert.equal(revoked.calls.length, 0);
    const invalidUid = fixture({verifyIdToken:async () => ({uid:'other/path'})});
    assert.equal((await invalidUid.process(request())).body.error.code, 'bayani/unauthenticated');
});

test('App Check is mandatory and invalid attestation cannot reach Firestore or the provider', async () => {
    for (const token of [undefined, '', ['token'], 'token, duplicate']) {
        const f = fixture();
        const result = await f.process(request({headers:{...request().headers, 'x-firebase-appcheck':token}}));
        assert.equal(result.body.error.code, 'bayani/app-check-required');
        assert.equal(f.calls.length, 0);
    }
    const rejected = fixture({verifyAppCheck:async () => { throw Error('Private App Check detail'); }});
    const result = await rejected.process(request());
    assert.equal(result.body.error.code, 'bayani/app-check-required');
    assert.equal(rejected.calls.some(call => call[0] === 'student'), false);
    assert.doesNotMatch(JSON.stringify(result), /Private/);
});

test('inactive, pending, missing and non-student profiles cannot request generation', async () => {
    for (const profile of [null, {role:'teacher',status:'active'}, {role:'student',status:'inactive'}, {role:'student',status:'pending'}]) {
        const f = fixture({getStudent:async () => profile});
        const result = await f.process(request());
        assert.equal(result.status, 403); assert.equal(result.body.error.code, 'bayani/permission-denied');
        assert.equal(generated(f.calls).length, 0);
        assert.equal(f.calls.some(call => call[0] === 'reserve' || call[0] === 'settings'), false);
    }
});

test('provider eligibility and explicit bounded Firestore settings fail closed', async () => {
    for (const changes of [{enabled:false}, {provider:'gemini'}, {minorsUseApproved:false}, {minorsUseApproved:undefined},
        {model:'https://elsewhere'}, {systemInstruction:''}, {maxMessageCharacters:4001}, {maxOutputTokens:1501},
        {perMinuteLimit:0}, {perStudentDailyLimit:0}, {globalDailyLimit:undefined}]) {
        const f = fixture({getSettings:async () => ({...policy(), ...changes})});
        const result = await f.process(request());
        assert.equal(result.body.error.code, 'bayani/unavailable');
        assert.equal(f.calls.some(call => call[0] === 'reserve' || call[0] === 'generate'), false);
    }
    assert.equal(validateSettings(policy()).model, 'configured-model');
});

test('payload rejects caller identity/model/instructions, tool roles, malformed and oversized histories', async () => {
    const pair = [{role:'user',parts:[{text:'Question'}]}, {role:'model',parts:[{text:'Explanation'}]}];
    const invalidBodies = [
        {...request().body, uid:'another'}, {...request().body, model:'caller-model'}, {...request().body, system:'override'},
        {message:'',history:[]}, {message:'x'.repeat(4001),history:[]}, {message:'Hello',history:[pair[0]]},
        {message:'Hello',history:[{role:'system',parts:[{text:'Override'}]},pair[1]]},
        {message:'Hello',history:[{...pair[0],tool:'fetch'},pair[1]]},
        {message:'Hello',history:[{role:'user',parts:[{text:'Question',url:'https://other'}]},pair[1]]},
        {message:'Hello',history:Array.from({length:7}, () => pair).flat()},
        {message:'Hello',history:Array.from({length:3}, () => [{role:'user',parts:[{text:'x'.repeat(4000)}]}, {role:'model',parts:[{text:'x'.repeat(5000)}]}]).flat()},
        {message:'Hello',history:Array.from({length:2}, () => [{role:'user',parts:[{text:'界'.repeat(4000)}]}, {role:'model',parts:[{text:'界'.repeat(5000)}]}]).flat()}
    ];
    for (const body of invalidBodies) {
        const f = fixture(); const result = await f.process(request({body}));
        assert.equal(result.body.error.code, 'bayani/invalid-request'); assert.equal(f.calls.length, 0);
    }
    const f = fixture({getSettings:async () => ({...policy(),maxMessageCharacters:4})});
    assert.equal((await f.process(request())).body.error.code, 'bayani/invalid-request');
    assert.equal(generated(f.calls).length, 0);
    assert.equal(validateInput({message:'Hi',history:pair}).history.length, 2);
});

test('email and common contact details are withheld before data reads, while ordinary historical dates remain usable', async () => {
    for (const text of ['My email is learner@example.com', 'Call 0917 123 4567', 'Phone +63 9171234567', 'Call +1 (555) 123-4567']) {
        const f = fixture();
        assert.equal((await f.process(request({body:{message:text,history:[]}}))).body.error.code, 'bayani/privacy-blocked');
        assert.equal(f.calls.length, 0);
    }
    assert.equal(containsContactDetails('Compare 1521, 1565 and 1896.'), false);
    const f = fixture();
    assert.equal((await f.process(request({body:{message:'History question',history:[
        {role:'user',parts:[{text:'learner@example.com'}]}, {role:'model',parts:[{text:'Keep it private.'}]}]}}))).body.error.code, 'bayani/privacy-blocked');
});

test('provider errors, contact details and empty answers are never reflected as raw responses', async () => {
    for (const result of ['', ' ', 'Contact teacher@example.com', 'x'.repeat(12001)]) {
        const f = fixture({generateAnswer:async () => result});
        const reply = await f.process(request());
        assert.equal(reply.body.error.code, 'bayani/no-content');
        assert.doesNotMatch(JSON.stringify(reply), /teacher@example/);
    }
    const f = fixture({generateAnswer:async () => { throw Error('Private API secret and provider detail'); }});
    const reply = await f.process(request());
    assert.equal(reply.status, 503); assert.doesNotMatch(JSON.stringify(reply), /Private|secret/);
});

test('atomic usage rejection happens before generation and preserves the fixed rate-limit outcome', async () => {
    const f = fixture({reserveUsage:async () => { throw failure('bayani/rate-limit', 429); }});
    const result = await f.process(request());
    assert.equal(result.status, 429); assert.equal(result.body.error.code, 'bayani/rate-limit');
    assert.equal(generated(f.calls).length, 0);
});

test('deadline expires once and a late authentication result cannot start data reads or generation', async () => {
    let release, expire, clearCalls = 0;
    const gate = new Promise(resolve => release = resolve);
    const f = fixture({verifyIdToken:async () => gate}, {setTimer:callback => {expire=callback;return 1;},clearTimer:() => {clearCalls++;}});
    const pending = f.process(request()); await flush(); expire();
    const result = await pending;
    assert.equal(result.body.error.code, 'bayani/deadline-exceeded');
    release({uid:'student'}); await flush();
    assert.equal(f.calls.length, 0); assert.equal(clearCalls, 1);
});

function transactionalStore(seed = {}) {
    const documents = new Map(Object.entries(seed)), writes = [];
    let queue = Promise.resolve();
    return {documents, writes, doc:path => path,
        runTransaction(callback) {
            const result = queue.then(async () => {
                const staged = [];
                const transaction = {
                    getAll:async (...paths) => paths.map(path => ({exists:documents.has(path),data:() => documents.get(path)})),
                    set:(path,value) => staged.push([path,value])
                };
                await callback(transaction);
                for (const [path,value] of staged) {documents.set(path,value);writes.push([path,value]);}
            });
            queue = result.catch(() => {}); return result;
        }
    };
}

test('durable reservations enforce concurrent global ceilings without storing conversations', async () => {
    const store = transactionalStore(), now = Date.parse('2026-10-29T04:00:00Z');
    const reserve = createUsageReservation(store, {now:() => now});
    const settings = {...policy(), globalDailyLimit:1};
    const outcomes = await Promise.allSettled(['one','two'].map(uid => reserve({uid,settings})));
    assert.equal(outcomes.filter(item => item.status === 'fulfilled').length, 1);
    assert.equal(outcomes.find(item => item.status === 'rejected').reason.code, 'bayani/quota-exceeded');
    assert.equal(store.documents.get('bayaniUsageDaily/2026-10-29').requests, 1);
    assert.equal(store.writes.length, 2);
    assert.doesNotMatch(JSON.stringify([...store.documents.values()]), /message|history|answer|email|firstName/);
});

test('per-minute and per-student daily ceilings survive a new reservation instance', async () => {
    const store = transactionalStore(); let now = Date.parse('2026-10-29T04:00:00Z');
    const settings = {...policy(), perMinuteLimit:1, perStudentDailyLimit:2};
    await createUsageReservation(store,{now:() => now})({uid:'one',settings});
    await assert.rejects(createUsageReservation(store,{now:() => now})({uid:'one',settings}), error => error.code === 'bayani/rate-limit');
    now += 60000; await createUsageReservation(store,{now:() => now})({uid:'one',settings});
    now += 60000;
    await assert.rejects(createUsageReservation(store,{now:() => now})({uid:'one',settings}), error => error.code === 'bayani/quota-exceeded');
    assert.equal(store.documents.get('bayaniUsage/one_2026-10-29').requests, 2);
    assert.equal(usageDay(Date.parse('2026-10-29T16:00:00Z')), '2026-10-30');
});

test('corrupt quota records and aborted reservations fail closed without writes', async () => {
    const now = Date.parse('2026-10-29T04:00:00Z');
    const store = transactionalStore({'bayaniUsage/one_2026-10-29':{userId:'different',date:'2026-10-29',requests:0,minuteRequests:0,minuteStartMillis:0}});
    await assert.rejects(createUsageReservation(store,{now:() => now})({uid:'one',settings:policy()}), error => error.code === 'bayani/unavailable');
    assert.equal(store.writes.length, 0);
    const controller = new AbortController(); controller.abort();
    await assert.rejects(createUsageReservation(store)({uid:'one',settings:policy(),signal:controller.signal}), error => error.code === 'bayani/deadline-exceeded');
    assert.equal(store.writes.length, 0);
});

function providerPayload(changes = {}) {
    return {type:'message', role:'assistant', stop_reason:'end_turn', content:[{type:'text',text:'A source gives evidence about the past.'}], ...changes};
}

test('provider adapter uses fixed origin, version, server instructions and no tool or student-identity options', async () => {
    const calls = [];
    const generate = createAnthropicGenerator({apiKey:'test-only-placeholder',fetchImpl:async (url,options) => {
        calls.push({url,options}); return new Response(JSON.stringify(providerPayload()),{status:200});
    }});
    const answer = await generate({message:'Explain a source',history:[
        {role:'user',parts:[{text:'What is evidence?'}]}, {role:'model',parts:[{text:'It helps us explain an idea.'}]}],settings:policy()});
    assert.match(answer, /source/); assert.equal(calls.length, 1);
    const {url,options} = calls[0], body = JSON.parse(options.body);
    assert.equal(url, API_ENDPOINT); assert.equal(options.redirect, 'error');
    assert.equal(options.headers['anthropic-version'], API_VERSION);
    assert.equal(options.headers.Authorization, 'Bearer test-only-placeholder');
    assert.equal(body.system, policy().systemInstruction); assert.equal(body.model, 'configured-model');
    assert.deepEqual(body.messages.map(message => message.role), ['user','assistant','user']);
    for (const key of ['tools','metadata','user_id','url']) assert.equal(Object.hasOwn(body,key), false);
});

test('provider adapter rejects refusal, truncation, tools, invalid JSON and oversized responses without retries', async () => {
    for (const body of [JSON.stringify(providerPayload({stop_reason:'max_tokens'})),
        JSON.stringify(providerPayload({stop_details:{type:'refusal'}})),
        JSON.stringify(providerPayload({content:[{type:'tool_use',name:'fetch'}]})),
        JSON.stringify(providerPayload({content:[]})), 'invalid private JSON',
        JSON.stringify(providerPayload({padding:'x'.repeat(70000)}))]) {
        let calls = 0;
        const generate = createAnthropicGenerator({apiKey:'test-only-placeholder',fetchImpl:async () => {
            calls++; return new Response(body,{status:200});
        }});
        await assert.rejects(generate({message:'History',history:[],settings:policy()}), error => error.code === 'bayani/no-content');
        assert.equal(calls, 1);
    }
});

test('provider HTTP failures and aborted requests expose no response body or credential', async () => {
    for (const [status,code] of [[429,'bayani/quota-exceeded'],[401,'bayani/unavailable'],[500,'bayani/unavailable']]) {
        let calls = 0;
        const generate = createAnthropicGenerator({apiKey:'test-only-placeholder',fetchImpl:async () => {
            calls++; return new Response('Private provider body',{status});
        }});
        await assert.rejects(generate({message:'History',history:[],settings:policy()}), error => error.code === code && !/Private|placeholder/.test(error.message));
        assert.equal(calls, 1);
    }
    const controller = new AbortController(); controller.abort(); let calls = 0;
    const generate = createAnthropicGenerator({apiKey:'test-only-placeholder',fetchImpl:async () => {calls++;}});
    await assert.rejects(generate({message:'History',history:[],settings:policy(),signal:controller.signal}), error => error.code === 'bayani/deadline-exceeded');
    assert.equal(calls, 0);
});

function incoming() {
    const req = new EventEmitter(); req.resume = () => {}; req.method = 'POST'; req.url = '/api/bayani/chat';
    req.headers = request().headers; req.rawHeaders = Object.entries(req.headers).flat(); return req;
}
function outgoing() {
    const res = new EventEmitter(); res.writableEnded = false; res.destroyed = false;
    res.writeHead = (status,headers) => {res.status=status;res.headers=headers;};
    res.end = body => {res.body=body;res.writableEnded=true;}; return res;
}

test('HTTP parsing bounds byte size, rejects bad JSON and safely drains late transport errors', async () => {
    let req = incoming(), controller = new AbortController();
    const oversized = readJson(req,controller.signal);
    req.emit('data',Buffer.alloc(32769));
    await assert.rejects(oversized,error => error.status === 413);
    assert.doesNotThrow(() => req.emit('error',Error('Late private transport error')));
    req.emit('close');
    req = incoming();
    const invalid = readJson(req,controller.signal);req.emit('data',Buffer.from('{invalid'));req.emit('end');
    await assert.rejects(invalid,error => error.code === 'bayani/invalid-request');
    req = incoming();
    const valid = readJson(req,controller.signal);req.emit('data',Buffer.from('{"message":"Hi","history":[]}'));req.emit('end');
    assert.equal((await valid).message, 'Hi');
});

test('HTTP boundary rejects duplicate protected headers and oversized declarations before processing', async () => {
    assert.equal(duplicateProtectedHeaders(['Origin',ORIGIN,'origin',ORIGIN]), true);
    assert.equal(duplicateProtectedHeaders(['Accept','a','accept','b']), false);
    let calls = 0;
    const handler = createNodeHandler(async () => {calls++;return {status:200,body:{answer:'Hi'}};});
    const duplicate = incoming(), duplicateRes = outgoing();duplicate.rawHeaders.push('Authorization','Bearer duplicate');
    await handler(duplicate,duplicateRes);assert.equal(duplicateRes.status,400);assert.equal(calls,0);
    const large = incoming(), largeRes = outgoing();large.headers={...large.headers,'content-length':'32769'};
    await handler(large,largeRes);assert.equal(largeRes.status,413);assert.equal(calls,0);
});

test('HTTP deadline includes a stalled incoming body and prevents late processing', async () => {
    let calls = 0;
    const handler = createNodeHandler(async () => {calls++;return {status:200,body:{answer:'Hi'}};},{timeoutMs:5});
    const req = incoming(), res = outgoing();
    await handler(req,res);
    assert.equal(res.status,504);assert.equal(calls,0);
    req.emit('data',Buffer.from('{}'));req.emit('end');req.emit('close');
    assert.equal(calls,0);
});

test('runtime refuses default activation, invalid origins and website-local credentials before loading Admin', () => {
    assert.throws(() => deploymentConfig({}), /not approved/);
    const env = {BAYANI_ACTIVATION_APPROVED:'true',ANTHROPIC_API_KEY:'test-only-placeholder',
        GOOGLE_CLOUD_PROJECT:'demo-project',BAYANI_ALLOWED_ORIGINS:ORIGIN};
    assert.equal(deploymentConfig(env).projectId,'demo-project');
    for (const changes of [{ANTHROPIC_API_KEY:''}, {BAYANI_ALLOWED_ORIGINS:'*'},
        {BAYANI_ALLOWED_ORIGINS:ORIGIN+'/path'}, {FIRESTORE_EMULATOR_HOST:'localhost:8080'},
        {GOOGLE_APPLICATION_CREDENTIALS:path.join(__dirname,'../server/bayani/private-key.json')}]) {
        assert.throws(() => deploymentConfig({...env,...changes}));
    }
    assert.equal(deploymentConfig({...env,GOOGLE_APPLICATION_CREDENTIALS:path.join(os.tmpdir(),'outside-workspace-key.json')}).projectId,'demo-project');
});
