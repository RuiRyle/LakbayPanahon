import {mountAdministration} from './admin-administration-view.js';
import {firebaseEnvironment} from './firebase-environment.js';
import {mountDecisionRecords} from './admin-decision-view.js';
import {appConfirm} from './app-dialog.js';
import {auth} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {loadAdminAccounts,loadAdminAccount,loadAdminHistory,moderateAccount,loadAdminDecisionReview,loadSubmittedTeacherApplications,loadAdminOverview} from './admin-accounts.js';
import {mountTeacherReview} from './teacher-review-panel.js';
const $=id=>document.getElementById(id);
const adminRoutes={overview:'admin-dashboard.html',applications:'admin-applications.html',accounts:'admin-accounts.html',records:'admin-decisions.html',environment:'admin-administration.html'};
const adminPage=document.body.dataset.adminPage;
const adminParameters=new URLSearchParams(location.search);
let adminRouteReady=false;
let adminNavigationPending=false;
async function navigateAdmin(view,accountId=null){
    if(!(await canLeaveDetail()))return;
    const destination=new URL(adminRoutes[view],location.href);
    if(accountId)destination.searchParams.set('account',accountId);
    if(view==='applications')destination.searchParams.set('category',applicationGroup);
    if(view==='accounts'){destination.searchParams.set('role',$('accountRole').value);destination.searchParams.set('status',$('accountStatusFilter').value);}
    detailBaseline=detailState();
    adminNavigationPending=true;
    const link=document.createElement('a');link.href=destination.href;link.hidden=true;document.body.append(link);link.click();link.remove();
}
let epoch=0,busy=false,selected=null,cursors=[null],hasNext=false,nextCursor=null,historyCursor=null,historyNext=false;
let applicationQueue=false;
let applicationGroup='review';
const applicationGroupLabels={awaiting:'Not submitted',review:'Pending',revision:'For Revision',reviewed:'Reviewed'};
const applicationLabels={submitted:'Pending review',needs_changes:'For revision',approved:'Approved qualifications',declined:'Declined'};
const applicationTabs=document.createElement('div');applicationTabs.className='admin-application-tabs';applicationTabs.setAttribute('role','group');applicationTabs.setAttribute('aria-label','Application status');
for(const [group,label] of Object.entries(applicationGroupLabels)){const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.applicationGroup=group;button.setAttribute('aria-pressed',String(group===applicationGroup));button.addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;applicationGroup=group;$('adminAccountSearch').value='';cursors=[null];task(()=>accounts(),'','Loading applications...');});applicationTabs.append(button);}
$('accountListContext').after(applicationTabs);
const awaitingSubmissionLink=applicationTabs.querySelector('[data-application-group=awaiting]');awaitingSubmissionLink.className='admin-awaiting-submission-link';awaitingSubmissionLink.textContent='Teachers who have not submitted';applicationTabs.after(awaitingSubmissionLink);
const refreshApplications=document.createElement('button');refreshApplications.id='adminRefreshApplications';refreshApplications.type='button';refreshApplications.className='secondary admin-refresh-applications';refreshApplications.setAttribute('aria-label','Refresh application list');refreshApplications.title='Refresh application list';refreshApplications.textContent='\u21bb';$('accountListContext').parentElement.append(refreshApplications);refreshApplications.addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;const uid=selected?.id;task(async()=>{await accounts(false);if(uid)await openAccount(uid);},'Application list refreshed.','Refreshing applications...');});
const applicantSearchIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');applicantSearchIcon.setAttribute('viewBox','0 0 24 24');applicantSearchIcon.setAttribute('aria-hidden','true');applicantSearchIcon.classList.add('admin-applicant-search-icon');applicantSearchIcon.innerHTML='<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>';$('adminAccountSearch').parentElement.append(applicantSearchIcon);
const applicantPagination=document.createElement('div');applicantPagination.className='admin-applicant-pagination';const pageActions=$('nextAccounts').parentElement;$('accountPage').before(applicantPagination);applicantPagination.append($('accountPage'),pageActions);$('previousAccounts').title='Previous page';$('nextAccounts').title='Next page';
const workflowHelp=document.createElement('section');workflowHelp.className='admin-workflow-purpose';workflowHelp.hidden=true;const workflowTitle=text('strong','',workflowHelp);const workflowDescription=text('p','',workflowHelp);const workflowShortcut=text('button','',workflowHelp,'secondary');workflowShortcut.type='button';$('adminAccountModes').after(workflowHelp);workflowShortcut.addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;const toApplications=document.body.dataset.adminView==='accounts';if(toApplications)$('reviewSubmittedApplications').click();else{$('accountRole').value='teacher';$('accountStatusFilter').value='pending';$('accountFilters').requestSubmit();}});
$('accountStatusFilter').querySelector('option[value=pending]').textContent='Pending access';
$('newAccountStatus').querySelector('option[value=active]').textContent='Activate access';$('newAccountStatus').querySelector('option[value=inactive]').textContent='Deactivate access';
let detailBaseline='';
let pendingAccountDecision=null;
let savedAccountUid=null;
const viewCopy={overview:['Administrator Dashboard','Pending work and your saved decisions.'],applications:['Teacher Applications','Review qualifications and guide eligible teachers into active access.'],accounts:['Accounts','Manage existing student and teacher access.'],records:['Decision Records','Your saved administrative decisions, in document order.'],environment:['Administration','Workspace information, selected-account recovery and monitoring scope.']};
const viewMessages={};
function setupAccountDirectory(){
 if(adminPage!=='accounts')return;
 for(const [id,label]of [['accountRole','All roles'],['accountStatusFilter','All statuses']]){const option=document.createElement('option');option.value='all';option.textContent=label;$(id).prepend(option);$(id).value='all';}
 const intro=$('adminViewHeading').parentElement;intro.classList.add('admin-account-banner');const landscape=document.querySelector('.admin-welcome-landscape').cloneNode(true);intro.append(landscape);
 const tabs=text('div','',null,'admin-account-role-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Account role');
 for(const [role,label]of [['all','All Accounts'],['teacher','Teachers'],['student','Students']]){const button=text('button',label,tabs,'secondary');button.type='button';button.dataset.accountRole=role;button.setAttribute('aria-pressed',String(role==='all'));button.addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;$('accountRole').value=role;$('accountFilters').requestSubmit();});}
 const toolbar=text('section','',null,'admin-account-toolbar');toolbar.setAttribute('aria-label','Search and filter accounts');const form=$('accountFilters');toolbar.append($('adminAccountSearch').parentElement,form);const reset=text('button','Reset',form,'secondary');reset.type='button';reset.addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;$('adminAccountSearch').value='';$('accountRole').value='all';$('accountStatusFilter').value='all';form.requestSubmit();});
 $('adminAccountsView').before(tabs,toolbar);toolbar.after($('adminSearchScope'),$('adminSearchStatus'),$('adminResetFilters'));
 $('adminAccountSearch').placeholder='Search name or email (current page only)';
 const headings=text('div','',null,'admin-account-columns');headings.setAttribute('aria-hidden','true');for(const label of ['Account','Role','Status','Created','View'])text('span',label,headings);$('adminAccounts').before(headings);
 const listTitle=text('div','',null,'admin-account-list-title');text('h2','All accounts',listTitle);const loaded=text('span','',listTitle);loaded.id='adminDirectoryCount';headings.before(listTitle);
 const noMatches=text('div','',null,'admin-account-no-matches');noMatches.id='adminAccountNoMatches';noMatches.hidden=true;text('strong','No matching accounts on this page',noMatches);text('p','Try another name or email, or clear the search to see the loaded accounts.',noMatches);const clear=text('button','Clear search',noMatches,'secondary');clear.type='button';clear.addEventListener('click',()=>{$('adminAccountSearch').value='';filterAccountPage();$('adminAccountSearch').focus();});$('adminAccounts').after(noMatches);
 const heading=$('adminAccountDetail').querySelector('header');const panelTitle=text('h2','Account Details',null,'admin-account-detail-title');heading.before(panelTitle);const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.innerHTML='<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>';panelTitle.prepend(icon);
 const role=text('span','',heading,'admin-detail-role');role.id='adminDetailRole';
 const metadata=text('dl','',null,'admin-account-metadata');metadata.id='adminAccountMetadata';heading.after(metadata);
 const actions=text('div','',null,'admin-account-detail-actions');metadata.after(actions);
 const access=$('adminAccountDetail').querySelector('.admin-access-details');access.open=false;access.id='adminAccessPanel';
 for(const [label,handler]of [['Change status',()=>{access.open=!access.open;if(access.open)$('newAccountStatus').focus();}],['View history',()=>{historyDetails.open=!historyDetails.open;}]]){const button=text('button',label,actions,'secondary');button.type='button';button.addEventListener('click',handler);button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',label==='Change status'?'adminAccessPanel':'adminHistoryPanel');}
 const historySection=$('recordedDecisionsTitle').parentElement;const historyDetails=document.createElement('details');historyDetails.className='admin-account-history-details';historyDetails.id='adminHistoryPanel';const summary=text('summary','Decision history',historyDetails);historySection.before(historyDetails);historyDetails.append(historySection);
 for(const panel of [access,historyDetails])panel.addEventListener('toggle',()=>{actions.querySelector('[aria-controls='+panel.id+']').setAttribute('aria-expanded',String(panel.open));});
 const accessSummary=access.querySelector('summary');accessSummary.textContent='Update account access';
 const note=access.querySelector('p.teacher-note');note.textContent='Choose the access change, record a reason, then review the confirmation. Saved learning records are preserved.';
 $('saveAccountStatus').textContent='Review & confirm change';

}
setupAccountDirectory();
if(adminPage==='environment')mountAdministration($('adminEnvironment'),{environment:firebaseEnvironment});
async function showAdminView(view,focus=false,accountId=null){
    if(!viewCopy[view])view='overview';
    if(adminPage&&adminRouteReady&&view!==adminPage){(await navigateAdmin(view,accountId));return;}
    document.body.dataset.adminView=view;const back=$('adminApplicationBack');if(back)back.hidden=view!=='applications';
    const notice=viewMessages[view];$('adminStatus').textContent=notice?.value||'';$('adminStatus').dataset.error=String(notice?.error||false);
    $('adminOverview').hidden=view!=='overview';$('adminAccountsView').hidden=!['accounts','applications'].includes(view);$('adminEnvironment').hidden=view!=='environment';
    $('adminDecisionRecords').hidden=view!=='records';
    $('adminAccountsView').dataset.workspace=view==='applications'?'applications':'accounts';
    $('adminAccountSearch').placeholder=view==='applications'?'Search name or email':'Search name or email (current page only)';
    $('adminSelectionTitle').textContent=view==='applications'?'Select a teacher to review':'Select an account to begin';
    const emptyCopy=$('adminSelectionEmpty').querySelector('p');if(emptyCopy)emptyCopy.textContent=view==='applications'?'Choose Pending to review submitted applications. Teachers without a submission are available through the separate link.':'Choose a name from the list to review teaching details, change account access or read past decisions.';
    $('adminAccountModes').hidden=true;workflowHelp.hidden=!['accounts','applications'].includes(view);workflowShortcut.textContent=view==='applications'?'Go to Accounts':'Go to Teacher Applications';workflowTitle.textContent=view==='applications'?'Review teacher qualifications':'Manage student and teacher access';workflowDescription.textContent=view==='applications'?'Approve & Activate guides both audited decisions. Request changes or decline when requirements are not met.':'Activate or deactivate account access here. Teacher qualification decisions belong in Teacher Applications.';
    $('adminViewHeading').textContent=viewCopy[view][0];$('adminPageTitle').textContent=view==='accounts'?'Accounts Management':viewCopy[view][0];$('adminViewDescription').textContent=viewCopy[view][1];
    document.querySelectorAll('.admin-navigation [data-teacher-tab]').forEach(link=>{const active=link.dataset.teacherTab===view;link.setAttribute('aria-pressed',String(active));if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    if(view==='overview')$('adminOverview').open=true;
    if(focus)(view==='overview'?$('adminWelcomeHeading'):$('adminViewHeading')).focus({preventScroll:true});
}
function filterAccountPage(){
    const term=$('adminAccountSearch').value.trim().toLocaleLowerCase();let matches=0,total=0;
    $('adminAccounts').querySelectorAll('button[data-user-id]').forEach(button=>{total++;button.hidden=!!term&&!(applicationQueue?(button.dataset.searchValue||button.textContent):button.textContent).toLocaleLowerCase().includes(term);if(!button.hidden)matches++;});
    $('adminSearchStatus').textContent=term?`${matches} of ${total} ${applicationQueue?'teachers':'accounts'} on this page match.`:'';
    const count=$('adminLoadedAccountCount');if(count)count.textContent=String(matches);
    const scope=$('adminLoadedAccountScope');if(scope)scope.textContent=(applicationQueue?'Loaded applications':'Loaded '+$('accountStatusFilter').value+' '+$('accountRole').value+' accounts')+(term?' · search applied':' · current page only');
    if($('adminDirectoryCount')){$('adminDirectoryCount').textContent=term?matches+' of '+total+' match':total+' loaded on this page';$('adminAccountNoMatches').hidden=!term||matches>0;const title=document.querySelector('.admin-account-list-title h2');title.textContent=$('accountRole').value==='teacher'?'Teacher accounts':$('accountRole').value==='student'?'Student accounts':'All accounts';}
    $('adminResetFilters').hidden=matches>0||(applicationQueue&&!term);
    $('adminResetFilters').textContent=applicationQueue?'Clear search':'Reset search & filters';
}
$('adminAccountSearch').addEventListener('input',filterAccountPage);
$('adminResetFilters').addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;if(applicationQueue){$('adminAccountSearch').value='';filterAccountPage();$('adminAccountSearch').focus();return;}$('adminAccountSearch').value='';$('accountRole').value='teacher';$('accountStatusFilter').value='active';applicationQueue=false;(await showAdminView('accounts'));cursors=[null];task(()=>accounts(),'Filters reset. Showing active teacher accounts.','Loading active teacher accounts…');});
$('adminApplicationsMode').addEventListener('click',()=>$('reviewSubmittedApplications').click());
$('adminExistingMode').addEventListener('click',()=>$('accountFilters').requestSubmit());
$('adminRefreshRecords').addEventListener('click',()=>$('loadAdminOverview').click());
$('adminOpenRecords').addEventListener('click',async ()=>(await showAdminView('records',true)));
$('adminReturnToReview').addEventListener('click',async ()=>{(await showAdminView(applicationQueue?'applications':'accounts',true,selected?.id));if(selected)$('accountName').focus();});
function detailState(){return JSON.stringify([...$('adminAccountDetail').querySelectorAll('input,select,textarea')].map(el=>[el.name||el.id,el.type==='checkbox'?el.checked:el.value]));}
function hasUnsavedDecision(){return !!selected&&detailBaseline!==detailState();}
async function canLeaveDetail(){
    if(busy)return false;
    if(pendingAccountDecision){message('Check the unconfirmed account decision before changing accounts.',true);return false;}
    if($('teacherQualificationReview').querySelector('form button[type="submit"]:disabled')){message('Wait for the qualification decision to finish saving.');return false;}
    return !hasUnsavedDecision()||(await appConfirm('Discard the unsaved account or qualification decision?'));
}
window.addEventListener('beforeunload',event=>{if(hasUnsavedDecision()||busy||$('teacherQualificationReview').querySelector('form button[type="submit"]:disabled')){event.preventDefault();event.returnValue='';}});
function text(tag,value,parent,className) {const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;parent?.append(el);return el;}
function message(value,error=false,view=document.body.dataset.adminView||'overview'){viewMessages[view]={value,error};if(view===(document.body.dataset.adminView||'overview')){$('adminStatus').textContent=value;$('adminStatus').dataset.error=String(error);}}
function date(value){try{return new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(value.toDate());}catch{return'Date unavailable';}}
function clearDetail(){$('adminApplicationBack')?.remove();$('adminAccountsView').classList.remove('has-selection');selected=null;$('adminAccountDetail').hidden=true;$('adminSelectionEmpty').hidden=false;$('accountName').textContent='';$('accountEmail').textContent='';$('accountHistory').replaceChildren();$('teacherQualificationReview').replaceChildren();$('moderationForm').reset();}
function controls(){
    $('loadAdminOverview').disabled=busy||!auth.currentUser;
    $('adminReturnToReview').disabled=!selected||busy;
    $('adminReturnToReview').closest('.admin-tool-card').hidden=!selected&&!pendingAccountDecision&&!savedAccountUid;
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
    if(busy||adminNavigationPending)return;busy=true;const generation=epoch,view=document.body.dataset.adminView||'overview';
    document.querySelectorAll('#admin-main button, #admin-main input, #admin-main select, #admin-main textarea').forEach(el=>el.disabled=true);message(progress);$('admin-main').setAttribute('aria-busy','true');
    try{const outcome=await work();if(generation===epoch)message(typeof outcome==='string'?outcome:success,false,view);}
    catch(error){if(generation===epoch)message(error.code==='permission-denied'?'Access denied. Your administrator access or server permissions may have changed. Refresh and try again.':error.message||'Unable to complete this action.',true,view);}
    finally{if(generation===epoch){busy=false;document.body.classList.remove('workspace-loading');$('admin-main').setAttribute('aria-busy','false');document.querySelectorAll('#admin-main button, #admin-main input, #admin-main select, #admin-main textarea').forEach(el=>el.disabled=false);controls();}}
}
async function accounts(clear=true) {
    if(clear)clearDetail();$('adminAccounts').replaceChildren();
    const generation=epoch;let result;
    if(applicationQueue){$('adminDirectory').querySelectorAll('.admin-applicant-tab-count').forEach(count=>count.remove());$('adminAccounts').setAttribute('aria-busy','true');text('p','Loading teacher requests...',$('adminAccounts'),'admin-applicant-list-state');}
    try{result=applicationQueue?await loadSubmittedTeacherApplications(cursors.at(-1),applicationGroup):await loadAdminAccounts({role:$('accountRole').value,status:$('accountStatusFilter').value,cursor:cursors.at(-1)});}
    catch(error){if(generation===epoch&&applicationQueue){$('adminAccounts').replaceChildren();text('p','Unable to load teacher requests. Use Retry to try again.',$('adminAccounts'),'admin-applicant-list-state');const retry=text('button','Retry loading applications',$('adminAccounts'),'secondary');retry.type='button';retry.addEventListener('click',()=>task(()=>accounts(),'','Retrying teacher requests...'));}throw error;}
    finally{$('adminAccounts').setAttribute('aria-busy','false');}
    if(generation!==epoch)return;
    $('adminAccounts').replaceChildren();
    hasNext=result.hasNext;nextCursor=result.cursor;
    $('accountListTitle').textContent=applicationQueue?'Teacher Applications':'Accounts';
    refreshApplications.hidden=!applicationQueue;awaitingSubmissionLink.hidden=!applicationQueue;awaitingSubmissionLink.setAttribute('aria-pressed',String(applicationGroup==='awaiting'));applicationTabs.hidden=!applicationQueue;[...applicationTabs.querySelectorAll('button'),awaitingSubmissionLink].forEach(button=>{const active=button.dataset.applicationGroup===applicationGroup;button.setAttribute('aria-pressed',String(active));button.querySelector('.admin-applicant-tab-count')?.remove();if(active&&applicationQueue){const count=text('span',String(result.rows.length),button,'admin-applicant-tab-count');count.title='Loaded on this page; not a global total';count.setAttribute('aria-label',result.rows.length+' loaded on this page');}});
    $('adminSearchScope').textContent=applicationQueue?(applicationGroup==='awaiting'?'Search covers matches from this scanned account page only. Next checks more accounts.':'Search covers this loaded application page only. Use categories and pagination for other applications.'):'Filters only the accounts on this page. Use filters and pagination to find other accounts.';
    $('accountListContext').textContent=applicationQueue?({awaiting:'Accounts waiting for the teacher to submit a form.',review:'Submitted applications ready for your decision.',revision:'Teachers asked to update and resubmit their details.',reviewed:'Completed reviews. Approved teachers may still need activation.'}[applicationGroup]):'Select an account to review its access and recorded decisions.';
    $('accountPage').textContent=(applicationQueue?applicationGroupLabels[applicationGroup]+' · ':'')+'Page '+cursors.length;
    $('reviewSubmittedApplications').setAttribute('aria-pressed',String(applicationQueue));
    $('adminApplicationsMode').setAttribute('aria-pressed',String(applicationQueue));$('adminExistingMode').setAttribute('aria-pressed',String(!applicationQueue));
    $('adminAccountsView').dataset.mode=applicationQueue?'applications':'accounts';
    if(!result.rows.length)text('p',applicationQueue?(applicationGroup==='awaiting'&&hasNext?'No awaiting submissions on this scanned account page. Choose Next to check the next page.':'No teachers in this category on this page. Choose another category.'):'No accounts match these filters. Try another status or reset the filters.',$('adminAccounts'));
    for(const account of result.rows) {
        const displayName=[account.firstName,account.lastName].filter(Boolean).join(' ')||'Unnamed account';
        const button=text('button','',$('adminAccounts'),'secondary');text('strong',displayName,button,'admin-applicant-name');
        if(applicationQueue||adminPage==='accounts'){const initials=displayName.split(/\s+/).filter(Boolean).slice(0,2).map(word=>Array.from(word)[0]).join('').toUpperCase();const avatar=text('span',initials,button,'admin-list-avatar');avatar.setAttribute('aria-hidden','true');}
        button.type='button';button.setAttribute('aria-pressed',String(selected?.id===account.id));button.setAttribute('aria-controls','adminAccountDetail');
        button.dataset.userId=account.id;button.dataset.searchValue=[account.firstName,account.lastName,account.email].filter(Boolean).join(' ');
        text('small',account.email||'Email unavailable',button);
        const badge=text('small',applicationQueue?(account.applicationStage||applicationLabels[account.status]||'Application status unavailable'):`${account.role==='teacher'?'Teacher':'Student'} · ${account.status==='pending'?'Pending access':account.status==='inactive'?'Inactive':'Active'}`,button,'admin-status-label');badge.dataset.status=account.status;
        if(!applicationQueue&&adminPage==='accounts'){
         badge.textContent=account.status==='pending'?'Pending':account.status==='inactive'?'Inactive':'Active';
         text('span',account.role==='teacher'?'Teacher':'Student',button,'admin-account-role');
         text('span',account.createdAt?.toDate?new Intl.DateTimeFormat('en-PH',{dateStyle:'medium'}).format(account.createdAt.toDate()):'Not recorded',button,'admin-account-created');
         const identity=text('span','',null,'admin-account-identity');const avatar=button.querySelector('.admin-list-avatar');const name=button.querySelector('.admin-applicant-name');const email=button.querySelector('small:not(.admin-status-label)');identity.append(avatar,name,email);button.prepend(identity);button.title=displayName+' ? '+(account.email||'Email unavailable');
         const view=text('span','',button,'admin-account-view-icon');view.setAttribute('aria-hidden','true');view.innerHTML='<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
        }
        button.addEventListener('click',async ()=>{if((await canLeaveDetail()))task(()=>openAccount(account.id),'','Loading account details and decision records…');});
    }
    document.querySelectorAll('[data-account-role]').forEach(tab=>tab.setAttribute('aria-pressed',String(tab.dataset.accountRole===$('accountRole').value)));
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
async function openAccount(uid) {
    const generation=epoch,result=await loadAdminAccount(uid);
    if(generation!==epoch)return;clearDetail();savedAccountUid=null;selected=result.profile;
    $('adminAccountsView').classList.add('has-selection');
    document.querySelectorAll('#adminAccounts button').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.userId===uid)));
    $('accountName').textContent=[selected.firstName,selected.lastName].filter(Boolean).join(' ')||'Unnamed account';
    $('accountEmail').textContent=selected.email||'Email unavailable';
    if($('adminAccountMetadata')){$('adminAccountDetail').querySelector('.admin-access-details').open=false;$('adminHistoryPanel').open=false;document.querySelectorAll('.admin-account-detail-actions button').forEach(button=>button.setAttribute('aria-expanded','false'));$('adminDetailRole').textContent=selected.role==='teacher'?'Teacher':'Student';const metadata=$('adminAccountMetadata');metadata.replaceChildren();for(const [label,value]of [['Date created',date(selected.createdAt)],['Last updated',date(selected.updatedAt)],['Access',selected.status==='pending'?'Awaiting activation':selected.status==='active'?'Protected features available':'Protected features restricted'],['Account type',selected.role==='teacher'?'Teacher':'Student']]){const row=text('div','',metadata);text('dt',label,row);text('dd',value,row);}const heading=$('accountName').parentElement;let avatar=heading.querySelector('.admin-detail-avatar');if(!avatar)avatar=text('span','',heading,'admin-detail-avatar');avatar.setAttribute('aria-hidden','true');avatar.textContent=[selected.firstName,selected.lastName].filter(Boolean).map(value=>Array.from(value)[0]).slice(0,2).join('').toUpperCase();}
    $('accountCurrentStatus').textContent=adminPage==='accounts'?(selected.status==='pending'?'Pending':selected.status==='active'?'Active':'Inactive'):[selected.role,selected.status].join(' / ');$('accountCurrentStatus').dataset.status=selected.status;
    $('accountHistory').closest('section').hidden=applicationQueue;
    $('newAccountStatus').value=selected.status==='active'?'inactive':'active';
    $('saveAccountStatus').textContent=adminPage==='accounts'?'Review & confirm change':'Save Account Status';
    $('adminSelectionEmpty').hidden=true;$('adminAccountDetail').hidden=false;controls();await history();
    const previousBack=$('adminApplicationBack');previousBack?.remove();
    if(applicationQueue){$('adminPageTitle').textContent='Teacher Application Review';const back=text('button','\u2190 Back to list',document.querySelector('.teacher-topbar'),'secondary admin-application-back');back.id='adminApplicationBack';back.type='button';back.addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;clearDetail();$('accountListTitle').setAttribute('tabindex','-1');$('accountListTitle').focus({preventScroll:true});$('adminDirectory').scrollIntoView({block:'start',behavior:'instant'});});}
    if(selected?.id===uid&&selected.role==='teacher'){
        const host=document.createElement('section');host.className='qualification-review';$('teacherQualificationReview').append(host);
        await mountTeacherReview(host,selected,async outcome=>{
            if(generation!==epoch)return;detailBaseline=detailState();
            try{await accounts(false);if(generation===epoch)await openAccount(uid);if(generation===epoch)message(outcome?.decision==='approved'?(outcome.activationComplete?'Teacher approved and account access active. Qualification and access decisions are recorded separately.':'Qualifications approved. Next: activate account access if it is not already active.'):outcome?.decision==='needs_changes'?'Changes requested. The teacher can read your feedback and resubmit.':outcome?.decision==='declined'?'Application declined. Your reason and audit record are saved.':'Qualification decision saved with its audit record.');}
            catch(error){if(generation===epoch)message('Qualification decision saved with its audit record, but the view could not refresh. Refresh the saved review or account list before another decision.');throw error;}
        });
        if(!applicationQueue&&generation===epoch&&selected?.id===uid){const approved=host.dataset.applicationStatus==='approved'&&Number(selected.teacherVerifiedRevision)>0&&host.dataset.applicationRevision===String(selected.teacherVerifiedRevision);const context=text('section','',$('teacherQualificationReview'),'admin-account-review-context');text('strong',approved?'Qualifications approved':host.dataset.applicationStatus==='not_submitted'?'Teacher has not submitted an application':host.dataset.applicationStatus==='submitted'?'Application ready for review':'Qualification review needs attention',context);text('p',approved?(selected.status==='active'?'Account access is already active.':'Next: choose Activate access, record your reason, and confirm below.'):'Review qualifications in Teacher Applications before granting new classroom access.',context);const open=text('button',host.dataset.applicationStatus==='not_submitted'?'View submission status':'Open teacher application',context,'secondary');open.type='button';open.addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;applicationGroup=host.dataset.applicationStatus==='not_submitted'||host.dataset.applicationStatus==='draft'?'awaiting':host.dataset.applicationStatus==='needs_changes'?'revision':host.dataset.applicationStatus==='submitted'?'review':'reviewed';(await showAdminView('applications',false,uid));applicationQueue=true;task(async()=>{await accounts();await openAccount(uid);},'','Opening teacher application...');});const details=document.createElement('details');details.className='admin-legacy-qualification-review';const summary=text('summary','Qualification details and recovery controls',details);host.before(details);details.append(host);}
        if(applicationQueue&&generation===epoch&&selected?.id===uid){const access=text('button',host.dataset.applicationStatus==='approved'&&Number(selected.teacherVerifiedRevision)>0&&host.dataset.applicationRevision===String(selected.teacherVerifiedRevision)&&selected.status!=='active'?'Next: activate account access':'View account details',host,'secondary admin-application-access-link');access.type='button';access.addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;applicationQueue=false;$('accountRole').value='teacher';$('accountStatusFilter').value=selected.status;(await showAdminView('accounts',false,uid));task(async()=>{await accounts();await openAccount(uid);},'','Loading account access...');});}
        if(generation===epoch&&selected?.id===uid){const sidebar=host.querySelector('.qualification-information-side');if(sidebar){const preview=text('section','',sidebar,'qualification-history-panel');const historyHeading=text('h4','Review History',preview);const historyIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');historyIcon.setAttribute('viewBox','0 0 24 24');historyIcon.setAttribute('aria-hidden','true');historyIcon.classList.add('qualification-section-icon');historyIcon.innerHTML='<path d="M3 11a9 9 0 1 1 2 7 M3 4v7h7 M12 7v6l4 2"/>';historyHeading.prepend(historyIcon);const rows=[...$('accountHistory').querySelectorAll('article')];if(!rows.length)text('p','No saved decisions for this account.',preview,'teacher-note');for(const row of rows.slice(0,2)){const item=text('div','',preview,'qualification-history-preview');text('strong',row.querySelector('h3')?.textContent||'Recorded decision',item);text('p',row.querySelector('p')?.textContent||'Reason unavailable',item,'teacher-note');}const more=text('button','View complete history',preview,'secondary');more.type='button';more.addEventListener('click',()=>{$('accountHistory').closest('section').hidden=false;$('accountHistory').closest('section').scrollIntoView({block:'start',behavior:'instant'});$('recordedDecisionsTitle').setAttribute('tabindex','-1');$('recordedDecisionsTitle').focus({preventScroll:true});});}}
    }
    if(applicationQueue&&generation===epoch&&selected?.id===uid){const host=$('teacherQualificationReview').querySelector('.qualification-review');if(host)mountReviewDossier(host);}
    if(generation===epoch&&selected?.id===uid){detailBaseline=detailState();$('accountName').focus({preventScroll:true});if(window.matchMedia('(max-width:900px)').matches)$('adminAccountDetail').scrollIntoView({block:'start',behavior:'instant'});}
}
$('accountFilters').addEventListener('submit',async event=>{event.preventDefault();if(!(await canLeaveDetail()))return;applicationQueue=false;(await showAdminView('accounts'));cursors=[null];task(()=>accounts(),'Account list refreshed.','Loading filtered accounts…');});
$('reviewSubmittedApplications').addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;applicationQueue=true;applicationGroup='review';$('adminAccountSearch').value='';(await showAdminView('applications'));cursors=[null];task(()=>accounts(),'','Loading submitted teacher applications…');});
$('accountRole').addEventListener('change',()=>{if($('accountRole').value==='student'&&$('accountStatusFilter').value==='pending')$('accountStatusFilter').value='active';});
$('previousAccounts').addEventListener('click',async ()=>{if((await canLeaveDetail()))task(async()=>{cursors.pop();await accounts();});});
$('nextAccounts').addEventListener('click',async ()=>{if((await canLeaveDetail()))task(async()=>{cursors.push(nextCursor);await accounts();});});
$('moreAccountHistory').addEventListener('click',()=>task(()=>history(true)));
$('newAccountStatus').addEventListener('change',controls);
$('adminMenuToggle').addEventListener('click',()=>{
    const open=document.body.classList.toggle('admin-menu-open');
    $('adminMenuToggle').setAttribute('aria-expanded',String(open));
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('admin-menu-open')){document.body.classList.remove('admin-menu-open');$('adminMenuToggle').setAttribute('aria-expanded','false');$('adminMenuToggle').focus({preventScroll:true});}});

