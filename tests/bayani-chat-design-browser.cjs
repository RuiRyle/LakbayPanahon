// Actual markup, CSS and chat logic; simulated auth/provider. No external requests.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{pathToFileURL}=require('node:url');
const {runFixture}=require('./student-missing-features-browser.cjs');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-chat-design-'));
const source=name=>fs.readFileSync('js/'+name,'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];/g,'').replace(/export /g,'');
async function main(){for(const width of [1440,1024,768,390]){
 const original=fs.readFileSync('pages/bayani-ai.html','utf8');let html=original.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
 const css=[...original.matchAll(/href=["']\.\.\/css\/([^"']+)["']/g)].map(m=>fs.readFileSync('css/'+m[1],'utf8').replace(/@import[^;]+;/g,'')).join('\n');
 const script=`
 const auth={currentUser:{uid:'student'}},onAuthStateChanged=(_,fn)=>queueMicrotask(()=>fn(auth.currentUser));
 let calls=0,fail=false;
 const connectBayani=async()=>({settings:{maxMessageCharacters:2000,welcomeMessage:''},send:async()=>{calls++;if(fail)throw Error('Offline');return '**Look for connections.**\\n\\n- Start with the evidence in your lesson.\\n- Explain how the details relate to one another.';}});
 ${source('bayani-request.js')}
 ${source('bayani-ai.js')}
 ${source('expedition-ui.js')}
 const tick=(ms=80)=>new Promise(r=>setTimeout(r,ms)),assert=(ok,m)=>{if(!ok)throw Error(m);};
 (async()=>{
 document.body.classList.add('authenticated');document.body.classList.remove('auth-checking');await tick(700);
 assert(!input.disabled,'Composer unavailable');assert(!document.getElementById('bayaniEmpty').hidden,'Empty state missing');
 assert(document.documentElement.scrollWidth<=innerWidth+1,'Page overflow');
 const panel=document.querySelector('.bayani-companion'),workspace=document.querySelector('.bayani-workspace');
 assert(getComputedStyle(panel).display!=='none'&&panel.querySelectorAll('.bayani-kit a').length===3,'Companion navigation hidden');
 if(innerWidth<=950)assert(workspace.getBoundingClientRect().top<panel.getBoundingClientRect().top,'Chat not prioritized');
 if(innerWidth>950)assert(panel.getBoundingClientRect().width<=225,'Companion too wide');
 assert(document.querySelector('.bayani-heading').getBoundingClientRect().height<210,'Oversized introduction');
 assert(document.querySelector('.bayani-chat').getBoundingClientRect().height<=425,'Oversized conversation area');
 document.querySelector('.bayani-prompt').click();assert(input.value.includes('history lesson')&&calls===0,'Starter submitted or failed');
 form.requestSubmit();await tick();assert(calls===1&&log.querySelector('.user')&&log.querySelector('.assistant'),'Sending failed');
 assert(log.querySelector('.assistant ul')&&log.querySelector('.assistant .bayani-message-content strong'),'Formatting changed');
 assert(getComputedStyle(log.querySelector('.user')).backgroundColor!==getComputedStyle(log.querySelector('.assistant')).backgroundColor,'Messages indistinguishable');
 document.getElementById('newBayaniChat').click();assert(!log.children.length&&!input.value&&calls===1,'New Chat changed behavior');
 fail=true;input.value='Keep my draft';form.requestSubmit();await tick();assert(input.value==='Keep my draft'&&!input.disabled&&!log.children.length,'Error recovery changed');
 fail=false;form.requestSubmit();await tick();assert(calls===3,'Recovered send failed');
 const area=document.querySelector('.bayani-chat');assert(area.scrollWidth<=area.clientWidth+1,'Chat horizontal overflow');
 assert(document.querySelector('.bayani-note').textContent.includes('can make mistakes')&&form.textContent.includes('contact details'),'Notices missing');
 assert(document.documentElement.scrollWidth<=innerWidth+1,'Conversation page overflow');
 document.getElementById('fixtureResult').textContent='PASS: Bayani '+innerWidth+'px, layout, navigation, composer, starters, send, formatting, New Chat, recovery, notices';scrollTo(0,0);
 })().catch(e=>document.getElementById('fixtureResult').textContent='FAIL: '+e.message);
 `;
 html=html.replace('<head>','<head><base href="'+pathToFileURL(path.resolve('pages')).href+'/">').replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="fixtureResult">RUNNING</output><script type="module">'+script+'</script></body>');
 const file=path.join(out,'chat-'+width+'.html');fs.writeFileSync(file,html);const result=await runFixture(file,width);console.log(result);if(!result?.startsWith('PASS:'))process.exitCode=1;
 }console.log('Captures: '+out);}
main().catch(e=>{console.error(e);process.exitCode=1;});
