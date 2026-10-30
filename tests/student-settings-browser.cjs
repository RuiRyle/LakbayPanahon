// Real Settings markup/CSS/preferences code in Chrome; no Auth SDK or Firebase access.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-settings-'));
const original=fs.readFileSync(path.join(root,'pages/settings.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'').replace('class="student-page lakbay-theme"','class="student-page lakbay-theme authenticated"');
const css=['student.css','navy-gold-theme.css','student-settings.css','page-transition.css'].map(file=>fs.readFileSync(path.join(root,'css',file),'utf8')).join('\n');
const runtime=fs.readFileSync(path.join(root,'js/page-transition.js'),'utf8');
const cases=[['default','settings.html',1440],['restored','settings.html',1280],['blocked','settings.html',1440],['write-blocked','settings.html',1440],['autoplay-blocked','settings.html',1440],['reading','story.html',1440],['focus','quiz.html',1440]];
const results=[];
let failed=false;
for(const [scenario,page,width] of cases){
 const folder=path.join(temp,scenario);fs.mkdirSync(folder);
 const setup=`window.fixtureErrors=[];window.addEventListener('error',e=>fixtureErrors.push(e.message));window.addEventListener('unhandledrejection',e=>fixtureErrors.push(String(e.reason)));Object.defineProperty(window,'AudioContext',{value:${scenario==='autoplay-blocked'?"class {constructor(){this.state='suspended';this.currentTime=0;}resume(){return Promise.reject(new DOMException('Playback blocked','NotAllowedError'));}}":"undefined"}});Object.defineProperty(window,'webkitAudioContext',{value:undefined});document.body.classList.add('authenticated');
 ${scenario==='blocked'?"Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage disabled','SecurityError');}});":scenario==='restored'?"localStorage.setItem('lakbay-ui-sounds','off');localStorage.setItem('lakbay-background-music','off');localStorage.setItem('lakbay-ui-sound-volume','20');localStorage.setItem('lakbay-background-music-volume','35');localStorage.setItem('lakbay-reading-size','larger');localStorage.setItem('lakbay-high-contrast','on');localStorage.setItem('lakbay-reduce-motion','on');":"localStorage.clear();localStorage.setItem('lakbay-background-music','off');"}
 ${scenario==='write-blocked'?"const storedPreferences=window.localStorage;Object.defineProperty(window,'localStorage',{value:{getItem:storedPreferences.getItem.bind(storedPreferences),setItem(){throw new DOMException('Storage full','QuotaExceededError');}}});":""}`;
 const script=`
 (async()=>{
  if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
  const check=(value,message)=>{if(!value)throw Error(message);},q=selector=>document.querySelector(selector),sw=name=>q('[data-preference-switch="'+name+'"]');
  check(q('.settings-nav-link').getAttribute('aria-current')==='page'||${JSON.stringify(page)}!=='settings.html','Settings navigation is not current');
  if(${JSON.stringify(scenario)}==='restored'){
   check(sw('sounds').getAttribute('aria-checked')==='false'&&q('#gameSoundVolume').value==='20'&&q('#backgroundMusicVolume').value==='35','Saved audio choices were not restored');
   check(document.documentElement.dataset.studentTextSize==='larger'&&document.body.classList.contains('lakbay-high-contrast')&&document.body.classList.contains('lakbay-reduce-motion'),'Saved display choices were not restored');
  }
  for(const name of ['sounds','music','motion','contrast','focus-audio']){
   const button=sw(name),before=button.getAttribute('aria-checked');button.focus();check(document.activeElement===button,'Switch cannot receive keyboard focus');button.click();check(button.getAttribute('aria-checked')!==before,'Switch does not update: '+name);
  }
  const sound=q('[data-volume-control="sounds"]')||q('[data-volume-control="sound"]'),music=q('[data-volume-control="music"]');
  check(sound&&music,'Independent volume controls missing');sound.value='20';sound.dispatchEvent(new Event('input',{bubbles:true}));music.value='35';music.dispatchEvent(new Event('input',{bubbles:true}));
  check(uiSoundVolume===.2&&backgroundMusicVolume===.35,'Volumes interfere with one another');
  check(sound.closest('.settings-volume-row').querySelector('output').textContent==='20%'&&music.closest('.settings-volume-row').querySelector('output').textContent==='35%','Volume labels are stale');
  const reading=q('[data-reading-size]');reading.value='larger';reading.dispatchEvent(new Event('change',{bubbles:true}));check(document.documentElement.dataset.studentTextSize==='larger','Reading size did not apply');
  uiFocusAudioEnabled=true;applyPageAudioFocus();
  check(getPageAudioFocusMode()===(${JSON.stringify(scenario)}==='reading'?'reading':${JSON.stringify(scenario)}==='focus'?'focus':'normal'),'Page audio focus mode incorrect');
  document.dispatchEvent(new CustomEvent('lakbay:daily-focus',{detail:{active:true}}));check(backgroundMusicFocusLevel===0,'Daily Challenge did not mute background music');
  document.dispatchEvent(new CustomEvent('lakbay:daily-focus',{detail:{active:false}}));check(backgroundMusicFocusLevel===(${JSON.stringify(scenario)}==='reading'?.28:${JSON.stringify(scenario)}==='focus'?0:1),'Focus level did not restore');
  if(!['reading','focus'].includes(${JSON.stringify(scenario)}))check(!q('[data-music-status]').textContent.includes('paused while you focus'),'Finished focus activity left a stale paused message');
  check(document.documentElement.scrollWidth<=innerWidth+1,'Settings overflow desktop at extra-large text');
  for(const control of document.querySelectorAll('.settings-switch,.settings-reading-control,.settings-preview-button')){const rect=control.getBoundingClientRect();check(rect.width>0&&rect.left>=0&&rect.right<=innerWidth+1,'A preference control is clipped');}
  q('[data-preferences-reset]').click();check(uiSoundVolume===.85&&backgroundMusicVolume===.8&&document.documentElement.dataset.studentTextSize==='standard','Reset did not restore defaults');
  check(!document.body.classList.contains('lakbay-high-contrast')&&!document.body.classList.contains('lakbay-reduce-motion'),'Reset left display preferences enabled');
  if(['blocked','write-blocked'].includes(${JSON.stringify(scenario)})){check(!q('.settings-saved-note').textContent.includes('save automatically'),'Blocked storage still claims preferences save automatically');check(q('.settings-storage-badge strong').textContent==='For this visit only','Storage badge still promises persistence');}
  else check(localStorage.getItem('lakbay-ui-sound-volume')==='85'&&localStorage.getItem('lakbay-background-music-volume')==='80','Reset defaults were not persisted');
  if(${JSON.stringify(scenario)}!=='focus'){q('[data-music-start]').click();await new Promise(resolve=>setTimeout(resolve,0));check(q('[data-music-status]').textContent.includes(${scenario==='autoplay-blocked'?"'browser paused playback'":"'does not support'"}),'Unavailable or blocked audio lacks clear feedback');}
  check(!fixtureErrors.length,'Uncaught browser errors: '+fixtureErrors.join('; '));
  if(${JSON.stringify(scenario)}==='restored'){reading.value='larger';reading.dispatchEvent(new Event('change',{bubbles:true}));}
  document.activeElement?.blur();document.querySelector('main').scrollTop=0;window.scrollTo({top:0,behavior:'instant'});await new Promise(resolve=>setTimeout(resolve,300));
  document.getElementById('result').textContent='PASS: '+${JSON.stringify(scenario)}+' settings controls, independent volumes, reading, focus, reset, layout and safe recovery';
 })().catch(error=>{document.getElementById('result').textContent='FAIL: '+error.message;});`;
 const html=original.replace('</head>','<style>'+css+'</style></head>').replace('</body>','<output id="result" style="position:fixed;bottom:0;right:0;background:#10263f;color:#edd194;z-index:9999">RUNNING</output><script>'+setup+'\n'+runtime+'\n'+script+'</script></body>');
 const file=path.join(folder,page),screenshot=path.join(folder,'settings.png');fs.writeFileSync(file,html);
 const result=spawnSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--window-size='+width+',1400','--user-data-dir='+path.join(folder,'browser'),'--screenshot='+screenshot,'--dump-dom','--virtual-time-budget=3000','file:///'+file.replaceAll('\\','/')],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true});
 const message=result.stdout?.match(/<output id="result"[^>]*>([^<]+)<\/output>/)?.[1]||result.error?.message||'FAIL: no browser result';console.log(scenario+': '+message);console.log('Screenshot: '+screenshot);const passed=result.status===0&&message.startsWith('PASS:');results.push({scenario,page,width,status:passed?'pass':'fail',message,screenshot});if(!passed)failed=true;
}
fs.writeFileSync(path.join(root,'docs/validation/student-settings-local.json'),JSON.stringify({checkedAt:new Date().toISOString(),mode:'offline-chrome-real-preferences-code',audio:'Unavailable AudioContext or simulated autoplay refusal; no listening/sound-quality judgment',status:failed?'fail':'pass',cases:results},null,2)+'\n');
console.log(failed?'FAIL: desktop settings acceptance':'PASS: seven desktop settings scenarios (mocked audio; no Firebase)');process.exitCode=failed?1:0;