document.querySelectorAll('.admin-navigation [data-teacher-tab]').forEach(link=>link.addEventListener('click',async event=>{
    if(adminPage){if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();await navigateAdmin(link.dataset.teacherTab);return;}
    event.preventDefault();if(busy)return;if(!['accounts','applications'].includes(link.dataset.teacherTab)&&!(await canLeaveDetail()))return;
    document.querySelectorAll('.admin-navigation [data-teacher-tab]').forEach(item=>{item.removeAttribute('aria-current');item.setAttribute('aria-pressed','false');});
    link.setAttribute('aria-current','location');
    link.setAttribute('aria-pressed','true');
    document.body.classList.remove('admin-menu-open');$('adminMenuToggle').setAttribute('aria-expanded','false');
    if(link.getAttribute('href')==='#adminOverview')$('adminOverview').open=true;
    const destination=link.dataset.teacherTab;
    if(destination==='applications'){if(applicationQueue)(await showAdminView('applications',true));else $('reviewSubmittedApplications').click();}
    else if(destination==='accounts'){if(!applicationQueue)(await showAdminView('accounts',true));else $('accountFilters').requestSubmit();}
    else (await showAdminView(destination,true));
}));
async function overview(){
    const generation=epoch;$('adminOverviewStatus').textContent='Updating dashboard...';$('adminOverviewStatus').parentElement.dataset.state='loading';$('loadAdminOverview').setAttribute('aria-busy','true');$('loadAdminOverview').disabled=true;
    try{
        const result=await loadAdminOverview();if(generation!==epoch)return;
        const host=$('adminOverviewResults');host.replaceChildren();
        const metrics=text('div','',host,'admin-metrics teacher-summary');
        for(const [label,value,note] of [['Teachers awaiting approval',String(result.teacherQueue.length)+(result.moreTeacherQueue?'+':''),'Pending accounts and submitted forms; loaded snapshot'],['Your decision records',String(result.decisions.length)+(result.moreDecisions?'+':''),'Saved records · up to 10 loaded']]){const card=text('div','',metrics,'admin-metric');text('span',label,card);text('strong',value,card);text('small',note,card);}
        const loadedAccounts=$('adminAccounts').querySelectorAll('button').length;
        for(const [label,value,note] of [['Accounts in current view',String(loadedAccounts),applicationQueue?'Loaded application queue':'Loaded account page; not a global total'],['Last snapshot',new Intl.DateTimeFormat('en-PH',{hour:'numeric',minute:'2-digit',timeZone:'Asia/Manila'}).format(new Date()),'Philippine time; refresh for current data']]){const card=text('div','',metrics,'admin-metric');text('span',label,card);text('strong',value,card);text('small',note,card);if(label==='Accounts in current view'){card.querySelector('strong').id='adminLoadedAccountCount';card.querySelector('small').id='adminLoadedAccountScope';}}
        filterAccountPage();
        const summaryIcons=['M8 4H5v17h14V4h-3M8 2h8v5H8zM8 12h8M8 16h6','M9 3h6l5 5v13H4V3h5m5 0v6h6M8 13h8M8 17h6','M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5v2','M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm0 4v5l4 2'];
        [...metrics.children].forEach((card,index)=>{const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.classList.add('admin-summary-icon');const shape=document.createElementNS('http://www.w3.org/2000/svg','path');shape.setAttribute('d',summaryIcons[index]);icon.append(shape);card.prepend(icon);});
        $('adminQueueBadge').textContent=String(result.teacherQueue.length)+(result.moreTeacherQueue?'+':'');$('adminQueueBadge').hidden=false;
        const applications=text('section','',host);applications.className='admin-pending-panel';
        const queueHeading=text('header','',applications,'admin-pending-heading');const queueTitle=text('h2','Pending Teacher Applications',queueHeading);
        const queueIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');queueIcon.setAttribute('viewBox','0 0 24 24');queueIcon.setAttribute('aria-hidden','true');queueIcon.innerHTML='<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2"/>';queueTitle.prepend(queueIcon);
        text('p','Teacher accounts awaiting access and submitted qualifications. Each row shows its current stage.',applications,'admin-queue-scope');
        if(!result.teacherQueue.length){
            const empty=text('div','',applications,'admin-queue-empty');text('strong','No teachers awaiting approval in this snapshot',empty);
            text('p','Use Accounts to manage existing students and teachers. Refresh this snapshot to check for new requests.',empty,'teacher-note');
            const find=text('button','Find teacher accounts awaiting access',empty,'secondary');find.type='button';find.addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;applicationQueue=false;$('accountRole').value='teacher';$('accountStatusFilter').value='pending';$('adminAccountSearch').value='';cursors=[null];(await showAdminView('accounts',true));task(()=>accounts(),'Showing teacher accounts awaiting access. Qualification submission and approval are checked separately.','Loading teacher accounts…');});
        }
        for(const application of result.teacherQueue.slice(0,5)){
            const name=application.legalName?.trim()||application.email||'Teacher application';
            const row=text('div','',applications,'admin-queue-row');
            const initials=application.legalName?.trim().split(/\s+/).filter(Boolean).slice(0,2).map(part=>Array.from(part)[0]).join('').toLocaleUpperCase()||'T';
            const avatar=text('span',initials,row,'admin-queue-avatar');avatar.setAttribute('aria-hidden','true');
            const identity=text('div','',row,'admin-queue-identity');text('strong',name,identity);text('small',application.email||'Email unavailable',identity);
            text('span',application.stage,row,'admin-queue-status');
            const review=text('button','Review',row,'secondary');review.type='button';review.setAttribute('aria-label','Review application for '+name);review.addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;applicationQueue=application.reviewApplication;(await showAdminView(applicationQueue?'applications':'accounts',false,application.id));if(applicationQueue)applicationGroup='review';if(!applicationQueue){$('accountRole').value='teacher';$('accountStatusFilter').value='pending';$('adminAccountSearch').value='';}cursors=[null];task(async()=>{await accounts();await openAccount(application.id);},'Application loaded.','Loading teacher application…');});
        }
        const open=text('button','View pending ('+result.pendingTeacherCount+(result.morePendingTeachers?'+':'')+')',queueHeading,'admin-queue-view-all');open.type='button';open.setAttribute('aria-label','View pending teacher accounts; '+result.pendingTeacherCount+(result.morePendingTeachers?' or more':'')+' loaded');open.addEventListener('click',async ()=>{if(!(await canLeaveDetail()))return;applicationQueue=false;$('accountRole').value='teacher';$('accountStatusFilter').value='pending';$('adminAccountSearch').value='';cursors=[null];(await showAdminView('accounts',true));task(()=>accounts(),'','Loading pending teacher accounts?');});
        const decisions=text('section','',host,'admin-decision-preview');
        const decisionHeading=text('header','',decisions,'admin-activity-heading');const decisionTitle=text('h2','Decision activity',decisionHeading);
        const historyIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');historyIcon.setAttribute('viewBox','0 0 24 24');historyIcon.setAttribute('aria-hidden','true');historyIcon.innerHTML='<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>';decisionTitle.prepend(historyIcon);
        const all=text('button','View all records',decisionHeading,'admin-activity-view-all');all.type='button';all.addEventListener('click',async ()=>{if((await canLeaveDetail()))(await showAdminView('records',true));});
        if(result.decisions.length)text('p','Showing '+Math.min(3,result.decisions.length)+' of '+result.decisions.length+' loaded'+(result.moreDecisions?' (more available)':'')+'. Document order, not a latest-activity feed.',decisions,'admin-activity-scope');
        const records=$('adminRecordResults');records.replaceChildren();
        const openDecisionAccount=async decision=>{if(!(await canLeaveDetail()))return;(await showAdminView('accounts',false,decision.userId));applicationQueue=false;task(async()=>{await accounts();await openAccount(decision.userId);},'Account history loaded.','Loading account history...');};
        for(const [index,decision] of result.decisions.entries()){
            const label=decision.previousStatus===decision.status?'Review decision recorded':decision.status==='active'?'Account activated':decision.status==='inactive'?'Account deactivated':'Account access changed';
            const row=text('article','',records,'admin-decision-record');text('h3',label,row);text('p',decision.previousStatus+' \u2192 '+decision.status,row,'teacher-note');text('p','Account ID: '+decision.userId,row,'teacher-note');text('p',decision.reason||'Reason unavailable',row,'admin-record-reason');text('p','Administrator: '+(decision.actorId||'Unavailable'),row,'teacher-note');text('p',date(decision.createdAt)+' (Philippine time)',row,'teacher-note');
            const inspect=text('button','Open account history',row,'secondary');inspect.type='button';inspect.addEventListener('click',async ()=>(await openDecisionAccount(decision)));
            if(index<3){
                const preview=text('article','',decisions,'admin-activity-row');preview.dataset.status=decision.status;
                const mark=text('span',decision.status==='inactive'?'\u2013':'\u2713',preview,'admin-activity-mark');mark.setAttribute('aria-hidden','true');
                const content=text('div','',preview,'admin-activity-content');text('h3',label,content);text('p','Account ID: '+decision.userId,content,'admin-activity-account');text('p',decision.reason||'Reason unavailable',content,'admin-activity-reason');
                const timestamp=text('time',date(decision.createdAt)+' (PH)',content,'admin-activity-time');try{timestamp.dateTime=decision.createdAt.toDate().toISOString();}catch{}
                const action=text('button','View history',content,'admin-activity-link');action.type='button';action.setAttribute('aria-label','View history for account '+decision.userId);action.addEventListener('click',async ()=>(await openDecisionAccount(decision)));
            }
        }
        mountDecisionRecords(records,result.decisions,{moreAvailable:result.moreDecisions,onHistory:openDecisionAccount,resolveAccount:adminPage==='records'?loadAdminAccount:null,resolveReview:adminPage==='records'?loadAdminDecisionReview:null,isCurrent:()=>generation===epoch&&!!auth.currentUser});
        if(!result.decisions.length){const empty=text('div','',decisions,'admin-activity-empty');const mark=text('span','\u2637',empty,'admin-activity-empty-icon');mark.setAttribute('aria-hidden','true');text('strong','No decision records yet',empty);text('p','Your saved account and teacher-review decisions will appear here.',empty,'teacher-note');text('p','Only records made by your administrator account are shown.',records,'teacher-note');}
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
            action.addEventListener('click',async ()=>{if(!['applications','accounts'].includes(destination)&&!(await canLeaveDetail()))return;if(destination==='applications')$('reviewSubmittedApplications').click();else if(destination==='accounts')$('accountFilters').requestSubmit();else (await showAdminView(destination,true));});
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
        host.hidden=false;$('adminOverviewStatus').textContent='Snapshot loaded at '+new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(new Date())+' (Philippine time). Refresh after making decisions.';
        $('adminOverviewStatus').parentElement.dataset.state='ready';
        $('adminHeaderSnapshot').textContent='Updated '+new Intl.DateTimeFormat('en-PH',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'Asia/Manila'}).format(new Date())+' · PH';
    }catch(error){if(generation===epoch){$('adminOverviewStatus').parentElement.dataset.state='error';$('adminOverviewStatus').textContent=$('adminOverviewResults').hidden?'Overview unavailable. Try refreshing again.':'Refresh failed. The previous snapshot is still shown and may be outdated.';}throw error;}
    finally{if(generation===epoch){$('loadAdminOverview').setAttribute('aria-busy','false');$('loadAdminOverview').disabled=false;}}
}
$('loadAdminOverview').addEventListener('click',()=>task(overview,'','Loading application queue and decision records…'));
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
let moderationConfirmationPending=false;
$('moderationForm').addEventListener('submit',async event=>{
    event.preventDefault();if(busy||moderationConfirmationPending||!selected||pendingAccountDecision||savedAccountUid)return;
    const values={uid:selected.id,expectedRole:selected.role,expectedStatus:selected.status,expectedVersion:selected.updatedAt?.toMillis?.()||selected.createdAt?.toMillis?.()||0,status:$('newAccountStatus').value,reason:$('moderationReason').value,identityVerified:$('teacherIdentityVerified').checked};
    const generation=epoch;
    moderationConfirmationPending=true;
    let confirmed;
    try{confirmed=await appConfirm(`Change access for ${selected.email||selected.id} from ${selected.status} to ${values.status}?\n\nReason: ${values.reason.trim()}\n\nAn inactive account loses protected access. Saved learning records are preserved. The decision will be recorded.`);}
    finally{moderationConfirmationPending=false;}
    if(!confirmed||generation!==epoch||busy||selected?.id!==values.uid||pendingAccountDecision||savedAccountUid)return;
    task(async()=>{try{await moderateAccount(values);}catch(error){if(generation===epoch&&error.code==='admin/decision-unknown')pendingAccountDecision={uid:values.uid,check:error.checkDecision};throw error;}if(generation===epoch)return refreshSavedAccount(values.uid);},'','Saving account access decision…');
});
function clear(){document.body.classList.add('workspace-loading');for(const key of Object.keys(viewMessages))delete viewMessages[key];++epoch;busy=false;pendingAccountDecision=null;savedAccountUid=null;applicationQueue=false;clearDetail();cursors=[null];hasNext=false;nextCursor=null;historyCursor=null;historyNext=false;$('adminAccounts').replaceChildren();$('adminRecordResults').replaceChildren();$('adminOverviewResults').replaceChildren();$('adminQueueBadge').hidden=true;$('adminOverviewResults').hidden=true;$('adminOverviewStatus').textContent='Not loaded yet.';$('adminHeaderSnapshot').textContent='Not updated yet';$('loadAdminOverview').setAttribute('aria-busy','false');$('loadAdminOverview').disabled=false;$('adminOverviewStatus').parentElement.dataset.state='idle';$('adminOverview').open=false;message('');controls();}
window.addEventListener('pagehide',clear);
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
onAuthStateChanged(auth,async user=>{adminRouteReady=false;clear();const initial=adminRoutes[adminPage]?adminPage:'overview';applicationQueue=initial==='applications';if(applicationQueue&&Object.hasOwn(applicationGroupLabels,adminParameters.get('category')))applicationGroup=adminParameters.get('category');if(['all','teacher','student'].includes(adminParameters.get('role')))$('accountRole').value=adminParameters.get('role');if(['all','pending','active','inactive'].includes(adminParameters.get('status')))$('accountStatusFilter').value=adminParameters.get('status');(await showAdminView(initial));adminRouteReady=true;if(user)task(async()=>{if(!adminPage||['overview','accounts','applications'].includes(initial))await accounts();if(!adminPage||['overview','records','environment'].includes(initial))await overview();const uid=adminParameters.get('account');if(uid&&['accounts','applications'].includes(initial))await openAccount(uid);},'','Loading administrator workspace…');});
(await showAdminView(adminRoutes[adminPage]?adminPage:'overview'));
