const assert=require('assert/strict'),{randomUUID}=require('crypto');
module.exports=async p=>{
 const u=await p.fixture.fixtureUser('efficiency-security'),input={...p.identity,requestId:randomUUID()},state=await p.call(p.names[0],input,u,'security-probes');
 for(const name of p.names)for(const headers of [{authorization:''},{'x-firebase-appcheck':''},{'x-firebase-appcheck':'invalid'}])await assert.rejects(p.call(name,{attemptId:state.attemptId},u,'security-probes',{headers}),e=>e.status===401);
 await p.db.doc('users/'+u.uid).update({status:'disabled'});await assert.rejects(p.call(p.names[2],{attemptId:state.attemptId},u,'security-probes'),e=>e.status===403);await p.db.doc('users/'+u.uid).update({status:'active'});
 const ref=p.db.doc('learningSettings/securedAssessment');await ref.update({enabled:false});await assert.rejects(p.call(p.names[2],{attemptId:state.attemptId},u,'security-probes'),e=>/not-active/.test(e.assessmentCode));await ref.update({enabled:true});
 const question=p.db.doc('questions/'+state.questions[0].id),original=(await question.get()).data();await question.update({question:original.question+' Local mutation probe'});await assert.rejects(p.call(p.names[2],{attemptId:state.attemptId},u,'security-probes'),e=>/content-changed/.test(e.assessmentCode));await question.set(original);assert.equal((await p.call(p.names[2],{attemptId:state.attemptId},u,'security-probes')).attemptId,state.attemptId);
 await assert.rejects(p.call(p.names[3],{attemptId:state.attemptId,revision:state.revision,xp:1000},u,'security-probes'));
 return{status:'pass',checks:['All four endpoints reject missing Auth, missing App Check and invalid App Check','Profile disablement observed on next request','Policy pause observed on next request','Catalog edit invalidates unfinished attempt; restored content permits same-attempt recovery','Forged XP rejected'],workloadTotalsExcludeProbes:true};
};
