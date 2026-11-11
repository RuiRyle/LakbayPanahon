// Read-only production inspection; prepares public projections without writing Firestore.
const fs=require('node:fs'),path=require('node:path'),{publicDailyCard}=require('./daily-card-projection.cjs');
const {decode}=require('./apply-chapter1-mission1-learning-polish.cjs');
(async()=>{if(!process.argv.includes('--inspect')){console.log('Use --inspect to prepare a bounded public-card migration. No writes.');return;}
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(process.cwd());const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const response=await fetch('https://firestore.googleapis.com/v1/projects/lakbaypanahon-1797e/databases/(default)/documents/dailyChallenges?pageSize=100',{headers:{Authorization:'Bearer '+token}});if(!response.ok)throw Error('Daily catalog read failed: '+response.status);const data=await response.json();if(data.nextPageToken)throw Error('Daily migration exceeds reviewed bound');
 const writes=(data.documents||[]).map(row=>({path:'dailyChallengeCards/'+row.name.split('/').at(-1),fields:publicDailyCard(Object.fromEntries(Object.entries(row.fields||{}).map(([k,v])=>[k,decode(v)])))}));
 fs.mkdirSync('build/render-cutover-review',{recursive:true});fs.writeFileSync('build/render-cutover-review/daily-card-plan.json',JSON.stringify({projectId:'lakbaypanahon-1797e',mode:'not-published',writes},null,2));console.log('Prepared '+writes.length+' public cards; no Firestore writes.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
