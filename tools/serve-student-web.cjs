#!/usr/bin/env node
// Local website preview server: serves only a reviewed package, never the repository root.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),build=path.join(root,'build');
function resolvePackage(value){
    let folder;
    if(value)folder=fs.realpathSync(path.resolve(root,value));
    else{
        const candidates=fs.readdirSync(build,{withFileTypes:true}).filter(item=>item.isDirectory()&&/^student-web-[a-zA-Z0-9]+$/.test(item.name))
            .map(item=>path.join(build,item.name)).filter(item=>fs.existsSync(path.join(item,'release-manifest.json')))
            .sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs);
        if(!candidates.length)throw Error('Build a local package first: node functions/build-web-release-local.cjs --build');folder=fs.realpathSync(candidates[0]);
    }
    if(path.dirname(folder)!==build||!/^student-web-[a-zA-Z0-9]+$/.test(path.basename(folder)))throw Error('Choose a build/student-web-* package inside this workspace.');
    return folder;
}
function createStudentWebServer(folder){
    const manifest=JSON.parse(fs.readFileSync(path.join(folder,'release-manifest.json'),'utf8'));
    const config=JSON.parse(fs.readFileSync(path.join(folder,'firebase.json'),'utf8'));
    const publicRoot=fs.realpathSync(path.join(folder,'public'));
    const selected=new Set(manifest.files.map(item=>item.file));
    const headers=Object.fromEntries(config.hosting.headers[0].headers.map(item=>[item.key,item.value]));
    // The local server is HTTP; HTTPS upgrade applies to an eventual HTTPS host.
    headers['Content-Security-Policy']=headers['Content-Security-Policy'].replace('; upgrade-insecure-requests','');
    const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.mp4':'video/mp4','.woff':'font/woff','.woff2':'font/woff2'};
    return http.createServer((request,response)=>{
        try{
            if(!['GET','HEAD'].includes(request.method)){response.writeHead(405,{Allow:'GET, HEAD'});response.end();return;}
            const url=new URL(request.url,'http://localhost');
            const name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname).replace(/^\//,'');
            const known=selected.has(name),file=path.resolve(publicRoot,known?name:'404.html');
            if(!file.startsWith(publicRoot+path.sep)||!selected.has(known?name:'404.html')){response.writeHead(404);response.end();return;}
            const real=fs.realpathSync(file);if(!real.startsWith(publicRoot+path.sep))throw Error('Path outside public package');
            const bytes=fs.readFileSync(real),type=mime[path.extname(real)]||'application/octet-stream';
            const standard={...headers,'Content-Type':type,'Cache-Control':'no-store','Accept-Ranges':'bytes'};
            if(known&&request.headers.range){
                const range=/^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
                let start,end;
                if(range&&(range[1]||range[2])){
                    start=range[1]?Number(range[1]):Math.max(0,bytes.length-Number(range[2]));
                    end=range[1]?(range[2]?Math.min(Number(range[2]),bytes.length-1):bytes.length-1):bytes.length-1;
                }
                if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=bytes.length||end<start){response.writeHead(416,{...standard,'Content-Range':'bytes */'+bytes.length});response.end();return;}
                response.writeHead(206,{...standard,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${bytes.length}`});response.end(request.method==='HEAD'?undefined:bytes.subarray(start,end+1));return;
            }
            response.writeHead(known?200:404,{...standard,'Content-Length':bytes.length});response.end(request.method==='HEAD'?undefined:bytes);
        }catch{response.writeHead(400);response.end('Invalid package request');}
    });
}
function main(){
    const folder=resolvePackage(process.argv[2]),server=createStudentWebServer(folder);
    server.on('error',error=>{console.error(error.message);process.exitCode=1;});
    server.listen(0,'127.0.0.1',()=>{
        console.log('Student web system: http://localhost:'+server.address().port+'/');
        console.log('Package: '+path.relative(root,folder));console.log('Local machine only. Press Ctrl+C to stop.');
    });
    process.on('SIGINT',()=>{server.closeAllConnections();server.close(()=>process.exit());});
}
module.exports={resolvePackage,createStudentWebServer};
if(require.main===module)try{main();}catch(error){console.error(error.message);process.exitCode=1;}
