import {mountAdministration} from './admin-administration-view.js';
import {firebaseEnvironment} from './firebase-environment.js';
import {decisionAccessSummary,describeAdminDecision,mountDecisionRecords} from './admin-decision-view.js';
import {appConfirm} from './app-dialog.js';
import {auth} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {loadAdminAccounts,loadAdminAccount,loadAdminHistory,moderateAccount,moderationDetails,loadAdminDecisionDetails,loadAdminRecentDecisions,loadSubmittedTeacherApplications,loadAdminOverview,watchAdminAccountHistory,watchAdminRecentDecisions,watchAdminApplicationQueue} from './admin-accounts.js';
import {loadTeacherReviewSnapshot,mountTeacherReview} from './teacher-review-panel.js';
const $=id=>document.getElementById(id);
const adminRoutes={overview:'admin-dashboard.html',applications:'admin-applications.html',accounts:'admin-accounts.html',records:'admin-decisions.html',environment:'admin-administration.html'};
const adminPage=document.body.dataset.adminPage;
const adminParameters=new URLSearchParams(location.search);
let adminRouteReady=false;
let adminNavigationPending=false;
async function navigateAdmin(view,accountId=null,action=null,{preserveContext=true,recordId=null}={}){
    if(!(await canLeaveDetail()))return;
    const destination=new URL(adminRoutes[view],location.href);
    if(accountId)destination.searchParams.set('account',accountId);
    if(['activate','history'].includes(action))destination.searchParams.set('action',action);
    if(recordId)destination.searchParams.set('decision',recordId);
    if(preserveContext&&view==='applications')destination.searchParams.set('category',applicationGroup);
    if(preserveContext&&view==='accounts'){destination.searchParams.set('role',$('accountRole').value);destination.searchParams.set('status',$('accountStatusFilter').value);}
    detailBaseline=detailState();
    adminNavigationPending=true;
    setAdminMenu(false);
    const link=document.createElement('a');link.href=destination.href;link.hidden=true;document.body.append(link);link.click();link.remove();
}
let epoch=0,busy=false,selected=null,cursors=[null],hasNext=false,nextCursor=null,historyCursor=null,historyNext=false;
let requestedHistoryRecord=null;
let stopHistoryWatch=null,historyPaged=false;
let stopRecentWatch=null,recentLive=null,decisionTimeline=null,decisionKey=null;
let directoryRequest=0;
let liveApplicationQueue=null;
let applicationQueue=false;
let applicationGroup='review';
const applicationGroupLabels={ready:'Ready to review',email:'Waiting for email confirmation',activation:'Ready to activate',review:'Awaiting review',revision:'Changes requested',reviewed:'Reviewed',awaiting:'Not submitted'};
const applicationGroupDescriptions={
    awaiting:'These teachers still need to submit their application.', review:'Includes submissions ready for review and those waiting for email confirmation.',
    ready:'These teachers have verified their email. Review the qualifications and choose an outcome.',
    email:'You can review the details now. The teacher must verify their email before you can approve them.',
    activation:'These teachers are approved and still need classroom access.',
    revision:'These teachers have been asked to update and resubmit their application.', reviewed:'Applications with a saved approval or decline.'
};
const applicationLabels={submitted:'Pending review',needs_changes:'For revision',approved:'Approved qualifications',declined:'Declined'};
const applicationStage=$('adminApplicationStage');
const applicationTabs=applicationStage?null:document.createElement('div');
let awaitingSubmissionLink;

function updateApplicationRoute(accountId){
    if(!applicationStage)return;
    const url=new URL(location.href);
    url.searchParams.set('category',applicationGroup);
    if(accountId)url.searchParams.set('account',accountId);
    else url.searchParams.delete('account');
    window.history.replaceState(window.history.state,'',url);
}

async function applyApplicationStage(group){
    if(!(await canLeaveDetail())){
        if(applicationStage)applicationStage.value=applicationGroup;
        return;
    }
    applicationGroup=group;
    updateApplicationRoute();
    $('adminAccountSearch').value='';
    cursors=[null];
    task(()=>accounts(),'','Loading applications…');
}

