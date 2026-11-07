import {auth} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {loadTeacherApplication,refreshTeacherEmail,sendTeacherVerification,saveTeacherApplication,readTeacherEvidence} from './teacher-application-client.js';
import {showTeacherEvidence} from './teacher-evidence-viewer.js';
const $=id=>document.getElementById(id),form=$('teacherApplicationForm');
const unified=document.body.dataset.unifiedTeacherSetup==='true';
let application=null,epoch=0,busy=false,editing=true,lastVerificationSent=0;
function message(text,error=false){$('applicationMessage').textContent=text;$('applicationMessage').dataset.error=String(error);if($('retryTeacherSetup'))$('retryTeacherSetup').hidden=!error||!auth.currentUser;}
function route(){const type=form.elements.applicantType.value,licensed=type==='licensed_teacher',school=type==='school_teacher';$('licensedTeacherFields').hidden=!licensed;$('endorsedTeacherFields').hidden=licensed||school;$('applicationRouteHelp').textContent=school?'The administrator confirms your identity and connection to your institution. No PRC number or document upload is required to start. They may request one supporting document if needed.':licensed?'For the professional-license route, provide your current PRC registration number and expiry. Choose School affiliation if you only need your school role verified.':'Provide the supervisor or organization representative who can endorse your learning-support role.';}

function renderApplicationJourney(){
 const signedIn=!!auth.currentUser,verified=auth.currentUser?.emailVerified===true,submitted=application?.status==='submitted',approved=application?.status==='approved',current=!signedIn?'account':!verified?'email':submitted||approved?'review':'details';
 document.querySelector('.application-hero>.eyebrow').textContent=signedIn?'YOUR ACCOUNT IS READY':'TEACHER ACCOUNT SETUP';
 document.body.dataset.setupPhase=!signedIn?'account':!verified?'email':!editing?'review':'details';
 for(const step of document.querySelectorAll('[data-application-step]')){const key=step.dataset.applicationStep,complete=(key==='account'&&signedIn)||(key!=='account'&&approved)||(key==='email'&&verified)||(key==='details'&&submitted);step.dataset.state=complete?'complete':key===current?'current':'pending';if(key===current&&!approved)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');}
 document.querySelector('.application-status-card').dataset.status=application?.status||'none';
 document.body.dataset.setupEditing=String(editing);
 const state=application?.status||'none',copy={submitted:['Your details are under review.','Your teacher setup is submitted. Check your review status here; there is no need to fill in the form again.'],needs_changes:['A few details need updating.','Read the reviewer’s feedback, update your saved details, and submit them again.'],declined:['Review your application feedback.','Read the decision below. You can revise your details before requesting another review.'],approved:['Your classroom is ready.','Your teacher setup is approved. Open your classroom workspace to create a class and invite students.']}[state]||['Complete your teacher setup.','Your account is created. Verify your email, add your teaching details, then submit them for administrator review. You can save a draft and return later.'];
 $('teacherSetupTitle').textContent=copy[0];$('teacherSetupDescription').textContent=copy[1];
 if(!signedIn){$('teacherSetupTitle').textContent='Create your teacher account.';$('teacherSetupDescription').textContent='One setup, from your account to your classroom. Create your sign-in, verify your email, and share your teaching details here.';}
 else if(!verified){$('teacherSetupTitle').textContent='Next, verify your email.';$('teacherSetupDescription').textContent='Your account is created. Open the verification link in your inbox, then check your email status below to continue here.';}
}

function controls(){renderApplicationJourney();form.setAttribute('aria-busy',String(busy));const locked=!editing;form.querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=busy||locked);$('sendTeacherVerification').disabled=busy||auth.currentUser?.emailVerified===true||Date.now()-lastVerificationSent<60000;$('refreshTeacherEmail').disabled=busy;$('reloadApplication').disabled=busy;}
async function task(work,success=''){if(busy)return;busy=true;const generation=epoch;controls();message('Working...');try{await work();if(generation===epoch)message(success);}catch(error){if(generation===epoch)message(error.code==='permission-denied'?'Access denied. Refresh your email status or sign in again, then retry.':error.message||'Could not complete this action.',true);}finally{if(generation===epoch){busy=false;controls();}}}
async function load(){const generation=epoch,result=await loadTeacherApplication();if(generation!==epoch)return;application=result.application;
 $('applicationWorkspace').hidden=false;$('teacherEmailStatus').textContent=auth.currentUser.email+(auth.currentUser.emailVerified?' — verified':' — verification needed');
 $('teacherApplicationStatus').textContent=({draft:'Draft — not sent for review',submitted:'Submitted — awaiting administrator review',needs_changes:'More information requested',declined:'Declined — see the reason below',approved:'Approved — '+(application?.applicantType==='school_teacher'?'school affiliation verified':application?.applicantType==='licensed_teacher'?'licensed teacher':application?.applicantType==='student_teacher'?'student teacher':'learning facilitator')})[application?.status]||'No application submitted yet';
 $('teacherDecisionReason').textContent=application?.decisionReason||'';
 $('openApprovedWorkspace').hidden=application?.status!=='approved'||result.profile.status!=='active';
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
function save(submit){const values=Object.fromEntries(new FormData(form));values.acknowledged=$('teacherQualificationAcknowledged').checked;const options={submit,file:$('teacherEvidenceFile').files[0]||null,removeEvidence:$('removeTeacherEvidence').checked,expectedRevision:application?.revision||0};return task(async()=>{await saveTeacherApplication(values,options);await load();},submit?'Application submitted. An administrator must review it before classroom access is granted.':'Draft saved. It is not submitted for review.');}
form.addEventListener('submit',event=>{event.preventDefault();save(true);});
$('saveTeacherDraft').addEventListener('click',()=>save(false));
$('applicantType').addEventListener('change',route);
$('teacherEvidenceFile').addEventListener('change',()=>{$('applicationFileName').textContent=$('teacherEvidenceFile').files[0]?.name||'No new image selected.';});
$('reloadApplication').addEventListener('click',()=>task(()=>load(),'Application refreshed.'));
$('viewTeacherEvidence').addEventListener('click',()=>task(()=>showTeacherEvidence(auth.currentUser.uid,application)));
$('refreshTeacherEmail').addEventListener('click',()=>task(async()=>{await refreshTeacherEmail();$('teacherEmailStatus').textContent=auth.currentUser.email+(auth.currentUser.emailVerified?' — verified':' — verification needed');},'Email status refreshed. Your unsaved application stays in the form.'));
$('sendTeacherVerification').addEventListener('click',()=>task(async()=>{await sendTeacherVerification();lastVerificationSent=Date.now();setTimeout(controls,60000);},'Verification email sent. Open it in your inbox, then return and check your status.'));
$('reviseTeacherApplication').addEventListener('click',()=>{if(application?.status==='approved'&&!confirm('Changing an approved application requires a new review. Classroom access pauses when you save the revision; classes and student progress stay saved. Continue?'))return;editing=true;$('teacherSetupDetails').open=true;$('teacherSetupDetails').dataset.editing='true';controls();message('Edit your information, then save a draft or submit a new revision.');});
function clear(){++epoch;busy=false;application=null;editing=false;form.reset();$('applicationWorkspace').hidden=true;$('teacherDecisionReason').textContent='';$('teacherEvidenceStatus').textContent='';$('teacherEmailStatus').textContent='';$('teacherApplicationStatus').textContent='';controls();}
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
