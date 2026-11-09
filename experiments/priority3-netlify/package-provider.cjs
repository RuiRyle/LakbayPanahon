// Provider packaging only. The copied entry still rejects non-demo projects.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'../..'),prepared=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/node-standalone-package-2026-11-07.json'),'utf8'));
assert.equal(prepared.pass,true);const candidate=fs.realpathSync(path.resolve(root,prepared.output));assert.equal(path.dirname(candidate),path.join(root,'build'));
const tool=createRequire(path.join(__dirname,'packaging-tools/package.json')),destination=fs.mkdtempSync(path.join(root,'build/node-provider-artifact-'));
const canary='DUMMY_LOCAL_BUILD_ONLY_'+crypto.randomUUID(),old=process.env.LOCAL_PACKAGE_CANARY;process.env.LOCAL_PACKAGE_CANARY=canary;
const report={pass:false,source:prepared.output,destination:path.relative(root,destination),toolVersion:tool('@netlify/zip-it-and-ship-it/package.json').version,node:process.version,canary,archives:[]};
(async()=>{
 const {zipFunctions}=await import(pathToFileURL(tool.resolve('@netlify/zip-it-and-ship-it')).href);
 const results=await zipFunctions(path.join(candidate,'functions'),destination,{basePath:candidate,archiveFormat:'zip',config:{'*':{nodeBundler:'zisi',nodeVersion:'22.x',includedFilesBasePath:candidate,includedFiles:['bridge.cjs','service/**','adapter-deps/node_modules/serverless-http/**','!**/.env*','!**/*.log']}}});
 assert.equal(results.length,1);assert.equal(results[0].name,'assessment');
 for(const result of results){const bytes=fs.readFileSync(result.path);report.archives.push({name:result.name,path:path.relative(root,result.path),sizeBytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),runtime:result.runtime,mainFile:result.mainFile});}
 report.pass=true;
})().catch(e=>{report.error=e.stack;process.exitCode=1;}).finally(()=>{if(old===undefined)delete process.env.LOCAL_PACKAGE_CANARY;else process.env.LOCAL_PACKAGE_CANARY=old;report.verifiedAt=new Date().toISOString();fs.writeFileSync(path.join(root,'docs/validation/node-provider-artifact-2026-11-07.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));});
