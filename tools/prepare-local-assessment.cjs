// Stage current development code for loopback emulator testing; never rewrite the frozen candidate.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const {validateCandidateArchive,relativeFiles,hash,base}=require('../functions/stage0-gcloud-plan.cjs');
function prepareLocalBackend(){
 const archive=validateCandidateArchive();
 const parent=path.join(root,'build');fs.mkdirSync(parent,{recursive:true});
 const folder=fs.mkdtempSync(path.join(parent,'local-assessment-dev-')),functions=path.join(folder,'functions');fs.mkdirSync(functions);
 const files=[];
 for(const file of relativeFiles){
  const source=path.join(file==='index.js'?path.join(base,'functions'):path.join(root,'functions'),file);
  const target=path.join(functions,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target,fs.constants.COPYFILE_EXCL);
  files.push({file:'functions/'+file,sha256:hash(fs.readFileSync(target))});
 }
 const rules=require('./admin-review-rules.cjs').prepare();fs.copyFileSync(rules,path.join(folder,'firestore.rules'));files.push({file:'firestore.rules',sha256:hash(fs.readFileSync(rules))});
 const cache=path.join(base,'functions/node_modules');if(!fs.existsSync(cache))throw Error('Run npm run setup:local to install local backend dependencies.');
 fs.symlinkSync(cache,path.join(functions,'node_modules'),process.platform==='win32'?'junction':'dir');
 const manifest={mode:'local-development-only',acceptedCandidate:false,productionExecutionEnabled:false,archiveValid:archive.archiveValid,sourceDrift:archive.sourceDrift,clientSha256:hash(fs.readFileSync(path.join(root,'js/student-assessment-client.js'))),files};
 fs.writeFileSync(path.join(folder,'development-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 return {folder,functions,rules:path.join(folder,'firestore.rules'),manifest};
}
module.exports={prepareLocalBackend};
if(require.main===module)console.log(JSON.stringify(prepareLocalBackend(),null,2));
