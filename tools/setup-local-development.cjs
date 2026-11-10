'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function preflight(){
 if(Number(process.versions.node.split('.')[0])!==22)throw Error('Install Node.js 22 LTS, reopen the terminal, then run npm ci and npm run setup:local.');
 const java=spawnSync('java',['-version'],{encoding:'utf8',windowsHide:true});
 const output=(java.stdout||'')+(java.stderr||'');const major=Number(output.match(/version "(\d+)/)?.[1]);
 if(java.error||java.status!==0||major<21)throw Error('Install Java JDK 21 or newer and reopen the terminal. java -version must work.');
 return require('../functions/stage0-gcloud-plan.cjs').validateCandidate();
}
function main(){
 preflight();
 const npm=process.env.npm_execpath;
 if(!npm||!fs.existsSync(npm))throw Error('Run this setup through npm run setup:local.');
 const cwd=path.join(root,'build/priority3-stage0-release/functions');
 const result=spawnSync(process.execPath,[npm,'ci','--ignore-scripts','--no-audit','--no-fund'],{cwd,stdio:'inherit',windowsHide:true});
 if(result.error||result.status!==0)throw Error('Backend dependency installation failed. Check the network and retry npm run setup:local.');
 require('../functions/stage0-gcloud-plan.cjs').validateCandidate();
 console.log('Local setup ready. Run npm run start:local. No Firebase login, real project, billing or deployment is required.');
}
if(require.main===module)try{main();}catch(error){console.error(error.message);process.exitCode=1;}
module.exports={preflight};
