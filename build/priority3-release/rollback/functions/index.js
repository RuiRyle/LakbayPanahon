const {onCall,HttpsError}=require('firebase-functions/v2/https');
const options={region:'asia-southeast1',serviceAccount:'assessment-runtime@lakbaypanahon-1797e.iam.gserviceaccount.com',enforceAppCheck:process.env.FUNCTIONS_EMULATOR!=='true',maxInstances:10};
for(const name of ['startStudentAssessment','advanceStudentAssessment','resumeStudentAssessment','submitStudentActivity'])exports[name]=onCall(options,async()=>{throw new HttpsError('unavailable','Assessment saving is temporarily unavailable. Your earned progress is safe.');});
