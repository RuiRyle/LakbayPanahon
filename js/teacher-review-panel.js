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
 for(const [label,key]of [['Credential name','legalName'],['Institution','institution'],['Location','locality'],['Role','roleTitle'],['Application email','email'],['Institution website (applicant supplied)','officialWebsite'],['Work email (applicant supplied)','workEmail'],['PRC registration number','prcNumber'],['Endorsing supervisor','sponsorName'],['Supervisor contact (applicant supplied)','sponsorContact'],['Teaching statement','statement']])if(application[key])add('p',label+': '+application[key]);
 add('p','Submission email: '+(application.emailVerified?'verified at submission':'not verified'));
 if(application.prcExpiresAt)add('p','Declared PRC expiry: '+application.prcExpiresAt.toDate().toLocaleDateString('en-PH',{timeZone:'Asia/Manila'}));
 if(application.decisionReason)add('p','Last applicant-facing reason: '+application.decisionReason);
 const notice=add('p','');notice.setAttribute('role','status');
 if(application.evidenceRevision){
  if(application.evidenceUploadedAt?.toMillis()+30*86400000<=Date.now()){await readTeacherEvidence(profile.id,application);if(!root.isConnected||auth.currentUser!==user)return;notice.textContent='Expired evidence was removed. Request updated evidence if needed.';}
  else{const view=add('button','View Private Evidence');view.type='button';view.addEventListener('click',async()=>{view.disabled=true;try{await showTeacherEvidence(profile.id,application);}catch(e){if(root.isConnected)notice.textContent=e.message;}finally{view.disabled=false;}});}
 }
 if(application.applicantType==='licensed_teacher'){const link=add('a','Open official PRC verification');link.href='https://verification.prc.gov.ph/Verification';link.target='_blank';link.rel='noopener noreferrer';}
 add('p','Use an independently obtained institutional contact. A school email, an uploaded ID or a PRC record alone does not prove the applicant owns those credentials. Do not record unnecessary sensitive information.');
 if(application.applicantType==='school_teacher')add('p','School-affiliation route: verify identity and current institutional affiliation. PRC or supervisor endorsement checks are not required. Approval grants classroom access, not professional licensure.');
 if(application.status!=='submitted'){add('p','Review decisions are available after the applicant submits a verified-email application.');return;}
 const form=add('form','');form.className='qualification-review-form';
 form.innerHTML='<label>Decision<select name="decision"><option value="needs_changes">Request more information</option><option value="approved">Approve this application route</option><option value="declined">Decline application</option></select></label><label class="application-check"><input type="checkbox" name="identity">I checked that the applicant owns the claimed identity.</label><label class="application-check"><input type="checkbox" name="affiliation">I independently confirmed the current institutional affiliation.</label><label class="application-check"><input type="checkbox" name="prc">Licensed route: I checked the PRC record and current credential details.</label><label class="application-check"><input type="checkbox" name="endorsement">Student-teacher/facilitator route: I confirmed the supervisor/organization endorsement.</label><label>Institution verification reference (admin only)<textarea name="affiliationReference" maxlength="500" placeholder="Record the independent contact method and result."></textarea></label><label>PRC or endorsement reference (only for those routes)<textarea name="credentialReference" maxlength="500" placeholder="Record the checked source/result, without unnecessary personal details."></textarea></label><label>Reason / next steps shown to the applicant<textarea name="reason" required minlength="5" maxlength="500"></textarea></label><button type="submit">Save Qualification Decision</button>';
 if(application.applicantType==='school_teacher')for(const name of ['prc','endorsement','credentialReference'])form.elements[name].closest('label').hidden=true;
 form.addEventListener('submit',async event=>{event.preventDefault();const values=Object.fromEntries(new FormData(form));for(const key of ['identity','affiliation','prc','endorsement'])values[key]=form.elements[key].checked;form.querySelectorAll('input,select,textarea,button').forEach(e=>e.disabled=true);notice.textContent='Saving review...';try{await reviewTeacherApplication(profile.id,application.revision,profile.updatedAt?.toMillis?.()||profile.createdAt?.toMillis?.()||0,values);if(auth.currentUser===user&&root.isConnected)await onReviewed();}catch(error){if(auth.currentUser===user&&root.isConnected)notice.textContent=error.message;}finally{form.querySelectorAll('input,select,textarea,button').forEach(e=>e.disabled=false);}});
}
