const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('classmate setup pins CLI and exposes only local scripts',()=>{
 const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
 assert.equal(pkg.engines.node,'22.x');assert.equal(pkg.devDependencies['firebase-tools'],'15.33.0');
 assert.match(pkg.scripts['start:local'],/--secured/);assert.ok(!Object.keys(pkg.scripts).some(key=>key.includes('deploy')));
});
test('launcher supports installed Node and project CLI and keeps demo-only endpoints',()=>{
 const source=fs.readFileSync('tools/start-local-emulator.cjs','utf8');
 assert.match(source,/process\.versions\.node/);assert.match(source,/require\.resolve\('firebase-tools\/lib\/bin\/firebase.js'\)/);
 assert.match(source,/project='demo-lakbay-local'/);assert.match(source,/running\?\.auth\|\|running\?\.firestore/);
 assert.match(source,/validateCandidate/);assert.match(source,/if\(!restore\)/);
});
test('dependency preparation preserves accepted artifacts and never deploys',()=>{
 const source=fs.readFileSync('tools/setup-local-development.cjs','utf8');
 assert.match(source,/'ci','--ignore-scripts'/);assert.match(source,/validateCandidate/);assert.doesNotMatch(source,/'deploy'/);
 require('../functions/stage0-gcloud-plan.cjs').validateCandidate();
});
