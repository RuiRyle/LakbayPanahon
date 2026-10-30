// Inactive cutover candidate only. Never overwrites or publishes firestore.rules.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const collections=['studentProgress','studentChapterProgress','studentDailyChallenges','studentArtifacts','studentBadges','studentQuizAttempts'];
function changeBlock(source,marker,transform){
 const start=source.indexOf(marker);if(start<0||source.indexOf(marker,start+1)>=0)throw Error('Missing/duplicate reviewed rule block: '+marker);
 const open=start+marker.length-1;let depth=0,quote=null;
 for(let i=open;i<source.length;i++){
  const c=source[i];if(quote){if(c==='\\')i++;else if(c===quote)quote=null;continue;}
  if(c==='"'||c==="'"){quote=c;continue;}
  if(c==='{')depth++;if(c==='}'&&!--depth)return source.slice(0,start)+transform(source.slice(start,i+1))+source.slice(i+1);
 }
 throw Error('Unclosed reviewed rule block');
}
function buildCandidate(source){
 let candidate=changeBlock(source,'function rewardUpdate() {',()=> 'function rewardUpdate() { return false; }');
 for(const collection of collections){
  const marker=new RegExp('match /'+collection+'/\\{[^}]+\\} \\{').exec(candidate)?.[0];if(!marker)throw Error('Missing reviewed collection '+collection);
  candidate=changeBlock(candidate,marker,block=>{
   let count=0;const replacement=block.replace(/allow\s+(?:create|update|delete)(?:\s*,\s*(?:create|update|delete))*\s*:\s*if[\s\S]*?;/g,()=>{count++;return 'allow create, update, delete: if false;';});
   if(!count)throw Error('No reviewed write rule in '+collection);return replacement;
  });
 }
 return '// INACTIVE TRUSTED-ASSESSMENT CUTOVER CANDIDATE. Review with backend/frontend/key migration.\n'+candidate;
}
function main(){
 const source=fs.readFileSync(path.join(root,'firestore.rules'),'utf8'),candidate=buildCandidate(source);
 fs.mkdirSync(path.join(root,'build'),{recursive:true});const folder=fs.mkdtempSync(path.join(root,'build/student-assessment-'));
 fs.writeFileSync(path.join(folder,'firestore.trusted-assessment.rules'),candidate,{flag:'wx'});
 const report={mode:'inactive-rule-cutover-candidate-not-deployed',createdAt:new Date().toISOString(),sourceHash:crypto.createHash('sha256').update(source).digest('hex'),candidateHash:crypto.createHash('sha256').update(candidate).digest('hex'),file:path.relative(root,path.join(folder,'firestore.trusted-assessment.rules')).replaceAll('\\','/'),clientWriteCollectionsBlocked:collections,profileRewardWritesBlocked:true,liveRuleVerification:'pending',activation:'disabled'};
 fs.writeFileSync(path.join(root,'docs/validation/trusted-assessment-rules-candidate-2026-10-30.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main();
module.exports={buildCandidate,collections,changeBlock};
