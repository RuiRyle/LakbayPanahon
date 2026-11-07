
const { onCall, HttpsError } = require(
    "firebase-functions/v2/https"
);

const { initializeApp } = require(
    "firebase-admin/app"
);

const { getFirestore } = require(
    "firebase-admin/firestore"
);

initializeApp();

const {FieldValue}=require('firebase-admin/firestore');
const {assessmentHandlers}=require('./assessment-callables');
const assessment=assessmentHandlers(getFirestore(),()=>FieldValue.serverTimestamp());
// Proposed dedicated production identity. Provisioning/IAM require separate
// approval; never silently run new reward authority as the legacy Editor SA.
const assessmentOptions={region:'asia-southeast1',serviceAccount:'assessment-runtime@lakbaypanahon-1797e.iam.gserviceaccount.com',enforceAppCheck:process.env.FUNCTIONS_EMULATOR!=='true',maxInstances:10};
exports.startStudentAssessment=onCall(assessmentOptions,assessment.start);
exports.advanceStudentAssessment=onCall(assessmentOptions,assessment.advance);
exports.resumeStudentAssessment=onCall(assessmentOptions,assessment.resume);
exports.submitStudentActivity=onCall(assessmentOptions,assessment.submit);

