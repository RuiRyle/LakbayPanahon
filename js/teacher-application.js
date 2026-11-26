import {appConfirm} from './app-dialog.js';
import {auth} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {loadTeacherApplication,refreshTeacherEmail,sendTeacherVerification,saveTeacherApplication,readTeacherEvidence,watchTeacherApplication} from './teacher-application-client.js';
import {showTeacherEvidence} from './teacher-evidence-viewer.js';
import {applicationFields,safeEvidence,teacherEvidenceExpired} from './teacher-application-policy.js';
const $=id=>document.getElementById(id),form=$('teacherApplicationForm'),accountFields=$('teacherSetupAccount');
const submitButton=form.querySelector('button[type=submit]');
let accountStatus=null,verifiedRevision=0,application=null,epoch=0,busy=false,editing=true,lastVerificationSent=0;
let registering=true,setupReady=false,registrationSubmission=null,lastEmailCheck=0;
let stopApplicationWatch,applicationRefresh;
let applicationConflict=false, confirmedSaveNeedsRefresh=false;
const checkLatestDecision=document.createElement('button');
checkLatestDecision.type='button';checkLatestDecision.className='secondary';checkLatestDecision.hidden=true;
checkLatestDecision.textContent='Check latest application';
$('applicationFormFeedback').append(checkLatestDecision);
const reviewState=row=>JSON.stringify([row?.status,row?.revision,row?.emailVerified,row?.decisionReason]);
function followReview(){
 if(stopApplicationWatch||registering||!auth.currentUser)return;
 const current=epoch;
 const rerender=()=>{
  if(current!==epoch||editing||registering)return;
  clearTimeout(applicationRefresh);
  applicationRefresh=setTimeout(function update(){
   if(current!==epoch||editing||registering)return;
   if(busy){applicationRefresh=setTimeout(update,300);return;}
   void task(load,'Application and access status updated.','Checking the latest decision...');
  },150);
 };
 stopApplicationWatch=watchTeacherApplication(
  value=>{if(reviewState(value)!==reviewState(application))rerender();},
  profile=>{if(profile?.role==='teacher'&&(profile.status!==accountStatus||(profile.teacherVerifiedRevision||0)!==verifiedRevision))rerender();},
  ()=>{
   if(current!==epoch||!stopApplicationWatch)return;
   stopApplicationWatch();
   stopApplicationWatch=null;
   clearTimeout(applicationRefresh);
   $('applicationLiveStatus').hidden=false;
  }
 );
}
function message(text,error=false){
 const feedback=$('applicationMessage');
 feedback.textContent=text;
 feedback.dataset.error=String(error);
 $('retryTeacherSetup').hidden=!error||!auth.currentUser||!$('applicationWorkspace').hidden;
 if(error&&feedback.parentElement===$('applicationFormFeedback'))feedback.focus();
}
function route(){
 const type=form.elements.applicantType.value,licensed=type==='licensed_teacher',school=type==='school_teacher';
 for(const [id,relevant] of [['licensedTeacherFields',licensed],['endorsedTeacherFields',!licensed&&!school]]){
  const fields=$(id);
  fields.hidden=!relevant;
  for(const input of fields.querySelectorAll('input')){
   input.required=relevant;
   input.disabled=!relevant||busy||!editing;
  }
 }
 $('applicationRouteHelp').textContent=school
  ? 'Use the school or organization and role your institution can confirm. You can add a work contact or website below.'
  : licensed ? 'Use the name shown on your PRC license. Enter its registration number and expiry date.'
  : 'Enter the name and work contact of a supervisor or representative who can confirm your teaching role.';
}

