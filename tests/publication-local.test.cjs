const {test} = require('node:test');
const assert = require('node:assert/strict');
const {audit, loadPlans} = require('../functions/audit-publication-local.cjs');
const plan = writes => ({projectId:'lakbaypanahon-1797e', writes});
test('offline publication chain resolves authored dependencies in chapter order', () => {
    const report = audit(loadPlans());
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.externalBaselinePaths, []);
    assert.equal(report.counts.missions, 49);
    assert.equal(report.counts.chapterChallenges, 11);
    assert.equal(report.sequence.at(-1).file, 'chapter15-challenge-migration.json');
    assert.equal(report.liveStateVerified, false);
});
test('offline audit catches changed guards, out-of-order prerequisites and create collisions', () => {
    const reports = audit([
        {file:'first', plan:plan([{path:'eras/e',create:true,fields:{description:'reviewed'}}])},
        {file:'next', plan:{...plan([{path:'eras/e',create:false,expected:{description:'different'},fields:{description:'next'}},
            {path:'eras/e',create:true,fields:{}}]), prerequisites:[{path:'eras/e',expected:{description:'wrong'}}]}}
    ]);
    assert.ok(reports.errors.some(e => e.message.startsWith('Guard mismatch')));
    assert.ok(reports.errors.some(e => e.message.startsWith('Prerequisite mismatch')));
    assert.ok(reports.errors.some(e => e.message.startsWith('Creation collision')));
    assert.ok(reports.errors.some(e => e.message.startsWith('Duplicate write')));
});
test('unresolved live baseline stays explicit and learner writes are rejected', () => {
    const report = audit([{file:'partial',plan:plan([
        {path:'chapters/existing',create:false,fields:{description:'pending'}},
        {path:'studentProgress/learner',create:true,fields:{completed:true}}
    ])}]);
    assert.deepEqual(report.externalBaselinePaths, ['chapters/existing']);
    assert.ok(report.errors.some(e => e.message.startsWith('Non-curriculum path')));
    assert.equal(report.liveStateVerified, false);
});
