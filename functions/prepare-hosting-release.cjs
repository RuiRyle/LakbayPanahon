// Offline package/acceptance review only. Never publishes or changes Firebase.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {resolvePackage}=require('../tools/serve-student-web.cjs');
const {createHostingConfig}=require('./student-hosting-config.cjs');
const root=path.resolve(__dirname,'..'),hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function main(){
 const folder=resolvePackage(process.argv[2]),relative=path.relative(root,folder).replaceAll('\\','/'),publicDir=path.join(folder,'public');
 const manifestBytes=fs.readFileSync(path.join(folder,'release-manifest.json')),manifest=JSON.parse(manifestBytes),configBytes=fs.readFileSync(path.join(folder,'firebase.json')),config=JSON.parse(configBytes);
 const paths=new Set(),html=[];
 for(const item of manifest.files){
  if(typeof item.file!=='string'||item.file.includes('\\')||item.file.split('/').includes('..')||paths.has(item.file))throw Error('Invalid/duplicate manifest path.');
  paths.add(item.file);const file=path.resolve(publicDir,item.file);
  if(!file.startsWith(publicDir+path.sep)||fs.lstatSync(file).isSymbolicLink()||!fs.statSync(file).isFile())throw Error('Invalid public file.');
  const bytes=fs.readFileSync(file);if(hash(bytes)!==item.sha256||hash(fs.readFileSync(path.join(root,item.file)))!==item.sha256)throw Error('Build/source drift: '+item.file);
  if(item.file.endsWith('.html'))html.push(bytes.toString('utf8'));
 }
 function inspect(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  const file=path.join(directory,entry.name);if(entry.isSymbolicLink())throw Error('Symlink in public package.');
  if(entry.isDirectory())inspect(file);else if(!paths.has(path.relative(publicDir,file).replaceAll('\\','/')))throw Error('Unmanifested file in public package.');
 }}inspect(publicDir);
 if(JSON.stringify(config)!==JSON.stringify(createHostingConfig(html)))throw Error('Hosting configuration differs from reviewed security-header generator.');
 if(paths.size!==manifest.files.length||paths.has('firestore.rules')||[...paths].some(file=>/^(?:docs|backups|tests|functions|data|server|\.git|\.env)(?:\/|$)/.test(file)))throw Error('Private file in public package.');
 const load=name=>JSON.parse(fs.readFileSync(path.join(root,'docs/validation',name),'utf8'));
 const student=load('student-acceptance-local.json'),teacher=load('teacher-registration-browser-2026-10-31.json'),live=load('staged-role-auth-live-2026-10-31.json');
 if(student.units.status!=='pass'||student.browser.status!=='pass'||!teacher.pass||live.status!=='pass'||live.cleanup!=='complete'||live.package.replaceAll('\\','/')!==relative)throw Error('Matching acceptance evidence required.');
 for(const proof of [...teacher.sources,...live.sources])if(hash(fs.readFileSync(path.join(root,proof.file)))!==proof.sha256)throw Error('Acceptance source drift: '+proof.file);
 const metadata=load('hosting-target-2026-10-31.json');
 const report={mode:'reviewed-hosting-package-not-deployed',preparedAt:new Date().toISOString(),project:'lakbaypanahon-1797e',site:config.hosting.site,package:relative,manifestSha256:hash(manifestBytes),hostingConfigSha256:hash(configBytes),files:paths.size,pages:html.length,
  sourceHashesMatch:true,privateFilesExcluded:true,stagedRoleChecks:live.steps.length,studentChecks:student.units.passed,studentBrowserFixtures:student.browser.fixtures.length,hostingMetadataCheckedAt:metadata.checkedAt,
  proposedPreviewCommand:`firebase hosting:channel:deploy release-review --expires 7d --project lakbaypanahon-1797e --config ${relative}/firebase.json`,
  previewEffects:['Uploads only the reviewed public package to a publicly reachable, expiring preview URL.','Uses the existing real Firebase project, accounts and saved progression.','Firebase CLI may add the preview hostname to Firebase Auth authorized domains.','Does not activate a demo mode or replace the live Hosting channel.'],
  outstanding:['Approval of the external preview publication before executing the command.','Hosted HTTPS/Auth/assets/security-header checks after publication.','Human content/Grade 5 comprehension, real-device/audio and optional AI suitability checks.','Actual operator/support/privacy arrangements before public learner rollout.']};
 fs.writeFileSync(path.join(root,'docs/validation/hosting-release-plan-2026-10-31.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main();
