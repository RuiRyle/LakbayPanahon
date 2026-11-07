const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),out=path.join(root,'build','story-playground-review');fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(root,'pages/story-playground.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
html=html.replace('<head>','<head><base href="'+pathToFileURL(path.join(root,'pages')).href+'/">');
const source=['lesson-narration-text.js','bayani-voice-clips.js','bayani-generated-clips.js','lesson-game-audio.js','bayani-narration-button.js','adventure-voice.js','lesson-image-viewer.js','story-playground-content.js','story-playground.js'].map(name=>fs.readFileSync(path.join(root,'js',name),'utf8')).join('\n');
const reading=fs.readFileSync(path.join(root,'js/story-reading-steps.js'),'utf8');
const check=`
const check=(value,message)=>{if(!value)throw Error(message);};
const click=id=>document.getElementById(id).click();
(async()=>{
check(document.getElementById('labSceneTitle').textContent.includes('photo'),'opening lesson missing');
check(document.querySelector('.lesson-goal').textContent.includes('Explain why'),'learning goal missing');
check(document.querySelector('.lesson-example').textContent.includes('field note'),'worked example missing');
check(document.querySelectorAll('#labSteps li').length===5,'progress trail does not match the five screens');
check(document.getElementById('labProgressLabel').textContent==='Step 1 of 5','opening progress unclear');
check(!document.getElementById('labBag').open,'clue bag should start collapsed');
const effectToggle=document.querySelector('.lesson-sound-options input[type="checkbox"]'),voiceToggle=document.querySelector('.narrator-options input[type="checkbox"]');
check(effectToggle&&voiceToggle,'Separate voice and game sound controls missing');
effectToggle.checked=false;effectToggle.dispatchEvent(new Event('change'));check(!window.LakbayLessonAudio.enabled,'Game effects did not mute');effectToggle.checked=true;effectToggle.dispatchEvent(new Event('change'));
voiceToggle.checked=false;voiceToggle.dispatchEvent(new Event('change'));check(document.getElementById('labNarrate').disabled,'Narration mute did not disable Listen');voiceToggle.checked=true;voiceToggle.dispatchEvent(new Event('change'));check(!document.getElementById('labNarrate').disabled,'Narration did not re-enable');
const characterButton=document.getElementById('labNarrate');check(characterButton.querySelector('img')&&characterButton.getAttribute('aria-label')==='Hear the story with Bayani','Character narration control missing');
const originalNarrator=window.LakbayNarrator;let narrationRequests=0;window.LakbayNarrator={enabled:true,play(parts){narrationRequests++;check(parts.length>0,'Narration lost lesson content');document.dispatchEvent(new CustomEvent('lakbay:narration-state',{detail:{active:true}}));},stop(){document.dispatchEvent(new CustomEvent('lakbay:narration-state',{detail:{active:false}}));}};
characterButton.click();check(characterButton.dataset.speaking==='true'&&characterButton.getAttribute('aria-pressed')==='true'&&characterButton.querySelector('.bayani-narration-action').textContent==='Stop story','Character does not show speaking state');characterButton.click();check(narrationRequests===1&&characterButton.dataset.speaking==='false'&&characterButton.querySelector('img')&&characterButton.querySelector('.bayani-narration-action').textContent==='Hear the story','Character stop restarted narration or destroyed artwork');window.LakbayNarrator=originalNarrator;document.dispatchEvent(new CustomEvent('lakbay:narration-preference'));

const NativeAudio=window.Audio,clip=window.LakbayBayaniVoiceClips[0],recordingUrl=new URL(clip.src,document.baseURI).href;
const recording=new NativeAudio(recordingUrl);recording.preload='metadata';
await new Promise((resolve,reject)=>{recording.onloadedmetadata=resolve;recording.onerror=()=>reject(Error('Saved Bayani recording cannot be decoded'));recording.load();});
check(Number.isFinite(recording.duration)&&recording.duration>0,'Saved Bayani recording has no playable duration');recording.removeAttribute('src');
let chosenRecording='';window.Audio=function(src){chosenRecording=src;const audio=new NativeAudio();audio.play=()=>Promise.resolve();return audio;};
document.querySelector('.narrator-options>button').click();check(chosenRecording===recordingUrl,'Try voice did not select the saved Bayani recording');window.LakbayNarrator.stop();window.Audio=NativeAudio;
const imageTrigger=document.querySelector('.lab-image-trigger');imageTrigger.click();
const viewer=document.querySelector('.lesson-image-dialog');check(viewer.open,'Preview image does not open');
const imageRect=viewer.getBoundingClientRect();check(Math.abs(imageRect.left+imageRect.width/2-innerWidth/2)<2&&Math.abs(imageRect.top+imageRect.height/2-innerHeight/2)<2,'Preview image viewer is not centered '+JSON.stringify({rect:imageRect.toJSON(),width:innerWidth,height:innerHeight}));
viewer.querySelector('button').click();await new Promise(resolve=>setTimeout(resolve,30));check(!viewer.open&&document.activeElement===imageTrigger,'Image viewer did not close and restore focus');
imageTrigger.click();viewer.dispatchEvent(new MouseEvent('click',{clientX:0,clientY:0,bubbles:true}));await new Promise(resolve=>setTimeout(resolve,30));check(!viewer.open,'Clicking outside the illustration does not close the viewer');
click('labNext');check(document.getElementById('labNext').disabled,'clue gate bypassed');
check(document.querySelector('.lab-bayani-character'),'Bayani guide missing');
check(document.querySelectorAll('[data-clue]').length===3,'clue cards missing');
document.querySelector('[data-clue="place"]').click();check(document.querySelector('[data-clue="place"]').getAttribute('aria-pressed')==='true','clue card did not open its note');
check(document.querySelector('.clue-meaning').textContent.includes('Why it matters'),'clue lacks learning explanation');
for(const button of document.querySelectorAll('[data-clue]')){button.click();document.querySelector('#labClueNote button').click();}
check(document.getElementById('labJournal').children.length===3,'journal save failed');check(!document.getElementById('labNext').disabled,'clue gate did not open');
check(document.getElementById('labBagCount').textContent==='3 / 3','collection count missing');
click('labNext');check(document.getElementById('labNext').hidden&&!document.getElementById('labCheckOrder').hidden,'order screen has competing main actions');click('labCheckOrder');check(document.getElementById('labNext').disabled,'incorrect care sequence accepted');
document.querySelectorAll('.lab-order-row')[2].querySelector('button').click();document.querySelectorAll('.lab-order-row')[1].querySelector('button').click();click('labCheckOrder');check(!document.getElementById('labNext').disabled,'correct sequence rejected');check(document.getElementById('labCheckOrder').hidden&&!document.getElementById('labNext').hidden,'order success has competing actions');
click('labNext');document.querySelector('[data-option="0"]').click();click('labCheckExplanation');check(document.getElementById('labNext').disabled,'incorrect explanation accepted');check(document.getElementById('labFeedback').dataset.kind==='hint','wrong choice lacks hint');
document.querySelector('[data-option="1"]').click();click('labCheckExplanation');check(!document.getElementById('labNext').disabled,'correct explanation rejected');click('labNext');check(document.querySelector('.lab-stamp'),'discovery celebration missing');check(document.getElementById('labJournal').children.length===3,'journal lost on next step');
document.querySelector('[data-transfer="1"]').click();check(document.querySelector('.lesson-review [role="status"]').textContent.includes('do not tell'),'transfer misconception lacks feedback');
document.querySelector('[data-transfer="0"]').click();check(document.querySelector('.lesson-review [role="status"]').textContent.includes('layer and nearby'),'transfer explanation missing');
click('labRestart');check(document.getElementById('labJournal').children.length===0,'restart retained journal');click('labNext');document.querySelector('[data-clue]').click();
check(document.documentElement.scrollWidth<=innerWidth+1,'mobile overflow');
// Exercise the production reading-step enhancer, including scene replacement.
const readingHost=document.createElement('div');readingHost.id='storyText';readingHost.hidden=true;readingHost.innerHTML='<p>First authored paragraph.</p><p>Second authored paragraph.</p>';document.body.append(readingHost);
const script=document.createElement('script');script.textContent=${JSON.stringify(reading)};document.body.append(script);
await new Promise(resolve=>setTimeout(resolve,20));const controls=document.querySelector('.story-beat-toolbar');check(!readingHost.children[0].hidden&&readingHost.children[1].hidden,'short reading mode missing');controls.querySelectorAll('button')[1].click();check(readingHost.children[0].hidden&&!readingHost.children[1].hidden,'next reading part failed');controls.querySelectorAll('button')[2].click();check([...readingHost.children].every(p=>!p.hidden),'full explanation unavailable');readingHost.replaceChildren(Object.assign(document.createElement('p'),{textContent:'New scene paragraph.'}));await new Promise(resolve=>setTimeout(resolve,20));check(controls.textContent.includes('Part 1 of 1'),'scene reading state did not reset');controls.remove();readingHost.remove();
document.getElementById('result').textContent='PASS: clue gates, journal, order challenge, retry hints, explanation, reveal, restart, reading steps and scene reset';
})().catch(error=>{document.getElementById('result').textContent='FAIL: '+error.message;});`;
html=html.replace('</body>','<output id="result" style="position:fixed;bottom:0;right:0;background:#10263e;color:#fff;font:10px monospace;z-index:100">RUNNING</output><script>'+source+'</script><script>'+check+'</script></body>');
const fixture=path.join(out,'preview.html');fs.writeFileSync(fixture,html);
for(const width of [1440,600]){
const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--user-data-dir='+path.join(out,'browser-'+width),'--window-size='+width+',1100','--screenshot='+path.join(out,'detective-'+width+'.png'),'--dump-dom','--virtual-time-budget=3000',pathToFileURL(fixture).href],{encoding:'utf8',timeout:30000,maxBuffer:5*1024*1024,windowsHide:true});
if(result.error)throw result.error;const message=result.stdout.match(/<output id="result"[^>]*>([^<]+)<\/output>/)?.[1]||'FAIL: no browser result';console.log(width+'px: '+message);if(!message.startsWith('PASS:'))process.exitCode=1;
}
