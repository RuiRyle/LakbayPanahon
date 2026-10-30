// Bounded publication check against the original project. No learner queries or writes.
const path=require('node:path');
const plan=require('../data/chapter15-challenge-migration.json');
const auth=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));

async function main(){
 if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Original project only.');
 const account=auth.getProjectDefaultAccount(process.cwd());
 if(!account)throw Error('Firebase CLI sign-in is unavailable.');
 const token=await auth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform']);
 const paths=[...new Set([
  ...plan.prerequisites.filter(row=>row.path.startsWith('missions/')).map(row=>row.path),
  ...plan.writes.filter(row=>/^(chapters|chapterChallenges|badges)\//.test(row.path)).map(row=>row.path)
 ])];
 if(paths.length<8||paths.length>9)throw Error('Unexpected publication plan scope.');
 const base='https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(plan.projectId)+'/databases/(default)/documents/';
 const results=[];
 for(const documentPath of paths){
  const response=await fetch(base+documentPath+'?mask.fieldPaths=status&mask.fieldPaths=chapterId',{headers:{Authorization:'Bearer '+token.access_token}});
  if(!response.ok)throw Error(documentPath+' HTTP '+response.status);
  const data=await response.json();
  const status=data.fields?.status?.stringValue,chapterId=data.fields?.chapterId?.stringValue;
  if(status!=='active'||(documentPath!=='chapters/chapter-15'&&chapterId!=='chapter-15'))
   throw Error(documentPath+' has unexpected status or chapter.');
  results.push({path:documentPath,status});
 }
 console.log(JSON.stringify({projectId:plan.projectId,checked:results.length,documents:results}));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
