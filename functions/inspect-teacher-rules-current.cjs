// Read-only live rules inspection plus local review artifacts. Never publishes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {scopes}=require('./prepare-teacher-rules-review.cjs');
const root=path.resolve(__dirname,'..'),project='lakbaypanahon-1797e',hash=s=>crypto.createHash('sha256').update(s).digest('hex');
(async()=>{
 const auth=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=auth.getProjectDefaultAccount(root);if(!account)throw Error('Firebase CLI owner session required.');const token=(await auth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 async function get(url){const r=await fetch(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Read-only rules lookup HTTP '+r.status);return r.json();}
 const release=await get('https://firebaserules.googleapis.com/v1/projects/'+project+'/releases/cloud.firestore'),ruleset=await get('https://firebaserules.googleapis.com/v1/'+release.rulesetName),live=ruleset.source.files.find(f=>f.name==='firestore.rules')?.content;if(!live)throw Error('Live source missing');
 const candidate=fs.readFileSync(path.join(root,'firestore.rules'),'utf8'),normalize=s=>s.replace(/\r\n/g,'\n'),before=scopes(normalize(live)),after=scopes(normalize(candidate));
 const changed=[...new Set([...before.result.keys(),...after.result.keys()])].filter(k=>before.result.get(k)!==after.result.get(k));
 const directory=fs.mkdtempSync(path.join(root,'build/teacher-rules-readiness-'));fs.writeFileSync(path.join(directory,'live-firestore.rules'),live);fs.writeFileSync(path.join(directory,'candidate-firestore.rules'),candidate);
 const features=['classJoinCodes','classFeedback','teacherSupportNotes','classHelpRequests','classReviewAssignments','classReviewReflections','classmates'];
 const matches=(source,name)=>new RegExp('match\\s+/[^\\n]*'+name+'/').test(source);
 const report={mode:'read-only-live-comparison; candidate prepared, not validated for activation',preparedAt:new Date().toISOString(),project,liveRuleset:release.rulesetName,liveSourceHash:hash(live),candidateSourceHash:hash(candidate),matchesLive:hash(live)===hash(candidate),outsideScopeMatches:before.outside===after.outside,changedScopes:changed,features:features.map(name=>({name,live:matches(live,name),candidate:matches(candidate,name)})),candidateDirectory:path.relative(root,directory).replaceAll('\\','/'),deploymentPerformed:false,pending:['Fresh complete permission tests against this exact candidate hash','Review candidate and backup before activation','Publish only after release authorization','Real teacher/student acceptance with authorized accounts']};
 fs.writeFileSync(path.join(directory,'review.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(root,'docs/validation/teacher-current-rules-review-2026-11-05.json'),JSON.stringify(report,null,2));
 const markdown='# Teacher rules comparison — November 5, 2026\n\nRead-only comparison against the actual currently published rules. Nothing published. Candidate is prepared for review, not yet validated for activation.\n\n'+changed.map(key=>'## '+key+'\n\nPublished:\n```\n'+(before.result.get(key)||'(absent)')+'\n```\n\nCandidate:\n```\n'+(after.result.get(key)||'(absent)')+'\n```\n').join('\n');fs.writeFileSync(path.join(root,'docs/teacher-current-rules-review-2026-11-05.md'),markdown);
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
