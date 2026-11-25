import {appConfirm} from './app-dialog.js';
import {auth,db} from './firebase-config.js';
import {doc,getDocFromServer} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {loadAdminAccount,moderateAccount} from './admin-accounts.js';
import {reviewTeacherApplication} from './teacher-application-review.js';
import {showTeacherEvidence} from './teacher-evidence-viewer.js';
import {readTeacherEvidence} from './teacher-application-client.js';
import {APPLICANT_LABELS,reviewFields} from './teacher-application-policy.js';
export function loadTeacherReviewSnapshot(uid){return getDocFromServer(doc(db,'teacherApplications',uid));}
export async function mountTeacherReview(root,profile,onReviewed,loadedSnapshot){
 const user=auth.currentUser,snapshot=loadedSnapshot??await loadTeacherReviewSnapshot(profile.id);
 if(auth.currentUser!==user||!root.isConnected)return;
 root.replaceChildren();
 const add=(tag,text,parent=root)=>{const e=document.createElement(tag);e.textContent=text;parent.append(e);return e;};
 const focusedReview=Boolean(document.getElementById('adminApplicationStage'));
 const heading=focusedReview?null:add('header','');
 if(heading){heading.className='qualification-review-heading';add('h3','Teacher Application',heading);add('p','Review the applicant’s information and qualifications before recording a decision.',heading);}
 const hasApplication=snapshot.exists();
 const application=hasApplication?snapshot.data():{status:'not_submitted',legalName:[profile.firstName,profile.lastName].filter(Boolean).join(' '),email:profile.email||''};
 const emailVerified=application.emailVerified===true;
 if(heading&&document.body.dataset.adminView==='applications'){const cap=document.createElementNS('http://www.w3.org/2000/svg','svg');cap.setAttribute('viewBox','0 0 80 60');cap.setAttribute('aria-hidden','true');cap.classList.add('qualification-heading-cap');cap.innerHTML='<path d="M4 20 40 4 76 20 40 36Z M18 28v18q22 16 44 0V28 M73 22v29"/>';heading.append(cap);}
 root.dataset.applicationStatus=application.status;root.dataset.applicationRevision=String(application.revision||0);root.dataset.emailVerified=String(emailVerified);
 const statusNames={submitted:'Pending review',not_submitted:'Not submitted',draft:'Not submitted',needs_changes:'Revision requested',approved:'Approved',declined:'Declined'};
 const accessNames={pending:'Pending',active:'Active',inactive:'Inactive'};
 const decisionNames={approved:profile.status==='active'?'Approve application':profile.status==='inactive'?'Approve & reactivate':'Approve & activate',needs_changes:'Request changes',declined:'Decline application'};
 const identity=add('section','');identity.className='qualification-applicant-card';
 const avatar=add('span',(application.legalName||profile.firstName||'T').trim().split(/\s+/).filter(Boolean).slice(0,2).map(word=>Array.from(word)[0]).join('').toUpperCase(),identity);avatar.className='qualification-applicant-avatar';avatar.setAttribute('aria-hidden','true');if(document.body.dataset.adminView==='applications'){avatar.textContent='';const personIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');personIcon.setAttribute('viewBox','0 0 48 48');personIcon.setAttribute('aria-hidden','true');personIcon.innerHTML='<circle cx="24" cy="15" r="8"/><path d="M9 40v-4c0-8 7-12 15-12s15 4 15 12v4Z"/>';avatar.append(personIcon);}
 const person=add('div','',identity);person.className='qualification-applicant-identity';
 const name=add(focusedReview?'h1':'h4',application.legalName||[profile.firstName,profile.lastName].filter(Boolean).join(' ')||'Teacher applicant',person);
 if(focusedReview){name.id='adminApplicantHeading';name.tabIndex=-1;}
 add('p',application.email||profile.email||'Email unavailable',person);add('p',APPLICANT_LABELS[application.applicantType]||'Applicant teacher',person);
 let submitted=hasApplication?'Submission time unavailable':'Application not submitted yet';try{if(application.updatedAt?.toDate)submitted='Application updated: '+new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(application.updatedAt.toDate())+' (PH)';}catch{}add('p',submitted,person);
 if(document.body.dataset.adminView==='applications'){
  const paths=['M4 6h16v12H4z M4 6l8 6 8-6','M2 8l10-5 10 5-10 5z M6 10v7q6 4 12 0v-7','M5 5h14v16H5z M8 2v6 M16 2v6 M5 10h14'];
  [...person.querySelectorAll('p')].forEach((row,index)=>{const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.innerHTML='<path d="'+paths[index]+'"/>';row.prepend(icon);});
 }
 const workflow=add('section','');workflow.className='qualification-approval-flow';workflow.setAttribute('aria-label','Approval and classroom access');
 add('h4','Review progress',workflow).className='qualification-outcome-title';
 const stages=add('dl','',workflow);stages.className='qualification-approval-stages';
 const stage=(label,value,className)=>{
  const item=add('div','',stages);
  add('dt',label,item);
  const status=add('dd',value,item);status.className=className;
  return status;
 };
 const verified=application.status==='approved'&&emailVerified&&Number.isInteger(application.revision)&&application.revision>0&&application.revision===profile.teacherVerifiedRevision;
 const qualificationStage=stage('1. Review qualifications',application.status==='submitted'&&!emailVerified?'Waiting for email verification':statusNames[application.status]||'Status unavailable','qualification-review-badge');
 const accessLabel=profile.status==='active'&&!verified?'Check current access':profile.status==='pending'?(verified?'Ready to activate':'Waiting for approval'):accessNames[profile.status]||'Status unavailable';
 const accessStage=stage('2. Grant classroom access',accessLabel,'qualification-access-stage');
 const showAccess=(label,state)=>{accessStage.textContent=label;workflow.dataset.accessOutcome=state;};
 showAccess(accessLabel,profile.status==='active'&&verified?'active':profile.status==='pending'&&verified?'attention':'pending');
 const next=add('div','',workflow);next.className='qualification-approval-next';
 const nextStep=add('p','',next);nextStep.className='qualification-next-step';
 if(application.status==='submitted')nextStep.textContent=emailVerified
  ? 'Review the details and record your decision below.'
  : 'You can review the details now. Refresh after the teacher verifies their email to unlock approval.';
 else if(application.status==='needs_changes')nextStep.textContent='Wait for the teacher to revise and resubmit before reviewing again.';
 else if(application.status==='declined')nextStep.textContent='The teacher may submit a revised application for another review.';
 else if(application.status==='approved'){
  if(!verified)nextStep.textContent='The approval or email verification needs a recheck. Review account history before changing access.';
  else if(profile.status==='active')nextStep.textContent='Qualifications approved. Classroom access is active.';
  else if(profile.status==='inactive')nextStep.textContent='Review account history before considering reactivation.';
  else if(profile.status==='pending')nextStep.textContent='The application is approved. Activate classroom access to let this teacher use the dashboard.';
  else nextStep.textContent='Check the current account status before changing access.';
 }else nextStep.textContent='Wait for the teacher to submit their qualifications.';
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
 if(application.prcExpiresAt?.toDate)add('p','Declared PRC expiry: '+application.prcExpiresAt.toDate().toLocaleDateString('en-PH',{timeZone:'Asia/Manila'}),focusedReview?factsPanel:root);
 if(application.decisionReason)add('p','Last reason sent to the applicant: '+application.decisionReason,focusedReview?workflow:root).className='qualification-previous-reason';
 const notice=add('p','',next);notice.className='qualification-notice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 if(application.evidenceRevision){
  if(application.evidenceUploadedAt?.toMillis?.()+30*86400000<=Date.now()){
   let removed=false;
   try{await readTeacherEvidence(profile.id,application);removed=true;}catch{}
   if(!root.isConnected||auth.currentUser!==user)return;
   notice.textContent=removed?'Expired evidence was removed. Request updated evidence if needed.':'This evidence has expired. Request updated evidence if needed.';
  }
  else{const documentRow=add('div','',documents);documentRow.className='qualification-document-row';const filename=add('p',application.evidenceName||'Private evidence attachment',documentRow);filename.className='qualification-document-name';const view=add('button','View Private Evidence',documentRow);view.type='button';view.addEventListener('click',async()=>{view.disabled=true;try{await showTeacherEvidence(profile.id,application);}catch(e){if(root.isConnected)notice.textContent=e.message;}finally{view.disabled=false;}});}
 }
 else add('p','No supporting document recorded. Check the requirements for this application route.',documents).className='teacher-note';
 if(!hasApplication){if(!focusedReview)add('p','The teacher must complete and submit Teacher Application after signing in. Qualification approval is unavailable until a submission is received.').className='qualification-submission-guidance';return;}
 const evidenceHelp=focusedReview?documents:root;
 if(application.applicantType==='licensed_teacher'){const link=add('a','Open official PRC verification',evidenceHelp);link.href='https://verification.prc.gov.ph/Verification';link.target='_blank';link.rel='noopener noreferrer';link.className='qualification-source-link';}
 add('p','Use an independently obtained institutional contact. A school email, an uploaded ID or a PRC record alone does not prove the applicant owns those credentials. Do not record unnecessary sensitive information.',evidenceHelp).className='teacher-note';
 if(application.status!=='submitted')return;
 if(application.applicantType==='school_teacher')add('p','For school affiliation, verify identity and current institutional affiliation. This review does not establish professional licensure.',evidenceHelp).className='teacher-note';
 const decisionHeading=focusedReview?add('h2','Record a decision'):null;
 if(decisionHeading)decisionHeading.className='qualification-decision-heading';
 const form=add('form','');form.className='qualification-review-form';
 form.innerHTML='<label>Decision<select name="decision"><option value="needs_changes">Request more information</option><option value="approved">Approve & Activate</option><option value="declined">Decline application</option></select></label><label class="application-check"><input type="checkbox" name="identity">I checked that the applicant owns the claimed identity.</label><label class="application-check"><input type="checkbox" name="affiliation">I independently confirmed the current institutional affiliation.</label><label class="application-check"><input type="checkbox" name="prc">Licensed route: I checked the PRC record and current credential details.</label><label class="application-check"><input type="checkbox" name="endorsement">Student-teacher/facilitator route: I confirmed the supervisor/organization endorsement.</label><label>Institution verification reference (admin only)<textarea name="affiliationReference" maxlength="500" placeholder="Record the independent contact method and result."></textarea></label><label>PRC or endorsement reference (only for those routes)<textarea name="credentialReference" maxlength="500" placeholder="Record the checked source/result, without unnecessary personal details."></textarea></label><label>Reason / next steps shown to the applicant<textarea name="reason" required minlength="5" maxlength="500"></textarea></label><button type="submit">Review &amp; confirm decision</button>';
 form.elements.decision.querySelector('option[value="approved"]').disabled=!emailVerified;
 if(application.applicantType==='school_teacher')for(const name of ['prc','endorsement','credentialReference'])form.elements[name].closest('label').hidden=true;
 if(application.applicantType==='licensed_teacher')form.elements.endorsement.closest('label').hidden=true;
 if(['student_teacher','facilitator'].includes(application.applicantType))form.elements.prc.closest('label').hidden=true;
 const group=(title,names)=>{const section=document.createElement('fieldset');section.className='qualification-step';add('legend',title,section);for(const name of names)section.append(form.elements[name].closest('label'));form.insertBefore(section,form.querySelector('button[type=submit]'));return section;};
 const verificationGroup=group('1. Verify the application',['identity','affiliation','prc','endorsement','affiliationReference','credentialReference']);
 const decisionGroup=group('2. Record your decision',['decision','reason']);
 if(focusedReview)form.elements.decision.closest('label').hidden=true;
 const optionalChecks=focusedReview?document.createElement('details'):null;
 if(optionalChecks){optionalChecks.className='qualification-optional-checks';add('summary','Add verification notes',optionalChecks);}
 const guidance=add('p','The teacher can read this reason.',decisionGroup);guidance.className='teacher-note';
 const decisionEffect=add('p','',decisionGroup);decisionEffect.className='qualification-decision-effect';decisionEffect.id='qualificationDecisionEffect';
 form.elements.reason.closest('label').before(decisionEffect);
 form.elements.reason.setAttribute('aria-describedby',decisionEffect.id);
 const choices=add('div','',decisionGroup);choices.className='qualification-decision-choices';
 let saving=false,saved=false,stale=false,uncertain=null,activationPending=false,activationUnknown=null,activationComplete=false,confirmedValues=null;
 const feedback=add('p','');feedback.className='qualification-form-feedback';feedback.setAttribute('role','status');feedback.tabIndex=-1;
 const reloadReview=add('button','Reload application');reloadReview.type='button';reloadReview.hidden=true;reloadReview.className='secondary';
 form.querySelector('button[type=submit]').before(feedback,reloadReview);
 const approvalEffect=profile.status==='active'?'Save the qualification approval. The account keeps its active status.'
  :`Save the qualification approval and ${profile.status==='inactive'?'restore':'grant'} classroom access. Each step is recorded in the account history.`;
 const accessEffect=profile.status==='active'?' The account will move to pending and classroom access will pause.':'';
 const effects={approved:approvalEffect,needs_changes:'Send your reason so the teacher can revise and resubmit.'+accessEffect,declined:'Send your reason and mark the application declined.'+accessEffect};
 const syncDecision=()=>{
  const value=form.elements.decision.value;
  decisionEffect.textContent=effects[value];
  for(const button of choices.children)button.setAttribute('aria-pressed',String(button.dataset.decision===value));
  const summary=form.querySelector('.qualification-verification-details > summary');
  const approving=value==='approved';
  if(summary)summary.textContent=decisionNames[value]+(focusedReview&&!approving?' – reason':' – checks and reason');
  if(optionalChecks){
   if(approving){decisionGroup.before(verificationGroup);optionalChecks.remove();}
   else{decisionGroup.after(optionalChecks);optionalChecks.append(verificationGroup);}
   verificationGroup.querySelector('legend').textContent=approving?'1. Verify the application':'Verification checks';
   decisionGroup.querySelector('legend').textContent=approving?'2. Record your decision':'Explain your decision';
  }
 };
 for(const [value,label]of Object.entries(decisionNames)){
  const choice=add('button',label,choices);choice.type='button';choice.dataset.decision=value;
  choice.disabled=value==='approved'&&!emailVerified;
  choice.addEventListener('click',()=>{
   form.elements.decision.value=value;
   if(!stale)feedback.textContent='';
   syncDecision();
   const verification=form.querySelector('.qualification-verification-details');
   if(verification)verification.open=true;
   (focusedReview&&value==='approved'?form.elements.identity:form.elements.reason).focus({preventScroll:document.body.dataset.adminView!=='applications'});
  });
 }
 if(document.body.dataset.adminView==='applications'){
  form.prepend(choices);root.insertBefore(form,(decisionHeading||layout).nextSibling);
  const verification=document.createElement('details');verification.className='qualification-verification-details';const summary=document.createElement('summary');summary.textContent='Verification checks & decision reason';verification.append(summary);
  for(const child of [...form.children])if(child!==choices)verification.append(child);form.append(verification);
  form.addEventListener('invalid',()=>{verification.open=true;},true);

 }
 syncDecision();
 form.elements.decision.addEventListener('change',syncDecision);
 form.addEventListener('input',()=>{if(!stale)feedback.textContent='';});
 const recovery=add('button','Check saved decision',next);recovery.type='button';recovery.hidden=true;recovery.className='secondary qualification-recovery-action';
 const active=()=>auth.currentUser===user&&root.isConnected;
 const lock=()=>{
  form.dataset.decisionState=saving?'saving':uncertain||activationUnknown?'unconfirmed':saved?'saved':'editing';
  const locked=saving||saved||!!uncertain;
  form.dataset.decisionLocked=String(locked);
  form.querySelectorAll('input,select,textarea,button').forEach(e=>e.disabled=locked||(!emailVerified&&e.dataset.decision==='approved')||(stale&&e.type==='submit'));
 };
 reloadReview.addEventListener('click',async()=>{
  if(saving||!active())return;
  saving=true;lock();
  try{await onReviewed({refreshOnly:true,userId:profile.id});}
  catch{if(active())feedback.textContent='Could not reload the application. Try again when connected.';}
  finally{saving=false;if(active())lock();}
 });
 const activateApproved=async()=>{
  activationPending=true;
  qualificationStage.textContent=statusNames.approved;
  showAccess(activationUnknown?'Activation unconfirmed':'Activation in progress','attention');
  nextStep.textContent='Qualification approval is saved.';
  notice.textContent='Qualifications approved. Activating account access...';
  try{
   if(activationUnknown){if(!await activationUnknown.checkDecision()){notice.textContent='Qualifications are approved. Activation is still unconfirmed. Check again; do not submit another activation.';recovery.hidden=false;recovery.textContent='Check activation result';return false;}activationUnknown=null;}
   else{
    const {profile:latest}=await loadAdminAccount(profile.id);if(!active())return false;
    if(latest.status!==profile.status||latest.teacherVerifiedRevision!==application.revision||latest.moderationEventId!==latest.teacherVerificationReviewId)throw Object.assign(Error('Account access changed after this review. Inspect the account and history before activating.'),{code:'admin/stale-activation'});
    if(latest.status!=='active')await moderateAccount({uid:profile.id,expectedStatus:latest.status,expectedRole:latest.role,expectedVersion:latest.updatedAt?.toMillis?.()||latest.createdAt?.toMillis?.()||0,status:'active',reason:confirmedValues.reason,identityVerified:confirmedValues.identity===true});
   }
   activationPending=false;activationComplete=true;recovery.hidden=true;showAccess(accessNames.active,'active');return true;
  }catch(error){if(active()){if(error.code==='admin/decision-unknown')activationUnknown=error;notice.textContent='Qualifications approved; account activation '+(activationUnknown?'is unconfirmed. ':'did not complete. ')+error.message;const blocked=['admin/stale-activation','admin/stale-account'].includes(error.code)||String(error.code||'').endsWith('permission-denied');showAccess(blocked?'Check current access':activationUnknown?'Activation unconfirmed':'Activation incomplete','attention');if(blocked){activationPending=false;notice.textContent+=' Refresh the saved review and inspect account history; this activation will not be retried automatically.';}recovery.textContent=blocked?'Refresh saved review':activationUnknown?'Check activation result':'Retry account activation';nextStep.textContent='Next: '+recovery.textContent+'.';recovery.hidden=false;}return false;}
 };
 const refreshSaved=async()=>{
  saved=true;uncertain=null;recovery.textContent='Refresh saved review';notice.textContent='Qualification decision saved with its audit record.';
  qualificationStage.textContent=statusNames[confirmedValues.decision];
  if(confirmedValues.decision!=='approved')showAccess(accessNames[profile.status==='inactive'?'inactive':'pending'],'pending');
  nextStep.textContent=activationComplete?'Qualifications approved. Classroom access is active.':'Refresh the review for the latest decision and next action.';
  try{await onReviewed({decision:form.elements.decision.value,userId:profile.id,activationComplete});}catch{if(active()){notice.textContent='Qualification decision saved with its audit record, but the view could not refresh. Refresh the saved review before another decision.';recovery.hidden=false;}}
 };
 recovery.addEventListener('click',async()=>{
  if(saving||!active())return;saving=true;recovery.disabled=true;lock();
  try{if(activationPending){if(await activateApproved())await refreshSaved();}else if(saved)await refreshSaved();else if(uncertain&&await uncertain.checkDecision()){saved=true;uncertain=null;if(confirmedValues.decision!=='approved'||await activateApproved())await refreshSaved();}else notice.textContent='The decision is still unconfirmed. Check again when connected; do not submit another review.';}
  catch(error){if(active())notice.textContent=error.message;}
  finally{saving=false;if(active()){recovery.disabled=false;lock();}}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(saving||saved||uncertain||stale)return;
  const values=Object.fromEntries(new FormData(form));for(const key of ['identity','affiliation','prc','endorsement'])values[key]=form.elements[key].checked;
  try{reviewFields(application,values);}catch(error){feedback.textContent=error.message;feedback.focus();return;}
  feedback.textContent='';
  const submitter=event.submitter;
  saving=true;lock();let confirmed=false;try{confirmed=await appConfirm(`${decisionNames[values.decision]} for ${application.legalName||profile.email||profile.id}?\n\n${effects[values.decision]}\n\nReason the teacher will see: ${String(values.reason||'').trim()}`,{title:'Confirm teacher review'});}catch(error){if(active())notice.textContent=error.message;}
  if(!confirmed||!active()){
   saving=false;
   if(active()){
    lock();
    if(form.contains(submitter))submitter.focus();
   }
   return;
  }
  confirmedValues=values;saving=true;lock();notice.textContent='Saving qualification decision...';
  try{await reviewTeacherApplication(profile.id,application.revision,profile.updatedAt?.toMillis?.()||profile.createdAt?.toMillis?.()||0,values);if(active()){saved=true;if(values.decision!=='approved'||await activateApproved())await refreshSaved();}}
  catch(error){if(active()){if(error.code==='admin/decision-unknown'){uncertain=error;notice.textContent=error.message;qualificationStage.textContent='Decision unconfirmed';recovery.hidden=false;recovery.focus();}else{stale=error.code==='admin/stale-review';reloadReview.hidden=!stale;feedback.textContent=error.message;feedback.focus();}}}
  finally{saving=false;if(active())lock();}
 });
}
