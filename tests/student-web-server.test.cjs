const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createStudentWebServer,resolvePackage}=require('../tools/serve-student-web.cjs');
test('local website server serves only the selected package, including audio ranges and security headers',async()=>{
    const folder=resolvePackage(),manifest=JSON.parse(fs.readFileSync(path.join(folder,'release-manifest.json'),'utf8'));
    const audio=manifest.files.find(item=>item.file.endsWith('.mp3'));assert.ok(audio,'Expected the recorded Bayani audio in the package');
    const server=createStudentWebServer(folder);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
    try{
        const home=await fetch(base+'/');assert.equal(home.status,200);assert.ok(home.headers.get('content-security-policy').includes("script-src 'self'"));assert.equal(home.headers.get('x-content-type-options'),'nosniff');
        for(const route of ['/server/assessment/server.mjs','/docs/student-status-2026-10-31.md','/data/bayani-generated-clips.json','/release-manifest.json','/.env'])assert.equal((await fetch(base+route)).status,404,route);
        assert.equal((await fetch(base+'/pages/story-playground.html')).status,200);
        const partial=await fetch(base+'/'+audio.file,{headers:{Range:'bytes=0-9'}});assert.equal(partial.status,206);assert.equal(partial.headers.get('content-type'),'audio/mpeg');assert.equal((await partial.arrayBuffer()).byteLength,10);
        assert.equal((await fetch(base+'/'+audio.file,{headers:{Range:'bytes=999999999-'}})).status,416);
        assert.equal((await fetch(base+'/',{method:'POST'})).status,405);
    }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('local website server rejects repository-root and private-directory targets',()=>{
    for(const folder of ['.','server','docs'])assert.throws(()=>resolvePackage(folder),/inside this workspace/);
});
