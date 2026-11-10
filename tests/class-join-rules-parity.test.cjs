const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const normalize=s=>s.replace(/\r\n/g,'\n');
test('normal and secured local rules share the one-class reservation contract',()=>{
 const sources=['firestore.rules','firestore.assessment.rules'].map(file=>normalize(fs.readFileSync(file,'utf8')));
 const scope=s=>{const start=s.indexOf('    // One reservation per Auth UID'),end=s.indexOf('    match /classMembers/{membershipId}',start);assert.ok(start>=0&&end>start,'Missing studentClassSlots rule scope');return s.slice(start,end);};
 assert.equal(scope(sources[0]),scope(sources[1]));
 const guard='getAfter(/databases/$(database)/documents/studentClassSlots/$(request.auth.uid)).data.classId == request.resource.data.classId';
 for(const source of sources){const start=source.indexOf('    match /classMembers/{membershipId}'),end=source.indexOf('    match /classAssignments/',start);assert.ok(source.slice(start,end).includes(guard),'Membership creation lacks paired reservation');}
});
test('local admin rule transformation preserves class join permissions',()=>{
 const {separateActivation}=require('../tools/admin-review-rules.cjs');
 const rules=separateActivation(fs.readFileSync('firestore.assessment.rules','utf8'));
 assert.match(rules,/match \/studentClassSlots\/\{studentId\}/);
 assert.match(rules,/request\.auth\.uid == studentId/);
 assert.match(rules,/getAfter\(\/databases\/\$\(database\)\/documents\/studentClassSlots/);
});

test('secured teacher transactions can check their reserved publication ID before creating it',()=>{
 for(const file of ['firestore.rules','firestore.assessment.rules']){
  const source=fs.readFileSync(file,'utf8');
  for(const [name,id]of [['classAssignments','assignmentId'],['classReviewAssignments','assignmentId'],['classAnnouncements','announcementId']]){
   const start=source.indexOf('match /'+name+'/{'+id+'}');
   assert.ok(start>=0);
   const required='allow get: if activeTeacher() && !exists(/databases/$(database)/documents/'+name+'/'+'$('+id+'));';
   assert.ok(source.slice(start,start+550).includes(required),file+': '+name+' missing safe absent-record read');
  }
 }
});
