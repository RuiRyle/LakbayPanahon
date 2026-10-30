// Offline HTTP/Chrome check of a staged package; no Firebase scripts or data calls.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
async function main(){
 const packagePath=process.argv[2];if(!packagePath)throw Error('Pass one staged build/student-web-* package directory.');
 const folder=fs.realpathSync(path.resolve(root,packagePath));
 if(!/^student-web-[A-Za-z0-9]+$/.test(path.basename(folder))||path.dirname(folder)!==path.join(root,'build'))throw Error('Expected a staged package inside this workspace build directory.');
 const config=JSON.parse(fs.readFileSync(path.join(folder,'firebase.json'),'utf8')),manifest=JSON.parse(fs.readFileSync(path.join(folder,'release-manifest.json'),'utf8'));
 const selected=new Set(manifest.files.map(f=>f.file)),publicDir=path.join(folder,'public'),screens=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-hosting-security-'));
 const headers=Object.fromEntries(config.hosting.headers[0].headers.map(h=>[h.key,h.value]));
 const server=http.createServer((req,res)=>{
  try{
   const url=new URL(req.url,'http://local.invalid'),file=decodeURIComponent(url.pathname).replace(/^\//,'');
   if(!selected.has(file)){res.writeHead(404);res.end('Not in staged package');return;}
   const responseHeaders={...headers,'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.svg')?'image/svg+xml':'application/octet-stream'};
   // HTTPS upgrade is a hosting directive; this fixture is deliberately loopback HTTP.
   responseHeaders['Content-Security-Policy']=responseHeaders['Content-Security-Policy'].replace('; upgrade-insecure-requests','');
   if(url.searchParams.get('control')==='true')delete responseHeaders['Content-Security-Policy'];
   let body=fs.readFileSync(path.join(publicDir,file));
   if(file==='404.html'&&url.searchParams.has('probe'))body=Buffer.from(body.toString('utf8').replace('</body>',"<script>document.title='INJECTED-CSP-TEST';</script></body>"));
   res.writeHead(200,responseHeaders);res.end(body);
  }catch{res.writeHead(400);res.end('Invalid request');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 async function browser(name,url){
  const screenshot=path.join(screens,name+'.png');
  const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--window-size=1440,1000','--user-data-dir='+path.join(screens,name+'-profile'),'--screenshot='+screenshot,'--dump-dom','--virtual-time-budget=1000',url],{windowsHide:true});
  let stdout='',stderr='';child.stdout.on('data',chunk=>{stdout+=chunk;});child.stderr.on('data',chunk=>{stderr+=chunk;});
  const timer=setTimeout(()=>child.kill(),20000);
  const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});clearTimeout(timer);
  if(code!==0)throw Error('Chrome failed: '+stderr.slice(-300));
  return{html:stdout,screenshot};
 }
 try{
  for(const privatePath of ['/server/assessment/server.mjs','/backups/private.json','/release-manifest.json']){
   if((await fetch(base+privatePath)).status!==404)throw Error('Private path was served: '+privatePath);
  }
  const [protectedPage,control]=await Promise.all([browser('protected',base+'/404.html?probe=1'),browser('control',base+'/404.html?probe=1&control=true')]);
  if(!control.html.includes('<title>INJECTED-CSP-TEST</title>'))throw Error('Control did not execute the injected script');
  if(protectedPage.html.includes('<title>INJECTED-CSP-TEST</title>')||!protectedPage.html.includes('Trail not found | LakbayPanahon'))throw Error('Hosting CSP did not block the injected script');
  if(!protectedPage.html.includes('Open My Journey'))throw Error('404 recovery action missing');
  console.log('PASS: staged 404 renders, configured CSP blocks untrusted inline script, control executes, and public-file allowlist is enforced.');
  console.log('Screenshot: '+protectedPage.screenshot);
 }finally{await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