if(applicationStage){
    text('option',applicationGroupLabels.review,applicationStage).value='review';
    for(const [label,groups] of [
        ['Needs an admin action',['ready','activation']],
        ['Waiting or completed',['email','revision','awaiting','reviewed']]
    ]){
        const section=text('optgroup','',applicationStage);
        section.label=label;
        for(const group of groups)text('option',applicationGroupLabels[group],section).value=group;
    }
    applicationStage.value=applicationGroup;
    applicationStage.addEventListener('change',()=>applyApplicationStage(applicationStage.value));
}else{
    applicationTabs.className='admin-application-tabs';
    applicationTabs.setAttribute('role','group');
    applicationTabs.setAttribute('aria-label','Application status');
    for(const [group,label] of Object.entries(applicationGroupLabels)){
        const button=text('button',label,applicationTabs);button.type='button';button.dataset.applicationGroup=group;
        button.setAttribute('aria-pressed',String(group===applicationGroup));
        button.addEventListener('click',()=>applyApplicationStage(group));
    }
    $('accountListContext').after(applicationTabs);
    awaitingSubmissionLink=applicationTabs.querySelector('[data-application-group=awaiting]');
    awaitingSubmissionLink.className='admin-awaiting-submission-link';
    awaitingSubmissionLink.textContent='Teachers who have not submitted';
    applicationTabs.after(awaitingSubmissionLink);
}
const refreshApplications=document.createElement('button');refreshApplications.id='adminRefreshApplications';refreshApplications.type='button';refreshApplications.className='secondary admin-refresh-applications';refreshApplications.setAttribute('aria-label','Refresh application list');refreshApplications.title='Refresh application list';refreshApplications.textContent=applicationStage?'Refresh list':'\u21bb';
if(applicationStage)refreshApplications.insertAdjacentHTML('afterbegin','<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.6-1L20 9M4 15l2.3 3A7 7 0 0 0 18 17"/></svg>');
(applicationStage?.closest('.admin-application-toolbar')||$('accountListContext').parentElement).append(refreshApplications);
refreshApplications.addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;const uid=selected?.id;task(async()=>{await accounts(false);if(uid)await openAccount(uid);},'Application list refreshed.','Refreshing applications…');});
const applicationConnection=text('p','',null,'admin-applicant-list-state');
applicationConnection.setAttribute('role','status');
applicationConnection.hidden=true;
$('adminAccounts').before(applicationConnection);
function showApplicationConnection(message=''){
    applicationConnection.textContent=message;
    applicationConnection.hidden=!message;
}
const applicantSearchIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');applicantSearchIcon.setAttribute('viewBox','0 0 24 24');applicantSearchIcon.setAttribute('aria-hidden','true');applicantSearchIcon.classList.add('admin-applicant-search-icon');applicantSearchIcon.innerHTML='<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>';$('adminAccountSearch').parentElement.append(applicantSearchIcon);
const applicantPagination=document.createElement('div');applicantPagination.className='admin-applicant-pagination';const pageActions=$('nextAccounts').parentElement;$('accountPage').before(applicantPagination);applicantPagination.append($('accountPage'),pageActions);$('previousAccounts').title='Previous page';$('nextAccounts').title='Next page';
const workflowHelp=text('section','',null,'admin-workflow-purpose');
workflowHelp.hidden=true;
workflowHelp.setAttribute('aria-labelledby','adminWorkflowTitle');
const workflowTitle=text('h1','Teacher Applications',workflowHelp);workflowTitle.id='adminWorkflowTitle';workflowTitle.tabIndex=-1;
let workflowGuide=workflowHelp;
if(applicationStage){
    const introduction=text('div','',workflowHelp,'admin-application-intro');
    introduction.append(workflowTitle);
    text('p','Review qualifications first. Grant classroom access after approval.',introduction);
    workflowGuide=text('details','',workflowHelp,'admin-review-guide');
    text('summary','How reviews work',workflowGuide);
}
const workflowSteps=text('ol','',workflowGuide,'admin-review-flow');
for(const [title,copy] of [
    ['Review qualifications','Check the submitted details and record your decision.'],
    ['Activate classroom access','If access is still pending after approval, open Ready to activate.']
]){
    const step=text('li','',workflowSteps);
    text('strong',title,step);
    text('span',copy,step);
}
$('adminAccountModes').after(workflowHelp);
$('accountStatusFilter').querySelector('option[value=pending]').textContent='Pending access';
$('newAccountStatus').querySelector('option[value=active]').textContent='Activate access';$('newAccountStatus').querySelector('option[value=inactive]').textContent='Deactivate access';
let detailBaseline={};
let pendingAccountDecision=null;
let savedAccountUid=null;
let staleAccountUid=null;
const viewCopy={overview:['Admin Dashboard','See what needs your attention and check your recent decisions.'],applications:['Teacher Applications','Review teacher qualifications and grant classroom access after approval.'],accounts:['User Accounts','Find a student or teacher, check their history, or change their access.'],records:['Decision Records','Your saved decisions, newest first.'],environment:['Admin Tools','Check an unfinished decision or see what you can manage here.']};
const viewMessages={};
const adminStatus = $('adminStatus');
const adminStatusHome = document.createComment('Page status position');
adminStatus.before(adminStatusHome);
function setupAccountDirectory(){
 if(adminPage!=='accounts')return;
 for(const [id,label]of [['accountRole','All roles'],['accountStatusFilter','All statuses']]){const option=document.createElement('option');option.value='all';option.textContent=label;$(id).prepend(option);$(id).value='all';}
 const intro=$('adminViewHeading').parentElement;intro.classList.add('admin-account-banner');const landscape=document.querySelector('.admin-welcome-landscape').cloneNode(true);intro.append(landscape);
 const tabs=text('div','',null,'admin-account-role-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Account role');
 for(const [role,label]of [['all','Everyone'],['teacher','Teachers'],['student','Students']]){const button=text('button',label,tabs,'secondary');button.type='button';button.dataset.accountRole=role;button.setAttribute('aria-pressed',String(role==='all'));button.addEventListener('click',()=>applyAccountFilters(role));}
 const toolbar=text('section','',null,'admin-account-toolbar');toolbar.setAttribute('aria-label','Search and filter accounts');
 const form=$('accountFilters');
 $('accountRole').closest('label').hidden=true;
 form.querySelector('button[type="submit"]').textContent='Apply status';
 form.append($('adminResetFilters'));
 const filterHeading=text('div','',toolbar,'admin-account-filter-heading');
 text('h2','Find an account',filterHeading);
 filterHeading.append(tabs);
 const filterFields=text('div','',toolbar,'admin-account-filter-fields');
 filterFields.append($('adminAccountSearch').parentElement,form);
 $('adminAccountsView').before(toolbar);
 toolbar.append($('adminSearchScope'),$('adminSearchStatus'));
 $('adminAccountSearch').placeholder='Name, email, or username';
 const headings=text('div','',null,'admin-account-columns');headings.setAttribute('aria-hidden','true');for(const label of ['Account','Role','Status','Created','View'])text('span',label,headings);$('adminAccounts').before(headings);
 const listTitle=text('div','',null,'admin-account-list-title');text('h2','Account results',listTitle);const loaded=text('span','',listTitle);loaded.id='adminDirectoryCount';headings.before(listTitle);
 const noMatches=text('div','',null,'admin-account-no-matches');noMatches.id='adminAccountNoMatches';noMatches.hidden=true;text('strong','No matches on this page',noMatches);text('p','Try a different search or check the next page if available.',noMatches);$('adminAccounts').after(noMatches);
 const heading=$('adminAccountDetail').querySelector('header');const panelTitle=text('h2','Account Details',null,'admin-account-detail-title');heading.before(panelTitle);const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.innerHTML='<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>';panelTitle.prepend(icon);
 const role=text('span','',heading,'admin-detail-role');role.id='adminDetailRole';
 const metadata=text('dl','',null,'admin-account-metadata');metadata.id='adminAccountMetadata';heading.after(metadata);
 const access=$('adminAccountDetail').querySelector('.admin-access-details');access.open=false;access.id='adminAccessPanel';
 const historySection=$('recordedDecisionsTitle').parentElement;const historyDetails=document.createElement('details');historyDetails.className='admin-account-history-details';historyDetails.id='adminHistoryPanel';text('summary','View decision history',historyDetails);historySection.before(historyDetails);historyDetails.append(historySection);
 const accessSummary=access.querySelector('summary');accessSummary.textContent='Change account access';
 const note=access.querySelector('p.teacher-note');note.textContent='Choose the access change, record a reason, then review the confirmation. Saved learning records are preserved.';
 $('saveAccountStatus').textContent='Review & confirm change';

}
setupAccountDirectory();
if(adminPage==='environment')mountAdministration($('adminEnvironment'),{environment:firebaseEnvironment});
async function showAdminView(view,focus=false,accountId=null,action=null){
    if(!viewCopy[view])view='overview';
    if(adminPage&&adminRouteReady&&view!==adminPage){(await navigateAdmin(view,accountId,action));return;}
    document.body.dataset.adminView=view;const back=$('adminApplicationBack');if(back)back.hidden=!['applications','accounts'].includes(view);
    renderAdminMessage(view);
    $('adminOverview').hidden=view!=='overview';$('adminAccountsView').hidden=!['accounts','applications'].includes(view);$('adminEnvironment').hidden=view!=='environment';
    $('adminDecisionRecords').hidden=view!=='records';
    $('adminAccountsView').dataset.workspace=view==='applications'?'applications':'accounts';
    $('adminAccountSearch').placeholder=view==='applications'?'Search name or email':'Name, email, or username';
    $('adminSelectionTitle').textContent=view==='applications'?'Select a teacher to review':'Select an account to begin';
    const emptyCopy=$('adminSelectionEmpty').querySelector('p');if(emptyCopy)emptyCopy.textContent=view==='applications'?'Select a teacher from the list to see the application and its next step.':'Select a student or teacher to view their access and decision history.';
    $('adminAccountModes').hidden=true;workflowHelp.hidden=view!=='applications';
    $('adminViewHeading').textContent=viewCopy[view][0];$('adminPageTitle').textContent=view==='overview'?'Dashboard':viewCopy[view][0];$('adminViewDescription').textContent=viewCopy[view][1];
    const refreshLabel={overview:'Refresh dashboard data',accounts:'Refresh account list',records:'Refresh decision records'}[view]||'Refresh';
    $('loadAdminOverview').setAttribute('aria-label',refreshLabel);
    $('loadAdminOverview').title=refreshLabel;
    document.querySelectorAll('.admin-navigation [data-teacher-tab]').forEach(link=>{const active=link.dataset.teacherTab===view;link.setAttribute('aria-pressed',String(active));if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    if(view==='overview')$('adminOverview').open=true;
    if(focus)(view==='overview'?$('adminWelcomeHeading'):view==='applications'?workflowTitle:$('adminViewHeading')).focus({preventScroll:true});
}
function syncDirectoryReset(term) {
    $('adminResetFilters').hidden=!term && $('accountRole').value==='all' && $('accountStatusFilter').value==='all';
}
function filterAccountPage(){
    const term=$('adminAccountSearch').value.trim().toLocaleLowerCase();let matches=0,total=0;
    $('adminAccounts').querySelectorAll('button[data-user-id]').forEach(button=>{total++;button.hidden=!!term&&!(button.dataset.searchValue||button.textContent).toLocaleLowerCase().includes(term);if(!button.hidden)matches++;});
    $('adminSearchStatus').textContent=term?`${matches} of ${total} ${applicationQueue?'teachers':'accounts'} on this page match.`:'';
    const filteredAccounts = adminPage==='accounts' && !applicationQueue;
    if($('adminDirectoryCount')){$('adminDirectoryCount').textContent=term?matches+' of '+total+' match':total+' loaded on this page';$('adminAccountNoMatches').hidden=!term||!total||matches>0;const title=document.querySelector('.admin-account-list-title h2');title.textContent=$('accountRole').value==='teacher'?'Teacher accounts':$('accountRole').value==='student'?'Student accounts':'All accounts';}
    if(filteredAccounts) syncDirectoryReset(term);
    else $('adminResetFilters').hidden=applicationQueue ? !term : matches>0;
    $('adminResetFilters').textContent=applicationQueue?'Clear search':'Clear search & filters';
}
$('adminAccountSearch').addEventListener('input',filterAccountPage);
$('adminResetFilters').addEventListener('click',async ()=>{
    if(!(await canLeaveDetail()))return;
    const search=$('adminAccountSearch');
    search.value='';
    search.focus();
    if(applicationQueue){filterAccountPage();return;}
    const directory=adminPage==='accounts';
    $('accountRole').value=directory?'all':'teacher';
    $('accountStatusFilter').value=directory?'all':'active';
    (await showAdminView('accounts'));
    cursors=[null];
    task(()=>accounts(),directory?'Filters cleared. Showing all account roles and statuses.':'Filters cleared. Showing active teacher accounts.','Loading accounts…');
});
$('adminApplicationsMode').addEventListener('click',()=>$('reviewSubmittedApplications').click());
$('adminExistingMode').addEventListener('click',()=>$('accountFilters').requestSubmit());
$('adminRefreshRecords').addEventListener('click',()=>$('loadAdminOverview').click());
$('adminOpenRecords')?.addEventListener('click',async ()=>(await showAdminView('records',true)));
const recoveryButton=$('adminReturnToReview');
const recoverySummary=$('adminRecoverySummary');
let moderationConfirmationPending=false;
const activationPanel=$('moderationForm').closest('details');
const accessFeedback=text('p','',null,'qualification-form-feedback');
accessFeedback.setAttribute('role','status');accessFeedback.tabIndex=-1;
$('saveAccountStatus').before(accessFeedback);
$('moderationForm').addEventListener('input',()=>{accessFeedback.textContent='';});
const historyNotice=text('p','',null,'teacher-note');
historyNotice.setAttribute('role','status');
historyNotice.hidden=true;
$('accountHistory').before(historyNotice);
const recordsConnection=text('p','',null,'teacher-note admin-records-connection');
recordsConnection.setAttribute('role','status');
recordsConnection.hidden=true;
$('adminRecordResults').before(recordsConnection);
recoveryButton?.addEventListener('click',async ()=>{(await showAdminView(applicationQueue?'applications':'accounts',true,selected?.id));if(selected)$('accountName').focus();});
function detailState(){
    const values=root=>JSON.stringify([...root.querySelectorAll('input,textarea,select')].filter(field=>!field.closest('label[hidden]')||field.name!=='decision').map(field=>field.type==='checkbox'?field.checked:field.value));
    return {access:values($('moderationForm')),review:values($('teacherQualificationReview'))};
}
function qualificationDecisionState(){return $('teacherQualificationReview').querySelector('form')?.dataset.decisionState;}
function hasUnsavedDecision(){
    if(!selected)return false;
    const {access,review}=detailState();
    return (!savedAccountUid&&detailBaseline.access!==access)||(qualificationDecisionState()!=='saved'&&detailBaseline.review!==review);
}
async function canLeaveDetail(){
    if(busy||moderationConfirmationPending||qualificationDecisionState()==='saving')return false;
    if(pendingAccountDecision){message('Check the unconfirmed account decision before changing accounts.',true,document.body.dataset.adminView,selected?.id);return false;}
    if(qualificationDecisionState()==='unconfirmed'){message('Check the saved decision before leaving this review.',true,document.body.dataset.adminView,selected?.id);return false;}
    return !hasUnsavedDecision()||(await appConfirm('Discard the unsaved account or qualification decision?'));
}
window.addEventListener('beforeunload',event=>{if(hasUnsavedDecision()||busy||moderationConfirmationPending||pendingAccountDecision||['saving','unconfirmed'].includes(qualificationDecisionState())){event.preventDefault();event.returnValue='';}});
function text(tag,value,parent,className) {const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;parent?.append(el);return el;}
function accountContact(account){
    if(account.email)return account.email;
    return account.role==='student'&&/^LP-[A-F0-9]{12}$/.test(account.studentId||'')
        ? (account.username || 'Existing Student ID '+account.studentId) : 'Email unavailable';
}
async function openApplicationQueue(group,uid=null){
    if(!(await canLeaveDetail()))return;
    applicationQueue=true;applicationGroup=group;cursors=[null];$('adminAccountSearch').value='';
    await showAdminView('applications',true,uid);
    if(!adminNavigationPending)task(async()=>{await accounts();if(uid)await openAccount(uid);},'','Loading teacher applications…');
}
function renderAdminMessage(view) {
    const notice = viewMessages[view];
    const inAccount = Boolean(notice?.accountUid &&
        ['accounts', 'applications'].includes(view) && selected?.id === notice.accountUid);
    const actionArea = inAccount && view === 'applications'
        ? $('teacherQualificationReview').querySelector('.qualification-approval-next') : null;
    const anchor = inAccount ? $('accountName').parentElement : adminStatusHome;
    if (actionArea) {
        if (adminStatus.parentElement !== actionArea) actionArea.append(adminStatus);
    } else if (anchor.nextSibling !== adminStatus) anchor.after(adminStatus);
    adminStatus.dataset.error = String(notice?.error || false);
    adminStatus.classList.toggle('lp-status-panel', inAccount);
    adminStatus.dataset.state = notice?.state || '';
    adminStatus.textContent = notice?.accountUid && !inAccount ? '' : notice?.value || '';
}
function message(value,error=false,view=document.body.dataset.adminView||'overview',accountUid=null,state=error?'error':''){
    viewMessages[view]={value,error,accountUid,state};
    if(view===(document.body.dataset.adminView||'overview'))renderAdminMessage(view);
}
function date(value){try{return new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(value.toDate());}catch{return'Date unavailable';}}
function clearDetail(){
    stopHistoryWatch?.();stopHistoryWatch=null;historyPaged=false;historyCursor=null;historyNext=false;
    staleAccountUid=null;
    $('adminApplicationBack')?.remove();if(applicationStage){$('adminPageTitle').textContent='Teacher Applications';delete activationPanel.dataset.fromApplication;activationPanel.open=false;$('newAccountStatus').closest('label').hidden=false;}
    $('adminAccountsView').classList.remove('has-selection');selected=null;requestedHistoryRecord=null;historyNotice.hidden=true;$('adminAccountDetail').hidden=true;$('adminSelectionEmpty').hidden=Boolean(applicationStage);$('accountName').textContent='';$('accountEmail').textContent='';$('accountHistory').replaceChildren();$('teacherQualificationReview').replaceChildren();$('moderationForm').reset();accessFeedback.textContent='';renderAdminMessage(document.body.dataset.adminView||'overview');
}
function controls(){
    $('loadAdminOverview').disabled=busy||!auth.currentUser;
    if(recoveryButton){
        recoveryButton.disabled=!selected||busy;
        recoveryButton.closest('.admin-tool-card').hidden=!selected&&!pendingAccountDecision&&!savedAccountUid;
    }
    if(recoverySummary)recoverySummary.textContent=pendingAccountDecision?'An account decision is unconfirmed. Return to the review and use Check saved decision; do not repeat the write.':savedAccountUid?'A decision was saved. Return to the account to refresh its details.':selected?'Selected account: '+(selected.email||selected.id)+'. Its history and recovery controls are available in the review.':'No account is selected. Open Accounts to inspect an account history.';
    $('checkAccountDecision').hidden=!pendingAccountDecision&&!savedAccountUid&&!staleAccountUid;
    $('checkAccountDecision').textContent=pendingAccountDecision?'Check saved decision':staleAccountUid?'Reload account':'Refresh saved account';
    $('checkAccountDecision').disabled=busy;
    if(pendingAccountDecision||savedAccountUid)$('adminAccountDetail').querySelectorAll('form input,form select,form textarea,form button').forEach(el=>el.disabled=true);
    const moderationLocked=busy||!selected||Boolean(pendingAccountDecision||savedAccountUid||staleAccountUid);
    $('moderationForm').querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=moderationLocked);
    $('teacherQualificationReview').querySelectorAll('form[data-decision-locked="true"] input,form[data-decision-locked="true"] select,form[data-decision-locked="true"] textarea,form[data-decision-locked="true"] button').forEach(el=>el.disabled=true);
    $('previousAccounts').disabled=busy||cursors.length===1;$('nextAccounts').disabled=busy||!hasNext;
    $('moreAccountHistory').hidden=!historyNext;$('moreAccountHistory').disabled=busy;
    $('identityCheck').hidden=selected?.role!=='teacher'||$('newAccountStatus').value!=='active';
}
async function task(work,success='',progress='Loading administrator data…',accountUid=null) {
    if(busy||adminNavigationPending)return;busy=true;const generation=epoch,view=document.body.dataset.adminView||'overview';
    const lockedControls=document.querySelectorAll('#admin-main :is(button,input,select,textarea):enabled');
    lockedControls.forEach(control=>control.disabled=true);
    $('loadAdminOverview').disabled=true;
    message(progress,false,view,accountUid,'loading');$('admin-main').setAttribute('aria-busy','true');
    try {
        const outcome=await work();
        if(generation===epoch)message(typeof outcome==='string'?outcome:outcome?.message||success,false,view,accountUid,outcome?.state);
    }
    catch(error){if(generation===epoch)message(error.code==='permission-denied'?'Access denied. Your administrator access or server permissions may have changed. Refresh and try again.':error.message||'Unable to complete this action.',true,view,accountUid);}
    finally{if(generation===epoch){busy=false;document.body.classList.remove('workspace-loading');$('admin-main').setAttribute('aria-busy','false');lockedControls.forEach(control=>control.disabled=false);controls();}}
}
function stopApplicationQueue(){
    const live=liveApplicationQueue;
    liveApplicationQueue=null;
    if(live){clearTimeout(live.timer);live.unsubscribe?.();}
}
function followApplicationQueue(group,cursor,sourceVersion){
    if(sourceVersion===undefined){stopApplicationQueue();return;}
    if(liveApplicationQueue?.group===group&&liveApplicationQueue.cursor===cursor){
        liveApplicationQueue.loaded=sourceVersion;
        return;
    }
    stopApplicationQueue();
    const live={group,cursor,loaded:sourceVersion};
    liveApplicationQueue=live;
    live.unsubscribe=watchAdminApplicationQueue(group,cursor,version=>{
        if(liveApplicationQueue===live&&!live.refreshFailed)showApplicationConnection();
        clearTimeout(live.timer);
        const update=()=>{
            if(liveApplicationQueue!==live||!applicationQueue||applicationGroup!==group||cursors.at(-1)!==cursor||live.loaded===version)return;
            if(busy||$('adminAccounts').getAttribute('aria-busy')==='true'){
                live.timer=setTimeout(update,300);
                return;
            }
            void accounts(false).catch(()=>{
                if(liveApplicationQueue!==live)return;
                live.refreshFailed=true;
                showApplicationConnection('New applications could not load. Showing the last loaded list. Use Refresh list to try again.');
            });
        };
        live.timer=setTimeout(update,200);
    },()=>{
        if(liveApplicationQueue!==live)return;
        stopApplicationQueue();
        showApplicationConnection('Live updates paused. Use Refresh list to reconnect.');
    });
}
async function accounts(clear=true, pageCursors=null) {
    const list=$('adminAccounts');
    if(clear&&!pageCursors){
        if(clear)clearDetail();
        list.replaceChildren();
        if(applicationStage)$('adminApplicationCount').textContent='';
        if(applicationQueue){
            $('adminDirectory').querySelectorAll('.admin-applicant-tab-count').forEach(count=>count.remove());
            text('p','Loading teacher requests...',list,'admin-applicant-list-state');
        }
    }
    const generation=epoch,request=++directoryRequest,cursor=(pageCursors||cursors).at(-1);let result;
    if(!applicationQueue||liveApplicationQueue?.group!==applicationGroup){
        stopApplicationQueue();
        showApplicationConnection();
    }
    list.setAttribute('aria-busy','true');
    try{result=applicationQueue?await loadSubmittedTeacherApplications(cursor,applicationGroup):await loadAdminAccounts({role:$('accountRole').value,status:$('accountStatusFilter').value,cursor});}
    catch(error){if(generation===epoch&&request===directoryRequest&&applicationQueue&&clear&&!pageCursors){list.replaceChildren();text('p','Unable to load teacher requests. Use Retry to try again.',list,'admin-applicant-list-state');const retry=text('button','Retry loading applications',list,'secondary');retry.type='button';retry.addEventListener('click',()=>task(()=>accounts(),'','Retrying teacher requests...'));}throw error;}
    finally{if(generation===epoch&&request===directoryRequest)list.setAttribute('aria-busy','false');}
    if(generation!==epoch||request!==directoryRequest)return;
    if(pageCursors){
        cursors=pageCursors;
        if(clear){clearDetail();updateApplicationRoute();}
    }
    if(applicationQueue){
        showApplicationConnection();
        if(liveApplicationQueue)liveApplicationQueue.refreshFailed=false;
        followApplicationQueue(applicationGroup,cursor,result.sourceVersion);
    }
    const focusedAccount=list.contains(document.activeElement)?document.activeElement.dataset.userId:null;
    list.replaceChildren();
    hasNext=result.hasNext;nextCursor=result.cursor;
    $('accountListTitle').textContent=applicationQueue?'Application queue':'Accounts';
    refreshApplications.hidden=!applicationQueue;
    if(applicationStage){
        applicationStage.value=applicationGroup;
        $('adminApplicationCount').textContent=result.rows.length+' on this page';
    }else{
        awaitingSubmissionLink.hidden=!applicationQueue;
        applicationTabs.hidden=!applicationQueue;
        for(const button of [...applicationTabs.querySelectorAll('button'),awaitingSubmissionLink]){
            const active=button.dataset.applicationGroup===applicationGroup;
            button.setAttribute('aria-pressed',String(active));
            button.querySelector('.admin-applicant-tab-count')?.remove();
            if(active&&applicationQueue){
                const count=text('span',String(result.rows.length),button,'admin-applicant-tab-count');
                count.setAttribute('aria-label',result.rows.length+' loaded on this page');
            }
        }
    }
    $('adminSearchScope').textContent=applicationStage?'Search matches only the applications on this page.':applicationQueue?(applicationGroup==='awaiting'?'Search this scanned page by name or email. Choose Next to check more accounts.':'Change the category or page to see other applications.'):'Search the accounts on this page. Apply role and status filters to change which accounts load.';
    $('accountListContext').textContent=applicationQueue?applicationGroupDescriptions[applicationGroup]:'Select an account to review its access and recorded decisions.';
    $('accountPage').textContent=(applicationQueue?applicationGroupLabels[applicationGroup]+' · ':'')+'Page '+cursors.length;
    $('reviewSubmittedApplications').setAttribute('aria-pressed',String(applicationQueue));
    $('adminApplicationsMode').setAttribute('aria-pressed',String(applicationQueue));$('adminExistingMode').setAttribute('aria-pressed',String(!applicationQueue));
    $('adminAccountsView').dataset.mode=applicationQueue?'applications':'accounts';
    if(!result.rows.length)text('p',applicationQueue?(hasNext?'No teachers in this category on this page. Choose Next to check more accounts.':'No teachers in this category on this page.'):'No accounts match these filters. Try another status or reset the filters.',$('adminAccounts'),'admin-applicant-list-state');
    for(const account of result.rows) {
        const displayName=[account.firstName,account.lastName].filter(Boolean).join(' ')||'Unnamed account';
        const button=text('button','',$('adminAccounts'),'secondary');text('strong',displayName,button,'admin-applicant-name');
        if(applicationQueue||adminPage==='accounts'){const initials=displayName.split(/\s+/).filter(Boolean).slice(0,2).map(word=>Array.from(word)[0]).join('').toUpperCase();const avatar=text('span',initials,button,'admin-list-avatar');avatar.setAttribute('aria-hidden','true');}
        button.type='button';button.setAttribute('aria-pressed',String(selected?.id===account.id));button.setAttribute('aria-controls','adminAccountDetail');
        const contact=accountContact(account);
        button.dataset.userId=account.id;button.dataset.searchValue=[account.firstName,account.lastName,contact].filter(Boolean).join(' ');
        text('small',contact,button,applicationStage?'admin-applicant-contact':undefined);
        let stageLabel=account.applicationStage||applicationLabels[account.status]||'Application status unavailable';
        let rowAction='View application';
        let stageTone=account.status;
        if(applicationQueue&&applicationStage){
            if(account.status==='submitted'){
                const ready=account.emailVerified===true;
                stageLabel=ready?'Ready to review':'Email confirmation pending';
                rowAction=ready?'Review':'View application';
                stageTone=ready?'ready':'email';
            }else if(applicationGroup==='activation'){
                stageLabel='Access pending';
                rowAction='Review activation';
                stageTone='activation';
            }else if(applicationGroup==='reviewed')rowAction='View decision';
        }
        const badge=text('small',applicationQueue?stageLabel:`${account.role==='teacher'?'Teacher':'Student'} · ${account.status==='pending'?'Pending access':account.status==='inactive'?'Inactive':'Active'}`,button,'admin-status-label');badge.dataset.status=stageTone;
        if(applicationStage)text('span',rowAction,button,'admin-applicant-open');
        if(!applicationQueue&&adminPage==='accounts'){
         badge.textContent=account.status==='pending'?'Pending':account.status==='inactive'?'Inactive':'Active';
         text('span',account.role==='teacher'?'Teacher':'Student',button,'admin-account-role');
         text('span',account.createdAt?.toDate?new Intl.DateTimeFormat('en-PH',{dateStyle:'medium'}).format(account.createdAt.toDate()):'Not recorded',button,'admin-account-created');
         const identity=text('span','',null,'admin-account-identity');const avatar=button.querySelector('.admin-list-avatar');const name=button.querySelector('.admin-applicant-name');const address=button.querySelector('small:not(.admin-status-label)');identity.append(avatar,name,address);button.prepend(identity);button.title=displayName+' · '+contact;
         const view=text('span','',button,'admin-account-view-icon');view.setAttribute('aria-hidden','true');view.innerHTML='<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
        }
        button.addEventListener('click',async ()=>{if((await canLeaveDetail()))task(()=>openAccount(account.id),'','Loading account details and decision records…');});
    }
    document.querySelectorAll('[data-account-role]').forEach(tab=>tab.setAttribute('aria-pressed',String(tab.dataset.accountRole===$('accountRole').value)));
    filterAccountPage();
    if(focusedAccount)[...list.querySelectorAll('button[data-user-id]')].find(button=>button.dataset.userId===focusedAccount)?.focus({preventScroll:true});
    controls();
}
async function history(append=false) {
    if(!selected)return;const generation=epoch,uid=selected.id;
    const cursor=append?historyCursor:null;
    const result=await loadAdminHistory(uid,cursor);
    if(generation!==epoch||selected?.id!==uid)return;
    if(append&&cursor?.id!==historyCursor?.id){if(historyNext)await history(true);return;}
    if(append)historyPaged=true;
    renderAccountHistory(result,append?'append':'replace');
    if(append&&requestedHistoryRecord&&(!historyNext||result.rows.some(record=>record.id===requestedHistoryRecord)))revealAccountHistory(requestedHistoryRecord);
}
function renderAccountHistory(result,mode='replace'){
    const host=$('accountHistory');
    const fragment=document.createDocumentFragment();
    const existing=new Set([...host.querySelectorAll('article')].map(row=>row.dataset.recordId));
    const newRows=[];
    if(mode!=='prepend'){historyCursor=result.cursor;historyNext=result.hasNext;}
    if(mode==='replace'&&!result.rows.length)text('p','No decisions have been recorded for this account.',fragment,'teacher-note');
    for(const item of result.rows) {
        if(mode!=='replace'&&existing.has(item.id))continue;
        const outcome=describeAdminDecision(item);
        const row=text('article','',fragment,'admin-history-entry');
        newRows.push([item,row]);
        row.dataset.recordId=item.id;
        const header=text('div','',row,'admin-history-heading');
        const title=text('h3',outcome.label,header);
        row.dataset.tone=outcome.tone;
        const time=text('time',date(item.createdAt)+' (PH)',header,'teacher-note');
        try{time.dateTime=item.createdAt.toDate().toISOString();}catch{}
        text('p',item.reason||'No reason was recorded.',row,'admin-history-reason');
        text('p',decisionAccessSummary(item),row,'admin-history-access');
        const audit=text('details','',row,'admin-history-audit');
        text('summary','Full record',audit);
        text('p','Administrator ID: '+(item.actorId||'Unavailable'),audit,'teacher-note');
        text('p','Record ID: '+item.id,audit,'teacher-note');
        if(item.identityVerified)text('p','Teacher identity verification confirmed.',audit,'teacher-note');
    }
    if(mode==='replace')host.replaceChildren(fragment);
    else if(mode==='append')host.append(fragment);
    else {host.querySelector(':scope > p')?.remove();host.prepend(fragment);}
    if(selected?.role==='teacher'&&newRows.length){
        void loadAdminDecisionDetails([],newRows.map(([item])=>item)).then(({reviews})=>{
            const byId=new Map(reviews);
            for(const [item,row] of newRows){
                const review=byId.get(item.id);
                if(!review||!row.isConnected)continue;
                const verified=describeAdminDecision(item,review);
                row.querySelector('h3').textContent=verified.label;row.dataset.tone=verified.tone;
                text('p','Application revision '+review.revision,row.querySelector('details'),'teacher-note');
                const preview=[...$('teacherQualificationReview').querySelectorAll('.qualification-history-preview')].find(entry=>entry.dataset.recordId===item.id);
                if(preview)preview.querySelector('strong').textContent=verified.label;
            }
        }).catch(()=>{});
    }
    controls();
}
function startHistoryWatch(uid,initialHistory){
    let head=initialHistory.rows.map(row=>row.id);
    const account=selected;
    stopHistoryWatch=watchAdminAccountHistory(uid,{
        onConnection:()=>{},
        onError:()=>{stopHistoryWatch=null;},
        onRecords:result=>{
            if(selected!==account)return;
            const ids=result.rows.map(row=>row.id);
            if(ids.length===head.length&&ids.every((id,index)=>id===head[index]))return;
            const overlap=ids.findIndex(id=>head.includes(id));
            if(!head.length||overlap===-1){
                historyPaged=false;
                renderAccountHistory(result);
            }else{
                renderAccountHistory(result,'prepend');
                const history=$('accountHistory');
                const focused=document.activeElement;
                const entries=new Map([...history.querySelectorAll('article')].map(row=>[row.dataset.recordId,row]));
                let next=history.firstElementChild;
                for(const id of ids){
                    const row=entries.get(id);
                    if(next===row)next=next.nextElementSibling;
                    else history.insertBefore(row,next);
                }
                if(!historyPaged){
                    const keep=new Set(ids);
                    for(const row of entries.values()){
                        if(!keep.has(row.dataset.recordId))row.remove();
                    }
                    historyCursor=result.cursor;historyNext=result.hasNext;controls();
                }
                if(history.contains(focused)&&document.activeElement!==focused)focused.focus({preventScroll:true});
            }
            head=ids;
            if(requestedHistoryRecord&&ids.includes(requestedHistoryRecord))revealAccountHistory(requestedHistoryRecord);
        }
    });
}
function revealAccountHistory(recordId=null) {
    const section=$('accountHistory').closest('section');
    section.hidden=false;
    if($('adminHistoryPanel'))$('adminHistoryPanel').open=true;
    const row=recordId?[...$('accountHistory').querySelectorAll('article')].find(item=>item.dataset.recordId===recordId):null;
    requestedHistoryRecord=row||!historyNext?null:recordId;
    historyNotice.hidden=!recordId||Boolean(row);
    historyNotice.textContent=historyNotice.hidden?'':historyNext?'This decision is further back. Use Load more decisions to find it.':'This decision is unavailable in the account history.';
    if(row)row.dataset.highlighted='true';
    const target=row||$('adminHistoryPanel')?.querySelector('summary')||$('recordedDecisionsTitle');
    if(target.tagName!=='SUMMARY')target.tabIndex=-1;
    target.scrollIntoView({block:'start',behavior:'instant'});
    target.focus({preventScroll:true});
}
function mountReviewDossier(host){
 const layout=host.querySelector('.qualification-information-grid');if(!layout)return;
 const sections=[['qualifications','Qualifications',layout.querySelector('.qualification-facts-panel')],['documents','Documents',layout.querySelector('.qualification-documents-panel')],['history','History',layout.querySelector('.qualification-history-panel')]];
 const summary=layout.querySelector('.qualification-summary-panel');if(sections.some(item=>!item[2])||!summary)return;
 const desk=text('section','',null,'admin-review-dossier');const navigation=text('div','',desk,'admin-review-tabs');navigation.setAttribute('role','tablist');navigation.setAttribute('aria-label','Application review information');
 const content=text('div','',desk,'admin-review-tab-content');const readiness=text('aside','',null,'admin-review-readiness');readiness.setAttribute('aria-label','Submitted information checklist');readiness.append(summary);summary.querySelector('h4').lastChild.textContent='Review checklist';
 const buttons=[];const activate=index=>{sections.forEach((item,i)=>{const active=i===index;item[2].hidden=!active;buttons[i].setAttribute('aria-selected',String(active));buttons[i].tabIndex=active?0:-1;});};
 sections.forEach(([key,label,panel],index)=>{const button=text('button',label,navigation);button.type='button';button.id='review-tab-'+key+'-'+selected.id;button.dataset.reviewTab=key;button.setAttribute('role','tab');panel.id='review-pane-'+key+'-'+selected.id;button.setAttribute('aria-controls',panel.id);panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.tabIndex=0;content.append(panel);buttons.push(button);button.addEventListener('click',()=>activate(index));button.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%sections.length;else if(event.key==='ArrowLeft')next=(index+sections.length-1)%sections.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=sections.length-1;else return;event.preventDefault();activate(next);buttons[next].focus();});});
 layout.replaceChildren(desk,readiness);layout.classList.add('admin-review-desk');activate(0);
}
function revealAdminAccessForm(uid){
    if(selected?.id!==uid||selected.status!=='pending'||selected.role!=='teacher')return;
    const qualification=$('teacherQualificationReview').querySelector('.qualification-review');
    if(!qualification||qualification.dataset.applicationStatus!=='approved'||qualification.dataset.emailVerified!=='true'||
        !Number.isInteger(selected.teacherVerifiedRevision)||selected.teacherVerifiedRevision<1||qualification.dataset.applicationRevision!==String(selected.teacherVerifiedRevision))return;
    if(applicationStage&&applicationQueue){
        activationPanel.dataset.fromApplication='true';
        activationPanel.querySelector('summary').textContent='Activate classroom access';
        $('newAccountStatus').value='active';
        $('newAccountStatus').closest('label').hidden=true;
        $('saveAccountStatus').textContent='Review activation';
        controls();
    }
    activationPanel.open=true;
    (applicationStage?$('teacherIdentityVerified'):$('newAccountStatus')).focus();
}
async function openAccount(uid) {
    const generation=epoch,account=loadAdminAccount(uid);
    const [result,initialHistory,reviewSnapshot]=await Promise.all([
        account,loadAdminHistory(uid),
        account.then(({profile})=>profile.role==='teacher'?loadTeacherReviewSnapshot(uid):null)
    ]);
    if(generation!==epoch)return;clearDetail();savedAccountUid=null;selected=result.profile;
    $('adminAccountsView').classList.add('has-selection');
    document.querySelectorAll('#adminAccounts button').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.userId===uid)));
    $('accountName').textContent=[selected.firstName,selected.lastName].filter(Boolean).join(' ')||'Unnamed account';
    $('accountEmail').textContent=accountContact(selected);
    if($('adminAccountMetadata')){$('adminAccessPanel').open=false;$('adminHistoryPanel').open=false;$('adminDetailRole').textContent=selected.role==='teacher'?'Teacher':'Student';const metadata=$('adminAccountMetadata');metadata.replaceChildren();for(const [label,value]of [['Date created',date(selected.createdAt)],['Last updated',date(selected.updatedAt)],['Access',selected.status==='pending'?'Awaiting activation':selected.status==='active'?'Protected features available':'Protected features restricted']]){const row=text('div','',metadata);text('dt',label,row);text('dd',value,row);}const heading=$('accountName').parentElement;let avatar=heading.querySelector('.admin-detail-avatar');if(!avatar)avatar=text('span','',heading,'admin-detail-avatar');avatar.setAttribute('aria-hidden','true');avatar.textContent=[selected.firstName,selected.lastName].filter(Boolean).map(value=>Array.from(value)[0]).slice(0,2).join('').toUpperCase();}
    $('accountCurrentStatus').textContent=adminPage==='accounts'?(selected.status==='pending'?'Pending':selected.status==='active'?'Active':'Inactive'):[selected.role,selected.status].join(' / ');$('accountCurrentStatus').dataset.status=selected.status;
    $('accountHistory').closest('section').hidden=applicationQueue;
    $('newAccountStatus').value=selected.status==='active'?'inactive':'active';
    $('saveAccountStatus').textContent=adminPage==='accounts'?'Review & confirm change':'Save Account Status';
    $('adminSelectionEmpty').hidden=true;$('adminAccountDetail').hidden=false;renderAccountHistory(initialHistory);
    const previousBack=$('adminApplicationBack');previousBack?.remove();
    if(applicationQueue||adminPage==='accounts'){
        if(applicationQueue)$('adminPageTitle').textContent=applicationStage?'Application review':'Teacher Application Review';
        const className=applicationQueue?'secondary admin-application-back':'secondary admin-account-back';
        const back=text('button',applicationStage?'\u2190 Back to queue':'\u2190 Back to list',document.querySelector('.teacher-topbar'),className);
        back.id='adminApplicationBack';back.type='button';
        back.addEventListener('click',async()=>{
            if(!(await canLeaveDetail()))return;
            clearDetail();
            updateApplicationRoute();
            const row=[...$('adminAccounts').querySelectorAll('button')].find(control=>control.dataset.userId===uid);
            const target=row||$('accountListTitle');
            if(!row)target.tabIndex=-1;
            target.scrollIntoView({block:'center',behavior:'instant'});
            target.focus({preventScroll:true});
        });
    }
    if(selected?.id===uid&&selected.role==='teacher'){
        const host=document.createElement('section');host.className='qualification-review';$('teacherQualificationReview').append(host);
        await mountTeacherReview(host,selected,async outcome=>{
            if(generation!==epoch)return;detailBaseline=detailState();
            const view = document.body.dataset.adminView;
            try{await reloadDecisionAccount(uid);if(generation===epoch)message(outcome?.refreshOnly?'Application reloaded.':outcome?.decision==='approved'?(outcome.activationComplete?'Teacher approved and account access active. Qualification and access decisions are recorded separately.':'Qualifications approved. Check the current account access.'):outcome?.decision==='needs_changes'?'Changes requested. The teacher can read your feedback and resubmit.':outcome?.decision==='declined'?'Application declined. Your reason and audit record are saved.':'Qualification decision saved with its audit record.',false,view,uid);}
            catch(error){if(generation===epoch&&!outcome?.refreshOnly)message('Qualification decision saved with its audit record, but the view could not refresh. Refresh the saved review or account list before another decision.',false,view,uid,'refresh-needed');throw error;}
        },reviewSnapshot);
        if(!applicationQueue&&generation===epoch&&selected?.id===uid){const approved=host.dataset.applicationStatus==='approved'&&Number(selected.teacherVerifiedRevision)>0&&host.dataset.applicationRevision===String(selected.teacherVerifiedRevision);const context=text('section','',$('teacherQualificationReview'),'admin-account-review-context');text('strong',approved?'Qualifications approved':host.dataset.applicationStatus==='not_submitted'?'Teacher has not submitted an application':host.dataset.applicationStatus==='submitted'?'Application ready for review':'Qualification review needs attention',context);text('p',approved?(selected.status==='active'?'Account access is already active.':'Next: choose Activate access, record your reason, and confirm below.'):'Review qualifications in Teacher Applications before granting new classroom access.',context);const open=text('button',host.dataset.applicationStatus==='not_submitted'?'View submission status':'Open teacher application',context,'secondary');open.type='button';open.addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;applicationGroup=host.dataset.applicationStatus==='not_submitted'||host.dataset.applicationStatus==='draft'?'awaiting':host.dataset.applicationStatus==='needs_changes'?'revision':host.dataset.applicationStatus==='submitted'?'review':'reviewed';(await showAdminView('applications',false,uid));applicationQueue=true;task(async()=>{await accounts();await openAccount(uid);},'','Opening teacher application...');});const details=document.createElement('details');details.className='admin-legacy-qualification-review';const summary=text('summary','Qualification details and recovery controls',details);host.before(details);details.append(host);}
        if(applicationQueue&&generation===epoch&&selected?.id===uid){
            const next=host.querySelector('.qualification-approval-next');
            if(next){
                const approved=host.dataset.applicationStatus==='approved'&&Number(selected.teacherVerifiedRevision)>0&&host.dataset.applicationRevision===String(selected.teacherVerifiedRevision);
                const needsActivation=approved&&host.dataset.emailVerified==='true'&&selected.status==='pending';
                const access=text('button',needsActivation?(applicationStage?'Activate classroom access':'Review and activate access'):approved&&selected.status==='inactive'?'Review account access':'View account details',next,'secondary admin-application-access-link');
                access.type='button';
                if(needsActivation)access.dataset.accessAction='activate';
                access.addEventListener('click',async ()=>{
                    if(applicationStage&&needsActivation){if(!busy)revealAdminAccessForm(uid);return;}
                    if(!(await canLeaveDetail()))return;
                    applicationQueue=false;
                    $('accountRole').value='teacher';
                    $('accountStatusFilter').value=selected.status;
                    await showAdminView('accounts',false,uid,needsActivation?'activate':null);
                    if(!adminNavigationPending)task(async()=>{await accounts();await openAccount(uid);if(needsActivation)revealAdminAccessForm(uid);},'','Loading account access...');
                });
                if(host.dataset.applicationStatus==='submitted'&&host.dataset.emailVerified==='false'){
                    const refreshVerification=text('button','Refresh verification status',next,'secondary');refreshVerification.type='button';
                    refreshVerification.addEventListener('click',()=>refreshApplications.click());
                }
            }
        }
        const sidebar=host.querySelector('.qualification-information-side');
        if(generation===epoch&&selected?.id===uid&&sidebar){
            const preview=text('section','',sidebar,'qualification-history-panel');
            const historyHeading=text('h4','Recent decisions',preview);
            const historyIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');
            historyIcon.setAttribute('viewBox','0 0 24 24');
            historyIcon.setAttribute('aria-hidden','true');
            historyIcon.classList.add('qualification-section-icon');
            historyIcon.innerHTML='<path d="M3 11a9 9 0 1 1 2 7 M3 4v7h7 M12 7v6l4 2"/>';
            historyHeading.prepend(historyIcon);
            const rows=[...$('accountHistory').querySelectorAll('article')];
            if(!rows.length)text('p','No saved decisions for this account.',preview,'teacher-note');
            for(const row of rows.slice(0,2)){
                const item=text('div','',preview,'qualification-history-preview');
                item.dataset.recordId=row.dataset.recordId;
                text('strong',row.querySelector('h3').textContent,item);
                text('p',row.querySelector('time').textContent,item,'teacher-note');
                text('p',row.querySelector('.admin-history-reason').textContent,item,'qualification-history-reason');
            }
            if(rows.length){
                const more=text('button','View complete history',preview,'secondary');
                more.type='button';
                more.addEventListener('click',()=>revealAccountHistory());
            }
        }
    }
    if(applicationQueue&&generation===epoch&&selected?.id===uid){const host=$('teacherQualificationReview').querySelector('.qualification-review');if(host)mountReviewDossier(host);}
    if(generation===epoch&&selected?.id===uid){
        if(adminPage)startHistoryWatch(uid,initialHistory);
        detailBaseline=detailState();
        updateApplicationRoute(uid);
        const heading=$('adminApplicantHeading')||$('accountName');
        if(applicationStage)$('adminAccountDetail').setAttribute('aria-labelledby',heading.id);
        heading.focus({preventScroll:true});
        if(applicationStage||window.matchMedia('(max-width:900px)').matches)$('adminAccountDetail').scrollIntoView({block:'start',behavior:'instant'});
    }
}
async function applyAccountFilters(role){
    if(!(await canLeaveDetail()))return;
    if(role){$('accountRole').value=role;if(role==='student'&&$('accountStatusFilter').value==='pending')$('accountStatusFilter').value='active';}
    applicationQueue=false;
    await showAdminView('accounts');
    if(!adminNavigationPending){cursors=[null];task(()=>accounts(),'Account list refreshed.','Loading filtered accounts…');}
}
$('accountFilters').addEventListener('submit',event=>{event.preventDefault();void applyAccountFilters();});
$('reviewSubmittedApplications').addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;applicationQueue=true;applicationGroup='review';$('adminAccountSearch').value='';(await showAdminView('applications'));cursors=[null];task(()=>accounts(),'','Loading submitted teacher applications…');});
$('accountRole').addEventListener('change',()=>{
    if($('accountRole').value==='student'&&$('accountStatusFilter').value==='pending')$('accountStatusFilter').value='active';
    if(adminPage==='accounts')syncDirectoryReset($('adminAccountSearch').value.trim());
});
$('accountStatusFilter').addEventListener('change',()=>{
    if(adminPage==='accounts')syncDirectoryReset($('adminAccountSearch').value.trim());
});
async function changeAccountPage(button,forward){
    if(button.disabled||busy||adminNavigationPending||!(await canLeaveDetail())||busy||adminNavigationPending)return;
    const requested=forward?[...cursors,nextCursor]:cursors.slice(0,-1),generation=epoch;
    let loaded=false;
    await task(async()=>{await accounts(true,requested);loaded=true;},'Page '+requested.length+' loaded.','Loading page '+requested.length+'…');
    if(generation!==epoch)return;
    if(!loaded){button.focus({preventScroll:true});return;}
    const heading=document.querySelector('.admin-account-list-title h2')||$('accountListTitle');
    heading.tabIndex=-1;
    heading.setAttribute('aria-describedby','accountPage');
    heading.scrollIntoView({block:'center',behavior:'instant'});
    heading.focus({preventScroll:true});
}
$('previousAccounts').addEventListener('click',event=>changeAccountPage(event.currentTarget,false));
$('nextAccounts').addEventListener('click',event=>changeAccountPage(event.currentTarget,true));
$('moreAccountHistory').addEventListener('click',()=>task(()=>history(true)));
$('newAccountStatus').addEventListener('change',controls);
const adminMenuToggle=$('adminMenuToggle');
const adminMenuDismiss=$('adminMenuDismiss');
const adminMenuViewport=window.matchMedia('(max-width: 900px)');
function setAdminMenu(open,restoreFocus=false){
    document.body.classList.toggle('admin-menu-open',open);
    adminMenuToggle.setAttribute('aria-expanded',String(open));
    adminMenuToggle.setAttribute('aria-label',open?'Close administrator menu':'Open administrator menu');
    if(adminMenuDismiss)adminMenuDismiss.hidden=!open;
    $('admin-main').inert=open;
    if(open)$('adminNavigation').querySelector('[aria-current="page"]')?.focus({preventScroll:true});
    else if(restoreFocus)adminMenuToggle.focus({preventScroll:true});
}
adminMenuToggle.addEventListener('click',()=>setAdminMenu(adminMenuToggle.getAttribute('aria-expanded')!=='true',true));
adminMenuDismiss?.addEventListener('click',()=>setAdminMenu(false,true));
adminMenuViewport.addEventListener('change',event=>{if(!event.matches)setAdminMenu(false);});
document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&adminMenuToggle.getAttribute('aria-expanded')==='true'&&!document.querySelector('dialog[open]'))setAdminMenu(false,true);
});

