// Local-only source package and offline dependency installation. Never deploys.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),node=path.join(root,'build/node22/node-v22.23.4-win-x64/node.exe'),npm=path.join(path.dirname(node),'node_modules/npm/bin/npm-cli.js');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'build/priority3-stage0-release/manifest.json'),'utf8'));
const output=fs.mkdtempSync(path.join(root,'build/node-backend-standalone-')),inventory=[];
const serviceFiles=manifest.inventory.filter(row=>row.file.startsWith('functions/')&&fs.existsSync(path.join(__dirname,'service',row.file.slice(10)))).map(row=>['service/'+row.file.slice(10),row.sha256]);
const files=[...serviceFiles,...['bridge.cjs','functions/assessment.cjs','adapter-deps/package.json','adapter-deps/package-lock.json'].map(name=>[name,null])];
const allowDownload=process.argv.includes('--allow-download');
const report={pass:false,output:path.relative(root,output),runtime:cp.execFileSync(node,['--version'],{encoding:'utf8'}).trim(),allowLockedDownloads:allowDownload,installs:[],inventory};
try{
 for(const [name,expected]of files){const bytes=fs.readFileSync(path.join(__dirname,name)),hash=crypto.createHash('sha256').update(bytes).digest('hex');if(expected&&hash!==expected)throw Error('Accepted service mismatch: '+name);const target=path.join(output,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);inventory.push({file:name,sha256:hash});}
 const env={...process.env};delete env.NODE_PATH;
 for(const folder of ['service','adapter-deps']){const r=cp.spawnSync(node,[npm,'ci',...(allowDownload?[]:['--offline']),'--omit=dev','--ignore-scripts','--no-audit','--no-fund'],{cwd:path.join(output,folder),env,encoding:'utf8',windowsHide:true});fs.writeFileSync(path.join(output,folder+'-install.log'),(r.stdout||'')+(r.stderr||''));report.installs.push({folder,exitCode:r.status,error:r.error?.message});if(r.status!==0)throw Error('Locked dependency install failed: '+folder);}
 report.pass=true;
}catch(e){report.error=e.message;process.exitCode=1;}
report.verifiedAt=new Date().toISOString();fs.writeFileSync(path.join(root,'docs/validation/node-standalone-package-2026-11-07.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
