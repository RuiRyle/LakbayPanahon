// LOCAL-ONLY proof entrypoint. Test fixtures and metrics MUST NOT be deployed.
import {initializeApp} from '../../build/priority3-stage0-release/functions/node_modules/firebase-admin/lib/app/index.js';
import {getAuth} from '../../build/priority3-stage0-release/functions/node_modules/firebase-admin/lib/auth/index.js';
import {getAppCheck} from '../../build/priority3-stage0-release/functions/node_modules/firebase-admin/lib/app-check/index.js';
import core from '../priority3-netlify/service/student-assessment.js';
import {restStore} from './rest-store.mjs';
import fixture from './.local-state/trust.json';
const methods={startStudentAssessment:'start',advanceStudentAssessment:'advance',resumeStudentAssessment:'resume',submitStudentActivity:'submit'};
let app;const totals=[];
function initialize(env){if(env.LOCAL_ONLY!=='1')throw Error('Local only');process.env.GCLOUD_PROJECT='demo-lakbaypanahon';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';process.env.GCE_METADATA_HOST='127.0.0.1:9';if(!app){app=initializeApp({projectId:'demo-lakbaypanahon'});getAppCheck(app).appCheckTokenVerifier.signatureVerifier.keyFetcher.fetchPublicKeys=async()=>({'local-proof':fixture.publicKey});}}
export default{async fetch(request,env){initialize(env);const url=new URL(request.url),name=url.pathname.split('/').at(-1);if(name==='health')return Response.json({local:true});if(name==='metrics')return Response.json(totals);
 const metric={name,firestoreRequests:0,reads:0,writes:0,deletes:0,transactionAttempts:0,retries:0},start=performance.now();let status=200,body;
 try{if(!methods[name])throw Object.assign(Error('NOT_FOUND'),{http:404});if(request.method!=='POST')throw Object.assign(Error('INVALID_ARGUMENT'),{http:400});if(request.headers.get('origin')&&request.headers.get('origin')!=='https://lakbaypanahon-1797e.web.app')throw Object.assign(Error('PERMISSION_DENIED'),{http:403});
 const raw=await request.text();if(new TextEncoder().encode(raw).length>65536)throw Object.assign(Error('INVALID_ARGUMENT'),{http:413});const payload=JSON.parse(raw);if(!payload||Object.keys(payload).join()!=='data')throw Object.assign(Error('INVALID_ARGUMENT'),{http:400});
 let identity;try{const token=request.headers.get('authorization')?.match(/^Bearer ([^,]+)$/i)?.[1];if(!token)throw Error('Missing Auth');identity=await getAuth(app).verifyIdToken(token,true);await getAppCheck(app).verifyToken(request.headers.get('x-firebase-appcheck')||'');}catch{throw Object.assign(Error('UNAUTHENTICATED'),{http:401});}
 const service=core.createAssessmentService(restStore(metric));body={result:await service[methods[name]](identity.uid,payload.data)};
 }catch(e){status=e.http||(/^assessment\//.test(e.code||'')?(/forbidden|locked/.test(e.code)?403:/invalid|unissued/.test(e.code)?400:/rate-limit/.test(e.code)?429:412):503);body={error:{status:status===401?'UNAUTHENTICATED':status===503?'UNAVAILABLE':'FAILED_PRECONDITION',message:e.code||e.message,details:{assessmentCode:e.code}}};}
 metric.status=status;metric.wallMs=performance.now()-start;totals.push(metric);return Response.json(body,{status,headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'https://lakbaypanahon-1797e.web.app'}});
}};
