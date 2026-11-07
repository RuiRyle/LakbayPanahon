// Local Firestore only. Uses synthetic identities; never uses CLI credentials.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const host = process.env.FIRESTORE_EMULATOR_HOST;
assert.match(host || '', /^127\.0\.0\.1:\d+$/, 'Set FIRESTORE_EMULATOR_HOST to the local test emulator.');
const project = 'demo-lakbay-teacher', database = `projects/${project}/databases/(default)`;
const base = `http://${host}/v1/${database}/documents`, prefix = `${database}/documents/`;
const steps = [];
const SERVER = {serverTime:true};
const unverified=new Set();
const encode = value => value===null ? {nullValue:null} : value instanceof Date ? {timestampValue:value.toISOString()} :
    typeof value === 'string' ? {stringValue:value} : typeof value === 'boolean' ? {booleanValue:value} :
    typeof value === 'number' ? {integerValue:String(value)} : Array.isArray(value) ? {arrayValue:{values:value.map(encode)}} :
    {mapValue:{fields:Object.fromEntries(Object.entries(value).map(([key,v])=>[key,encode(v)]))}};
function token(uid) {
    if (uid === 'owner') return 'owner';
    const part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    return part({alg:'none',typ:'JWT'})+'.'+part({sub:uid,user_id:uid,aud:project,iss:`https://securetoken.google.com/${project}`,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,email:uid+'@example.com',email_verified:!unverified.has(uid),firebase:{sign_in_provider:'password'}})+'.';
}
async function call(uid, url, method = 'GET', data) {
    const response = await fetch(url,{method,headers:{...(uid?{Authorization:'Bearer '+token(uid)}:{}),'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(10000)});
    const body = await response.json(); return {status:response.status,body};
}
function write(record, data, update = false) {
    const transforms = Object.entries(data).filter(([,v])=>v===SERVER).map(([fieldPath])=>({fieldPath,setToServerValue:'REQUEST_TIME'}));
    const fields = Object.fromEntries(Object.entries(data).filter(([,v])=>v!==SERVER).map(([k,v])=>[k,encode(v)]));
    return {update:{name:prefix+record,fields},...(update?{updateMask:{fieldPaths:Object.keys(data)}}:{}),...(transforms.length?{updateTransforms:transforms}:{})};
}
async function commit(uid, writes) { return call(uid,base+':commit','POST',{writes}); }
async function seed(record, data) { const response = await commit('owner',[write(record,data)]); assert.equal(response.status,200,JSON.stringify(response.body)); }
async function check(name, uid, operation, allowed) {
    const response = await operation();
    assert.equal(response.status, allowed?200:403, name+': '+JSON.stringify(response.body));
    steps.push({name,status:'pass'}); console.log('PASS: '+name); return response;
}
const read = (uid, record) => () => call(uid,base+'/'+record);
const save = (uid, record, data, update = false) => () => commit(uid,[write(record,data,update)]);
const query = (uid, collectionId, filters) => () => call(uid,base+':runQuery','POST',{structuredQuery:{from:[{collectionId}],where:{compositeFilter:{op:'AND',filters:filters.map(([fieldPath,value])=>({fieldFilter:{field:{fieldPath},op:'EQUAL',value:encode(value)}}))}},orderBy:[{field:{fieldPath:'__name__'},direction:'ASCENDING'}],limit:100}});
async function main() {
    await call('owner',`http://${host}/emulator/v1/${database}/documents`,'DELETE');
    for (const [uid,role,status] of [['t1','teacher','active'],['t2','teacher','active'],['pending','teacher','pending'],['alice','student','active'],['bob','student','active']]) await seed('users/'+uid,{role,status,firstName:uid,lastName:'Example'});
    for(const uid of ['t1','t2']){await seed('users/'+uid,{role:'teacher',status:'active',firstName:uid,lastName:'Example',email:uid+'@example.com',teacherVerifiedRevision:1,teacherAccessType:'licensed_teacher'});await seed('teacherApplications/'+uid,{status:'approved',revision:1,emailVerified:true,email:uid+'@example.com'});}
    await seed('chapters/c1',{status:'active'}); await seed('missions/m1',{chapterId:'c1',status:'active',title:'Clues'});
    const classroom = {name:'Grade 5',description:'History',teacherId:'t1',teacherName:'Teacher One',status:'active',currentJoinCode:'',createdAt:SERVER,updatedAt:SERVER};
    await check('approved teacher creates class','t1',save('t1','classes/class1',classroom),true);
    await check('pending teacher denied class creation','pending',save('pending','classes/nope',{...classroom,teacherId:'pending'}),false);
    await check('student denied class creation','alice',save('alice','classes/nope',{...classroom,teacherId:'alice'}),false);
    await check('owner reads class','t1',read('t1','classes/class1'),true);
    await check('other teacher denied class read','t2',read('t2','classes/class1'),false);
    await check('teacher queries owned classes','t1',query('t1','classes',[['teacherId','t1']]),true);
    await check('teacher cannot query foreign classes','t2',query('t2','classes',[['teacherId','t1']]),false);
    await check('class ownership cannot transfer','t1',save('t1','classes/class1',{teacherId:'t2',updatedAt:SERVER},true),false);
    await check('owner edits class details','t1',save('t1','classes/class1',{name:'Sampaguita',updatedAt:SERVER},true),true);
    const code = 'ABCDEFGHIJKL', second = 'MNOPQRSTUVWX';
    const invite = {classId:'class1',teacherId:'t1',status:'active',createdAt:SERVER,expiresAt:new Date(Date.now()+7*86400000)};
    const inviteWrites = newCode => [write('classes/class1',{currentJoinCode:newCode,updatedAt:SERVER},true),write('classJoinCodes/'+newCode,invite)];
    await check('atomic invitation generation','t1',()=>commit('t1',inviteWrites(code)),true);
    await check('other teacher cannot read invitation','t2',read('t2','classJoinCodes/'+code),false);
    await check('student may look up exact invitation','alice',read('alice','classJoinCodes/'+code),true);
    await check('student cannot enumerate invitations','alice',query('alice','classJoinCodes',[['classId','class1']]),false);
    const membership = uid => ({userId:uid,classId:'class1',joinCode:code,status:'active',joinedAt:SERVER});
    await check('student joins with active code','alice',save('alice','classMembers/alice_class1',membership('alice')),true);
    await check('joined student reads class','alice',read('alice','classes/class1'),true);
    await check('nonmember cannot read class','bob',read('bob','classes/class1'),false);
    await check('owner queries active roster','t1',query('t1','classMembers',[['classId','class1'],['status','active']]),true);
    await check('other teacher cannot query roster','t2',query('t2','classMembers',[['classId','class1'],['status','active']]),false);
    await check('teacher cannot modify membership','t1',save('t1','classMembers/alice_class1',{status:'inactive'},true),false);
    const link = {teacherId:'t1',userId:'alice',classId:'class1'};
    await check('owner establishes report link','t1',save('t1','teacherStudentLinks/t1_alice',link),true);
    await check('cannot link nonmember','t1',save('t1','teacherStudentLinks/t1_bob',{...link,userId:'bob'}),false);
    await seed('studentProgress/alice_m1',{userId:'alice',missionId:'m1',completed:true,bestScore:80,completedAt:new Date()});
    await seed('studentQuizAttempts/alice_a1',{userId:'alice',missionId:'m1',score:80,passed:true,topicsForReview:[],completedAt:new Date()});
    await seed('studentProgress/bob_m1',{userId:'bob',missionId:'m1',completed:true,bestScore:100});
    await check('owner reads active member profile','t1',read('t1','users/alice'),true);
    for (const collection of ['studentProgress','studentQuizAttempts']) {
        await check('owner queries member '+collection,'t1',query('t1',collection,[['userId','alice']]),true);
        await check('other teacher cannot query '+collection,'t2',query('t2',collection,[['userId','alice']]),false);
        await check('nonmember report query denied '+collection,'t1',query('t1',collection,[['userId','bob']]),false);
    }
    const news = {classId:'class1',title:'Our discussion',body:'Find the clue.',status:'draft',publishedAt:SERVER,updatedAt:SERVER};
    await check('owner saves announcement draft','t1',save('t1','classAnnouncements/news',news),true);
    await check('student cannot read draft','alice',read('alice','classAnnouncements/news'),false);
    await check('owner publishes announcement','t1',save('t1','classAnnouncements/news',{...news,status:'published'}),true);
    await check('member reads announcement','alice',read('alice','classAnnouncements/news'),true);
    await check('nonmember cannot read announcement','bob',read('bob','classAnnouncements/news'),false);
    await check('member queries published announcements','alice',query('alice','classAnnouncements',[['classId','class1'],['status','published']]),true);
    await check('teacher reads drafts and published items','t1',query('t1','classAnnouncements',[['classId','class1']]),true);
    await check('other teacher cannot publish','t2',save('t2','classAnnouncements/foreign',{...news,status:'published'}),false);
    const assignment = {classId:'class1',title:'Clues',missionId:'m1',chapterId:'c1',instructions:'Explore!',status:'published',publishedAt:SERVER,updatedAt:SERVER};
    await check('owner assigns existing mission','t1',save('t1','classAssignments/task',assignment),true);
    await check('member reads assignment','alice',read('alice','classAssignments/task'),true);
    const feedbackPath='classFeedback/class1_alice_m1';
    const feedback={classId:'class1',userId:'alice',teacherId:'t1',missionId:'m1',chapterId:'c1',body:'Explain one clue about community life.',revision:1,createdAt:SERVER,updatedAt:SERVER,readAt:null};
    const missingFeedback=await call('t1',base+'/'+feedbackPath);
    assert.equal(missingFeedback.status,404,'Absent feedback read is allowed but returns no document.');
    steps.push({name:'owner can check absent feedback before sending',status:'pass'});
    await check('owner sends mission-specific student feedback','t1',save('t1',feedbackPath,feedback),true);
    const savedFeedback=await call('t1',base+'/'+feedbackPath);
    const feedbackCreated=new Date(savedFeedback.body.fields.createdAt.timestampValue);
    await check('recipient reads teacher feedback','alice',read('alice',feedbackPath),true);
    await check('recipient queries feedback for own class','alice',query('alice','classFeedback',[['classId','class1'],['userId','alice']]),true);
    await check('owner queries recipient feedback','t1',query('t1','classFeedback',[['classId','class1'],['userId','alice'],['teacherId','t1']]),true);
    await check('nonrecipient cannot read feedback','bob',read('bob',feedbackPath),false);
    await check('other teacher cannot read feedback','t2',read('t2',feedbackPath),false);
    await check('student cannot send teacher feedback','alice',save('alice','classFeedback/class1_alice_m2',{...feedback,missionId:'m2'}),false);
    await check('other teacher cannot overwrite feedback','t2',save('t2',feedbackPath,{body:'Changed'},true),false);
    await check('recipient marks feedback read','alice',save('alice',feedbackPath,{readAt:SERVER},true),true);
    await check('recipient cannot alter feedback message','alice',save('alice',feedbackPath,{body:'Changed',readAt:SERVER},true),false);
    await check('recipient cannot add score to feedback','alice',save('alice',feedbackPath,{score:100,readAt:SERVER},true),false);
    await check('owner updates feedback revision and resets acknowledgement','t1',save('t1',feedbackPath,{...feedback,createdAt:feedbackCreated,revision:2,body:'Revisit the clue, then explain it in your own words.'}),true);
    await check('owner cannot skip feedback revision','t1',save('t1',feedbackPath,{...feedback,createdAt:feedbackCreated,revision:4}),false);
    await check('owner cannot store private fields in student feedback','t1',save('t1',feedbackPath,{...feedback,createdAt:feedbackCreated,revision:3,privateNote:'Private'}),false);
    await check('owner cannot send feedback to nonmember','t1',save('t1','classFeedback/class1_bob_m1',{...feedback,userId:'bob'}),false);
    const supportPath='teacherSupportNotes/class1_alice_m1';
    const support={classId:'class1',userId:'alice',teacherId:'t1',missionId:'m1',chapterId:'c1',status:'planned',note:'Discuss the community clue privately.',revision:1,createdAt:SERVER,updatedAt:SERVER,statusAt:SERVER};
    assert.equal((await call('t1',base+'/'+supportPath)).status,404,'Owner can check for an absent support note.');
    steps.push({name:'owner checks for absent private follow-up',status:'pass'});
    await check('owner records private planned follow-up','t1',save('t1',supportPath,support),true);
    const supportCreated=new Date((await call('t1',base+'/'+supportPath)).body.fields.createdAt.timestampValue);
    const supportTime=new Date((await call('t1',base+'/'+supportPath)).body.fields.statusAt.timestampValue);
    await check('student cannot read private follow-up','alice',read('alice',supportPath),false);
    await check('other teacher cannot read private follow-up','t2',read('t2',supportPath),false);
    await check('owner queries private follow-up','t1',query('t1','teacherSupportNotes',[['classId','class1'],['userId','alice'],['teacherId','t1']]),true);
    await check('student cannot query private follow-up','alice',query('alice','teacherSupportNotes',[['classId','class1'],['userId','alice']]),false);
    await check('student cannot create private follow-up','alice',save('alice','teacherSupportNotes/class1_alice_m2',{...support,missionId:'m2'}),false);
    await check('private note rejects invalid status','t1',save('t1',supportPath,{...support,createdAt:supportCreated,status:'mastered',revision:2}),false);
    await check('private note rejects score fields','t1',save('t1',supportPath,{...support,createdAt:supportCreated,statusAt:supportTime,revision:2,score:100}),false);
    await check('note edits preserve follow-up status time','t1',save('t1',supportPath,{...support,createdAt:supportCreated,statusAt:supportTime,revision:2,note:'Use an illustrated clue during discussion.'}),true);
    await check('owner marks follow-up discussed with new time','t1',save('t1',supportPath,{...support,createdAt:supportCreated,status:'discussed',revision:3}),true);
    const discussedTime=new Date((await call('t1',base+'/'+supportPath)).body.fields.statusAt.timestampValue);
    await check('editing discussed note preserves discussion time','t1',save('t1',supportPath,{...support,createdAt:supportCreated,statusAt:discussedTime,status:'discussed',revision:4}),true);
    await check('stale support revision cannot overwrite newer note','t1',save('t1',supportPath,{...support,createdAt:supportCreated,statusAt:discussedTime,status:'discussed',revision:3}),false);
    await check('owner reopens follow-up with new status boundary','t1',save('t1',supportPath,{...support,createdAt:supportCreated,revision:5}),true);
    await check('other teacher cannot remove class member','t2',()=>commit('t2',[{delete:prefix+'classMembers/alice_class1'}]),false);
    await check('owning teacher removes class membership','t1',()=>commit('t1',[{delete:prefix+'classMembers/alice_class1'}]),true);
    await check('removal revokes teacher progress access','t1',read('t1','studentProgress/alice_m1'),false);
    await check('removal revokes teacher private note access','t1',read('t1',supportPath),false);
    await check('removal revokes student feedback access','alice',read('alice',feedbackPath),false);
    await check('removed student retains personal progress','alice',read('alice','studentProgress/alice_m1'),true);
    await check('removed student may rejoin with active invitation','alice',save('alice','classMembers/alice_class1',membership('alice')),true);
    await check('owner can set optional assignment deadline','t1',save('t1','classAssignments/dated',{...assignment,dueAt:new Date('2026-11-05T15:59:59.999Z')}),true);
    await check('member reads dated assignment','alice',read('alice','classAssignments/dated'),true);
    await check('deadline rejects untyped string','t1',save('t1','classAssignments/baddate',{...assignment,dueAt:'tomorrow'}),false);
    await check('student cannot change deadline','alice',save('alice','classAssignments/dated',{...assignment,dueAt:null}),false);
    await check('other teacher cannot change deadline','t2',save('t2','classAssignments/dated',{...assignment,dueAt:null}),false);
    await check('owner can remove optional deadline','t1',save('t1','classAssignments/dated',{...assignment,dueAt:null}),true);
    await check('cannot assign wrong chapter','t1',save('t1','classAssignments/bad',{...assignment,chapterId:'c2'}),false);
    // A new mission goes through student-authorized writes, rather than seeded
    // completion records. This checks the real rules, not factual grading.
    await seed('missions/m2',{chapterId:'c1',status:'active',title:'Follow the evidence',xpReward:10});
    await seed('quizzes/q2',{missionId:'m2',status:'active',questionCount:1,passingScore:100});
    await seed('learningSettings/progression',{xpPerLevel:100,version:1});
    const followup={...assignment,missionId:'m2',title:'Follow the evidence',status:'draft'};
    await check('teacher prepares second mission draft','t1',save('t1','classAssignments/followup',followup),true);
    await check('student cannot read draft mission assignment','alice',read('alice','classAssignments/followup'),false);
    await check('teacher publishes second mission','t1',save('t1','classAssignments/followup',{...followup,status:'published'}),true);
    await check('student queries published class missions','alice',query('alice','classAssignments',[['classId','class1'],['status','published']]),true);
    await check('nonmember cannot read mission assignment','bob',read('bob','classAssignments/followup'),false);
    const attempt={userId:'alice',chapterId:'c1',missionId:'m2',quizId:'q2',attemptId:'loop1',questionIds:['q2-item'],answers:{'q2-item':'A'},score:100,correctAnswers:1,totalQuestions:1,passed:true,topicsForReview:[],completedAt:SERVER,response:{score:100,correctAnswers:1,passed:true,topicsForReview:[],firstCompletion:true,xpReward:10}};
    await check('student saves completion attempt and paired reward','alice',()=>commit('alice',[
        write('studentProgress/alice_m2',{userId:'alice',chapterId:'c1',missionId:'m2',quizId:'q2',completed:true,bestScore:100,xpEarned:10,completedAt:SERVER,updatedAt:SERVER}),
        write('users/alice',{xp:10,level:1,lastRewardKind:'mission',lastRewardId:'m2',updatedAt:SERVER},true),
        write('studentQuizAttempts/alice_loop1',attempt)
    ]),true);
    const saved=await check('teacher sees student-written mission completion','t1',read('t1','studentProgress/alice_m2'),true);
    assert.equal(saved.body.fields.bestScore.integerValue,'100');
    await check('teacher sees student-written attempt','t1',read('t1','studentQuizAttempts/alice_loop1'),true);
    const cycleFeedback={...feedback,missionId:'m2',body:'Explain which clue supports your answer after completing this mission.'};
    await check('teacher sends guidance after student-earned completion','t1',save('t1','classFeedback/class1_alice_m2',cycleFeedback),true);
    await check('student reads guidance after mission completion','alice',read('alice','classFeedback/class1_alice_m2'),true);
    await check('student acknowledges the post-mission guidance','alice',save('alice','classFeedback/class1_alice_m2',{readAt:SERVER},true),true);
    await check('teacher records private follow-up for completed mission','t1',save('t1','teacherSupportNotes/class1_alice_m2',{...support,missionId:'m2',status:'discussed',note:'Discussed the evidence after the student completed the mission.'}),true);
    await check('student cannot read post-mission private discussion','alice',read('alice','teacherSupportNotes/class1_alice_m2'),false);
    const cycleProgress=await check('follow-up preserves student-earned mission result','t1',read('t1','studentProgress/alice_m2'),true);
    assert.equal(cycleProgress.body.fields.bestScore.integerValue,'100');
    const cycleXP=await check('feedback and support do not issue extra XP','alice',read('alice','users/alice'),true);
    assert.equal(cycleXP.body.fields.xp.integerValue,'10');
    await check('teacher cannot change student score','t1',save('t1','studentProgress/alice_m2',{bestScore:90,updatedAt:SERVER},true),false);
    await check('student replay saves attempt with no second reward','alice',save('alice','studentQuizAttempts/alice_loop2',{...attempt,attemptId:'loop2',response:{...attempt.response,firstCompletion:false,xpReward:0}}),true);
    const afterReplay=await check('student can read unchanged XP after replay','alice',read('alice','users/alice'),true);
    assert.equal(afterReplay.body.fields.xp.integerValue,'10');
    await check('teacher reads active mission catalog','t1',query('t1','missions',[['status','active']]),true);
    await check('teacher cannot edit curriculum','t1',save('t1','missions/m1',{title:'Changed'},true),false);
    await check('rotate code and revoke old atomically','t1',()=>commit('t1',[...inviteWrites(second),write('classJoinCodes/'+code,{status:'revoked'},true)]),true);
    await check('old invitation no longer joins','bob',save('bob','classMembers/bob_class1',membership('bob')),false);
    await check('new invitation admits student','bob',save('bob','classMembers/bob_class1',{...membership('bob'),joinCode:second}),true);
    await check('revocation clears current invitation','t1',save('t1','classes/class1',{currentJoinCode:'',updatedAt:SERVER},true),true);
    await check('stale active code rejected after revocation','alice',save('alice','classMembers/alice_class1',membership('alice')),false);
    await check('archive clears invitation','t1',save('t1','classes/class1',{status:'archived',currentJoinCode:'',updatedAt:SERVER},true),true);
    await check('archived class prevents reporting','t1',read('t1','studentProgress/alice_m1'),false);
    await check('archived class prevents teacher member removal','t1',()=>commit('t1',[{delete:prefix+'classMembers/alice_class1'}]),false);
    await check('archived class prevents feedback updates','t1',save('t1',feedbackPath,{...feedback,createdAt:feedbackCreated,revision:3}),false);
    await check('archived class prevents private follow-up writes','t1',save('t1',supportPath,{...support,createdAt:supportCreated,revision:6}),false);
    await check('archived class prevents publication','t1',save('t1','classAnnouncements/archived',{...news,status:'published'}),false);
    await check('student progress remains saved after archive','alice',read('alice','studentProgress/alice_m1'),true);
    await check('restore class','t1',save('t1','classes/class1',{status:'active',updatedAt:SERVER},true),true);
    await check('member may leave class','alice',()=>commit('alice',[{delete:prefix+'classMembers/alice_class1'}]),true);
    await check('leaving immediately revokes teacher progress read','t1',read('t1','studentProgress/alice_m1'),false);
    await check('leaving immediately revokes teacher attempt query','t1',query('t1','studentQuizAttempts',[['userId','alice']]),false);
    await check('leaving immediately revokes teacher profile read','t1',read('t1','users/alice'),false);
    await check('student retains progress after leaving','alice',read('alice','studentProgress/alice_m1'),true);
    await check('leaving revokes published announcement access','alice',read('alice','classAnnouncements/news'),false);
    await check('leaving revokes published assignment access','alice',read('alice','classAssignments/followup'),false);
    await check('leaving revokes student feedback access','alice',read('alice',feedbackPath),false);
    await check('leaving revokes teacher feedback access','t1',read('t1',feedbackPath),false);
    await check('leaving revokes teacher private follow-up access','t1',read('t1',supportPath),false);
    await check('leaving revokes feedback acknowledgement','alice',save('alice',feedbackPath,{readAt:SERVER},true),false);
    await check('leaving revokes teacher access to new completion','t1',read('t1','studentProgress/alice_m2'),false);
    await check('student retains new completion after leaving','alice',read('alice','studentProgress/alice_m2'),true);
    await seed('users/t1',{role:'teacher',status:'inactive'});
    await check('inactive teacher loses class access','t1',read('t1','classes/class1'),false);
}
if(require.main===module)main().then(()=>{
    const report={mode:'local-emulator-synthetic-identities-not-deployed',verifiedAt:new Date().toISOString(),sourceHash:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../firestore.rules'))).digest('hex'),steps};
    const reportName=process.argv.includes('--refinement')?'teacher-student-loop-emulator-2026-11-03.json':process.argv.includes('--qualification-regression')?'qualification-teacher-regression-2026-10-31.json':process.argv.includes('--admin-regression')?'admin-teacher-regression-2026-10-31.json':'teacher-workflow-emulator-2026-10-31.json';
    fs.writeFileSync(path.join(__dirname,'../docs/validation/'+reportName),JSON.stringify(report,null,2));
    console.log(`PASS: ${steps.length} local teacher/student integration checks`);
}).catch(error=>{console.error(error);process.exitCode=1;});
module.exports={base,prefix,project,database,call,seed,read,save,write,commit,check,query,SERVER,steps,unverified};
