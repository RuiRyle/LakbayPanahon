// Separate disposable test environment only. Does not use the user's emulator or cloud.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),{spawnSync}=require('node:child_process');
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8281'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9298')throw Error('Use the isolated candidate-check emulator configuration.');
function isolated(file){return fs.readFileSync(file,'utf8').replaceAll('demo-lakbay-local','demo-lakbay-teacher').replaceAll('127.0.0.1:8180','127.0.0.1:8281').replaceAll('127.0.0.1:9099','127.0.0.1:9298');}
(async()=>{
 const file=path.resolve('tools/seed-local-emulator.cjs'),seed=new Module(file,module);seed.filename=file;seed.paths=Module._nodeModulePaths(path.dirname(file));seed._compile(isolated(file),file);await seed.exports.seedLocalEmulator();
 for(const relative of ['tests/class-invitation-emulator.cjs','tests/classmates-emulator.cjs','tests/class-help-emulator.cjs','tests/class-review-emulator.cjs']){
  const file=path.resolve(relative),script=`const Module=require('node:module'),path=require('node:path');const file=${JSON.stringify(file)},m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(${JSON.stringify(isolated(file))},file);`;
  const result=spawnSync(process.execPath,['-e',script],{cwd:process.cwd(),encoding:'utf8',windowsHide:true});if(result.stdout)process.stdout.write(result.stdout);if(result.stderr)process.stderr.write(result.stderr);if(result.status!==0)throw Error('Candidate check failed: '+relative);
 }
 console.log('PASS: candidate invitation, classmates, help, and review/reflection suites in isolated demo project.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
