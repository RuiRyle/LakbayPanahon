'use strict';
// LOCAL PROOF ENTRY ONLY. Deliberately refuses production activation.
if(process.env.GCLOUD_PROJECT!=='demo-lakbaypanahon'||!/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST||'')||!/^127\.0\.0\.1:\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST||''))throw Error('Local demo proof only; no production deployment approved');
if(process.env.FUNCTIONS_EMULATOR==='true')throw Error('App Check must remain enforced in this proof');
exports.handler=require('../bridge.cjs').createHandler(require('../service/index.js'));
