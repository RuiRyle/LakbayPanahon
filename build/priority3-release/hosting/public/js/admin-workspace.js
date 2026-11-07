import {auth} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {loadAdminAccounts,loadAdminAccount,loadAdminHistory,moderateAccount,loadSubmittedTeacherApplications} from './admin-accounts.js';
import {mountTeacherReview} from './teacher-review-panel.js';
const $=id=>document.getElementById(id);
let epoch=0,busy=false,selected=null,cursors=[null],hasNext=false,nextCursor=null,historyCursor=null,historyNext=false;
let applicationQueue=false;
function text(tag,value,parent,className) {const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;parent?.append(el);return el;}
function message(value,error=false){$('adminStatus').textContent=value;$('adminStatus').dataset.error=String(error);}
function date(value){try{return new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(value.toDate());}catch{return'Date unavailable';}}
function clearDetail(){selected=null;$('adminAccountDetail').hidden=true;$('accountName').textContent='';$('accountEmail').textContent='';$('accountHistory').replaceChildren();$('teacherQualificationReview').replaceChildren();$('moderationForm').reset();}
function controls(){
    $('previousAccounts').disabled=busy||cursors.length===1;$('nextAccounts').disabled=busy||!hasNext;
    $('moreAccountHistory').hidden=!historyNext;$('moreAccountHistory').disabled=busy;
    $('identityCheck').hidden=selected?.role!=='teacher'||$('newAccountStatus').value!=='active';
}
async function task(work,success='') {
    if(busy)return;busy=true;const generation=epoch;
    document.querySelectorAll('#admin-main button, #admin-main input, #admin-main select, #admin-main textarea').forEach(el=>el.disabled=true);message('Working...');
    try{await work();if(generation===epoch)message(success);}
    catch(error){if(generation===epoch)message(error.code==='permission-denied'?'Access denied. Your administrator access or server permissions may have changed. Refresh and try again.':error.message||'Unable to complete this action.',true);}
    finally{if(generation===epoch){busy=false;document.querySelectorAll('#admin-main button, #admin-main input, #admin-main select, #admin-main textarea').forEach(el=>el.disabled=false);controls();}}
}
async function accounts(clear=true) {
    if(clear)clearDetail();$('adminAccounts').replaceChildren();
    const generation=epoch,result=applicationQueue?await loadSubmittedTeacherApplications(cursors.at(-1)):await loadAdminAccounts({role:$('accountRole').value,status:$('accountStatusFilter').value,cursor:cursors.at(-1)});
    if(generation!==epoch)return;
    hasNext=result.hasNext;nextCursor=result.cursor;
    $('accountPage').textContent=(applicationQueue?'Submitted applications · ':'')+'Page '+cursors.length;
    $('reviewSubmittedApplications').setAttribute('aria-pressed',String(applicationQueue));
    if(!result.rows.length)text('p','No accounts match these filters.',$('adminAccounts'));
    for(const account of result.rows) {
        const button=text('button',[account.firstName,account.lastName].filter(Boolean).join(' ')||'Unnamed account',$('adminAccounts'),'secondary');
        button.type='button';button.setAttribute('aria-pressed',String(selected?.id===account.id));
        button.dataset.userId=account.id;
        text('small',account.email||'Email unavailable',button);
        button.addEventListener('click',()=>task(()=>openAccount(account.id)));
    }
    controls();
}
async function history(append=false) {
    if(!selected)return;const generation=epoch,uid=selected.id;
    const result=await loadAdminHistory(uid,append?historyCursor:null);
    if(generation!==epoch||selected?.id!==uid)return;
    if(!append)$('accountHistory').replaceChildren();
    historyCursor=result.cursor;historyNext=result.hasNext;
    if(!append&&!result.rows.length)text('p','No decisions have been recorded for this account.',$('accountHistory'));
    for(const item of result.rows) {
        const row=text('article','',$('accountHistory'),'teacher-item');
        text('h3',`${item.previousStatus} → ${item.status}`,row);text('p',item.reason,row);
        text('p',date(item.createdAt)+' (Philippine time)',row,'teacher-note');
        text('p','Administrator ID: '+item.actorId,row,'teacher-note');
        if(item.identityVerified)text('p','Teacher identity verification confirmed.',row,'teacher-note');
    }
    controls();
}
async function openAccount(uid) {
    clearDetail();const generation=epoch,result=await loadAdminAccount(uid);
    if(generation!==epoch)return;selected=result.profile;
    document.querySelectorAll('#adminAccounts button').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.userId===uid)));
    $('accountName').textContent=[selected.firstName,selected.lastName].filter(Boolean).join(' ')||'Unnamed account';
    $('accountEmail').textContent=selected.email||'Email unavailable';
    $('accountCurrentStatus').textContent=`${selected.role} · ${selected.status}`;
    $('newAccountStatus').value=selected.status==='active'?'inactive':'active';
    $('saveAccountStatus').textContent=selected.role==='teacher'&&selected.status==='pending'?'Save Approval Decision':'Save Account Status';
    $('adminAccountDetail').hidden=false;controls();await history();
    if(selected?.id===uid&&selected.role==='teacher'){
        const host=document.createElement('section');host.className='qualification-review';$('teacherQualificationReview').append(host);
        await mountTeacherReview(host,selected,async()=>{await accounts(false);await openAccount(uid);});
    }
}
$('accountFilters').addEventListener('submit',event=>{event.preventDefault();applicationQueue=false;cursors=[null];task(()=>accounts(),'Account list refreshed.');});
$('reviewSubmittedApplications').addEventListener('click',()=>{applicationQueue=true;cursors=[null];task(()=>accounts(),'Submitted applications include new requests and existing teachers seeking verification.');});
$('accountRole').addEventListener('change',()=>{if($('accountRole').value==='student'&&$('accountStatusFilter').value==='pending')$('accountStatusFilter').value='active';});
$('previousAccounts').addEventListener('click',()=>task(async()=>{cursors.pop();await accounts();}));
$('nextAccounts').addEventListener('click',()=>task(async()=>{cursors.push(nextCursor);await accounts();}));
$('moreAccountHistory').addEventListener('click',()=>task(()=>history(true)));
$('newAccountStatus').addEventListener('change',controls);
$('moderationForm').addEventListener('submit',event=>{
    event.preventDefault();if(!selected)return;
    const values={uid:selected.id,expectedRole:selected.role,expectedStatus:selected.status,expectedVersion:selected.updatedAt?.toMillis?.()||selected.createdAt?.toMillis?.()||0,status:$('newAccountStatus').value,reason:$('moderationReason').value,identityVerified:$('teacherIdentityVerified').checked};
    task(async()=>{await moderateAccount(values);await accounts(false);await openAccount(values.uid);},'Account status saved with its audit record.');
});
function clear(){++epoch;busy=false;applicationQueue=false;clearDetail();cursors=[null];hasNext=false;nextCursor=null;historyCursor=null;historyNext=false;$('adminAccounts').replaceChildren();message('');controls();}
window.addEventListener('pagehide',clear);
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
onAuthStateChanged(auth,user=>{clear();if(user)task(()=>accounts(),'Select an account to review.');});
