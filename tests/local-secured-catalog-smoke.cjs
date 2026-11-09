// Loopback-only acceptance against the launcher's actual seeded catalog.
const assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const catalog=require('../functions/audit-student-handoff.cjs').catalog().snapshot.collections;
async function main(){
 const fresh=process.argv.includes('--fresh');
 const login=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:'+(fresh?'signUp':'signInWithPassword')+'?key=local',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:fresh?'local-progression-'+randomUUID()+'@example.com':'student@lakbay.local',password:'LakbayLocal123!',returnSecureToken:true})});
 const identity=await login.json();assert.equal(login.status,200,'Seeded local student signs in');
 if(fresh){const r=await fetch('http://127.0.0.1:8180/v1/projects/demo-lakbay-local/databases/(default)/documents/users/'+identity.localId,{method:'PATCH',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({fields:{role:{stringValue:'student'},status:{stringValue:'active'},firstName:{stringValue:'Local progression fixture'},xp:{integerValue:'0'},level:{integerValue:'1'}}})});assert.equal(r.status,200);}
 async function call(name,data){const r=await fetch('http://127.0.0.1:5001/demo-lakbay-local/asia-southeast1/'+name,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+identity.idToken},body:JSON.stringify({data}),signal:AbortSignal.timeout(60000)});const b=await r.json();assert.equal(r.status,200,JSON.stringify(b));return b.result;}
 let state=await call('startStudentAssessment',{kind:'mission',chapterId:'era1-prologue',missionId:'prologue-mission1',quizId:'prologue-quiz1',requestId:randomUUID()});
 assert.equal(state.questions.length,5);
 const act=async data=>state=await call('advanceStudentAssessment',{attemptId:state.attemptId,revision:state.revision,requestId:randomUUID(),...data});
 for(let i=0;i<5;i++){const q=state.questions[i];const source=catalog.questions.find(row=>row.id===q.id);assert.ok(source);await act({action:'answer',questionId:q.id,answer:source.correctAnswer});}
 const resumed=await call('resumeStudentAssessment',{attemptId:state.attemptId});assert.equal(Object.keys(resumed.answers).length,5);
 await act({action:'followupStart'});
 while(state.followupQuestions.length){const q=state.followupQuestions.at(-1);if(!state.followupAnswers[q.id]){const source=catalog.practiceQuestions.find(row=>row.id===q.id);assert.ok(source);await act({action:'followupAnswer',questionId:q.id,answer:source.correctAnswer});}else if(state.followupQuestions.length<state.followupLimit)await act({action:'followupNext'});else break;}
 const input={attemptId:state.attemptId,revision:state.revision};
 const result=await call('submitStudentActivity',input);assert.equal(result.passed,true);assert.equal(result.score,100);
 const replay=await call('submitStudentActivity',input);assert.equal(replay.replayed,true);assert.equal(replay.score,100);
 if(fresh){assert.equal(result.firstCompletion,true);assert.equal(result.totalXp,40);assert.equal(replay.totalXp,40);const next=await call('startStudentAssessment',{kind:'mission',chapterId:'era1-prologue',missionId:'prologue-mission2',quizId:'prologue-quiz2',requestId:randomUUID()});assert.equal(next.questions.length,5);}
 console.log(JSON.stringify({passed:true,fresh,checks:['local sign-in','five catalog questions','saved answers','resume','followup','server grading','receipt replay',...(fresh?['first completion XP 40','next mission unlocked']:[])],score:result.score,totalXp:result.totalXp}));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
