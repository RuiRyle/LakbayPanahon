const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {buildCandidate,collections,changeBlock}=require('../functions/build-trusted-assessment-rules.cjs');
const source=fs.readFileSync(require.resolve('../firestore.rules'),'utf8');
test('inactive cutover candidate disables direct browser reward writers and profile XP awards',()=>{
 const candidate=buildCandidate(source);assert.match(candidate,/function rewardUpdate\(\) \{ return false; \}/);
 for(const collection of collections){let current;const marker=new RegExp('match /'+collection+'/\\{[^}]+\\} \\{').exec(candidate)[0];changeBlock(candidate,marker,block=>{current=block;return block;});assert.match(current,/allow create, update, delete: if false;/);assert.ok(!/allow (?:create|update): if activeStudent/.test(current),collection);}
 assert.ok(source.includes('return activeStudent() && kind'));assert.ok(candidate.includes('allow read: if signedIn() && request.auth.uid == userId;'));
});
test('current owner-controlled drafts and practice remain available in the candidate',()=>{
 const candidate=buildCandidate(source);assert.ok(candidate.includes('allow update: if activeStudent() && ownRecord() && validDraft();'));
 assert.ok(candidate.includes('match /studentPracticeProgress/'));assert.ok(candidate.includes('request.resource.data.totalQuestions <= 200'));
});
test('unexpected rule layout fails closed instead of producing a partial cutover',()=>{
 assert.throws(()=>buildCandidate(source.replace('function rewardUpdate() {','function renamed() {')),/Missing\/duplicate/);
 assert.throws(()=>buildCandidate(source.replace('match /studentProgress/{progressId} {','match /renamed/{progressId} {')),/Missing reviewed/);
});