function dashboardReady(){return application?.status==='approved'&&application.emailVerified===true&&accountStatus==='active'&&auth.currentUser?.emailVerified===true&&application.email===auth.currentUser.email&&Number.isInteger(application.revision)&&application.revision>0&&application.revision===verifiedRevision;}
function verificationPending(){
 return !editing&&['submitted','approved'].includes(application?.status)
  && (auth.currentUser?.emailVerified!==true||application.emailVerified!==true);
}
function renderNextStep(){
 const state=application?.status;
 const card=$('teacherNextStep');
 card.hidden=!['submitted','approved'].includes(state)||verificationPending()||editing;
 if(card.hidden)return;
 let title,description;
 if(dashboardReady()){
  title='Classroom access is active';
  description='Open the teacher dashboard to create a class or invite students.';
 }else if(state==='approved'){
  title=accountStatus==='active'?'Ask an administrator to check your approval':'Wait for account activation';
  description=accountStatus==='active'
   ? 'Your approval needs to match your current account before classroom access is available.'
   : 'An administrator will activate classroom access. Your application is already saved.';
 }else{
  title='Wait for administrator review';
  description='Check back here for a decision or a request for more information.';
 }
 $('teacherNextStepTitle').hidden=state==='submitted';
 $('teacherNextStepTitle').textContent=title;
 $('teacherNextStepDescription').textContent=description;
}
function renderApplicationJourney(){
 const submitted=application?.status==='submitted',approved=application?.status==='approved';
 const phase=registering?'account':verificationPending()?'email':editing?'details':'review';
 const verified=auth.currentUser?.emailVerified===true&&(!submitted||application.emailVerified===true);
 document.body.dataset.setupPhase=phase;
 const ready=dashboardReady();
 for(const step of document.querySelectorAll('[data-application-step]')){
  const key=step.dataset.applicationStep,current=key===(['account','details'].includes(phase)?'apply':phase)&&!ready;
  const complete=(key==='apply'&&(submitted||approved))||(key==='email'&&verified)||(key==='review'&&ready);
  step.dataset.state=current?'current':complete?'complete':'pending';
  step.querySelector('.application-step-complete').hidden=current||!complete;
  if(current)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');
 }
 document.querySelector('.application-status-card').dataset.status=application?.status||'none';document.body.dataset.applicationState=application?.status||'none';
 document.body.dataset.setupEditing=String(editing);
 const state=application?.status||'none',copy={draft:['Finish your teacher application','Your draft is saved. Finish your teaching details, then submit the application for review.'],submitted:['Your details are under review.','Your teacher setup is submitted. Check your review status here; there is no need to fill in the form again.'],needs_changes:['A few details need updating.','Read the reviewer’s feedback, update your saved details, and submit them again.'],declined:['Review your application feedback.','Read the decision below. You can revise your details before requesting another review.'],approved:['Your classroom is ready.','Your teacher setup is approved. Open your classroom workspace to create a class and invite students.']}[state]||['Finish your teacher application','You’re signed in to your teacher account. Add your teaching details and submit them for review.'];
 $('teacherSetupTitle').textContent=copy[0];$('teacherSetupDescription').textContent=copy[1];
 if(state==='approved'&&!dashboardReady()){$('teacherSetupTitle').textContent='Qualifications approved — activation pending';$('teacherSetupDescription').textContent='Your qualifications are approved. An administrator must separately activate your account before classroom tools become available. You do not need to resubmit your application.';}
 if(state==='approved'&&accountStatus==='active'&&!dashboardReady()){$('teacherSetupTitle').textContent='Your approval needs an administrator check.';$('teacherSetupDescription').textContent='Your account and approved application must match before classroom access is available. Use Check access status or contact your administrator.';}
 if(registering){$('teacherSetupTitle').textContent='Create your teacher account';$('teacherSetupDescription').textContent='Enter your account and teaching details to apply for classroom access.';}
 else if(phase==='email'){$('teacherSetupTitle').textContent='Application submitted';$('teacherSetupDescription').textContent='Confirm your email so an administrator can approve your application.';}
}

