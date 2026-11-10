import {appConfirm} from './app-dialog.js';
import {auth,db} from './firebase-config.js';
import {doc,getDocFromServer} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {loadAdminAccount,moderateAccount} from './admin-accounts.js';
import {reviewTeacherApplication} from './teacher-application-review.js';
import {showTeacherEvidence} from './teacher-evidence-viewer.js';
import {readTeacherEvidence} from './teacher-application-client.js';
import {APPLICANT_LABELS} from './teacher-application-policy.js';
export async function mountTeacherReview(root,profile,onReviewed){
 const user=auth.currentUser,snapshot=await getDocFromServer(doc(db,'teacherApplications',profile.id));
 if(auth.currentUser!==user||!root.isConnected)return;
 root.replaceChildren();
 const add=(tag,text,parent=root)=>{const e=document.createElement(tag);e.textContent=text;parent.append(e);return e;};
 const heading=add('header','');heading.className='qualification-review-heading';add('h3','Teacher Application',heading);add('p','Review the applicant’s information and qualifications before recording a decision.',heading);
 const hasApplication=snapshot.exists();
 const application=hasApplication?snapshot.data():{status:'not_submitted',legalName:[profile.firstName,profile.lastName].filter(Boolean).join(' '),email:profile.email||''};
 if(document.body.dataset.adminView==='applications'){const cap=document.createElementNS('http://www.w3.org/2000/svg','svg');cap.setAttribute('viewBox','0 0 80 60');cap.setAttribute('aria-hidden','true');cap.classList.add('qualification-heading-cap');cap.innerHTML='<path d="M4 20 40 4 76 20 40 36Z M18 28v18q22 16 44 0V28 M73 22v29"/>';heading.append(cap);}
 root.dataset.applicationStatus=application.status;root.dataset.applicationRevision=String(application.revision||0);
 const statusNames={submitted:'Pending Review',not_submitted:'Not Submitted',draft:'Not submitted',needs_changes:'For revision',approved:'Qualifications approved',declined:'Declined'};
 const statusBadge=add('span',statusNames[application.status]||'Status unavailable',heading);statusBadge.className='qualification-review-badge';
 const identity=add('section','');identity.className='qualification-applicant-card';
 const avatar=add('span',(application.legalName||profile.firstName||'T').trim().split(/\s+/).filter(Boolean).slice(0,2).map(word=>Array.from(word)[0]).join('').toUpperCase(),identity);avatar.className='qualification-applicant-avatar';avatar.setAttribute('aria-hidden','true');if(document.body.dataset.adminView==='applications'){avatar.textContent='';const personIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');personIcon.setAttribute('viewBox','0 0 48 48');personIcon.setAttribute('aria-hidden','true');personIcon.innerHTML='<circle cx="24" cy="15" r="8"/><path d="M9 40v-4c0-8 7-12 15-12s15 4 15 12v4Z"/>';avatar.append(personIcon);}
 const person=add('div','',identity);person.className='qualification-applicant-identity';add('h4',application.legalName||[profile.firstName,profile.lastName].filter(Boolean).join(' ')||'Teacher applicant',person);add('p',application.email||profile.email||'Email unavailable',person);add('p',APPLICANT_LABELS[application.applicantType]||'Applicant teacher',person);
 let submitted=hasApplication?'Submission time unavailable':'Application not submitted yet';try{if(application.updatedAt?.toDate)submitted='Application updated: '+new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(application.updatedAt.toDate())+' (PH)';}catch{}add('p',submitted,person);
 const current=add('div','',identity);current.className='qualification-current-status';add('strong','Current Status',current);const badge=add('span',statusNames[application.status]||'Status unavailable',current);badge.className='qualification-review-badge';if(application.status==='submitted')add('p','Awaiting administrator decision.',current);else if(!hasApplication)add('p','Waiting for the teacher to submit qualifications.',current);const accountStage=add('p',(Number.isInteger(application.revision)?'Revision '+application.revision+' \u00b7 ':'')+'Account '+profile.status,current);accountStage.className='qualification-account-stage';
 if(document.body.dataset.adminView==='applications'){
  const paths=['M4 6h16v12H4z M4 6l8 6 8-6','M2 8l10-5 10 5-10 5z M6 10v7q6 4 12 0v-7','M5 5h14v16H5z M8 2v6 M16 2v6 M5 10h14'];
  [...person.querySelectorAll('p')].forEach((row,index)=>{const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.innerHTML='<path d="'+paths[index]+'"/>';row.prepend(icon);});
 }
 const nextStep=add('p','');nextStep.className='qualification-next-step';
 const verified=application.status==='approved'&&application.revision===profile.teacherVerifiedRevision;
 nextStep.textContent=application.status==='submitted'?'Next: review the submitted qualifications, then choose Approve & Activate, Request changes or Decline.':application.status==='needs_changes'?'Next: wait for the teacher to revise and resubmit. Their current submission cannot be approved.':application.status==='declined'?'Decision saved: the teacher may submit a revised application for another review.':application.status==='approved'?(verified?(profile.status==='active'?'Complete: qualifications approved and classroom access active.':profile.status==='inactive'?'Qualifications approved; access is inactive. Review account history before considering reactivation.':'Approval saved; activation is incomplete. Open account details to review and finish access activation.'):'Approval needs rechecking: the approved revision does not match account eligibility. Inspect account history before granting access.'):'Next: the teacher must verify their email and submit teaching details. An account waiting for access is not a submitted application.';
 const layout=add('div','');layout.className='qualification-information-grid';const main=add('div','',layout);main.className='qualification-information-main';const side=add('aside','',layout);side.className='qualification-information-side';side.setAttribute('aria-label','Application summary and history');
 const factsPanel=add('section','',main);factsPanel.className='qualification-facts-panel';add('h4','Qualification details',factsPanel);
 const details=add('dl','',factsPanel);details.className='qualification-facts';
 for(const [label,key]of [['Institution','institution'],['Location','locality'],['Teaching role','roleTitle'],['Institution website (applicant supplied)','officialWebsite'],['Work email (applicant supplied)','workEmail'],['PRC registration number','prcNumber'],['Endorsing supervisor','sponsorName'],['Supervisor contact (applicant supplied)','sponsorContact'],['Teaching statement','statement']])if(application[key]){const item=add('div','',details);add('dt',label,item);add('dd',application[key],item);}
 if(!details.childElementCount){for(const label of ['Institution','Location','Teaching role','Teaching statement']){const item=add('div','',details);add('dt',label,item);add('dd','Not provided',item);}}
 const summary=add('section','',side);summary.className='qualification-summary-panel';add('h4','Application summary',summary);
 for(const [label,available]of [['Applicant details',!!application.legalName],['Institution',!!application.institution],['Teaching statement',!!application.statement],['Verified email',application.emailVerified===true],['Supporting evidence',!!application.evidenceRevision]]){const row=add('p','',summary);row.className='qualification-summary-item';row.dataset.available=String(available);const mark=add('span',available?'\u2713':'\u2014',row);mark.setAttribute('aria-hidden','true');add('span',label+': '+(available?'Provided':'Not recorded'),row);}
 add('p','Provided data is not proof of verification.',summary).className='teacher-note';
 const documents=add('section','',main);documents.className='qualification-documents-panel';add('h4','Supporting document',documents);
 if(document.body.dataset.adminView==='applications'){
  const iconHeadings=[[factsPanel,'M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h7'],[summary,'M8 5H5v16h14V5h-3 M8 3h8v5H8z M8 12h8 M8 16h6'],[documents,'M8 13l7-7a4 4 0 0 1 6 6L10 22a6 6 0 0 1-8-8L13 3']];
  for(const [panel,path]of iconHeadings){const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.classList.add('qualification-section-icon');icon.innerHTML='<path d="'+path+'"/>';panel.querySelector('h4').prepend(icon);}
 }
 if(application.prcExpiresAt)add('p','Declared PRC expiry: '+application.prcExpiresAt.toDate().toLocaleDateString('en-PH',{timeZone:'Asia/Manila'}));
 if(application.decisionReason)add('p','Last applicant-facing reason: '+application.decisionReason);
 const notice=add('p','');notice.className='qualification-notice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 if(application.evidenceRevision){
  if(application.evidenceUploadedAt?.toMillis()+30*86400000<=Date.now()){await readTeacherEvidence(profile.id,application);if(!root.isConnected||auth.currentUser!==user)return;notice.textContent='Expired evidence was removed. Request updated evidence if needed.';}
  else{const documentRow=add('div','',documents);documentRow.className='qualification-document-row';const filename=add('p',application.evidenceName||'Private evidence attachment',documentRow);filename.className='qualification-document-name';const view=add('button','View Private Evidence',documentRow);view.type='button';view.addEventListener('click',async()=>{view.disabled=true;try{await showTeacherEvidence(profile.id,application);}catch(e){if(root.isConnected)notice.textContent=e.message;}finally{view.disabled=false;}});}
 }
 else add('p','No supporting document recorded. Check the requirements for this application route.',documents).className='teacher-note';
 if(!hasApplication){const next=add('p','The teacher must complete and submit Teacher Application after signing in. Qualification approval is unavailable until a submission is received.');next.className='qualification-submission-guidance';return;}
 if(application.applicantType==='licensed_teacher'){const link=add('a','Open official PRC verification');link.href='https://verification.prc.gov.ph/Verification';link.target='_blank';link.rel='noopener noreferrer';}
 add('p','Use an independently obtained institutional contact. A school email, an uploaded ID or a PRC record alone does not prove the applicant owns those credentials. Do not record unnecessary sensitive information.');
 if(application.applicantType==='school_teacher')add('p','School-affiliation route: verify identity and current institutional affiliation. PRC or supervisor endorsement checks are not required. Approval verifies qualifications, not professional licensure. Approve & Activate records qualification approval and access activation as separate audited decisions.');
 if(application.status!=='submitted'){add('p',application.status==='approved'?(profile.status==='active'?'Qualifications approved. Account access is active.':'Qualifications approved. Account access remains '+profile.status+'. Open account details to review access and record a separate activation decision when appropriate.'):application.status==='needs_changes'?'Waiting for the applicant to revise and resubmit the requested information.':application.status==='declined'?'Application declined. The applicant may submit a revised application for a new review.':'Review decisions are available after the applicant submits a verified-email application.');return;}
 const form=add('form','');form.className='qualification-review-form';
 form.innerHTML='<label>Decision<select name="decision"><option value="needs_changes">Request more information</option><option value="approved">Approve & Activate</option><option value="declined">Decline application</option></select></label><label class="application-check"><input type="checkbox" name="identity">I checked that the applicant owns the claimed identity.</label><label class="application-check"><input type="checkbox" name="affiliation">I independently confirmed the current institutional affiliation.</label><label class="application-check"><input type="checkbox" name="prc">Licensed route: I checked the PRC record and current credential details.</label><label class="application-check"><input type="checkbox" name="endorsement">Student-teacher/facilitator route: I confirmed the supervisor/organization endorsement.</label><label>Institution verification reference (admin only)<textarea name="affiliationReference" maxlength="500" placeholder="Record the independent contact method and result."></textarea></label><label>PRC or endorsement reference (only for those routes)<textarea name="credentialReference" maxlength="500" placeholder="Record the checked source/result, without unnecessary personal details."></textarea></label><label>Reason / next steps shown to the applicant<textarea name="reason" required minlength="5" maxlength="500"></textarea></label><button type="submit">Review &amp; confirm decision</button>';
 if(application.applicantType==='school_teacher')for(const name of ['prc','endorsement','credentialReference'])form.elements[name].closest('label').hidden=true;
 if(application.applicantType==='licensed_teacher')form.elements.endorsement.closest('label').hidden=true;
 if(['student_teacher','facilitator'].includes(application.applicantType))form.elements.prc.closest('label').hidden=true;
 const group=(title,names)=>{const section=document.createElement('fieldset');section.className='qualification-step';add('legend',title,section);for(const name of names)section.append(form.elements[name].closest('label'));form.insertBefore(section,form.querySelector('button[type=submit]'));return section;};
 group('1. Verify the application',['identity','affiliation','prc','endorsement','affiliationReference','credentialReference']);
 const decisionGroup=group('2. Record your decision',['decision','reason']);
 const guidance=add('p','The applicant can read your reason. Explain the decision and any next steps clearly.',decisionGroup);guidance.className='teacher-note';
 const choices=add('div','',decisionGroup);choices.className='qualification-decision-choices';
 for(const [value,label]of [['approved','Approve & Activate'],['needs_changes','Request changes'],['declined','Decline']]){const choice=add('button',label,choices);choice.type='button';choice.dataset.decision=value;choice.setAttribute('aria-pressed',String(form.elements.decision.value===value));choice.addEventListener('click',()=>{form.elements.decision.value=value;for(const button of choices.children)button.setAttribute('aria-pressed',String(button.dataset.decision===value));const verification=form.querySelector('.qualification-verification-details');if(verification){verification.open=true;verification.querySelector('summary').textContent=(value==='approved'?'Approve & Activate':value==='needs_changes'?'Request changes':'Decline')+' - checks and reason';}form.elements.reason.focus({preventScroll:document.body.dataset.adminView!=='applications'});});}
 if(document.body.dataset.adminView==='applications'){
  form.prepend(choices);root.insertBefore(form,layout.nextSibling);
  const verification=document.createElement('details');verification.className='qualification-verification-details';const summary=document.createElement('summary');summary.textContent='Verification checks & decision reason';verification.append(summary);
  for(const child of [...form.children])if(child!==choices)verification.append(child);form.append(verification);
  form.addEventListener('invalid',()=>{verification.open=true;},true);

 }
 form.elements.decision.addEventListener('change',()=>{for(const button of choices.children)button.setAttribute('aria-pressed',String(button.dataset.decision===form.elements.decision.value));});
 let saving=false,saved=false,uncertain=null,activationPending=false,activationUnknown=null,activationComplete=false,confirmedValues=null;
 const recovery=add('button','Check saved decision');recovery.type='button';recovery.hidden=true;
 const active=()=>auth.currentUser===user&&root.isConnected;
 const lock=()=>{form.dataset.decisionLocked=String(saving||saved||!!uncertain);form.querySelectorAll('input,select,textarea,button').forEach(e=>e.disabled=saving||saved||!!uncertain);};
 const activateApproved=async()=>{
  activationPending=true;
  notice.textContent='Qualifications approved. Activating account access...';
  try{
   if(activationUnknown){if(!await activationUnknown.checkDecision()){notice.textContent='Qualifications are approved. Activation is still unconfirmed. Check again; do not submit another activation.';recovery.hidden=false;recovery.textContent='Check activation result';return false;}activationUnknown=null;}
   else{
    const {profile:latest}=await loadAdminAccount(profile.id);if(!active())return false;
    if(latest.status!==profile.status||latest.teacherVerifiedRevision!==application.revision||latest.moderationEventId!==latest.teacherVerificationReviewId)throw Object.assign(Error('Account access changed after this review. Inspect the account and history before activating.'),{code:'admin/stale-activation'});
    if(latest.status!=='active')await moderateAccount({uid:profile.id,expectedStatus:latest.status,expectedRole:latest.role,expectedVersion:latest.updatedAt?.toMillis?.()||latest.createdAt?.toMillis?.()||0,status:'active',reason:confirmedValues.reason,identityVerified:confirmedValues.identity===true});
   }
   activationPending=false;activationComplete=true;recovery.hidden=true;return true;
  }catch(error){if(active()){if(error.code==='admin/decision-unknown')activationUnknown=error;notice.textContent='Qualifications approved; account activation '+(activationUnknown?'is unconfirmed. ':'did not complete. ')+error.message;const blocked=['admin/stale-activation','admin/stale-account'].includes(error.code)||String(error.code||'').endsWith('permission-denied');if(blocked){activationPending=false;notice.textContent+=' Refresh the saved review and inspect account history; this activation will not be retried automatically.';}recovery.textContent=blocked?'Refresh saved review':activationUnknown?'Check activation result':'Retry account activation';recovery.hidden=false;}return false;}
 };
 const refreshSaved=async()=>{
  saved=true;uncertain=null;recovery.textContent='Refresh saved review';notice.textContent='Qualification decision saved with its audit record.';
  try{await onReviewed({decision:form.elements.decision.value,userId:profile.id,activationComplete});}catch{if(active()){notice.textContent='Qualification decision saved with its audit record, but the view could not refresh. Refresh the saved review before another decision.';recovery.hidden=false;}}
 };
 recovery.addEventListener('click',async()=>{
  if(saving||!active())return;saving=true;recovery.disabled=true;lock();
  try{if(activationPending){if(await activateApproved())await refreshSaved();}else if(saved)await refreshSaved();else if(uncertain&&await uncertain.checkDecision()){saved=true;uncertain=null;if(confirmedValues.decision!=='approved'||await activateApproved())await refreshSaved();}else notice.textContent='The decision is still unconfirmed. Check again when connected; do not submit another review.';}
  catch(error){if(active())notice.textContent=error.message;}
  finally{saving=false;if(active()){recovery.disabled=false;lock();}}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(saving||saved||uncertain)return;
  const values=Object.fromEntries(new FormData(form));for(const key of ['identity','affiliation','prc','endorsement'])values[key]=form.elements[key].checked;
  saving=true;lock();let confirmed=false;try{confirmed=await appConfirm(`Record ${values.decision.replaceAll('_',' ')} for ${application.legalName||profile.email||profile.id}?\n\nApplicant-facing reason: ${String(values.reason||'').trim()}\n\n${values.decision==='approved'?'This will first save qualification approval, then activate classroom access in a separate audited decision. If activation fails, approval remains saved and access is not assumed active.':'This does not grant a new classroom approval; the applicant receives your decision and next steps.'} Existing access is governed by the saved account status. This decision will be saved with its audit record.`);}catch(error){if(active())notice.textContent=error.message;}if(!confirmed||!active()){saving=false;if(active())lock();return;}
  confirmedValues=values;saving=true;lock();notice.textContent='Saving qualification decision...';
  try{await reviewTeacherApplication(profile.id,application.revision,profile.updatedAt?.toMillis?.()||profile.createdAt?.toMillis?.()||0,values);if(active()){saved=true;if(values.decision!=='approved'||await activateApproved())await refreshSaved();}}
  catch(error){if(active()){notice.textContent=error.message;if(error.code==='admin/decision-unknown'){uncertain=error;recovery.hidden=false;}}}
  finally{saving=false;if(active())lock();}
 });
}
