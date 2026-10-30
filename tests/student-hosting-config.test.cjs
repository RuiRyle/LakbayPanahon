const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createHostingConfig}=require('../functions/student-hosting-config.cjs');
test('hosting serves only the staged public directory and has no backend rewrites or function deployment',()=>{
 const config=createHostingConfig();assert.deepEqual(Object.keys(config),['hosting']);assert.equal(config.hosting.public,'public');assert.equal(config.hosting.rewrites,undefined);assert.equal(config.functions,undefined);
});
test('headers preserve same-origin student frames while blocking unsafe embedding and active objects',()=>{
 const headers=Object.fromEntries(createHostingConfig().hosting.headers[0].headers.map(h=>[h.key,h.value]));
 assert.equal(headers['X-Frame-Options'],'SAMEORIGIN');assert.equal(headers['X-Content-Type-Options'],'nosniff');assert.equal(headers['Referrer-Policy'],'no-referrer');
 assert.match(headers['Content-Security-Policy'],/frame-ancestors 'self'/);assert.match(headers['Content-Security-Policy'],/object-src 'none'/);
 assert.match(headers['Permissions-Policy'],/microphone=\(\)/);assert.ok(!headers['Permissions-Policy'].includes('autoplay'));
});
test('trusted inline scripts get exact content hashes without permitting arbitrary inline JavaScript',()=>{
 const code='document.title="Teacher";',config=createHostingConfig(['<script>'+code+'</script><script src="app.js"></script>']);
 const csp=config.hosting.headers[0].headers.find(h=>h.key==='Content-Security-Policy').value;
 const script=csp.split(';').map(s=>s.trim()).find(s=>s.startsWith('script-src'));
 assert.ok(script.includes("'sha256-"+crypto.createHash('sha256').update(code).digest('base64')+"'"));
 assert.ok(!script.includes('unsafe-inline'));assert.ok(!script.includes('unsafe-eval'));
});
