const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const plan=require('../data/early-scene-image-repairs-migration.json');
const snapshot=require('../docs/validation/learning-content-snapshot.json');
test('image repairs preserve authored lesson behavior and guard the dated scene baseline',()=>{
    assert.equal(plan.writes.length,15);assert.equal(new Set(plan.writes.map(w=>w.path)).size,15);
    for(const w of plan.writes){
        const original=snapshot.collections.storyScenes.find(s=>'storyScenes/'+s.id===w.path);
        assert.ok(original);assert.equal(w.create,false);
        assert.deepEqual(Object.keys(w.fields).sort(),['imageAlt','imageCaption','imageFit','imageUrl']);
        assert.deepEqual(w.expected,{missionId:original.missionId,title:original.title,content:original.content,imageUrl:original.imageUrl});
        const svg=fs.readFileSync(w.fields.imageUrl.slice(3),'utf8');
        assert.ok(svg.includes('aria-labelledby="title description"'));assert.ok(svg.includes('<desc id="description">'));
        assert.match(w.fields.imageAlt,/Modern learning diagram/);assert.equal(w.fields.imageFit,'contain');
        assert.ok(!svg.includes('<script'));assert.ok(!svg.includes('<image'));
    }
});
test('every previously unresolved early snapshot image now has a local authored candidate',()=>{
    const {review}=require('../functions/audit-early-content-local.cjs');
    const inputs=fs.readdirSync('data').filter(f=>f.endsWith('.json')&&!/^chapter\d+-/.test(f)).map(file=>({file,data:JSON.parse(fs.readFileSync('data/'+file))}));
    const report=review(snapshot,inputs);
    const missing=report.chapters.flatMap(c=>c.missions).flatMap(m=>m.missingLocalImages);
    assert.equal(missing.length,59);
    assert.ok(missing.every(s=>s.authoredCandidates.some(c=>c.exists)));
});
