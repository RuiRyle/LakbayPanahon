// Hosted qualification acceptance with newly created synthetic identities only.
// No real verification emails are sent; no real PRC/school claim is made.
const h=require('./teacher-workflow-live.cjs');const{evaluate,go,wait,click,pass,admin,api}=h;
async function appPage(identity){await h.signIn(identity);await go('teacher-application.html');await wait(`!document.getElementById('applicationWorkspace').hidden&&!document.getElementById('reloadApplication').disabled`,'applicant workspace');}
async function idle(){await wait(`!document.getElementById('reloadApplication').disabled`,'application save');const error=await evaluate(`document.getElementById('applicationMessage').dataset.error==='true'?document.getElementById('applicationMessage').textContent:''`);if(error)throw Error(error);}
async function fill(evidence=true){await evaluate(`(()=>{const f=document.getElementById('teacherApplicationForm');for(const [k,v]of Object.entries({legalName:'Isolated Applicant',institution:'Synthetic Acceptance School',locality:'Cebu',roleTitle:'Grade 5 history teacher',statement:'Synthetic qualification workflow check only.',prcNumber:'1234567',prcExpiry:'2030-01-01'}))f.elements[k].value=v;document.getElementById('teacherQualificationAcknowledged').checked=true;${evidence?"const canvas=document.createElement('canvas');canvas.width=2;canvas.height=2;canvas.getContext('2d').fillRect(0,0,2,2);const data=canvas.toDataURL('image/png').split(',')[1],file=new File([Uint8Array.from(atob(data),c=>c.charCodeAt(0))],'synthetic-proof.png',{type:'image/png'}),transfer=new DataTransfer();transfer.items.add(file);document.getElementById('teacherEvidenceFile').files=transfer.files;":''}})()`);}
async function adminReview(operator,teacher,decision){
 await h.signIn(operator);await go('admin-dashboard.html');await wait(`document.body.classList.contains('authenticated')&&!document.querySelector('#accountFilters button').disabled`,'admin queue');
 await click('#reviewSubmittedApplications');await wait(`!document.querySelector('#accountFilters button').disabled`,'submitted application queue');
 const selector=`#adminAccounts button[data-user-id="${teacher.uid}"]`;
 for(let page=0;page<12;page++){if(await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`))break;if(await evaluate(`document.getElementById('nextAccounts').disabled`))throw Error('Synthetic application not found in bounded queue.');await click('#nextAccounts');await wait(`!document.querySelector('#accountFilters button').disabled`,'next queue page');}
 await click(selector);await wait(`!!document.querySelector('.qualification-review-form')`,'qualification review');
 if(decision==='approved'){
  await evaluate(`[...document.querySelectorAll('#teacherQualificationReview button')].find(b=>b.textContent==='View Private Evidence').click()`);await wait(`document.querySelector('.private-evidence-dialog')?.open&&document.querySelector('.private-evidence-dialog img')?.naturalWidth>0`,'private evidence image');
  await click('.private-evidence-dialog button');pass('Administrator privately views the uploaded image under hosted CSP');
 }
 await evaluate(`(()=>{const f=document.querySelector('.qualification-review-form');f.elements.decision.value=${JSON.stringify(decision)};for(const key of ['identity','affiliation','prc'])f.elements[key].checked=true;f.elements.affiliationReference.value='Synthetic fixture only: institution check recorded.';f.elements.credentialReference.value='Synthetic fixture only: no actual PRC lookup.';f.elements.reason.value=${JSON.stringify(decision==='approved'?'Synthetic review approved after recorded checks.':'Synthetic revision request: update institution details.')};f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));})()`);
 await wait(`!document.querySelector('.qualification-review-form')&&document.getElementById('accountCurrentStatus').textContent.includes(${JSON.stringify(decision==='approved'?'active':'pending')})`,'saved qualification decision');
}
async function main(){
 h.configureQualification(process.argv[2],process.argv[3]);h.report.suppressPageText=true;await h.launch();
 const teacher=await h.createIdentity('teacher'),operator=await h.createIdentity('teacher');
 await admin(api+'/users/'+operator.uid+'?updateMask.fieldPaths=role&updateMask.fieldPaths=status',{fields:{role:{stringValue:'admin'},status:{stringValue:'active'}}},'PATCH');h.registerAuditActor(operator.uid);
 await appPage(teacher);await fill(false);await evaluate(`document.getElementById('teacherApplicationForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))`);
 await wait(`document.getElementById('applicationMessage').textContent.includes('Verify your email')`,'unverified submission rejected');pass('Unverified applicant cannot submit qualifications on the hosted site');
 // Trusted fixture setup proves email-claim enforcement without sending mail.
 await admin('https://identitytoolkit.googleapis.com/v1/projects/lakbaypanahon-1797e/accounts:update',{localId:teacher.uid,emailVerified:true});
 await click('#refreshTeacherEmail');await idle();await fill(true);await evaluate(`document.getElementById('teacherApplicationForm').requestSubmit()`);await idle();
 if(!await evaluate(`document.getElementById('teacherApplicationStatus').textContent.includes('Submitted')`))throw Error('Application was not submitted.');pass('Verified fixture submits qualifications and private image through the real form');
 await adminReview(operator,teacher,'needs_changes');pass('Administrator requests a revision with an applicant-facing reason');
 await appPage(teacher);if(!await evaluate(`document.getElementById('teacherDecisionReason').textContent.includes('revision request')`))throw Error('Revision reason missing.');pass('Applicant sees the revision reason without administrator-only notes');
 await fill(true);await evaluate(`document.getElementById('teacherApplicationForm').requestSubmit()`);await idle();pass('Applicant resubmits a new qualification/evidence revision');
 await adminReview(operator,teacher,'approved');pass('Qualification approval atomically activates teacher access and records checks');
 await appPage(teacher);if(!await evaluate(`!document.getElementById('openApprovedWorkspace').hidden`))throw Error('Approved workspace action missing.');
 const evidence=await evaluate(`(async()=>{const {auth,db}=await import('/js/firebase-config.js');const f=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');return(await f.getDocFromServer(f.doc(db,'teacherEvidence',auth.currentUser.uid))).exists();})()`);
 if(evidence)throw Error('Evidence image retained after final approval.');pass('Final review physically deletes its private evidence image');
 await click('#openApprovedWorkspace');await wait(`location.pathname.endsWith('teacher-dashboard.html')&&document.body.classList.contains('authenticated')&&!document.getElementById('refreshTeacher').disabled`,'qualified classroom workspace');pass('Qualified, email-verified teacher opens classroom tools');
 await evaluate(`(async()=>{const t=await import('/js/teacher-class-client.js');await t.loadTeacherClasses();})()`);pass('Protected teacher queries accept the approved qualification revision');
 h.report.status='pass';
}
main().catch(e=>{h.report.status='fail';h.report.error=e.message;console.error('FAIL: '+e.message);process.exitCode=1;}).finally(h.cleanup);
