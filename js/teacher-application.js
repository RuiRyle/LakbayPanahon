import {auth} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {loadTeacherApplication,refreshTeacherEmail,sendTeacherVerification,saveTeacherApplication,readTeacherEvidence} from './teacher-application-client.js';
import {showTeacherEvidence} from './teacher-evidence-viewer.js';
const $=id=>document.getElementById(id),form=$('teacherApplicationForm');
const unified=document.body.dataset.unifiedTeacherSetup==='true';
let accountStatus=null,verifiedRevision=0,application=null,epoch=0,busy=false,editing=true,lastVerificationSent=0;
function message(text,error=false){$('applicationMessage').textContent=text;$('applicationMessage').dataset.error=String(error);if($('retryTeacherSetup'))$('retryTeacherSetup').hidden=!error||!auth.currentUser;}
function route(){const type=form.elements.applicantType.value,licensed=type==='licensed_teacher',school=type==='school_teacher';$('licensedTeacherFields').hidden=!licensed;$('endorsedTeacherFields').hidden=licensed||school;$('applicationRouteHelp').textContent=school?'The administrator confirms your identity and connection to your institution. No PRC number or document upload is required to start. They may request one supporting document if needed.':licensed?'For the professional-license route, provide your current PRC registration number and expiry. Choose School affiliation if you only need your school role verified.':'Provide the supervisor or organization representative who can endorse your learning-support role.';}

