const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createBayaniProcessor} = require('../server/bayani/core.cjs');
const {failure} = require('../server/bayani/errors.cjs');
const modulePromise = import('data:text/javascript;base64,' + Buffer.from(
    fs.readFileSync(path.join(__dirname, '../js/bayani-backend-client.js'), 'utf8')
).toString('base64'));

async function bridge({active = true, quota = false, enabled = true} = {}) {
    const {createBayaniBackendClient} = await modulePromise;
    const events = [], requests = [];
    const serverSettings = {
        enabled, provider:'anthropic', minorsUseApproved:true, model:'approved-test-model',
        systemInstruction:'Approved test teaching instructions from Firestore.',
        maxMessageCharacters:2000, maxOutputTokens:512,
        perMinuteLimit:3, perStudentDailyLimit:20, globalDailyLimit:100
    };
    const processor = createBayaniProcessor({
        async verifyIdToken(token, revoked) {
            assert.equal(token, 'firebase-test-token'); assert.equal(revoked, true);
            events.push('auth'); return {uid:'student'};
        },
        async verifyAppCheck(token) { assert.equal(token, 'app-check-test-token'); events.push('app-check'); },
        async getStudent(uid) { assert.equal(uid, 'student'); events.push('profile'); return {role:'student',status:active?'active':'inactive'}; },
        async getSettings() { events.push('settings'); return serverSettings; },
        async reserveUsage({uid}) {
            assert.equal(uid, 'student'); events.push('reserve');
            if (quota) throw failure('bayani/rate-limit', 429);
        },
        async generateAnswer(input) {
            events.push('provider');
            assert.equal(input.settings.model, serverSettings.model);
            assert.equal(input.settings.systemInstruction, serverSettings.systemInstruction);
            assert.equal(input.history[0]?.role, 'user');
            return 'Maaaring magkaiba ang pamumuno sa bawat pamayanan.';
        }
    }, {allowedOrigins:['https://school.example']});
    const client = createBayaniBackendClient({
        auth:{currentUser:{uid:'student',async getIdToken() { return 'firebase-test-token'; }}},
        appCheck:{}, async getAppCheckToken() { return {token:'app-check-test-token'}; },
        pageLocation:{href:'https://school.example/pages/bayani-ai.html'},
        settings:{enabled:true,provider:'anthropic',minorsUseApproved:true,
            backendEndpoint:'https://backend.example/api/bayani/chat',maxMessageCharacters:2000,
            model:'browser-must-not-send',systemInstruction:'browser-must-not-send'},
        async fetchRequest(endpoint, options) {
            const body = JSON.parse(options.body); requests.push({endpoint, options, body});
            const headers = Object.fromEntries(Object.entries(options.headers).map(([key,value]) => [key.toLowerCase(),value]));
            headers.origin = 'https://school.example';
            const result = await processor({method:options.method,path:new URL(endpoint).pathname,
                headers,body,signal:options.signal});
            return new Response(JSON.stringify(result.body), {status:result.status,headers:result.headers});
        }
    });
    return {client,events,requests};
}

const history = [
    {role:'user',parts:[{text:'Ano ang pamayanan?'}]},
    {role:'model',parts:[{text:'Ito ay pangkat ng mga taong namumuhay sa isang lugar.'}]}
];

test('browser and backend contract authenticates, reserves usage and uses only server teaching configuration', async () => {
    const fixture = await bridge();
    const answer = await fixture.client.send('Sino ang namumuno noon?', history);
    assert.match(answer, /pamumuno/);
    assert.deepEqual(fixture.events, ['auth','app-check','profile','settings','reserve','provider']);
    assert.deepEqual(Object.keys(fixture.requests[0].body).sort(), ['history','message']);
    assert.equal(fixture.requests[0].options.redirect, 'error');
    assert.doesNotMatch(JSON.stringify(fixture.requests[0].body), /browser-must-not-send|student/);
    assert.deepEqual(history.map(item => item.role), ['user','model']);
});

test('contact details are rejected without a provider call or usage reservation and are not echoed in the error', async () => {
    const fixture = await bridge();
    await assert.rejects(fixture.client.send('Email me at student@example.com', history), error => {
        assert.equal(error.code, 'bayani/privacy-blocked');
        assert.doesNotMatch(error.message, /student@example\.com/); return true;
    });
    assert.deepEqual(fixture.events, []);
});

test('an inactive account cannot access configuration, reserve usage or obtain an answer', async () => {
    const fixture = await bridge({active:false});
    await assert.rejects(fixture.client.send('Ano ang barangay noon?', history), {code:'bayani/permission-denied'});
    assert.deepEqual(fixture.events, ['auth','app-check','profile']);
});

test('a rate limit remains a rate limit across the bridge and never retries the provider', async () => {
    const fixture = await bridge({quota:true});
    await assert.rejects(fixture.client.send('Ano ang barangay noon?', history), {code:'bayani/rate-limit'});
    assert.equal(fixture.events.filter(event => event === 'reserve').length, 1);
    assert.equal(fixture.events.includes('provider'), false);
    assert.equal(fixture.requests.length, 1);
});

test('server-side disabling blocks an already-created browser client before any paid request', async () => {
    const fixture = await bridge({enabled:false});
    await assert.rejects(fixture.client.send('Ano ang barangay noon?', history), {code:'bayani/unavailable'});
    assert.equal(fixture.events.includes('reserve'), false);
    assert.equal(fixture.events.includes('provider'), false);
});
