import {auth} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {loadAdminAccounts,loadAdminAccount,loadAdminHistory,moderateAccount,loadSubmittedTeacherApplications,loadAdminOverview} from './admin-accounts.js';
import {mountTeacherReview} from './teacher-review-panel.js';
const $=id=>document.getElementById(id);
let epoch=0,busy=false,selected=null,cursors=[null],hasNext=false,nextCursor=null,historyCursor=null,historyNext=false;
let applicationQueue=false;
let detailBaseline='';
let pendingAccountDecision=null;
let savedAccountUid=null;
const viewCopy={overview:['Administrator overview','Check pending applications and review your recorded decisions.'],accounts:['Accounts & teacher reviews','Review submitted applications or manage existing account access.'],environment:['Administration','Workspace notices, permissions and available monitoring.']};
const viewMessages={};
function showAdminView(view,focus=false){
    if(!viewCopy[view])view='overview';
    document.body.dataset.adminView=view;
    const notice=viewMessages[view];$('adminStatus').textContent=notice?.value||'';$('adminStatus').dataset.error=String(notice?.error||false);
    $('adminOverview').hidden=view!=='overview';$('adminAccountsView').hidden=view!=='accounts';$('adminEnvironment').hidden=view!=='environment';
    $('adminAccountModes').hidden=view!=='accounts';
    $('adminViewHeading').textContent=viewCopy[view][0];$('adminPageTitle').textContent=viewCopy[view][0];$('adminViewDescription').textContent=viewCopy[view][1];
    document.querySelectorAll('.admin-navigation [data-teacher-tab]').forEach(link=>{const active=link.dataset.teacherTab===view;link.setAttribute('aria-pressed',String(active));if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    if(view==='overview')$('adminOverview').open=true;
    if(focus)$('adminViewHeading').focus({preventScroll:true});
}
function filterAccountPage(){
    const term=$('adminAccountSearch').value.trim().toLocaleLowerCase();let matches=0,total=0;
    $('adminAccounts').querySelectorAll('button').forEach(button=>{total++;button.hidden=!!term&&!button.textContent.toLocaleLowerCase().includes(term);if(!button.hidden)matches++;});
    $('adminSearchStatus').textContent=term?`${matches} of ${total} accounts on this page match.`:'';
    $('adminResetFilters').hidden=matches>0;
    $('adminResetFilters').textContent=applicationQueue?'Browse existing accounts':'Reset search & filters';
}
$('adminAccountSearch').addEventListener('input',filterAccountPage);
$('adminResetFilters').addEventListener('click',()=>{if(!canLeaveDetail())return;$('adminAccountSearch').value='';$('accountRole').value='teacher';$('accountStatusFilter').value='active';applicationQueue=false;cursors=[null];task(()=>accounts(),'Filters reset. Showing active teacher accounts.','Loading active teacher accounts…');});
$('adminApplicationsMode').addEventListener('click',()=>$('reviewSubmittedApplications').click());
$('adminExistingMode').addEventListener('click',()=>$('accountFilters').requestSubmit());
$('adminRefreshRecords').addEventListener('click',()=>$('loadAdminOverview').click());
$('adminReturnToReview').addEventListener('click',()=>{showAdminView('accounts',true);if(selected)$('accountName').focus();});
function detailState(){return JSON.stringify([...$('adminAccountDetail').querySelectorAll('input,select,textarea')].map(el=>[el.name||el.id,el.type==='checkbox'?el.checked:el.value]));}
function hasUnsavedDecision(){return !!selected&&detailBaseline!==detailState();}
function canLeaveDetail(){
    if(busy)return false;
    if(pendingAccountDecision){message('Check the unconfirmed account decision before changing accounts.',true);return false;}
    if($('teacherQualificationReview').querySelector('form button[type="submit"]:disabled')){message('Wait for the qualification decision to finish saving.');return false;}
    return !hasUnsavedDecision()||window.confirm('Discard the unsaved account or qualification decision?');
}
window.addEventListener('beforeunload',event=>{if(hasUnsavedDecision()||busy||$('teacherQualificationReview').querySelector('form button[type="submit"]:disabled')){event.preventDefault();event.returnValue='';}});
function text(tag,value,parent,className) {const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;parent?.append(el);return el;}
function message(value,error=false,view=document.body.dataset.adminView||'overview'){viewMessages[view]={value,error};if(view===(document.body.dataset.adminView||'overview')){$('adminStatus').textContent=value;$('adminStatus').dataset.error=String(error);}}
function date(value){try{return new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(value.toDate());}catch{return'Date unavailable';}}
function clearDetail(){$('adminAccountsView').classList.remove('has-selection');selected=null;$('adminAccountDetail').hidden=true;$('adminSelectionEmpty').hidden=false;$('accountName').textContent='';$('accountEmail').textContent='';$('accountHistory').replaceChildren();$('teacherQualificationReview').replaceChildren();$('moderationForm').reset();}
function controls(){
    $('adminReturnToReview').disabled=!selected||busy;
    $('adminRecoverySummary').textContent=pendingAccountDecision?'An account decision is unconfirmed. Return to the review and use Check saved decision; do not repeat the write.':savedAccountUid?'A decision was saved. Return to the account to refresh its details.':selected?'Selected account: '+(selected.email||selected.id)+'. Its history and recovery controls are available in the review.':'No account is selected. Open Accounts & Reviews to inspect an account history.';
    $('checkAccountDecision').hidden=!pendingAccountDecision&&!savedAccountUid;
    $('checkAccountDecision').textContent=pendingAccountDecision?'Check saved decision':'Refresh saved account';
    $('checkAccountDecision').disabled=busy;
    if(pendingAccountDecision||savedAccountUid)$('adminAccountDetail').querySelectorAll('form input,form select,form textarea,form button').forEach(el=>el.disabled=true);
    $('teacherQualificationReview').querySelectorAll('form[data-decision-locked="true"] input,form[data-decision-locked="true"] select,form[data-decision-locked="true"] textarea,form[data-decision-locked="true"] button').forEach(el=>el.disabled=true);
    $('previousAccounts').disabled=busy||cursors.length===1;$('nextAccounts').disabled=busy||!hasNext;
    $('moreAccountHistory').hidden=!historyNext;$('moreAccountHistory').disabled=busy;
    $('identityCheck').hidden=selected?.role!=='teacher'||$('newAccountStatus').value!=='active';
}
async function task(work,success='',progress='Loading administrator data…') {
    if(busy)return;busy=true;const generation=epoch,view=document.body.dataset.adminView||'overview';
    document.querySelectorAll('#admin-main button, #admin-main input, #admin-main select, #admin-main textarea').forEach(el=>el.disabled=true);message(progress);$('admin-main').setAttribute('aria-busy','true');
    try{const outcome=await work();if(generation===epoch)message(typeof outcome==='string'?outcome:success,false,view);}
    catch(error){if(generation===epoch)message(error.code==='permission-denied'?'Access denied. Your administrator access or server permissions may have changed. Refresh and try again.':error.message||'Unable to complete this action.',true,view);}
    finally{if(generation===epoch){busy=false;$('admin-main').setAttribute('aria-busy','false');document.querySelectorAll('#admin-main button, #admin-main input, #admin-main select, #admin-main textarea').forEach(el=>el.disabled=false);controls();}}
}
async function accounts(clear=true) {
    if(clear)clearDetail();$('adminAccounts').replaceChildren();
    const generation=epoch,result=applicationQueue?await loadSubmittedTeacherApplications(cursors.at(-1)):await loadAdminAccounts({role:$('accountRole').value,status:$('accountStatusFilter').value,cursor:cursors.at(-1)});
    if(generation!==epoch)return;
    hasNext=result.hasNext;nextCursor=result.cursor;
    $('accountListTitle').textContent=applicationQueue?'Submitted applications':'Accounts';
    $('accountListContext').textContent=applicationQueue?'Only submitted applications are listed. Select a teacher to review.':'Select an account to review its access and recorded decisions.';
    $('accountPage').textContent=(applicationQueue?'Submitted applications · ':'')+'Page '+cursors.length;
    $('reviewSubmittedApplications').setAttribute('aria-pressed',String(applicationQueue));
    $('adminApplicationsMode').setAttribute('aria-pressed',String(applicationQueue));$('adminExistingMode').setAttribute('aria-pressed',String(!applicationQueue));
    $('adminAccountsView').dataset.mode=applicationQueue?'applications':'accounts';
    if(!result.rows.length)text('p','No accounts match these filters.',$('adminAccounts'));
    for(const account of result.rows) {
        const button=text('button',[account.firstName,account.lastName].filter(Boolean).join(' ')||'Unnamed account',$('adminAccounts'),'secondary');
        button.type='button';button.setAttribute('aria-pressed',String(selected?.id===account.id));button.setAttribute('aria-controls','adminAccountDetail');
        button.dataset.userId=account.id;
        text('small',account.email||'Email unavailable',button);
        text('small',applicationQueue?'Application submitted':`${account.role} · ${account.status}`,button,'admin-status-label');
        button.addEventListener('click',()=>{if(canLeaveDetail())task(()=>openAccount(account.id),'Account details loaded.','Loading account details and decision records…');});
    }
    filterAccountPage();
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
    const generation=epoch,result=await loadAdminAccount(uid);
    if(generation!==epoch)return;clearDetail();savedAccountUid=null;selected=result.profile;
    $('adminAccountsView').classList.add('has-selection');
    document.querySelectorAll('#adminAccounts button').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.userId===uid)));
    $('accountName').textContent=[selected.firstName,selected.lastName].filter(Boolean).join(' ')||'Unnamed account';
    $('accountEmail').textContent=selected.email||'Email unavailable';
    $('accountCurrentStatus').textContent=`${selected.role} · ${selected.status}`;
    $('newAccountStatus').value=selected.status==='active'?'inactive':'active';
    $('saveAccountStatus').textContent='Save Account Status';
    $('adminSelectionEmpty').hidden=true;$('adminAccountDetail').hidden=false;controls();await history();
    if(selected?.id===uid&&selected.role==='teacher'){
        const host=document.createElement('section');host.className='qualification-review';$('teacherQualificationReview').append(host);
        await mountTeacherReview(host,selected,async()=>{
            if(generation!==epoch)return;detailBaseline=detailState();
            try{await accounts(false);if(generation===epoch)await openAccount(uid);if(generation===epoch)message('Qualification decision saved with its audit record.');}
            catch(error){if(generation===epoch)message('Qualification decision saved with its audit record, but the view could not refresh. Refresh the saved review or account list before another decision.');throw error;}
        });
    }
    if(generation===epoch&&selected?.id===uid){detailBaseline=detailState();$('accountName').focus({preventScroll:true});if(window.matchMedia('(max-width:900px)').matches)$('adminAccountDetail').scrollIntoView({block:'start',behavior:'instant'});}
}
$('accountFilters').addEventListener('submit',event=>{event.preventDefault();if(!canLeaveDetail())return;applicationQueue=false;cursors=[null];task(()=>accounts(),'Account list refreshed.','Loading filtered accounts…');});
$('reviewSubmittedApplications').addEventListener('click',()=>{if(!canLeaveDetail())return;applicationQueue=true;cursors=[null];task(()=>accounts(),'Submitted applications include new requests and existing teachers seeking verification.','Loading submitted teacher applications…');});
$('accountRole').addEventListener('change',()=>{if($('accountRole').value==='student'&&$('accountStatusFilter').value==='pending')$('accountStatusFilter').value='active';});
$('previousAccounts').addEventListener('click',()=>{if(canLeaveDetail())task(async()=>{cursors.pop();await accounts();});});
$('nextAccounts').addEventListener('click',()=>{if(canLeaveDetail())task(async()=>{cursors.push(nextCursor);await accounts();});});
$('moreAccountHistory').addEventListener('click',()=>task(()=>history(true)));
$('newAccountStatus').addEventListener('change',controls);
$('adminMenuToggle').addEventListener('click',()=>{
    const open=document.body.classList.toggle('admin-menu-open');
    $('adminMenuToggle').setAttribute('aria-expanded',String(open));
});
document.querySelectorAll('.admin-navigation [data-teacher-tab]').forEach(link=>link.addEventListener('click',event=>{
    if(busy){event.preventDefault();return;}
    document.querySelectorAll('.admin-navigation [data-teacher-tab]').forEach(item=>{item.removeAttribute('aria-current');item.setAttribute('aria-pressed','false');});
    link.setAttribute('aria-current','location');
    link.setAttribute('aria-pressed','true');
    document.body.classList.remove('admin-menu-open');$('adminMenuToggle').setAttribute('aria-expanded','false');
    if(link.getAttribute('href')==='#adminOverview')$('adminOverview').open=true;
    showAdminView(link.dataset.teacherTab,true);
}));
async function overview(){
    const generation=epoch;$('adminOverviewStatus').textContent='Loading administration snapshot...';
    try{
        const result=await loadAdminOverview();if(generation!==epoch)return;
        const host=$('adminOverviewResults');host.replaceChildren();
        const metrics=text('div','',host,'admin-metrics teacher-summary');
        for(const [label,value,note] of [['Waiting for review',String(result.applications.length)+(result.moreApplications?'+':''),'Submitted applications · up to 25 loaded'],['Your decision records',String(result.decisions.length)+(result.moreDecisions?'+':''),'Saved records · up to 10 loaded']]){const card=text('div','',metrics,'admin-metric');text('span',label,card);text('strong',value,card);text('small',note,card);}
        const applications=text('section','',host);text('h2','Submitted teacher applications',applications);
        if(!result.applications.length)text('p','No submitted applications in this snapshot.',applications,'teacher-note');
        for(const application of result.applications.slice(0,5)){const row=text('div','',applications,'admin-queue-row');text('strong',application.legalName||application.email||'Teacher application',row);text('small',application.email||'Submitted for verification',row);const review=text('button','Review',row,'secondary');review.type='button';review.addEventListener('click',()=>{if(!canLeaveDetail())return;showAdminView('accounts');task(()=>openAccount(application.id),'Application loaded.','Loading teacher application…');});}
        const open=text('button','Open submitted applications',applications,'secondary');open.type='button';open.addEventListener('click',()=>{showAdminView('accounts');$('reviewSubmittedApplications').click();});
        const decisions=text('section','',host);text('h2','Your recorded decisions',decisions);
        text('p',result.decisions.length?`${result.decisions.length} records loaded${result.moreDecisions?' (more available)':''}`:'No decisions recorded by your account.',decisions,'teacher-note');
        if(result.decisions.length)text('p','Document order, not a latest-activity feed. Full account history is available in Administration.',decisions,'teacher-note');
        const records=$('adminRecordResults');records.replaceChildren();
        for(const [index,decision] of result.decisions.entries()){const row=document.createElement('article');text('h3',`${decision.previousStatus} → ${decision.status}`,row);text('p','Account ID: '+decision.userId,row,'teacher-note');text('p',date(decision.createdAt)+' (Philippine time)',row,'teacher-note');const inspect=text('button','Open account history',row,'secondary');inspect.type='button';inspect.addEventListener('click',()=>{if(!canLeaveDetail())return;showAdminView('accounts');task(()=>openAccount(decision.userId),'Account history loaded.','Loading account history…');});records.append(row);if(index<3)decisions.append(row.cloneNode(true));}
        // Cloned summaries are read-only; actionable history controls stay in Administration.
        decisions.querySelectorAll('button').forEach(button=>button.remove());
        if(!result.decisions.length)text('p','No decisions recorded by your account.',records,'teacher-note');
        const all=text('button','View decision records',decisions,'secondary');all.type='button';all.addEventListener('click',()=>showAdminView('environment',true));
        host.hidden=false;$('adminOverviewStatus').textContent='Snapshot loaded at '+new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(new Date())+' (Philippine time). Refresh after making decisions.';
        $('loadAdminOverview').textContent='Refresh administration overview';
    }catch(error){if(generation===epoch)$('adminOverviewStatus').textContent=$('adminOverviewResults').hidden?'Overview unavailable. Try loading again.':'Refresh failed. The previous snapshot is still shown and may be outdated.';throw error;}
}
$('loadAdminOverview').addEventListener('click',()=>task(overview,'Administration overview loaded.','Loading application queue and decision records…'));
async function refreshSavedAccount(uid){
    const generation=epoch;
    savedAccountUid=uid;
    detailBaseline=detailState();
    try{await accounts(false);if(generation!==epoch)return;await openAccount(uid);return 'Account status saved with its audit record.';}
    catch{return 'Account status saved with its audit record, but the view could not refresh. Refresh Accounts to load the latest details before another decision.';}
}
$('checkAccountDecision').addEventListener('click',()=>task(async()=>{
    if(savedAccountUid)return refreshSavedAccount(savedAccountUid);
    const pending=pendingAccountDecision;if(!pending)return;
    if(!await pending.check())return 'The decision is still unconfirmed. Your review is preserved. Check again when connected; do not submit another decision.';
    pendingAccountDecision=null;return refreshSavedAccount(pending.uid);
}));
$('moderationForm').addEventListener('submit',event=>{
    event.preventDefault();if(busy||!selected||pendingAccountDecision||savedAccountUid)return;
    const values={uid:selected.id,expectedRole:selected.role,expectedStatus:selected.status,expectedVersion:selected.updatedAt?.toMillis?.()||selected.createdAt?.toMillis?.()||0,status:$('newAccountStatus').value,reason:$('moderationReason').value,identityVerified:$('teacherIdentityVerified').checked};
    const generation=epoch;
    if(!window.confirm(`Change access for ${selected.email||selected.id} from ${selected.status} to ${values.status}?\n\nReason: ${values.reason.trim()}\n\nAn inactive account loses protected access. Saved learning records are preserved. The decision will be recorded.`))return;
    task(async()=>{try{await moderateAccount(values);}catch(error){if(generation===epoch&&error.code==='admin/decision-unknown')pendingAccountDecision={uid:values.uid,check:error.checkDecision};throw error;}if(generation===epoch)return refreshSavedAccount(values.uid);},'','Saving account access decision…');
});
function clear(){for(const key of Object.keys(viewMessages))delete viewMessages[key];++epoch;busy=false;pendingAccountDecision=null;savedAccountUid=null;applicationQueue=false;clearDetail();cursors=[null];hasNext=false;nextCursor=null;historyCursor=null;historyNext=false;$('adminAccounts').replaceChildren();$('adminRecordResults').replaceChildren();$('adminOverviewResults').replaceChildren();$('adminOverviewResults').hidden=true;$('adminOverviewStatus').textContent='Not loaded yet.';$('loadAdminOverview').textContent='Load administration overview';$('adminOverview').open=false;message('');controls();}
window.addEventListener('pagehide',clear);
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
onAuthStateChanged(auth,user=>{clear();showAdminView('overview');if(user)task(async()=>{await accounts();await overview();},'Overview ready. Open submitted applications to review pending work.','Loading application queue and account directory…');});
showAdminView('overview');
