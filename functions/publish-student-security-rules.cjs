// Review/guarded publication of only the three student-hardening rule blocks.
// No Firestore document access, account creation, or frontend deployment.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const normalize=value=>value.replace(/\r\n/g,'\n').trim();
const markers=['    match /studentLearningDrafts/{draftId} {','    match /studentQuizAttempts/{attemptId} {','match /studentPracticeProgress/{progressId} {'];
function splitScopes(source){
 const spans=markers.map(marker=>{
  const start=source.indexOf(marker);if(start<0||source.indexOf(marker,start+1)>=0)throw Error('Missing or duplicate reviewed scope: '+marker);
  const open=start+marker.length-1;let depth=0,quote=null;
  for(let i=open;i<source.length;i++){
   const c=source[i];if(quote){if(c==='\\')i++;else if(c===quote)quote=null;continue;}
   if(c==='"'||c==="'"){quote=c;continue;}
   if(c==='{')depth++;if(c==='}'&&!--depth)return{start,end:i+1,marker,text:source.slice(start,i+1)};
  }
  throw Error('Unclosed reviewed scope');
 });
 let outside=source;for(const span of [...spans].sort((a,b)=>b.start-a.start))outside=outside.slice(0,span.start)+'REVIEWED_SCOPE:'+span.marker+outside.slice(span.end);
 return{spans,outside};
}
async function main(){
 if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Original project only.');
 const source=fs.readFileSync(path.join(root,'firestore.rules'),'utf8'),local=normalize(source),localParts=splitScopes(local);
 const apply=process.argv.includes('--publish');
 if(!apply&&!process.argv.includes('--compare')){console.log('Use --compare for read-only live rule comparison. --publish requires a matching successful verification and comparison.');return;}
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));
 const account=cli.getProjectDefaultAccount(root);if(!account)throw Error('Firebase CLI login required');
 const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const base='https://firebaserules.googleapis.com/v1/projects/lakbaypanahon-1797e';
 async function call(url,body,method=body?'POST':'GET'){
  const response=await fetch(url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000)});
  const result=await response.json();if(!response.ok)throw Error('Rules API '+response.status+': '+(result.error?.message||'Request failed'));return result;
 }
 const release=await call(base+'/releases/cloud.firestore');
 const ruleset=await call('https://firebaserules.googleapis.com/v1/'+release.rulesetName);
 if(ruleset.source.files.length!==1||ruleset.source.files[0].name!=='firestore.rules')throw Error('Unexpected live rule source layout. Review manually.');
 const before=normalize(ruleset.source.files[0].content),liveParts=splitScopes(before);
 const outsideScopeMatches=localParts.outside===liveParts.outside;
 const comparison={mode:'read-only-live-rule-comparison',checkedAt:new Date().toISOString(),sourceHash:hash(source),liveHash:hash(before),releaseName:release.name,rulesetName:release.rulesetName,outsideScopeMatches,
  scopes:localParts.spans.map((s,i)=>({marker:s.marker,changed:s.text!==liveParts.spans[i].text,beforeHash:hash(liveParts.spans[i].text),afterHash:hash(s.text)}))};
 const reportFile=path.join(root,'docs/validation/student-security-rules-comparison-2026-10-30.json');
 if(!apply){fs.writeFileSync(reportFile,JSON.stringify(comparison,null,2));console.log(JSON.stringify(comparison,null,2));if(!outsideScopeMatches)process.exitCode=1;return;}
 const reviewed=JSON.parse(fs.readFileSync(reportFile,'utf8'));
 const verification=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/student-security-rules-2026-10-30.json'),'utf8'));
 if(!outsideScopeMatches||!reviewed.outsideScopeMatches||reviewed.liveHash!==comparison.liveHash||reviewed.sourceHash!==hash(source))throw Error('Live/local rules changed or differ outside the reviewed scopes. Compare and review again.');
 const {cases}=require('../tests/fixtures/student-security-rules-cases.cjs');
 if(verification.sourceHash!==hash(source)||verification.issues.some(i=>i.severity==='ERROR')||verification.tests.length!==cases.length||verification.tests.some(t=>t.state!=='SUCCESS'))throw Error('Matching successful server verification is required.');
 if(before===local){console.log('Reviewed rules are already active.');return;}
 const stamp=Date.now(),backupFile=path.join(root,'backups','student-security-rules-'+stamp+'.json');
 fs.mkdirSync(path.dirname(backupFile),{recursive:true});fs.writeFileSync(backupFile,JSON.stringify({release,ruleset},null,2),{flag:'wx'});
 const created=await call(base+'/rulesets',{source:{files:[{name:'firestore.rules',content:source}]}});
 const latest=await call(base+'/releases/cloud.firestore');
 if(latest.rulesetName!==release.rulesetName)throw Error('Live rule release changed during publication. The new ruleset was not activated.');
 await call(base+'/releases/cloud.firestore?updateMask=rulesetName',{release:{name:release.name,rulesetName:created.name},updateMask:'rulesetName'},'PATCH');
 const after=await call(base+'/releases/cloud.firestore');
 if(after.rulesetName!==created.name)throw Error('Rule release readback differs; inspect the live release.');
 const readback=await call('https://firebaserules.googleapis.com/v1/'+after.rulesetName);
 if(normalize(readback.source.files[0].content)!==local)throw Error('Published source readback differs.');
 const evidence={mode:'published-and-read-back',publishedAt:new Date().toISOString(),sourceHash:hash(source),previousRuleset:release.rulesetName,rulesetName:after.rulesetName,backup:path.relative(root,backupFile).replaceAll('\\','/'),scopes:comparison.scopes};
 fs.writeFileSync(path.join(root,'docs/validation/student-security-rules-publication-2026-10-30.json'),JSON.stringify(evidence,null,2));
 console.log(JSON.stringify(evidence,null,2));
}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={splitScopes,normalize};
