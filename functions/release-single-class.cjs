// Scoped existing-membership migration and rules release. Default: inspect only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {decode,encode}=require('./apply-chapter1-mission1-learning-polish.cjs');
const root=path.resolve(__dirname,'..'),project='lakbaypanahon-1797e';
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const normalize=s=>s.replace(/\r\n/g,'\n').trim();
const decodeDoc=d=>Object.fromEntries(Object.entries(d.fields||{}).filter(([k])=>['userId','classId','status'].includes(k)).map(([k,v])=>[k,decode(v)]));
async function main(){
 const mode=process.argv[2]||'--inspect';if(!['--inspect','--apply'].includes(mode)||process.argv.length>3)throw Error('Use --inspect or --apply.');
 if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Original project only.');
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),a=cli.getProjectDefaultAccount(root);
 if(!a)throw Error('Firebase CLI login required.');
 const token=(await cli.getAccessToken(a.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 async function call(url,body,method=body?'POST':'GET'){
  const r=await fetch(url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000)});
  if(r.status===404)return null;const d=await r.json();if(!r.ok)throw Error('API '+r.status+' '+(d.error?.message||''));return d;
 }
 const api='https://firebaserules.googleapis.com/v1/projects/'+project,db='https://firestore.googleapis.com/v1/projects/'+project+'/databases/(default)/documents';
 let source=fs.readFileSync(path.join(root,'firestore.rules'),'utf8'),local=normalize(source);
 const release=await call(api+'/releases/cloud.firestore'),ruleset=await call('https://firebaserules.googleapis.com/v1/'+release.rulesetName);
 if(ruleset.source.files.length!==1)throw Error('Unexpected rules layout.');
 const before=normalize(ruleset.source.files[0].content);
 const start=local.indexOf('    // One reservation per Auth UID'),end=local.indexOf('    match /classMembers/{membershipId} {',start);
 const guard="        && getAfter(/databases/$(database)/documents/studentClassSlots/$(request.auth.uid)).data.classId == request.resource.data.classId\n";
 if(start<0||end<start||!local.includes(guard))throw Error('Missing reviewed single-class scope.');
 const original=local.slice(0,start)+local.slice(end),baseline=original.replace(guard,'');
 if(before!==baseline&&before!==local){
 const unrelated=["      // A create-only transaction must be able to confirm its reserved ID is absent.\n",...['classAssignments','classReviewAssignments','classAnnouncements'].map(name=>"      allow get: if activeTeacher() && !exists(/databases/$(database)/documents/"+name+"/$(assignmentId));\n")];
 unrelated[3]="      allow get: if activeTeacher() && !exists(/databases/$(database)/documents/classAnnouncements/$(announcementId));\n";
 let reduced=baseline;for(const line of unrelated)reduced=reduced.replace(line,'');
 let reducedCandidate=source;for(const line of unrelated)reducedCandidate=reducedCandidate.replace(line,'');
 if(reduced===before||normalize(reducedCandidate)===before){source=reducedCandidate;local=normalize(source);}
 }
 if(before!==normalize(local.slice(0,local.indexOf('    // One reservation per Auth UID'))+local.slice(local.indexOf('    match /classMembers/{membershipId} {',local.indexOf('    // One reservation per Auth UID')))).replace(guard,'')&&before!==local){fs.mkdirSync(path.join(root,'build/single-class-review'),{recursive:true});fs.writeFileSync(path.join(root,'build/single-class-review/live.rules'),before);fs.writeFileSync(path.join(root,'build/single-class-review/expected-baseline.rules'),baseline);throw Error('Live rules differ outside the single-class change. Review build/single-class-review before release.');}
 fs.mkdirSync(path.join(root,'build/single-class-review'),{recursive:true});fs.writeFileSync(path.join(root,'build/single-class-review/candidate.rules'),source);
 const response=await call(db+':runQuery',{structuredQuery:{from:[{collectionId:'classMembers'}],where:{fieldFilter:{field:{fieldPath:'status'},op:'EQUAL',value:{stringValue:'active'}}},limit:1001}});
 const documents=response.filter(row=>row.document).map(row=>row.document);
 if(documents.length>1000)throw Error('Membership review exceeds bounded migration; paginate explicitly.');
 const groups=new Map();
 for(const document of documents){const m=decodeDoc(document);if(typeof m.userId!=='string'||typeof m.classId!=='string'||m.userId.includes('/')||m.classId.includes('/')||document.name.split('/').at(-1)!==m.userId+'_'+m.classId)throw Error('Malformed existing membership needs review.');if(!groups.has(m.userId))groups.set(m.userId,[]);groups.get(m.userId).push(m.classId);}
 const duplicates=[...groups].filter(([,ids])=>ids.length>1);
 const writes=[],slots=[];
 for(const [uid,ids]of groups){const slot=await call(db+'/studentClassSlots/'+uid);slots.push({uid,document:slot});if(ids.length!==1)continue;if(slot){if(decodeDoc(slot).classId!==ids[0])throw Error('Existing class reservation differs; review migration.');}else writes.push({update:{name:`projects/${project}/databases/(default)/documents/studentClassSlots/${uid}`,fields:{classId:encode(ids[0])}},currentDocument:{exists:false}});}
 const report={checkedAt:new Date().toISOString(),mode,sourceHash:hash(source),liveRuleset:release.rulesetName,liveRulesMatch:before===local?'already-active':'baseline-matches',activeMemberships:documents.length,students:groups.size,multipleClassStudents:duplicates.length,reservationsToSeed:writes.length};
 fs.writeFileSync(path.join(root,'docs/validation/student-single-class-readiness-2026-11-10.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 if(duplicates.length){fs.writeFileSync(path.join(root,'backups/single-class-conflicts-'+Date.now()+'.json'),JSON.stringify({duplicates},null,2),{flag:'wx'});throw Error('Existing students have multiple classes; keep choices require review. No changes made.');}
 if(mode!=='--apply')return;
 const check=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/student-single-class-rules-2026-11-10.json'),'utf8'));
 if(check.sourceHash!==hash(source)||check.issues.some(i=>i.severity==='ERROR')||check.tests.length!==require('../tests/fixtures/single-class-rules-cases.cjs').cases.length||check.tests.some(t=>t.state!=='SUCCESS'))throw Error('Matching successful Rules API checks required.');
 if(writes.length>400)throw Error('Migration exceeds single bounded commit.');
 const backup='backups/single-class-release-'+Date.now()+'.json';fs.writeFileSync(path.join(root,backup),JSON.stringify({release,ruleset,memberships:documents,slots},null,2),{flag:'wx'});
 if(writes.length)await call(db+':commit',{writes});
 for(const [uid,ids]of groups){const slot=await call(db+'/studentClassSlots/'+uid);if(!slot||decodeDoc(slot).classId!==ids[0])throw Error('Reservation readback mismatch.');}
 if(before!==local){
  const created=await call(api+'/rulesets',{source:{files:[{name:'firestore.rules',content:source}]}});
  const latest=await call(api+'/releases/cloud.firestore');if(latest.rulesetName!==release.rulesetName)throw Error('Rules changed during preparation; activation stopped.');
  await call(api+'/releases/cloud.firestore?updateMask=rulesetName',{release:{name:release.name,rulesetName:created.name},updateMask:'rulesetName'},'PATCH');
 }
 const after=await call(api+'/releases/cloud.firestore'),readback=await call('https://firebaserules.googleapis.com/v1/'+after.rulesetName);
 if(normalize(readback.source.files[0].content)!==local)throw Error('Published rules readback mismatch.');
 fs.writeFileSync(path.join(root,'docs/validation/student-single-class-publication-2026-11-10.json'),JSON.stringify({...report,mode:'published-and-read-back',publishedAt:new Date().toISOString(),ruleset:after.rulesetName,seededReservations:writes.length,backup,membershipsDeleted:0,learningRecordsChanged:false},null,2));
 console.log('PASS: reservations and single-class rules published/read back. No memberships deleted.');
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
