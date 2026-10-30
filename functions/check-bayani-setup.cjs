// Read-only setup diagnostic: one Firestore document and two service states.
const path=require('node:path');
async function main(){
 const cli=require(path.join(process.env.APPDATA,'npm/node_modules/firebase-tools/lib/auth.js'));
 const account=cli.getProjectDefaultAccount(path.join(__dirname,'..'));
 if(!account)throw Error('Firebase CLI login required.');
 const token=(await cli.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform'])).access_token;
 const headers={Authorization:'Bearer '+token};
 const project='lakbaypanahon-1797e';
 const settings=await fetch('https://firestore.googleapis.com/v1/projects/'+project+'/databases/(default)/documents/learningSettings/bayaniAI',{headers});
 if(settings.ok){
  const {fields:f={}}=await settings.json();
  console.log(JSON.stringify({settings:{enabled:f.enabled?.booleanValue===true,model:f.model?.stringValue||null,hasAppCheckSiteKey:!!f.appCheckSiteKey?.stringValue,hasInstructions:!!f.systemInstruction?.stringValue,maxMessageCharacters:Number(f.maxMessageCharacters?.integerValue)||null}},null,2));
 }else console.log('Settings check: HTTP '+settings.status+' (no retry made).');
 for(const service of ['firebasevertexai.googleapis.com','generativelanguage.googleapis.com']){
  const response=await fetch('https://serviceusage.googleapis.com/v1/projects/'+project+'/services/'+service,{headers});
  if(response.ok)console.log(service+': '+(await response.json()).state);
  else console.log(service+': HTTP '+response.status);
 }
 console.log('This check does not send a Gemini prompt or prove that browser App Check succeeds.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
