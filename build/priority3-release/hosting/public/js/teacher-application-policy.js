export const EVIDENCE_MAX_BYTES=250*1024;
export const EVIDENCE_DAYS=30;
export const APPLICANT_LABELS={school_teacher:'School-affiliated teacher',licensed_teacher:'Licensed teacher',student_teacher:'Student teacher',facilitator:'Learning facilitator'};
export function applicationFields(values,submit=false){
 const result={};
 for(const [key,max]of Object.entries({legalName:100,institution:150,locality:100,roleTitle:100,officialWebsite:250,workEmail:150,prcNumber:12,sponsorName:100,sponsorContact:150,statement:1500})){
  result[key]=String(values[key]||'').trim();if(result[key].length>max)throw Error(`${key} is too long.`);
 }
 result.applicantType=values.applicantType;
 if(!APPLICANT_LABELS[result.applicantType])throw Error('Choose your application route.');
 result.prcExpiry=String(values.prcExpiry||'');
 if(result.officialWebsite&&!/^https:\/\/[^\s]+$/.test(result.officialWebsite))throw Error('Use an HTTPS institution website address.');
 if(submit){
  for(const key of ['legalName','institution','roleTitle'])if(!result[key])throw Error('Complete your name, institution and teaching role.');
  if(!values.acknowledged)throw Error('Read and acknowledge the qualification-data notice.');
  if(result.applicantType==='licensed_teacher'){
   if(!/^\d{4,12}$/.test(result.prcNumber)||!/^\d{4}-\d{2}-\d{2}$/.test(result.prcExpiry))throw Error('Enter your PRC registration number and expiry date.');
   if(new Date(result.prcExpiry+'T23:59:59+08:00').getTime()<Date.now())throw Error('The declared PRC expiry date has passed. Update your credentials before submitting.');
  }else if(result.applicantType!=='school_teacher'&&(!result.sponsorName||!result.sponsorContact))throw Error('Provide the endorsing supervisor and their work contact.');
 }
 if(result.applicantType==='school_teacher'){result.prcNumber='';result.prcExpiry='';result.sponsorName='';result.sponsorContact='';}
 result.acknowledged=values.acknowledged===true;return result;
}
export function reviewFields(application,values){
 const decision=values.decision;if(!['approved','needs_changes','declined'].includes(decision))throw Error('Choose a review decision.');
 const reason=String(values.reason||'').trim();if(reason.length<5||reason.length>500)throw Error('Enter a reason between 5 and 500 characters.');
 const checks={identity:values.identity===true,affiliation:values.affiliation===true,prc:values.prc===true,endorsement:values.endorsement===true};
 const affiliationReference=String(values.affiliationReference||'').trim(),credentialReference=String(values.credentialReference||'').trim();
 if(affiliationReference.length>500||credentialReference.length>500)throw Error('Verification references must be 500 characters or fewer.');
 if(decision==='approved'){
  if(!application.emailVerified)throw Error('The application must be submitted with a verified email.');
  if(!checks.identity||!checks.affiliation||affiliationReference.length<5)throw Error('Record identity and independent institution verification.');
  if(application.applicantType!=='school_teacher'){
   if(application.applicantType==='licensed_teacher'?!checks.prc:!checks.endorsement)throw Error('Complete the PRC or endorsement check for this route.');
   if(credentialReference.length<5)throw Error('Record the PRC result or supervisor endorsement reference.');
  }
 }
 return{decision,reason,checks,affiliationReference,credentialReference};
}
export function safeEvidence(file){
 if(!file||!['image/jpeg','image/png'].includes(file.type)||file.size<1||file.size>EVIDENCE_MAX_BYTES)throw Error('Choose one JPG or PNG image up to 250 KB. Redact unrelated personal details first.');
 return true;
}
