'use strict';
// Dedicated demo fixture only; never targets the classroom or production project.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
assert.equal(process.env.GCLOUD_PROJECT, 'demo-lakbaypanahon');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8180');
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9199');
const p = require('./proof.cjs');
const { createLocalServer } = require('./local-http.cjs');
const server = createLocalServer(require('./functions/assessment.cjs').handler);
const checks = [];
const report = { mode: 'loopback-node-http-synthetic-signed-app-check', status: 'running', checks,
  limitations: ['Fixture resets only demo-lakbaypanahon Firestore, separate from demo-lakbay-local.',
    'Generated App Check signing fixture; not real provider attestation.',
    'No cloud IAM, hosted limits, TLS, cold starts or production credentials tested.'] };
const output = 'docs/validation/node-http-workflow-2026-11-09.json';
async function main() {
  await p.fixture.seedLocalCatalog();
  const u = await p.fixture.fixtureUser('node-http-' + crypto.randomUUID());
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port + '/.netlify/functions/assessment/';
  async function call(name, data, token = p.appToken()) {
    const response = await fetch(base + name, { method: 'POST', headers: {
      'Content-Type': 'application/json', authorization: 'Bearer ' + u.token,
      'x-firebase-appcheck': token }, body: JSON.stringify({ data }) });
    const body = await response.json();
    if (!response.ok) throw Object.assign(Error(body.error?.message || 'HTTP failure'), { status: response.status, body });
    return body.result;
  }
  await assert.rejects(call(p.names[0], { ...p.identity, requestId: crypto.randomUUID() }, 'invalid'), e => e.status === 401);
  checks.push('Invalid App Check denied with real emulator Auth');
  const requestId = crypto.randomUUID();
  let state = await call(p.names[0], { ...p.identity, requestId });
  assert.equal((await call(p.names[0], { ...p.identity, requestId })).attemptId, state.attemptId);
  assert.equal((await call(p.names[2], { attemptId: state.attemptId })).attemptId, state.attemptId);
  checks.push('Signed start, issuance replay and resume over HTTP');
  const keys = new Map([...p.catalog.questions, ...p.catalog.practiceQuestions].map(q => [q.id, q.correctAnswer]));
  async function advance(data) {
    state = await call(p.names[1], { attemptId: state.attemptId, revision: state.revision,
      requestId: crypto.randomUUID(), ...data });
  }
  for (let i = 0; i < 5; i++) {
    const q = state.questions[i]; await advance({ action: 'answer', questionId: q.id, answer: keys.get(q.id) });
  }
  await advance({ action: 'followupStart' });
  for (let i = 0; i < state.followupLimit; i++) {
    const q = state.followupQuestions.at(-1);
    await advance({ action: 'followupAnswer', questionId: q.id, answer: keys.get(q.id) });
    if (i + 1 < state.followupLimit) await advance({ action: 'followupNext' });
  }
  checks.push('Issued questions and adaptive follow-up completed over HTTP');
  const submission = { attemptId: state.attemptId, revision: state.revision };
  const results = await Promise.all(Array.from({ length: 4 }, () => call(p.names[3], submission)));
  assert.ok(results.every(result => result.passed && result.score === 100));
  const xp = (await p.db.doc('users/' + u.uid).get()).data().xp;
  assert.equal(xp, p.mission.xpReward);
  assert.equal((await p.db.doc('studentProgress/' + u.uid + '_' + p.mission.id).get()).data().completed, true);
  const artifact = p.catalog.artifacts.find(item => item.missionId === p.mission.id);
  assert.ok(artifact);
  assert.equal((await p.db.doc('studentArtifacts/' + u.uid + '_' + artifact.id).get()).exists, true);
  checks.push('Four duplicate HTTP submissions return passing results with exact mission XP, completed progress and artifact');
  // Discard the acknowledged result to model a caller losing its outer response.
  const resumed = await call(p.names[2], { attemptId: state.attemptId });
  const replay = await call(p.names[3], submission);
  assert.equal(replay.score, 100);
  assert.equal((await p.db.doc('users/' + u.uid).get()).data().xp, xp);
  assert.ok(resumed);
  checks.push('Resume and same-attempt submit preserve XP after discarded acknowledgement');
  const { getAuth } = require('firebase-admin/auth');
  await getAuth().updateUser(u.uid, { disabled: true });
  await assert.rejects(call(p.names[2], { attemptId: state.attemptId }), e => e.status === 401);
  checks.push('Account disabled after token issuance denied over HTTP');
  report.status = 'pass'; report.awardedXp = xp;
}
main().catch(error => { report.status = 'fail'; report.error = error.stack; process.exitCode = 1; })
  .finally(async () => {
    if (server.listening) await new Promise(resolve => server.close(resolve));
    await p.cleanup();
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report));
  });