function controls(){
 renderApplicationJourney();renderNextStep();form.setAttribute('aria-busy',String(busy));
 $('teacherSetupLogout').hidden=!auth.currentUser;
 $('teacherSetupLogin').hidden=!!auth.currentUser;
 $('teacherResumeLink').hidden=!!auth.currentUser;
 const email=auth.currentUser?.email||'';
 $('teacherSignedInAccount').hidden=registering||!email;
 $('teacherSignedInEmail').textContent=registering?'':email;
 $('teacherSubmitNote').textContent=registering||auth.currentUser?.emailVerified!==true
  ? 'After you submit, check your inbox for an email confirmation link.'
  : 'After you submit, an administrator will review your teaching details.';
 form.querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=busy||!editing);
 route();
 accountFields.hidden=!registering;accountFields.disabled=!registering||busy;
 $('teacherApplicationName').hidden=registering;
 form.elements.legalName.disabled=busy||!editing||registering;
 form.elements.legalName.required=!registering;
 $('teacherEmail').readOnly=registering&&!!auth.currentUser;
 $('teacherPasswordField').hidden=registering&&!!auth.currentUser;
 $('teacherPassword').disabled=$('teacherConfirmPassword').disabled=busy||!registering||!!auth.currentUser;
 $('saveTeacherDraft').hidden=registering;
 $('cancelTeacherEdit').hidden=!editing||(!applicationConflict&&!['submitted','approved'].includes(application?.status));
 checkLatestDecision.hidden=!applicationConflict||!editing;
 checkLatestDecision.textContent=confirmedSaveNeedsRefresh?'Reload saved application':'Check latest application';
 $('saveTeacherDraft').disabled=busy||!editing||applicationConflict;
 $('reviseTeacherApplication').hidden=editing||!application;
 $('reviseTeacherApplication').disabled=busy;
 $('reloadApplication').hidden=editing;
 $('removeTeacherEvidenceLabel').hidden=!application?.evidenceRevision;
 const feedback=$('applicationMessage');
 const feedbackHost=editing&&setupReady&&!$('applicationWorkspace').hidden?$('applicationFormFeedback'):$('applicationPageFeedback');
 if(feedback.parentElement!==feedbackHost){
  feedbackHost.append(feedback);
  if(feedbackHost===$('applicationFormFeedback'))feedback.after(checkLatestDecision);
 }
 submitButton.disabled=busy||!editing||!setupReady||applicationConflict||form.dataset.authReady!=='true'||form.dataset.creating==='true';
 if(!busy&&form.dataset.creating!=='true')submitButton.textContent=registering&&!auth.currentUser?'Create account and apply':'Submit application';
 $('sendTeacherVerification').disabled=busy||auth.currentUser?.emailVerified===true||Date.now()-lastVerificationSent<60000;
 $('sendTeacherVerification').textContent=lastVerificationSent?'Resend link':'Send verification link';
 $('teacherEmailInstruction').textContent=lastVerificationSent
  ? 'Open the link we sent, then return here. Your status updates after we confirm your email.'
  : 'Open your verification link and return here. You can request a link below.';
 $('refreshTeacherEmail').disabled=busy;$('reloadApplication').disabled=busy;
}
function setupErrorMessage(error){
 switch(error.code){
  case 'teacher/stale-application':return 'Your saved application changed while you were editing. Your unsaved details are still here. Check the latest application before saving.';
  case 'teacher/save-status-unavailable':return 'Your application was saved. Use Reload saved application to check its status.';
  case 'permission-denied':return 'We could not confirm access to your application. Sign in again, then retry.';
  case 'unauthenticated':
  case 'auth/user-token-expired':
  case 'auth/invalid-user-token':return 'Your session expired. Sign in again to continue.';
  case 'auth/network-request-failed':
  case 'unavailable':
  case 'deadline-exceeded':return 'Unable to connect. Check your internet connection and try again.';
  case 'auth/too-many-requests':
  case 'resource-exhausted':return 'Too many requests. Wait a few minutes before trying again.';
  case undefined:return error.message||'Could not complete this action.';
  default:return 'Could not complete this action. Try again or contact an administrator if it continues.';
 }
}
async function task(work,success='',progress='Loading your teacher setup...'){
 if(busy)return;
 busy=true;const generation=epoch;controls();message(progress);
 try{await work();if(generation===epoch)message(typeof success==='function'?success():success);}
 catch(error){if(generation===epoch){if(error.code==='teacher/stale-application')applicationConflict=true;message(setupErrorMessage(error),true);}}
 finally{if(generation===epoch){busy=false;controls();}}
}
async function load({keepEdits=false,result=null}={}){const generation=epoch;result??=await loadTeacherApplication();if(generation!==epoch)return;application=result.application;accountStatus=result.profile.status;verifiedRevision=result.profile.teacherVerifiedRevision||0;applicationConflict=false;confirmedSaveNeedsRefresh=false;
 $('applicationWorkspace').hidden=false;$('teacherEmailStatus').textContent=auth.currentUser.email+(auth.currentUser.emailVerified?' — verified':' — verification needed');
 $('teacherApplicationStatus').textContent=({draft:'Draft — not sent for review',submitted:application?.emailVerified===true?'Submitted — awaiting administrator review':'Submitted — email confirmation pending',needs_changes:'More information requested',declined:'Declined — see the reason below',approved:'Approved — '+(application?.applicantType==='school_teacher'?'school affiliation verified':application?.applicantType==='licensed_teacher'?'licensed teacher':application?.applicantType==='student_teacher'?'student teacher':'learning facilitator')})[application?.status]||'No application submitted yet';
 $('teacherDecisionReason').textContent=application?.decisionReason||'';
 editing=keepEdits||!application||['draft','needs_changes','declined'].includes(application.status);
 $('openApprovedWorkspace').hidden=editing||!dashboardReady();
 if(!keepEdits){
  form.reset();updateEvidenceSelection();if(application)for(const field of form.elements){if(!field.name)continue;if(field.name==='prcExpiry'){field.value=application.prcExpiresAt?.toDate?.().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'})||'';}else if(application[field.name]!=null)field.value=application[field.name];}
  else form.elements.legalName.value=[result.profile.firstName,result.profile.middleName,result.profile.lastName].filter(Boolean).join(' ').trim();
  $('teacherQualificationAcknowledged').checked=application?.acknowledged===true;
 }
 $('teacherSetupDetails').open=editing;$('teacherSetupDetails').dataset.editing=String(editing);
 route();
 $('teacherEvidenceStatus').textContent=application?.evidenceRevision?'Evidence image attached. Only you and administrators can open it during review.':'';
 $('viewTeacherEvidence').hidden=!application?.evidenceRevision;
 if(application?.evidenceRevision&&teacherEvidenceExpired(application.evidenceUploadedAt)){
  $('viewTeacherEvidence').hidden=true;
  $('teacherEvidenceStatus').textContent='Your evidence expired. Attach a new image or remove the old attachment before saving.';
  try{await readTeacherEvidence(auth.currentUser.uid,application);}catch{/* Expired evidence stays hidden if cleanup is unavailable. */}
  if(generation!==epoch)return;
 }
 controls();
 if(!stopApplicationWatch)$('applicationLiveStatus').hidden=true;
 followReview();
}
function readSubmission(submit){
 const values=Object.fromEntries(new FormData(form));
 values.acknowledged=$('teacherQualificationAcknowledged').checked;
 if(registering)values.legalName=['teacherFirstName','teacherMiddleName','teacherLastName'].map(id=>$(id)?.value.trim()).filter(Boolean).join(' ');
 const options={submit,file:$('teacherEvidenceFile').files[0]||null,removeEvidence:$('removeTeacherEvidence').checked,expectedRevision:application?.revision||0,expectedStatus:application?.status||null,expectedReviewId:application?.reviewId||null};
 return {values,options};
}
function validateSubmission({values,options}){
 try{
  applicationFields(values,options.submit);
  if(options.file)safeEvidence(options.file);
  return true;
 }catch(error){
  message(error.message,true);
  return false;
 }
}
function updateEvidenceSelection(){
 const input=$('teacherEvidenceFile'),file=input.files[0];
 let error='';
 if(file)try{safeEvidence(file);}catch(problem){error=problem.message;}
 input.setCustomValidity(error);
 if(error)input.setAttribute('aria-invalid','true');else input.removeAttribute('aria-invalid');
 const status=$('applicationFileName');
 status.dataset.error=String(!!error);
 status.textContent=error||file?.name||'';
 $('clearTeacherEvidenceFile').hidden=!file;
}
async function sendVerificationLink(){
 const generation=epoch;
 await sendTeacherVerification();
 if(generation!==epoch)return;
 lastVerificationSent=Date.now();setTimeout(controls,60000);
}
function save(submit,{values,options}=readSubmission(submit)){
 const generation=epoch;
 let emailFailed=false;
 return task(async()=>{
  await saveTeacherApplication(values,options);
  if(generation!==epoch)return;
  try{
   await load();
  }catch{
   if(generation!==epoch)return;
   applicationConflict=true;
   confirmedSaveNeedsRefresh=true;
   throw Object.assign(Error('Your application was saved. Check the latest application to reload its status.'),{code:'teacher/save-status-unavailable'});
  }
  if(generation===epoch&&submit&&verificationPending()&&auth.currentUser.emailVerified!==true&&!lastVerificationSent){
   try{await sendVerificationLink();}catch{emailFailed=true;}
  }
  if(generation===epoch&&submit)$('teacherSetupTitle').focus();
 },()=>!submit?'Draft saved. It is not submitted for review.'
  :emailFailed?'Application submitted. Use Send verification link to try sending the email again.'
  :verificationPending()?''
  :'Application submitted for administrator review.',submit?'Submitting your application...':'Saving your draft...');
}
form.addEventListener('submit',event=>{
 event.preventDefault();
 if(busy||applicationConflict||!setupReady||form.dataset.authReady!=='true'||form.dataset.creating==='true'){
  event.stopImmediatePropagation();return;
 }
 const submission=readSubmission(true);
 if(!validateSubmission(submission)){event.stopImmediatePropagation();return;}
 if(!registering){save(true,submission);return;}
 registrationSubmission=submission;
},true);
$('saveTeacherDraft').addEventListener('click',()=>{
 if(busy||applicationConflict)return;
 const submission=readSubmission(false);
 if(validateSubmission(submission))save(false,submission);
});
checkLatestDecision.addEventListener('click',()=>{
 if(confirmedSaveNeedsRefresh){
  void task(async()=>{
   const generation=epoch;
   await load();
   if(generation===epoch&&verificationPending()&&auth.currentUser.emailVerified!==true&&!lastVerificationSent){
    try{await sendVerificationLink();}catch{/* The verification card offers an explicit resend. */}
   }
  },()=>verificationPending()&&!lastVerificationSent?'Your application is saved. Use Send verification link to request the email.':'Saved application reloaded.','Checking your saved application...');
  return;
 }
 const generation=epoch;
 let keepEdits=false;
 void task(async()=>{
  const result=await loadTeacherApplication();
  if(generation!==epoch)return;
  const latest=result.application;
  const description={approved:'Your application was approved. Saving a new revision pauses classroom access and requires another review.',declined:'Your application was declined.',needs_changes:'An administrator requested changes.',submitted:'A different submission is on file.',draft:'A different draft is on file.'}[latest?.status]||'Your saved application changed.';
  const reason=latest?.decisionReason?' Reviewer feedback: '+latest.decisionReason:'';
  keepEdits=await appConfirm(description+reason+' Keep the details you typed and continue editing?');
  if(generation===epoch&&keepEdits)await load({keepEdits:true,result});
 },()=>keepEdits?'Your edits are ready. Save or submit when you are ready.':'Your unsaved details are still here. Use Cancel edit to view the saved version.','Checking your latest application...');
});
$('cancelTeacherEdit').addEventListener('click',()=>task(async()=>{
 const generation=epoch;
 await load();
 if(generation===epoch)$('teacherSetupTitle').focus();
},'Edits discarded. Your saved application is shown.','Loading your saved application...'));
$('applicantType').addEventListener('change',route);
$('teacherEvidenceFile').addEventListener('change',updateEvidenceSelection);
$('clearTeacherEvidenceFile').addEventListener('click',()=>{
 const input=$('teacherEvidenceFile');
 input.value='';
 updateEvidenceSelection();
 input.focus();
});
$('reloadApplication').addEventListener('click',()=>task(async()=>{if(verificationPending())await refreshTeacherEmail();await load();},'Application refreshed.','Checking review and access status...'));
$('viewTeacherEvidence').addEventListener('click',()=>task(()=>showTeacherEvidence(auth.currentUser.uid,application),'','Opening your private evidence...'));
$('refreshTeacherEmail').addEventListener('click',()=>task(async()=>{
 const verified=await refreshTeacherEmail();
 if(!editing){await load();return;}
 $('teacherEmailStatus').textContent=auth.currentUser.email+(verified?' — verified':' — verification needed');
},()=>auth.currentUser?.emailVerified
 ? verificationPending()?'This application uses a different email address. Update your application or contact an administrator.':'Email verified. You can check your application status here.'
 : 'Email is not verified yet. Open the link in your inbox and check again.','Checking your email verification...'));
$('sendTeacherVerification').addEventListener('click',()=>task(sendVerificationLink,'Verification email sent. Open the link, then return here.','Sending verification link...'));
$('reviseTeacherApplication').addEventListener('click',async ()=>{
 if(busy||editing)return;
 const generation=epoch;
 if(application?.status==='approved'&&!(await appConfirm('Changing an approved application requires a new review. Classroom access pauses when you save the revision; classes and student progress stay saved. Continue?')))return;
 if(generation!==epoch||busy)return;
 editing=true;
 $('teacherSetupDetails').open=true;
 $('teacherSetupDetails').dataset.editing='true';
 controls();
 message('Edit your information, then save a draft or submit a new revision.');
 form.elements.legalName.focus();
});
function clear(){stopApplicationWatch?.();stopApplicationWatch=null;clearTimeout(applicationRefresh);++epoch;busy=false;application=null;applicationConflict=false;confirmedSaveNeedsRefresh=false;accountStatus=null;verifiedRevision=0;editing=false;setupReady=false;lastVerificationSent=0;lastEmailCheck=0;registrationSubmission=null;form.reset();updateEvidenceSelection();$('applicationWorkspace').hidden=true;$('applicationLiveStatus').hidden=true;$('teacherDecisionReason').textContent='';$('teacherEvidenceStatus').textContent='';$('teacherEmailStatus').textContent='';$('teacherApplicationStatus').textContent='';controls();}
window.addEventListener('pagehide',clear);window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
function showRegistration(user){
 registering=true;editing=true;setupReady=true;
 $('teacherEmail').value=user?.email||'';
 $('applicationWorkspace').hidden=false;
 $('teacherSetupDetails').open=true;$('teacherSetupDetails').dataset.editing='true';
 controls();
}
async function checkEmailOnReturn(){
 if(document.visibilityState==='hidden'||!verificationPending()||busy||Date.now()-lastEmailCheck<5000)return;
 const generation=epoch;
 lastEmailCheck=Date.now();busy=true;controls();
 try{
  if(await refreshTeacherEmail()&&generation===epoch){
   await load();
   if(generation===epoch&&!verificationPending())message('Email confirmed. Your application is ready for review.');
  }
 }catch{
  // The explicit check remains available if the automatic refresh fails.
 }finally{if(generation===epoch){busy=false;controls();}}
}
function resumeTeacherSetup(user){
 if(user&&form.dataset.creating==='true')return;
 clear();
 if(!user){showRegistration();message('');return;}
 registering=false;editing=true;setupReady=true;
 task(async()=>{
  try{await load();}
  catch(error){if(error.code!=='teacher/profile-missing'||auth.currentUser!==user)throw error;showRegistration(user);}
 }).then(checkEmailOnReturn);
}
document.addEventListener('teacher-registration-ready',controls);
document.addEventListener('teacher-account-ready',()=>{
 const submission=registrationSubmission;registrationSubmission=null;
 if(!submission){resumeTeacherSetup(auth.currentUser);return;}
 registering=false;
 form.elements.legalName.value=submission.values.legalName;
 controls();
 save(true,submission);
});
window.addEventListener('focus',checkEmailOnReturn);
document.addEventListener('visibilitychange',checkEmailOnReturn);
$('retryTeacherSetup')?.addEventListener('click',()=>resumeTeacherSetup(auth.currentUser));
onAuthStateChanged(auth,resumeTeacherSetup);
