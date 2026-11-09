import {auth,db} from './firebase-config.js';
import {doc,getDocFromServer} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {reviewTeacherApplication} from './teacher-application-review.js';
import {showTeacherEvidence} from './teacher-evidence-viewer.js';
import {readTeacherEvidence} from './teacher-application-client.js';
import {APPLICANT_LABELS} from './teacher-application-policy.js';
export async function mountTeacherReview(root,profile,onReviewed){
 const user=auth.currentUser,snapshot=await getDocFromServer(doc(db,'teacherApplications',profile.id));
 if(auth.currentUser!==user||!root.isConnected)return;
 root.replaceChildren();
 const add=(tag,text,parent=root)=>{const e=document.createElement(tag);e.textContent=text;parent.append(e);return e;};
 add('h3','Teacher qualification application');
 if(!snapshot.exists()){add('p','This teacher has not submitted qualifications. Ask them to open Teacher Application after signing in. Classroom access requires a completed review.');return;}
 const application=snapshot.data();
 add('p',`${APPLICANT_LABELS[application.applicantType]||'Applicant'} · ${application.status} · revision ${application.revision}`);
 const details=add('dl','');details.className='qualification-facts';
 for(const [label,key]of [['Applicant name','legalName'],['Institution','institution'],['Location','locality'],['Teaching role','roleTitle'],['Application email','email'],['Institution website (applicant supplied)','officialWebsite'],['Work email (applicant supplied)','workEmail'],['PRC registration number','prcNumber'],['Endorsing supervisor','sponsorName'],['Supervisor contact (applicant supplied)','sponsorContact'],['Teaching statement','statement']])if(application[key]){const item=add('div','',details);add('dt',label,item);add('dd',application[key],item);}
 add('p','Submission email: '+(application.emailVerified?'verified at submission':'not verified'));
 if(application.prcExpiresAt)add('p','Declared PRC expiry: '+application.prcExpiresAt.toDate().toLocaleDateString('en-PH',{timeZone:'Asia/Manila'}));
 if(application.decisionReason)add('p','Last applicant-facing reason: '+application.decisionReason);
 const notice=add('p','');notice.className='qualification-notice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 if(application.evidenceRevision){
  if(application.evidenceUploadedAt?.toMillis()+30*86400000<=Date.now()){await readTeacherEvidence(profile.id,application);if(!root.isConnected||auth.currentUser!==user)return;notice.textContent='Expired evidence was removed. Request updated evidence if needed.';}
  else{const view=add('button','View Private Evidence');view.type='button';view.addEventListener('click',async()=>{view.disabled=true;try{await showTeacherEvidence(profile.id,application);}catch(e){if(root.isConnected)notice.textContent=e.message;}finally{view.disabled=false;}});}
 }
 if(application.applicantType==='licensed_teacher'){const link=add('a','Open official PRC verification');link.href='https://verification.prc.gov.ph/Verification';link.target='_blank';link.rel='noopener noreferrer';}
 add('p','Use an independently obtained institutional contact. A school email, an uploaded ID or a PRC record alone does not prove the applicant owns those credentials. Do not record unnecessary sensitive information.');
 if(application.applicantType==='school_teacher')add('p','School-affiliation route: verify identity and current institutional affiliation. PRC or supervisor endorsement checks are not required. Approval verifies qualifications, not professional licensure. Account access requires a separate activation decision.');
 if(application.status!=='submitted'){add('p',application.status==='approved'?(profile.status==='active'?'Qualifications approved. Account access is active.':'Qualifications approved. Account access remains '+profile.status+'. Use Existing-account access below to record a separate activation decision when appropriate.'):application.status==='needs_changes'?'Waiting for the applicant to revise and resubmit the requested information.':application.status==='declined'?'Application declined. The applicant may submit a revised application for a new review.':'Review decisions are available after the applicant submits a verified-email application.');return;}
 const form=add('form','');form.className='qualification-review-form';
 form.innerHTML='<label>Decision<select name="decision"><option value="needs_changes">Request more information</option><option value="approved">Approve this application route</option><option value="declined">Decline application</option></select></label><label class="application-check"><input type="checkbox" name="identity">I checked that the applicant owns the claimed identity.</label><label class="application-check"><input type="checkbox" name="affiliation">I independently confirmed the current institutional affiliation.</label><label class="application-check"><input type="checkbox" name="prc">Licensed route: I checked the PRC record and current credential details.</label><label class="application-check"><input type="checkbox" name="endorsement">Student-teacher/facilitator route: I confirmed the supervisor/organization endorsement.</label><label>Institution verification reference (admin only)<textarea name="affiliationReference" maxlength="500" placeholder="Record the independent contact method and result."></textarea></label><label>PRC or endorsement reference (only for those routes)<textarea name="credentialReference" maxlength="500" placeholder="Record the checked source/result, without unnecessary personal details."></textarea></label><label>Reason / next steps shown to the applicant<textarea name="reason" required minlength="5" maxlength="500"></textarea></label><button type="submit">Save Qualification Decision</button>';
 if(application.applicantType==='school_teacher')for(const name of ['prc','endorsement','credentialReference'])form.elements[name].closest('label').hidden=true;
 if(application.applicantType==='licensed_teacher')form.elements.endorsement.closest('label').hidden=true;
 if(['student_teacher','facilitator'].includes(application.applicantType))form.elements.prc.closest('label').hidden=true;
 const group=(title,names)=>{const section=document.createElement('fieldset');section.className='qualification-step';add('legend',title,section);for(const name of names)section.append(form.elements[name].closest('label'));form.insertBefore(section,form.querySelector('button[type=submit]'));return section;};
 group('1. Verify the application',['identity','affiliation','prc','endorsement','affiliationReference','credentialReference']);
 const decisionGroup=group('2. Record your decision',['decision','reason']);
 const guidance=add('p','The applicant can read your reason. Explain the decision and any next steps clearly.',decisionGroup);guidance.className='teacher-note';
 let saving=false,saved=false,uncertain=null;
 const recovery=add('button','Check saved decision');recovery.type='button';recovery.hidden=true;
 const active=()=>auth.currentUser===user&&root.isConnected;
 const lock=()=>{form.dataset.decisionLocked=String(saving||saved||!!uncertain);form.querySelectorAll('input,select,textarea,button').forEach(e=>e.disabled=saving||saved||!!uncertain);};
 const refreshSaved=async()=>{
  saved=true;uncertain=null;recovery.textContent='Refresh saved review';notice.textContent='Qualification decision saved with its audit record.';
  try{await onReviewed();}catch{if(active()){notice.textContent='Qualification decision saved with its audit record, but the view could not refresh. Refresh the saved review before another decision.';recovery.hidden=false;}}
 };
 recovery.addEventListener('click',async()=>{
  if(saving||!active())return;saving=true;recovery.disabled=true;lock();
  try{if(saved)await refreshSaved();else if(uncertain&&await uncertain.checkDecision())await refreshSaved();else notice.textContent='The decision is still unconfirmed. Check again when connected; do not submit another review.';}
  catch(error){if(active())notice.textContent=error.message;}
  finally{saving=false;if(active()){recovery.disabled=false;lock();}}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(saving||saved||uncertain)return;
  const values=Object.fromEntries(new FormData(form));for(const key of ['identity','affiliation','prc','endorsement'])values[key]=form.elements[key].checked;
  if(!window.confirm(`Record ${values.decision.replaceAll('_',' ')} for ${application.legalName||profile.email||profile.id}?\n\nApplicant-facing reason: ${String(values.reason||'').trim()}\n\n${values.decision==='approved'?'Approval verifies qualifications without changing account status. Activate account access separately after this review.':'This does not grant a new classroom approval; the applicant receives your decision and next steps.'} Existing access is governed by the saved account status. This decision will be saved with its audit record.`))return;
  saving=true;lock();notice.textContent='Saving review...';
  try{await reviewTeacherApplication(profile.id,application.revision,profile.updatedAt?.toMillis?.()||profile.createdAt?.toMillis?.()||0,values);if(active())await refreshSaved();}
  catch(error){if(active()){notice.textContent=error.message;if(error.code==='admin/decision-unknown'){uncertain=error;recovery.hidden=false;}}}
  finally{saving=false;if(active())lock();}
 });
}