document.querySelectorAll('.admin-navigation [data-teacher-tab]').forEach(link=>link.addEventListener('click',async event=>{
    if(adminPage){
        if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
        event.preventDefault();
        if(link.dataset.teacherTab!==adminPage)await navigateAdmin(link.dataset.teacherTab,null,null,{preserveContext:false});
        else if(adminMenuToggle.getAttribute('aria-expanded')==='true'){setAdminMenu(false);$('admin-main').focus({preventScroll:true});}
        return;
    }
    event.preventDefault();if(busy)return;if(!['accounts','applications'].includes(link.dataset.teacherTab)&&!(await canLeaveDetail()))return;
    document.querySelectorAll('.admin-navigation [data-teacher-tab]').forEach(item=>{item.removeAttribute('aria-current');item.setAttribute('aria-pressed','false');});
    link.setAttribute('aria-current','page');
    link.setAttribute('aria-pressed','true');
    setAdminMenu(false);
    if(link.getAttribute('href')==='#adminOverview')$('adminOverview').open=true;
    const destination=link.dataset.teacherTab;
    if(destination==='applications'){if(applicationQueue)(await showAdminView('applications',true));else $('reviewSubmittedApplications').click();}
    else if(destination==='accounts'){if(!applicationQueue)(await showAdminView('accounts',true));else $('accountFilters').requestSubmit();}
    else (await showAdminView(destination,true));
}));
async function openDecisionAccount(decision) {
    if(adminPage){await navigateAdmin('accounts',decision.userId,'history',{preserveContext:false,recordId:decision.id});return;}
    if(!(await canLeaveDetail()))return;
    await showAdminView('accounts',false,decision.userId);
    applicationQueue=false;
    task(async()=>{await accounts();await openAccount(decision.userId);revealAccountHistory(decision.id);},'','Loading account history…');
}
function renderDecisionRecords(result,generation,reloadDetails=false) {
    if(decisionTimeline&&!reloadDetails){decisionTimeline.update(result.decisions,result.moreDecisions);return;}
    decisionTimeline=mountDecisionRecords($('adminRecordResults'),result.decisions,{
        moreAvailable:result.moreDecisions,onHistory:openDecisionAccount,
        resolveDetails:adminPage==='records'?loadAdminDecisionDetails:null,
        initialRecordId:adminParameters.get('decision'),
        isCurrent:()=>generation===epoch&&!!auth.currentUser
    });
}
function decisionWindowKey(result) {
    return JSON.stringify([result.moreDecisions,...result.decisions.map(record=>record.id)]);
}
function showRecordsConnection(copy) {
    recordsConnection.hidden=!copy;
    recordsConnection.textContent=copy;
}
function connectRecentDecisions(generation) {
    if(stopRecentWatch||!['overview','records'].includes(adminPage))return;
    let seenServer=false;
    stopRecentWatch=watchAdminRecentDecisions({
        onConnection:online=>{
            if(generation!==epoch||adminPage!=='records')return;
            if(online){seenServer=true;showRecordsConnection('');}
            else if(seenServer)showRecordsConnection('Reconnecting to live updates…');
        },
        onError:error=>{
            if(generation!==epoch)return;
            stopRecentWatch=null;
            if(error.code==='permission-denied'){
                decisionTimeline=null;decisionKey=null;recentLive=null;
                $('adminRecordResults').replaceChildren();
                $('adminRecentActivity')?.replaceChildren();
                if(adminPage==='records')showRecordsConnection('The server denied access to decision records.');
                return;
            }
            if(adminPage==='records')showRecordsConnection('Live updates paused. Use Refresh to reconnect.');
        },
        onRecords:result=>{
            if(generation!==epoch)return;
            recentLive=result;
            const key=decisionWindowKey(result);
            if(decisionKey===key)return;
            decisionKey=key;
            if(adminPage==='records'){
                if(!decisionTimeline&&!busy)message('',false,'records');
                renderDecisionRecords(result,generation);showAdminSnapshotTime();
            }
            else {
                const list=$('adminRecentActivity');
                if(list)renderRecentActivity(list,result.decisions,true);
            }
        }
    });
}
function renderRecentActivity(list,records,dashboard) {
    const focusedId=document.activeElement?.dataset.decisionId;
    list.replaceChildren();
    if(!records.length){
        const empty=text('div','',list,'admin-activity-empty');
        const mark=text('span','\u2637',empty,'admin-activity-empty-icon');mark.setAttribute('aria-hidden','true');
        text('strong','No decision records yet',empty);
        text('p','Your saved account and teacher-review decisions will appear here.',empty,'teacher-note');
        return;
    }
    text('p','Your '+Math.min(3,records.length)+' latest saved decisions.',list,'admin-activity-scope');
    for(const decision of records.slice(0,3)){
        const preview=text('article','',list,'admin-activity-row');preview.dataset.status=decision.status;
        const mark=text('span',decision.status==='inactive'?'\u2013':'\u2713',preview,'admin-activity-mark');mark.setAttribute('aria-hidden','true');
        const content=text('div','',preview,'admin-activity-content');
        text('h3',describeAdminDecision(decision).label,content);
        text('p','Account ID: '+decision.userId,content,'admin-activity-account');
        text('p',decision.reason||'Reason unavailable',content,'admin-activity-reason');
        const timestamp=text('time',date(decision.createdAt)+' (PH)',content,'admin-activity-time');try{timestamp.dateTime=decision.createdAt.toDate().toISOString();}catch{}
        const action=text('button',dashboard?'View decision':'View history',content,'admin-activity-link');
        action.type='button';action.dataset.decisionId=decision.id;
        action.setAttribute('aria-label',(dashboard?'View decision':'View history')+' for account '+decision.userId);
        action.addEventListener('click',()=>dashboard
            ? navigateAdmin('records',null,null,{preserveContext:false,recordId:decision.id})
            : openDecisionAccount(decision));
        if(decision.id===focusedId)action.focus({preventScroll:true});
    }
}
function showAdminSnapshotTime() {
    const current=new Date();
    $('adminOverviewStatus').textContent='Updated '+new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(current)+' (Philippine time).';
    $('adminOverviewStatus').parentElement.dataset.state='ready';
    $('adminHeaderSnapshot').textContent='Updated '+new Intl.DateTimeFormat('en-PH',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'Asia/Manila'}).format(current)+' · PH';
}
async function overview(){
    const generation=epoch;$('adminOverviewStatus').textContent='Updating dashboard...';$('adminOverviewStatus').parentElement.dataset.state='loading';$('loadAdminOverview').setAttribute('aria-busy','true');$('loadAdminOverview').disabled=true;
    const lastLive=recentLive;
    try{
        if(adminPage==='records'){
            const result=await loadAdminRecentDecisions();
            if(generation===epoch){
                const latest=recentLive!==lastLive?recentLive:result;
                decisionKey=decisionWindowKey(latest);
                renderDecisionRecords(latest,generation,true);showAdminSnapshotTime();
                connectRecentDecisions(generation);
            }
            return;
        }
        const result=await loadAdminOverview();if(generation!==epoch)return;
        const host=$('adminOverviewResults');host.replaceChildren();
        const dashboard=adminPage==='overview';
        const work=text('section','',host,'admin-work-queue');
        const workTitle=text('h2',dashboard?'Teacher application queue':'Teacher review queue',work);workTitle.id='adminWorkQueueTitle';work.setAttribute('aria-labelledby',workTitle.id);
        const workCards=text('div','',work,'admin-work-queue-cards');
        for(const [group,label,hint] of [
            ['ready','Review applications','Check teaching details and record a decision.'],
            ['activation','Activate approved teachers','Grant access to the teacher dashboard.'],
            ['email','Waiting for email confirmation','The teacher needs to confirm their email.']
        ]){
            const {count,more}=result.workQueue[group];
            const card=text('button','',workCards,'admin-work-queue-card');card.type='button';card.dataset.workCategory=group;
            card.dataset.hasItems=String(count>0);
            text('strong',dashboard?label:applicationGroupLabels[group],card,'admin-work-queue-label');
            text('span',count+(more&&count?'+':''),card,'admin-work-queue-count');
            text('small',hint,card,'admin-work-queue-hint');
            text('span','→',card,'admin-work-queue-arrow').setAttribute('aria-hidden','true');
            card.addEventListener('click',()=>openApplicationQueue(group));
        }
        if(Object.values(result.workQueue).some(entry=>entry.more))text('p','Counts cover the latest loaded results. Open a list to check more pages.',work,'teacher-note');
        const actionableCount=result.workQueue.ready.count+result.workQueue.activation.count;
        const queueBadge=$('adminQueueBadge');queueBadge.textContent=String(actionableCount);
        queueBadge.setAttribute('aria-label',` ${actionableCount} ready for review or activation in the loaded results`);
        queueBadge.hidden=actionableCount===0;
        const applications=text('section','',host);applications.className='admin-pending-panel';
        const queueHeading=text('header','',applications,'admin-pending-heading');const queueTitle=text('h2',dashboard?'Pending teacher accounts':'Teacher accounts awaiting approval',queueHeading);
        const queueIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');queueIcon.setAttribute('viewBox','0 0 24 24');queueIcon.setAttribute('aria-hidden','true');queueIcon.innerHTML='<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2"/>';queueTitle.prepend(queueIcon);
        text('p',dashboard?'Check where a teacher is in the application process.':'Open a teacher’s row to continue from the stage shown.',applications,'admin-queue-scope');
        if(!result.teacherQueue.length){
            const empty=text('div','',applications,'admin-queue-empty');text('strong','No teachers awaiting approval in this snapshot',empty);
            text('p','Use Refresh in the top bar to check for new requests.',empty,'teacher-note');
        }
        for(const application of result.teacherQueue.slice(0,dashboard?3:5)){
            const name=application.legalName?.trim()||application.email||'Teacher application';
            const row=text('div','',applications,'admin-queue-row');
            row.dataset.workCategory=application.workGroup||'awaiting';
            const initials=application.legalName?.trim().split(/\s+/).filter(Boolean).slice(0,2).map(part=>Array.from(part)[0]).join('').toLocaleUpperCase()||'T';
            const avatar=text('span',initials,row,'admin-queue-avatar');avatar.setAttribute('aria-hidden','true');
            const identity=text('div','',row,'admin-queue-identity');text('strong',name,identity);text('small',application.email||'Email unavailable',identity);
            text('span',application.stage,row,'admin-queue-status');
            const reviewLabel=application.workGroup==='ready'?'Review':'Open';
            const review=text('button',reviewLabel,row,'secondary');review.type='button';review.setAttribute('aria-label',reviewLabel+' '+name);review.addEventListener('click',async ()=>{if(application.workGroup){await openApplicationQueue(application.workGroup,application.id);return;}if(!(await canLeaveDetail()))return;applicationQueue=false;$('accountRole').value='teacher';$('accountStatusFilter').value='pending';$('adminAccountSearch').value='';cursors=[null];await showAdminView('accounts',false,application.id);if(!adminNavigationPending)task(async()=>{await accounts();await openAccount(application.id);},'Application loaded.','Loading teacher application…');});
        }
        const pendingCount=result.pendingTeacherCount+(result.morePendingTeachers?'+':'');
        const open=text('button','View pending accounts ('+pendingCount+')',queueHeading,'admin-queue-view-all');open.type='button';open.addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;applicationQueue=false;$('accountRole').value='teacher';$('accountStatusFilter').value='pending';$('adminAccountSearch').value='';cursors=[null];(await showAdminView('accounts',true));task(()=>accounts(),'','Loading pending teacher accounts…');});
        const decisions=text('section','',host,'admin-decision-preview');
        const decisionHeading=text('header','',decisions,'admin-activity-heading');const decisionTitle=text('h2',dashboard?'Recent decisions':'Decision activity',decisionHeading);
        const historyIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');historyIcon.setAttribute('viewBox','0 0 24 24');historyIcon.setAttribute('aria-hidden','true');historyIcon.innerHTML='<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>';decisionTitle.prepend(historyIcon);
        const all=text('button',dashboard?'Open decision records':'View all records',decisionHeading,'admin-activity-view-all');all.type='button';all.dataset.destination='records';all.addEventListener('click',async ()=>{if((await canLeaveDetail()))(await showAdminView('records',true));});
        const activity=text('div','',decisions);activity.id='adminRecentActivity';
        const latest=recentLive!==lastLive?recentLive:result;
        renderRecentActivity(activity,latest.decisions,dashboard);
        decisionKey=decisionWindowKey(latest);
        if(!adminPage)renderDecisionRecords(result,generation);
        if(!adminPage)renderOverviewShortcuts(host,applications,decisions,result);
        host.hidden=false;
        showAdminSnapshotTime();
        connectRecentDecisions(generation);
    }catch(error){
        if(generation===epoch){
            $('adminOverviewStatus').parentElement.dataset.state='error';
            if(adminPage==='records'&&error.code!=='permission-denied'){
                const retained=Boolean($('adminRecordResults').querySelector('.decision-list-panel'));
                if(retained)return {state:'refresh-needed',message:'Refresh failed. The last loaded decisions are still shown.'};
                throw Error('Could not load decision records. Use Refresh to try again.');
            }
            $('adminOverviewStatus').textContent=$('adminOverviewResults').hidden?'Overview unavailable. Try refreshing again.':'Refresh failed. The previous snapshot is still shown and may be outdated.';
        }
        throw error;
    }
    finally{if(generation===epoch){$('loadAdminOverview').setAttribute('aria-busy','false');$('loadAdminOverview').disabled=false;}}
}
function renderOverviewShortcuts(host,applications,decisions,result){
        const metrics=text('div','',null,'admin-metrics teacher-summary');
        for(const [label,value,note] of [
            ['Teachers awaiting approval',String(result.teacherQueue.length)+(result.moreTeacherQueue?'+':''),'Pending accounts and submitted applications'],
            ['Your decision records',String(result.decisions.length)+(result.moreDecisions?'+':''),'Up to 10 recent records in this snapshot']
        ]){const card=text('div','',metrics,'admin-metric');text('span',label,card);text('strong',value,card);text('small',note,card);}
        const summaryIcons=['M8 4H5v17h14V4h-3M8 2h8v5H8zM8 12h8M8 16h6','M9 3h6l5 5v13H4V3h5m5 0v6h6M8 13h8M8 17h6'];
        [...metrics.children].forEach((card,index)=>{const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.classList.add('admin-summary-icon');const shape=document.createElementNS('http://www.w3.org/2000/svg','path');shape.setAttribute('d',summaryIcons[index]);icon.append(shape);card.prepend(icon);});
        const quick=text('section','',host,'admin-quick-actions');const quickHeading=text('h2','Quick actions',quick);
        const bolt=document.createElementNS('http://www.w3.org/2000/svg','svg');bolt.setAttribute('viewBox','0 0 24 24');bolt.setAttribute('aria-hidden','true');bolt.classList.add('admin-quick-heading-icon');const boltPath=document.createElementNS('http://www.w3.org/2000/svg','path');boltPath.setAttribute('d','M13 2 4 14h7l-1 8 10-13h-7l1-7Z');bolt.append(boltPath);quickHeading.prepend(bolt);
        const shortcuts=[
            ['Review teacher applications','Submitted qualifications awaiting a decision','applications','M8 4H5v17h14V4h-3M8 2h8v5H8zM8 12h8M8 16h6'],
            ['Manage accounts','Student & Teacher Accounts: status and access','accounts','M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5v2'],
            ['View decision records','Saved decisions, reasons and account history','records','M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm0 4v5l4 2'],
            ['Administration & recovery','Selected-account recovery and workspace limits','environment','M4 4h16v6H4zM4 14h16v6H4zM7 7h1m-1 10h1']
        ];
        for(const [label,description,destination,path] of shortcuts){
            const action=text('button','',quick,'secondary admin-quick-action');action.type='button';action.dataset.destination=destination;
            const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');const shape=document.createElementNS('http://www.w3.org/2000/svg','path');shape.setAttribute('d',path);icon.append(shape);action.append(icon);
            const copy=text('span','',action,'admin-quick-copy');const title=text('strong',label,copy);title.id='adminQuickTitle-'+destination;const hint=text('small',description,copy);hint.id='adminQuickHint-'+destination;
            action.setAttribute('aria-labelledby',title.id);action.setAttribute('aria-describedby',hint.id);const arrow=text('span','\u2192',action,'admin-quick-arrow');arrow.setAttribute('aria-hidden','true');
            action.addEventListener('click',async ()=>{if(adminPage){await navigateAdmin(destination,null,null,{preserveContext:false});return;}if(!['applications','accounts'].includes(destination)&&!(await canLeaveDetail()))return;if(destination==='applications')$('reviewSubmittedApplications').click();else if(destination==='accounts')$('accountFilters').requestSubmit();else (await showAdminView(destination,true));});
        }
        const notices=text('section','',host,'admin-overview-notices');
        const noticeHeading=text('header','',notices,'admin-activity-heading');const noticeTitle=text('h2','Workspace notices',noticeHeading);
        const announcement=document.createElementNS('http://www.w3.org/2000/svg','svg');announcement.setAttribute('viewBox','0 0 24 24');announcement.setAttribute('aria-hidden','true');announcement.innerHTML='<path d="m4 9 13-5v16L4 15V9Zm0 0H2v6h2m3 1 1 6h4l-2-5M21 8v8"/>';noticeTitle.prepend(announcement);
        const notice=text('div','',notices,'admin-workspace-notice-box');
        const information=text('span','i',notice,'admin-notice-information');information.setAttribute('aria-hidden','true');
        const noticeCopy=text('div','',notice,'admin-notice-copy');text('strong','Administrative activity only',noticeCopy);text('p','Manage accounts, review teacher qualifications and inspect saved decisions here. Core content, assessment settings and student rewards cannot be edited in this workspace.',noticeCopy);
        text('p','Live Firebase and AI service health are not monitored.',notices,'admin-notice-limitation');
        const reviewColumn=text('div','',host,'admin-overview-column');reviewColumn.append(applications,decisions);
        const toolsColumn=text('div','',host,'admin-overview-column');toolsColumn.append(quick,notices);
        toolsColumn.insertBefore(metrics,notices);
}
$('loadAdminOverview').addEventListener('click',async ()=>{
    if(document.body.dataset.adminView==='accounts'){
        if(busy||!(await canLeaveDetail()))return;
        const uid=selected?.id;
        task(async()=>{await accounts();if(uid)await openAccount(uid);},'Account list refreshed.','Refreshing accounts…');
        return;
    }
    task(overview,'',adminPage==='records'?'Loading decision records…':'Loading application queue and decision records…');
});
async function refreshSavedAccount(uid){
    const generation=epoch;
    savedAccountUid=uid;
    detailBaseline=detailState();
    message('Account status saved. Updating this view…',false,document.body.dataset.adminView,uid,'saved');
    try {
        await reloadDecisionAccount(uid);
        if(generation!==epoch)return;
        return {state:'saved',message:'Account status saved with its audit record.'};
    } catch {
        if(generation===epoch)savedAccountUid=uid;
        return {state:'refresh-needed',message:'Account status saved with its audit record, but the view could not refresh. Use Refresh saved account to see the latest details.'};
    }
}
async function reloadDecisionAccount(uid){
    const [detail,directory]=await Promise.allSettled([openAccount(uid),accounts(false)]);
    if(detail.status==='rejected')throw detail.reason;
    if(directory.status==='rejected')throw directory.reason;
}
$('checkAccountDecision').addEventListener('click',()=>{
    const accountUid=staleAccountUid||savedAccountUid||pendingAccountDecision?.uid;
    if(!accountUid)return;
    task(async()=>{
        if(staleAccountUid){
            await reloadDecisionAccount(accountUid);
            return 'Latest account status loaded. Review it before deciding.';
        }
        if(savedAccountUid)return refreshSavedAccount(savedAccountUid);
        const pending=pendingAccountDecision;
        if(!await pending.check())return {state:'unconfirmed',message:'The decision is still unconfirmed. Your review is preserved. Check again when connected; do not submit another decision.'};
        pendingAccountDecision=null;return refreshSavedAccount(pending.uid);
    },'','Checking the saved account decision…',accountUid);
});
$('moderationForm').addEventListener('submit',async event=>{
    event.preventDefault();if(busy||moderationConfirmationPending||!selected||pendingAccountDecision||savedAccountUid||staleAccountUid)return;
    const values={uid:selected.id,expectedRole:selected.role,expectedStatus:selected.status,expectedVersion:selected.updatedAt?.toMillis?.()||selected.createdAt?.toMillis?.()||0,status:$('newAccountStatus').value,reason:$('moderationReason').value,identityVerified:$('teacherIdentityVerified').checked};
    try{moderationDetails(selected,values.status,values.reason,values.identityVerified);}catch(error){accessFeedback.textContent=error.message;accessFeedback.focus();return;}
    const applicant=$('accountName').textContent||selected.email||selected.id;
    const action=values.status==='active'?'Activate access':'Deactivate access';
    const consequence=values.status==='active'?'The user can sign in and use their workspace. Saved learning records are preserved.':'The user loses workspace access. Saved learning records are preserved.';
    const generation=epoch;
    moderationConfirmationPending=true;
    let confirmed;
    try{confirmed=await appConfirm(`${action} for ${applicant}${selected.email?' ('+selected.email+')':''}?\n\n${consequence}\n\nReason: ${values.reason.trim()}`,{title:'Confirm account access change'});}
    catch(error){if(generation===epoch){accessFeedback.textContent=error.message;accessFeedback.focus();}}
    finally{moderationConfirmationPending=false;}
    if(!confirmed||generation!==epoch||busy||selected?.id!==values.uid||pendingAccountDecision||savedAccountUid||staleAccountUid)return;
    task(async()=>{
        try{await moderateAccount(values);}
        catch(error){
            if(generation===epoch){
                if(error.code==='admin/decision-unknown')pendingAccountDecision={uid:values.uid,check:error.checkDecision};
                if(error.code==='admin/stale-account')staleAccountUid=values.uid;
            }
            throw error;
        }
        if(generation===epoch)return refreshSavedAccount(values.uid);
    },'','Saving account access decision…',values.uid);
});
function clear(){
    stopApplicationQueue();
    showApplicationConnection();
    stopRecentWatch?.();stopRecentWatch=null;decisionTimeline=null;recentLive=null;decisionKey=null;
    showRecordsConnection('');
    document.body.classList.add('workspace-loading');for(const key of Object.keys(viewMessages))delete viewMessages[key];++epoch;busy=false;pendingAccountDecision=null;savedAccountUid=null;applicationQueue=false;clearDetail();cursors=[null];hasNext=false;nextCursor=null;$('adminAccounts').replaceChildren();$('adminAccounts').setAttribute('aria-busy','false');$('adminRecordResults').replaceChildren();$('adminOverviewResults').replaceChildren();const snapshot=$('adminHeroSnapshot');if(snapshot){snapshot.replaceChildren();snapshot.hidden=true;}$('adminQueueBadge').hidden=true;$('adminOverviewResults').hidden=true;$('adminOverviewStatus').textContent='Not loaded yet.';$('adminHeaderSnapshot').textContent='Not updated yet';$('loadAdminOverview').setAttribute('aria-busy','false');$('loadAdminOverview').disabled=false;$('adminOverviewStatus').parentElement.dataset.state='idle';$('adminOverview').open=false;message('');controls();
}
window.addEventListener('pagehide',clear);
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
window.addEventListener('online',()=>{if(adminRouteReady&&auth.currentUser)connectRecentDecisions(epoch);});
onAuthStateChanged(auth,async user=>{
    adminRouteReady=false;clear();
    delete $('adminRecordResults').decisionState;
    const initial=adminRoutes[adminPage]?adminPage:'overview';
    applicationQueue=initial==='applications';
    if(applicationQueue&&Object.hasOwn(applicationGroupLabels,adminParameters.get('category')))applicationGroup=adminParameters.get('category');
    if(['all','teacher','student'].includes(adminParameters.get('role')))$('accountRole').value=adminParameters.get('role');
    if(['all','pending','active','inactive'].includes(adminParameters.get('status')))$('accountStatusFilter').value=adminParameters.get('status');
    await showAdminView(initial);adminRouteReady=true;
    if(user)task(async()=>{
        if(!adminPage||['accounts','applications'].includes(initial))await accounts();
        if(!adminPage||['overview','records'].includes(initial))await overview();
        const uid=adminParameters.get('account');
        if(uid&&['accounts','applications'].includes(initial)){
            await openAccount(uid);
            if(initial==='accounts'&&adminParameters.get('action')==='activate')revealAdminAccessForm(uid);
            if(initial==='accounts'&&adminParameters.get('action')==='history')revealAccountHistory(adminParameters.get('decision'));
        }
    },'','Loading administrator workspace…');
});
(await showAdminView(adminRoutes[adminPage]?adminPage:'overview'));