function dashboardReady(){return application?.status==='approved'&&accountStatus==='active'&&auth.currentUser?.emailVerified===true&&Number.isInteger(application.revision)&&application.revision>0&&application.revision===verifiedRevision;}
function renderNextStep(){
 const card=$('teacherNextStep');card.hidden=!auth.currentUser;if(card.hidden)return;
 const verified=auth.currentUser.emailVerified===true,state=application?.status;
 let title,description,label,action;
 if(!verified){title='Verify your email';description='Open the link in your inbox, then choose "I verified my email". You will continue on this page.';const sent=Date.now()-lastVerificationSent<60000;label=sent?'I verified my email':'Send verification link';action=sent?'email-check':'email-send';}
 else if(dashboardReady()){title='You are ready to teach';description='Your application is approved and account access is active.';label='Open teacher dashboard';action='dashboard';}
 else if(state==='approved'){title=accountStatus==='active'?'Ask an administrator to check your approval':'Wait for account activation';description=accountStatus==='active'?'Your saved approval and account need to match before dashboard access is available.':'Your qualifications are approved. An administrator will activate classroom access. You do not need to submit again.';label='Check access status';action='status';}
 else if(state==='submitted'){title='Wait for administrator review';description='Your application is submitted. No further action is needed unless the administrator requests changes.';label='Check review status';action='status';}
 else if(state==='needs_changes'||state==='declined'){title=state==='needs_changes'?'Update the requested details':'Read the feedback and update your details';description=application.decisionReason||'Review the feedback below, update your saved form and submit it again. You do not need another account.';label='Update my details';action='details';}
 else{title='Add your school and teaching role';description='Your name is already filled in. Complete the required details, confirm the notice and choose Submit application. The default school route needs no PRC number or upload.';label='Complete my details';action='details';}
 $('teacherNextStepTitle').textContent=title;$('teacherNextStepDescription').textContent=description;$('teacherNextAction').textContent=label;$('teacherNextAction').dataset.action=action;$('teacherNextAction').disabled=busy;
}
$('teacherNextAction').addEventListener('click',()=>{if(busy)return;const action=$('teacherNextAction').dataset.action;if(action==='email-send')$('sendTeacherVerification').click();else if(action==='email-check')$('refreshTeacherEmail').click();else if(action==='status')$('reloadApplication').click();else if(action==='dashboard')$('openApprovedWorkspace').click();else if(action==='details'){if(!editing)$('reviseTeacherApplication').click();$('teacherSetupDetails').open=true;const first=[form.elements.legalName,form.elements.institution,form.elements.roleTitle].find(field=>!field.value.trim())||form.elements.institution;first.focus();first.scrollIntoView({block:'center',behavior:'instant'});}});
function renderApplicationJourney(){
 const signedIn=!!auth.currentUser,verified=auth.currentUser?.emailVerified===true,submitted=application?.status==='submitted',approved=application?.status==='approved',current=!signedIn?'account':!verified?'email':submitted||approved?'review':'details';
 document.querySelector('.application-hero>.eyebrow').textContent='TEACHER ACCOUNT SETUP';
 document.body.dataset.setupPhase=!signedIn?'account':!verified?'email':!editing?'review':'details';
 for(const step of document.querySelectorAll('[data-application-step]')){const key=step.dataset.applicationStep,complete=(key==='account'&&signedIn)||(key==='email'&&verified)||(key==='details'&&(submitted||approved))||(key==='review'&&dashboardReady());step.dataset.state=complete?'complete':key===current?'current':'pending';if(key===current&&!dashboardReady())step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');}
 document.querySelector('.application-status-card').dataset.status=application?.status||'none';document.body.dataset.applicationState=application?.status||'none';
 document.body.dataset.setupEditing=String(editing);
 const state=application?.status||'none',copy={submitted:['Your details are under review.','Your teacher setup is submitted. Check your review status here; there is no need to fill in the form again.'],needs_changes:['A few details need updating.','Read the reviewer’s feedback, update your saved details, and submit them again.'],declined:['Review your application feedback.','Read the decision below. You can revise your details before requesting another review.'],approved:['Your classroom is ready.','Your teacher setup is approved. Open your classroom workspace to create a class and invite students.']}[state]||['Complete your teaching details.','Your email is verified. Add your school and teaching role, then submit your application. You can save a draft and return later.'];
 $('teacherSetupTitle').textContent=copy[0];$('teacherSetupDescription').textContent=copy[1];
 if(state==='approved'&&!dashboardReady()){$('teacherSetupTitle').textContent='Qualifications approved — activation pending';$('teacherSetupDescription').textContent='Your qualifications are approved. An administrator must separately activate your account before classroom tools become available. You do not need to resubmit your application.';}
 if(state==='approved'&&accountStatus==='active'&&!dashboardReady()){$('teacherSetupTitle').textContent='Your approval needs an administrator check.';$('teacherSetupDescription').textContent='Your account and approved application must match before classroom access is available. Use Check access status or contact your administrator.';}
 if(!signedIn){$('teacherSetupTitle').textContent='Create your teacher account.';$('teacherSetupDescription').textContent='One setup, from your account to your classroom. Create your sign-in, verify your email, and share your teaching details here.';}
 else if(!verified){$('teacherSetupTitle').textContent='Next, verify your email.';$('teacherSetupDescription').textContent='Your account is created. Open the verification link in your inbox, then check your email status below to continue here.';}
}

function controls(){renderApplicationJourney();renderNextStep();form.setAttribute('aria-busy',String(busy));const locked=!editing;form.querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=busy||locked);$('sendTeacherVerification').disabled=busy||auth.currentUser?.emailVerified===true||Date.now()-lastVerificationSent<60000;$('refreshTeacherEmail').disabled=busy;$('reloadApplication').disabled=busy;}
async function task(work,success='',progress='Loading your teacher setup...'){if(busy)return;busy=true;const generation=epoch;controls();message(progress);try{await work();if(generation===epoch)message(typeof success==='function'?success():success);}catch(error){if(generation===epoch)message(error.code==='permission-denied'?'Access denied. Refresh your email status or sign in again, then retry.':error.message||'Could not complete this action.',true);}finally{if(generation===epoch){busy=false;controls();}}}
async function load(){const generation=epoch,result=await loadTeacherApplication();if(generation!==epoch)return;application=result.application;accountStatus=result.profile.status;verifiedRevision=result.profile.teacherVerifiedRevision||0;
 $('applicationWorkspace').hidden=false;$('teacherEmailStatus').textContent=auth.currentUser.email+(auth.currentUser.emailVerified?' — verified':' — verification needed');
 $('teacherApplicationStatus').textContent=({draft:'Draft — not sent for review',submitted:'Submitted — awaiting administrator review',needs_changes:'More information requested',declined:'Declined — see the reason below',approved:'Approved — '+(application?.applicantType==='school_teacher'?'school affiliation verified':application?.applicantType==='licensed_teacher'?'licensed teacher':application?.applicantType==='student_teacher'?'student teacher':'learning facilitator')})[application?.status]||'No application submitted yet';
 $('teacherDecisionReason').textContent=application?.decisionReason||'';
 $('openApprovedWorkspace').hidden=!dashboardReady();
 $('reviseTeacherApplication').hidden=!application||application.status==='draft';editing=!application||application.status==='draft'||['needs_changes','declined'].includes(application.status);
 form.reset();$('applicationFileName').textContent='No new image selected.';if(application)for(const field of form.elements){if(!field.name)continue;if(field.name==='prcExpiry'){field.value=application.prcExpiresAt?.toDate?.().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'})||'';}else if(application[field.name]!=null)field.value=application[field.name];}
 else form.elements.legalName.value=[result.profile.firstName,result.profile.middleName,result.profile.lastName].filter(Boolean).join(' ').trim();
 $('teacherSetupDetails').open=editing;$('teacherSetupDetails').dataset.editing=String(editing);
 $('teacherQualificationAcknowledged').checked=application?.acknowledged===true;route();
 $('teacherEvidenceStatus').textContent=application?.evidenceRevision?'Evidence image attached. Only you and administrators can open it during review.':'No evidence image is retained for this application.';
 $('viewTeacherEvidence').hidden=!application?.evidenceRevision;
 if(application?.evidenceRevision&&application.evidenceUploadedAt?.toMillis()+30*86400000<=Date.now()){await readTeacherEvidence(auth.currentUser.uid,application);if(generation===epoch){$('teacherEvidenceStatus').textContent='Your old evidence expired and was removed. Attach a new image or select Remove Previous Evidence before saving.';$('viewTeacherEvidence').hidden=true;}}
 controls();
}
function save(submit){const values=Object.fromEntries(new FormData(form));values.acknowledged=$('teacherQualificationAcknowledged').checked;const options={submit,file:$('teacherEvidenceFile').files[0]||null,removeEvidence:$('removeTeacherEvidence').checked,expectedRevision:application?.revision||0};return task(async()=>{await saveTeacherApplication(values,options);await load();},submit?'Application submitted. An administrator must review it before classroom access is granted.':'Draft saved. It is not submitted for review.',submit?'Submitting your application...':'Saving your draft...');}
form.addEventListener('submit',event=>{event.preventDefault();save(true);});
$('saveTeacherDraft').addEventListener('click',()=>save(false));
$('applicantType').addEventListener('change',route);
$('teacherEvidenceFile').addEventListener('change',()=>{$('applicationFileName').textContent=$('teacherEvidenceFile').files[0]?.name||'No new image selected.';});
$('reloadApplication').addEventListener('click',()=>task(()=>load(),'Application refreshed.','Checking review and access status...'));
$('viewTeacherEvidence').addEventListener('click',()=>task(()=>showTeacherEvidence(auth.currentUser.uid,application),'','Opening your private evidence...'));
$('refreshTeacherEmail').addEventListener('click',()=>task(async()=>{await refreshTeacherEmail();$('teacherEmailStatus').textContent=auth.currentUser.email+(auth.currentUser.emailVerified?' — verified':' — verification needed');},()=>auth.currentUser?.emailVerified?'Email verified. Next: complete your teaching details.':'Email is not verified yet. Open the link in your inbox and check again.','Checking your email verification...'));
$('sendTeacherVerification').addEventListener('click',()=>task(async()=>{await sendTeacherVerification();lastVerificationSent=Date.now();setTimeout(controls,60000);},'Verification email sent. Open it in your inbox, then return and check your status.','Sending verification link...'));
$('reviseTeacherApplication').addEventListener('click',()=>{if(application?.status==='approved'&&!confirm('Changing an approved application requires a new review. Classroom access pauses when you save the revision; classes and student progress stay saved. Continue?'))return;editing=true;$('teacherSetupDetails').open=true;$('teacherSetupDetails').dataset.editing='true';controls();message('Edit your information, then save a draft or submit a new revision.');});
function clear(){++epoch;busy=false;application=null;accountStatus=null;verifiedRevision=0;editing=false;form.reset();$('applicationWorkspace').hidden=true;$('teacherDecisionReason').textContent='';$('teacherEvidenceStatus').textContent='';$('teacherEmailStatus').textContent='';$('teacherApplicationStatus').textContent='';controls();}
window.addEventListener('pagehide',clear);window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
function resumeTeacherSetup(user){
 if(unified&&$('teacherRegisterForm')?.dataset.creating==='true')return;
 clear();
 if(!user){if(unified){$('teacherSetupAccount').hidden=false;message('');return;}location.replace('login.html');return;}
 if(unified)$('teacherSetupAccount').hidden=true;
 editing=true;task(()=>load());
}
document.addEventListener('teacher-account-ready',()=>resumeTeacherSetup(auth.currentUser));
$('retryTeacherSetup')?.addEventListener('click',()=>resumeTeacherSetup(auth.currentUser));
onAuthStateChanged(auth,resumeTeacherSetup);
