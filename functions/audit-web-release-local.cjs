// Static dependency inventory only. Does not authenticate, deploy or contact Firebase.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const pages=['index.html','404.html',...['student-dashboard','student-shell','my-journey','my-class','chapters','era','mission','story','quiz','practice','chapter-challenge','achievements','my-profile','bayani-ai','settings','login','register','teacher','teacher-register','teacher-dashboard','admin-dashboard'].map(n=>'pages/'+n+'.html')];
const selected=new Set(),missing=[],rejected=[],queue=[...pages];
const supported=/\.(?:html|js|css|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|mp3|wav|ogg|mp4)$/i;
function add(from,reference){
 if(!reference||/^(?:https?:|data:|mailto:|tel:|#|\/\/)/i.test(reference))return;
 const clean=reference.split(/[?#]/)[0];if(!clean)return;
 let decoded;try{decoded=decodeURIComponent(clean);}catch{rejected.push({from,reference});return;}
 const absolute=path.resolve(decoded.startsWith('/')?root:path.dirname(path.join(root,from)),decoded.replace(/^\//,''));
 const local=path.relative(root,absolute).replaceAll('\\','/');
 if(local.startsWith('../')||!supported.test(local)||/^(?:backups|data|docs|functions|server|tests)\//.test(local)){rejected.push({from,reference});return;}
 if(!fs.existsSync(absolute)){missing.push({from,reference,target:local});return;}
 if(!selected.has(local))queue.push(local);
}
while(queue.length){
 const file=queue.shift();if(selected.has(file))continue;selected.add(file);
 if(!fs.existsSync(path.join(root,file))){missing.push({target:file});continue;}
 const source=fs.readFileSync(path.join(root,file),'utf8');
 if(file.endsWith('.html'))for(const match of source.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g))add(file,match[1]);
 if(file.endsWith('.css'))for(const match of source.matchAll(/url\(\s*["']?([^\s)'";]+)["']?\s*\)/g))add(file,match[1]);
 if(file.endsWith('.js'))for(const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["']([^"']+)["']/g))add(file,match[1]);
}
// Story images are also selected through Firestore metadata, not static page links.
function assets(folder){for(const entry of fs.readdirSync(path.join(root,folder),{withFileTypes:true})){const name=folder+'/'+entry.name;if(entry.isDirectory())assets(name);else if(supported.test(name)&&!name.endsWith('.html')&&!name.endsWith('.js')&&!name.endsWith('.css'))selected.add(name);}}
assets('assets');
const report={mode:'offline-release-inventory-not-deployed',entryPages:pages,files:[...selected].sort(),counts:{pages:pages.length,files:selected.size,missingReferences:missing.length,rejectedReferences:rejected.length},missing,rejected,excluded:['backups/','data/','docs/','functions/','server/','tests/','Firebase configs and rules','Local audit/preview HTML tools'],limitations:['Does not verify current Firestore image metadata or remote URLs.','Does not parse computed JavaScript URLs, inline-generated HTML or CSS @import.','Includes shared teacher/admin entry pages needed for role redirects; does not certify those workflows.','Inventory is not Hosting configuration or a deployment command.']};
fs.writeFileSync(path.join(root,'docs/validation/web-release-local.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({counts:report.counts,missing,rejected},null,2));
process.exitCode=missing.length||rejected.length?1:0;
