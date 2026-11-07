// Read-only metadata check: never deploys a website or updates Auth configuration.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),project='lakbaypanahon-1797e',site=project;
async function main(){
 if(!process.argv.includes('--inspect')){console.log('Use --inspect for GET-only Hosting/Auth-domain metadata. No files are uploaded.');return;}
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js')),account=cli.getProjectDefaultAccount(root);if(!account)throw Error('Firebase CLI login required.');
 const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 async function get(url){
  const response=await fetch(url,{method:'GET',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
  if(response.status===404)return null;
  if(!response.ok)throw Error('Read-only metadata check HTTP '+response.status);
  return response.json();
 }
 const base=`https://firebasehosting.googleapis.com/v1beta1/projects/${project}/sites/${site}`;
 const hosted=await get(base),channel=hosted?await get(base+'/channels/live'):null;
 let domains=null,domainError=null;
 try{domains=(await get(`https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/config`))?.authorizedDomains||[];}catch(error){domainError=error.message;}
 const release=channel?.release;
 const report={mode:'read-only-metadata-not-deployed',checkedAt:new Date().toISOString(),project,site,siteExists:!!hosted,defaultUrl:hosted?.defaultUrl||null,liveChannelExists:!!channel,
  liveRelease:release?{type:release.type||null,releasedAt:release.releaseTime||null,version:release.version?.name||null,versionStatus:release.version?.status||null}:null,
  authorizedDomains:domains,domainCheckError:domainError,configurationChanged:false};
 const file=process.argv.includes('--after-preview')?'hosting-target-after-preview-2026-10-31.json':'hosting-target-2026-10-31.json';
 fs.writeFileSync(path.join(root,'docs/validation',file),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
