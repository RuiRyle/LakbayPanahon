// Content-only atomic publication. Offline by default; no learner records or policy changes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{isDeepStrictEqual:equal}=require('node:util');
const {encode,decode}=require('./apply-chapter1-mission1-learning-polish.cjs');
const root=path.resolve(__dirname,'..'),planFile=path.join(root,'data/balangay-clarity-migration.json');
const sceneFields=['title','content','keyTerm','keyTermDefinition','exploreIntroduction','exploreItems','learningHelp','discoveryTitle','discoveryText','sourceUrls','contentReviewStatus'];
const assessmentFields=['question','optionA','optionB','optionC','optionD','explanation','answerExplanations','historicalClue','learningPoint','sourceUrls','contentReviewStatus'];
function validatePlan(plan){
 if(plan.projectId!=='lakbaypanahon-1797e'||!Array.isArray(plan.writes)||plan.writes.length!==36||new Set(plan.writes.map(w=>w.path)).size!==36)throw Error('Expected 36 existing Balangay curriculum documents.');
 let missions=0,scenes=0,main=0,practice=0;
 for(const w of plan.writes){const old=w.expected,patch=w.fields;if(w.create!==false||!old||!patch||old.status!=='active')throw Error('Existing active content guard required.');let allowed;
  if(w.path==='missions/chapter3-mission1'){missions++;allowed=['introduction','learningObjective','learningObjectives','lessonRecap','sourceUrls','contentReviewStatus'];if(old.chapterId!=='chapter-3'||old.xpReward!==100)throw Error('Mission identity/reward guard missing.');}
  else if(/^storyScenes\/chapter3-mission1-scene[1-5]$/.test(w.path)){scenes++;allowed=sceneFields;if(old.missionId!=='chapter3-mission1'||old.order!==Number(w.path.at(-1))||!Array.isArray(old.reviewTopics))throw Error('Scene identity guard missing.');}
  else if(w.path.startsWith('questions/chapter3-quiz1-question')){main++;allowed=assessmentFields;if(old.quizId!=='chapter3-quiz1'||!['easy','medium','hard'].includes(old.difficulty))throw Error('Quiz identity guard missing.');}
  else if(/^practiceQuestions\/chapter3-mission1-[a-z-]+-practice[12]$/.test(w.path)){practice++;allowed=[...assessmentFields,'hint','answerHints'];if(old.missionId!=='chapter3-mission1'||!old.reviewEvidencePolicy)throw Error('Practice identity/evidence-policy guard missing.');}
  else throw Error('Out-of-scope document: '+w.path);
  if(!Object.keys(patch).length||Object.keys(patch).some(k=>!allowed.includes(k)))throw Error('Forbidden field update: '+w.path);
  const absent=w.expectedAbsent||[];if(Object.keys(patch).some(k=>!Object.hasOwn(old,k)&&!absent.includes(k))||absent.some(k=>Object.hasOwn(old,k)||!Object.hasOwn(patch,k)))throw Error('Incomplete field baseline: '+w.path);
  if(w.path.startsWith('questions/')||w.path.startsWith('practiceQuestions/')){if(!['A','B','C','D'].includes(old.correctAnswer)||typeof old.topic!=='string')throw Error('Answer/topic identity missing');const options=['A','B','C','D'].map(k=>patch['option'+k]);if(options.some(v=>typeof v!=='string'||!v.trim())||new Set(options).size!==4||['A','B','C','D'].some(k=>!patch.answerExplanations?.[k]))throw Error('Incomplete question/feedback');}
  encode(old);encode(patch);
 }
 if(missions!==1||scenes!==5||main!==20||practice!==10)throw Error('Wrong content scope counts.');return true;
}
function compareDocument(w,current){if(!current)throw Error('Missing content: '+w.path);const matches=obj=>Object.entries(obj).every(([k,v])=>Object.hasOwn(current,k)&&equal(v,current[k]));if(matches({...w.expected,...w.fields}))return 'already-applied';if(!matches(w.expected)||(w.expectedAbsent||[]).some(k=>Object.hasOwn(current,k)))throw Error('Content changed since review: '+w.path);return 'pending';}
const decoded=doc=>doc?Object.fromEntries(Object.entries(doc.fields||{}).map(([k,v])=>[k,decode(v)])):null;
async function main(){
 const flags=process.argv.slice(2);if(flags.length>1||flags.some(f=>!['--check-local','--dry-run-live','--apply'].includes(f)))throw Error('Use --check-local, --dry-run-live or --apply.');
 const mode=flags[0]||'--check-local',plan=JSON.parse(fs.readFileSync(planFile,'utf8'));validatePlan(plan);
 if(mode==='--check-local'){const d=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/learning-content-snapshot-2026-10-31.json'),'utf8')).collections;const states=plan.writes.map(w=>{const [name,id]=w.path.split('/'),row=d[name].find(r=>r.id===id),{id:unused,...current}=row;return compareDocument(w,current);});console.log(JSON.stringify({mode,documents:states.length,pending:states.filter(s=>s==='pending').length}));return;}
 if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Original project only');const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(root);if(!account)throw Error('Existing CLI login required');const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const base='https://firestore.googleapis.com/v1/projects/'+plan.projectId+'/databases/(default)/documents',headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 async function call(url,body){const r=await fetch(url,{headers,...(body?{method:'POST',body:JSON.stringify(body)}:{})});if(r.status===404)return null;const data=await r.json();if(!r.ok)throw Error('Content request HTTP '+r.status);return data;}
 const read=async()=>{const docs=[];for(let i=0;i<plan.writes.length;i+=12)docs.push(...await Promise.all(plan.writes.slice(i,i+12).map(w=>call(base+'/'+w.path))));return docs;};
 const before=await read(),writes=[],backup=[];
 plan.writes.forEach((w,index)=>{const current=before[index];if(compareDocument(w,decoded(current))==='already-applied')return;backup.push({path:w.path,document:current});writes.push({update:{name:current.name,fields:Object.fromEntries(Object.entries(w.fields).map(([k,v])=>[k,encode(v)]))},updateMask:{fieldPaths:Object.keys(w.fields)},currentDocument:{updateTime:current.updateTime}});});
 console.log(JSON.stringify({mode,reviewedDocuments:plan.writes.length,pending:writes.length}));if(mode!=='--apply')return;
 let backupFile=null;if(writes.length){backupFile=path.join(root,'backups','balangay-clarity-'+Date.now()+'.json');fs.writeFileSync(backupFile,JSON.stringify(backup,null,2),{flag:'wx'});await call(base+':commit',{writes});}
 const after=await read();for(const [i,w]of plan.writes.entries())if(compareDocument(w,decoded(after[i]))!=='already-applied')throw Error('Publication readback mismatch');
 const evidence={mode:'published-and-read-back',publishedAt:new Date().toISOString(),projectId:plan.projectId,reviewedDocuments:36,changedDocuments:writes.length,backup:backupFile?path.relative(root,backupFile):null,planHash:crypto.createHash('sha256').update(fs.readFileSync(planFile)).digest('hex'),preserved:['mission IDs and order','topic IDs and coverage','correct-answer letters','difficulty and evidence policies','route activity and decisions','XP, completion and learner records'],note:'Authored content revision; independent teaching and learner review pending.'};
 fs.writeFileSync(path.join(root,'docs/validation/balangay-clarity-publication-2026-10-31.json'),JSON.stringify(evidence,null,2));console.log('Verified all 36 planned documents. No learner records changed.');
}
module.exports={validatePlan,compareDocument};if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
