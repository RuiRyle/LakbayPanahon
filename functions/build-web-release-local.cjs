// Local staging only. No Firebase access, deployment, overwrite or deletion.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
require('./audit-web-release-local.cjs');
const inventory=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/web-release-local.json'),'utf8'));
if(inventory.missing.length||inventory.rejected.length)throw Error('Resolve dependency audit findings before building.');
const permittedPages=new Set(inventory.entryPages);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const files=inventory.files.map(file=>{
 const source=path.resolve(root,file),relative=path.relative(root,source);
 if(relative.startsWith('..')||path.isAbsolute(relative)||file.includes('\\'))throw Error('Invalid inventory path.');
 if(!permittedPages.has(file)&&!/^((js\/[^/]+\.js)|(css\/[^/]+\.css)|(assets\/.+\.(png|jpe?g|webp|gif|svg|ico|woff2?|ttf|mp3|wav|ogg|mp4)))$/i.test(file))throw Error('Non-public file in inventory: '+file);
 const real=fs.realpathSync(source);if(path.relative(root,real).startsWith('..'))throw Error('Source points outside workspace: '+file);
 if(!fs.statSync(source).isFile())throw Error('Source is not a regular file: '+file);
 return {file,source,sha256:hash(source),bytes:fs.statSync(source).size};
});
if(!process.argv.includes('--build')){
 console.log('Ready to stage '+files.length+' reviewed file paths. Use --build to create a new local folder.');
}else{
 const folder=path.join(root,'build');fs.mkdirSync(folder,{recursive:true});
 const output=fs.mkdtempSync(path.join(folder,'student-web-')),publicDir=path.join(output,'public');
 fs.mkdirSync(publicDir);
 for(const item of files){
  const target=path.join(publicDir,item.file);fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync(item.source,target,fs.constants.COPYFILE_EXCL);
  if(hash(target)!==item.sha256)throw Error('Build copy mismatch: '+item.file);
 }
 fs.writeFileSync(path.join(output,'release-manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),mode:'local-staging-not-deployed',publicDirectory:'public',files:files.map(({source,...item})=>item)},null,2),{flag:'wx'});
 const {createHostingConfig}=require('./student-hosting-config.cjs');
 const html=files.filter(item=>item.file.endsWith('.html')).map(item=>fs.readFileSync(path.join(publicDir,item.file),'utf8'));
 fs.writeFileSync(path.join(output,'firebase.json'),JSON.stringify(createHostingConfig(html),null,2),{flag:'wx'});
 console.log('Staged and hash-verified '+files.length+' files in '+path.relative(root,publicDir)+'. Nothing deployed.');
}
