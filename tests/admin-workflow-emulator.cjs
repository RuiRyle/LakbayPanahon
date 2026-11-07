const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {base,database,call,seed,read,save,write,commit,check,query,SERVER,steps,prefix}=require('./teacher-workflow-emulator.cjs');
let sequence=0;
function moderation(uid,previousStatus,status,{actor='admin',reason='Identity checked for access.',identityVerified=true,extras={},audit=true,account=true}={}) {
    const eventId='event'+(++sequence);
    return [
        ...(account?[write('users/'+uid,{status,updatedAt:SERVER,moderatedAt:SERVER,moderatedBy:actor,moderationEventId:eventId,...extras},true)]:[]),
        ...(audit?[write('accountModeration/'+eventId,{userId:uid,actorId:actor,previousStatus,status,reason,identityVerified,createdAt:SERVER})]:[])
    ];
}
async function main(){
    await call('owner',base.replace('/v1/','/emulator/v1/'),'DELETE');
    for(const [uid,role,status]of[['admin','admin','active'],['admin2','admin','active'],['disabledAdmin','admin','inactive'],['pendingTeacher','teacher','pending'],['teacher','teacher','active'],['student','student','active']])await seed('users/'+uid,{role,status,firstName:uid,lastName:'Example',email:uid+'@example.com'});
    for(const uid of ['pendingTeacher','teacher']){await seed('teacherApplications/'+uid,{status:'approved',revision:1,emailVerified:true,email:uid+'@example.com'});await seed('users/'+uid,{role:'teacher',status:uid==='pendingTeacher'?'pending':'active',firstName:uid,lastName:'Example',email:uid+'@example.com',teacherVerifiedRevision:1});}
    await seed('studentProgress/student_m1',{userId:'student',missionId:'m1',completed:true,bestScore:80});
    await check('admin lists pending teachers','admin',query('admin','users',[['role','teacher'],['status','pending']]),true);
    await check('admin reads account profile','admin',read('admin','users/student'),true);
    for(const uid of ['teacher','student','pendingTeacher','disabledAdmin',null]) {
        await check((uid||'anonymous')+' cannot enumerate accounts',uid,query(uid,'users',[['role','teacher']]),false);
        await check((uid||'anonymous')+' cannot read moderation trail',uid,query(uid,'accountModeration',[['userId','student']]),false);
    }
    await check('status change without audit rejected','admin',()=>commit('admin',moderation('pendingTeacher','pending','active',{audit:false})),false);
    await check('audit without paired status update rejected','admin',()=>commit('admin',moderation('pendingTeacher','pending','active',{account:false})),false);
    await check('teacher approval requires verification','admin',()=>commit('admin',moderation('pendingTeacher','pending','active',{identityVerified:false})),false);
    await check('approval reason required','admin',()=>commit('admin',moderation('pendingTeacher','pending','active',{reason:'x'})),false);
    await check('stale review status rejected','admin',()=>commit('admin',moderation('pendingTeacher','inactive','active')),false);
    for(const uid of ['teacher','student','pendingTeacher','disabledAdmin'])await check(uid+' cannot approve teachers',uid,()=>commit(uid,moderation('pendingTeacher','pending','active',{actor:uid})),false);
    await check('admin cannot promote target role','admin',()=>commit('admin',moderation('pendingTeacher','pending','active',{extras:{role:'admin'}})),false);
    await check('admin cannot add XP during approval','admin',()=>commit('admin',moderation('pendingTeacher','pending','active',{extras:{xp:99999}})),false);
    await check('admin cannot change account email','admin',()=>commit('admin',moderation('pendingTeacher','pending','active',{extras:{email:'other@example.com'}})),false);
    await check('admin cannot deactivate self','admin',()=>commit('admin',moderation('admin','active','inactive')),false);
    await check('admin cannot deactivate another admin','admin',()=>commit('admin',moderation('admin2','active','inactive')),false);
    await check('verified teacher approval atomically records audit','admin',()=>commit('admin',moderation('pendingTeacher','pending','active')),true);
    const logs=await check('admin queries saved decisions','admin',query('admin','accountModeration',[['userId','pendingTeacher']]),true);
    const event=logs.body.find(row=>row.document)?.document?.name;if(!event)throw Error('Audit record missing.');
    await check('audit trail cannot be edited','admin',save('admin',event.slice(prefix.length),{reason:'Changed history'},true),false);
    await check('audit trail cannot be deleted','admin',()=>commit('admin',[{delete:event}]),false);
    await check('student deactivation atomically records audit','admin',()=>commit('admin',moderation('student','active','inactive',{identityVerified:false})),true);
    await check('inactive student loses protected progress access','student',read('student','studentProgress/student_m1'),false);
    await check('reactivate student without deleting progress','admin',()=>commit('admin',moderation('student','inactive','active',{identityVerified:false})),true);
    await check('reactivated student retains progress','student',read('student','studentProgress/student_m1'),true);
    await seed('classes/class1',{teacherId:'pendingTeacher',name:'History',status:'active'});
    await check('approved teacher can access owned class','pendingTeacher',read('pendingTeacher','classes/class1'),true);
    await check('deactivate teacher records audit','admin',()=>commit('admin',moderation('pendingTeacher','active','inactive')),true);
    await check('deactivated teacher loses class access','pendingTeacher',read('pendingTeacher','classes/class1'),false);
    await check('reactivating teacher still requires verification','admin',()=>commit('admin',moderation('pendingTeacher','inactive','active',{identityVerified:false})),false);
    await check('verified teacher reactivation accepted','admin',()=>commit('admin',moderation('pendingTeacher','inactive','active')),true);
    await check('student cannot self-promote to admin','student',save('student','users/student',{role:'admin',updatedAt:SERVER},true),false);
    await check('admin cannot create admin account through client','admin',save('admin','users/newadmin',{role:'admin',status:'active',firstName:'A',lastName:'B',email:'a@example.com',createdAt:SERVER}),false);
    await check('admin cannot delete profile','admin',()=>commit('admin',[{delete:prefix+'users/student'}]),false);
    await check('admin cannot change curriculum','admin',save('admin','missions/new',{status:'active',title:'Changed'}),false);
    await check('admin has no student quiz-result enumeration permission','admin',query('admin','studentQuizAttempts',[['userId','student']]),false);
    const progress=await call('owner',base+'/studentProgress/student_m1');assert.equal(progress.body.fields.bestScore.integerValue,'80');
    console.log('PASS: '+steps.length+' local administrator checks');
    const reportName=process.argv.includes('--qualification-regression')?'qualification-admin-regression-2026-10-31.json':'admin-workflow-emulator-2026-10-31.json';
    fs.writeFileSync(path.join(__dirname,'../docs/validation',reportName),JSON.stringify({mode:'local-emulator-synthetic-identities-not-deployed',verifiedAt:new Date().toISOString(),sourceHash:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../firestore.rules'))).digest('hex'),steps},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
