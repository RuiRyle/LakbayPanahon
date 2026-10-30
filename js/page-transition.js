// Animate same-origin page navigation while keeping special links native.
// Modifier clicks, external links, downloads, and same-page links retain browser behavior.
function restorePageAppearance() {
    document.body.classList.remove('page-leaving','page-entering');
    document.querySelectorAll('.route-transition-overlay').forEach(overlay=>overlay.remove());
    document.body.classList.add('page-visible');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restorePageAppearance,{once:true});
else restorePageAppearance();
window.addEventListener('pageshow',restorePageAppearance);
const PAGE_EXIT_DURATION=640;
let pageNavigationPending=false;
function shouldReduceMotion(){
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('lakbay-reduce-motion');
}
function showRouteTransition() {
    const overlay=document.createElement('div');
    overlay.className='route-transition-overlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML=`
        <div class="route-compass-loader">
            <div class="route-compass-orbit route-compass-orbit--outer"></div>
            <div class="route-compass-orbit route-compass-orbit--inner"></div>
            <div class="route-compass-orbit route-compass-orbit--arc"></div>
            <span class="route-compass-star route-compass-star--one">&#10022;</span>
            <span class="route-compass-star route-compass-star--two">&#10022;</span>
            <div class="route-transition-compass">
                <svg viewBox="0 0 160 160" focusable="false">
                    <circle cx="80" cy="80" r="61" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".36"/>
                    <circle cx="80" cy="80" r="48" fill="none" stroke="currentColor" stroke-width=".8" opacity=".25"/>
                    <path d="M80 17 91 68 80 60 69 68Z" fill="#ffe39a"/>
                    <path d="m80 143-11-51 11 8 11-8Z" fill="#829ab0"/>
                    <path d="m17 80 51-11-8 11 8 11Z" fill="#b4c4d3" opacity=".82"/>
                    <path d="m143 80-51-11 8 11-8 11Z" fill="#b4c4d3" opacity=".82"/>
                    <path d="M80 39 86 74 80 70 74 74Z" fill="#fff7df" opacity=".92"/>
                    <circle cx="80" cy="80" r="5" fill="#fff1be"/>
                </svg>
            </div>
        </div>`;
    document.body.append(overlay);
}
document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||pageNavigationPending)return;
    if(shouldReduceMotion())return;

    const clickedElement=event.target instanceof Element?event.target:null;
    const link=clickedElement?.closest('a[href]');
    if(!link||link.hasAttribute('download')||link.relList.contains('external'))return;
    const targetWindow=(link.getAttribute('target')||'').toLowerCase();
    if(targetWindow&&targetWindow!=='_self')return;

    let destination;
    try{destination=new URL(link.href,window.location.href);}catch{return;}
    if(!['http:','https:'].includes(destination.protocol)||destination.origin!==window.location.origin)return;
    if(destination.pathname===window.location.pathname&&destination.search===window.location.search)return;

    event.preventDefault();
    pageNavigationPending=true;
    document.body.classList.remove('page-visible');
    document.body.classList.add('page-leaving');
    showRouteTransition();
    window.setTimeout(()=>{
        window.location.assign(destination.href);
        // If a beforeunload prompt is canceled, restore the current page.
        window.setTimeout(()=>{
            pageNavigationPending=false;
            document.body.classList.remove('page-leaving');
            document.querySelectorAll('.route-transition-overlay').forEach(overlay=>overlay.remove());
            document.body.classList.add('page-visible');
        },900);
    },PAGE_EXIT_DURATION);
});

// Shared, accessible menu behavior across every student route.
function initializeStudentMenu() {
    const button=document.getElementById('mobileMenuButton');
    const sidebar=document.querySelector('.sidebar');
    if(!button||!sidebar||document.body.dataset.role!=='student'||button.dataset.studentMenuReady)return;
    button.dataset.studentMenuReady='true';
    if(!sidebar.id)sidebar.id='student-sidebar';
    button.setAttribute('aria-controls',sidebar.id);
    const isOpen=()=>sidebar.classList.contains('open');
    function setOpen(open,restoreFocus=false){
        sidebar.classList.remove('mobile-open');
        sidebar.classList.toggle('open',open);
        button.setAttribute('aria-expanded',String(open));
        button.setAttribute('aria-label',open?'Close navigation':'Open navigation');
        if(restoreFocus)button.focus({preventScroll:true});
    }
    setOpen(false);
    // Capture owns this click so every route changes menu state exactly once.
    document.addEventListener('click',event=>{
        if(button.contains(event.target)){
            event.preventDefault();event.stopImmediatePropagation();
            setOpen(!isOpen());
            if(isOpen())sidebar.querySelector('a,button')?.focus({preventScroll:true});
        }else if(isOpen()&&event.target instanceof Element&&event.target.closest('.sidebar .nav-link'))setOpen(false);
        else if(isOpen()&&!sidebar.contains(event.target))setOpen(false);
    },true);
    document.addEventListener('keydown',event=>{
        if(event.key==='Escape'&&isOpen()&&!document.querySelector('dialog[open]')){
            event.preventDefault();setOpen(false,true);
        }
    });
    window.addEventListener('resize',()=>{if(window.innerWidth>900)setOpen(false);});
    window.addEventListener('pagehide',()=>setOpen(false));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeStudentMenu,{once:true});
else initializeStudentMenu();

// Optional, low-volume game feedback for animated student cards and controls.
const UI_SOUND_PREFERENCE_KEY='lakbay-ui-sounds';
const UI_MOTION_PREFERENCE_KEY='lakbay-reduce-motion';
const UI_MUSIC_PREFERENCE_KEY='lakbay-background-music';
const UI_CONTRAST_PREFERENCE_KEY='lakbay-high-contrast';
const UI_FOCUS_AUDIO_PREFERENCE_KEY='lakbay-focus-audio';
const UI_SOUND_VOLUME_KEY='lakbay-ui-sound-volume';
const UI_MUSIC_VOLUME_KEY='lakbay-background-music-volume';
const UI_READING_SIZE_PREFERENCE_KEY='lakbay-reading-size';
const MUSIC_SESSION_EPOCH_KEY='lakbay-music-session-epoch-v4';
let uiSoundsEnabled=true;
let uiReducedMotionEnabled=false;
let backgroundMusicEnabled=true;
let uiFocusAudioEnabled=true;
let uiHighContrastEnabled=false;
let uiReadingSize='standard';
let uiSoundVolume=.85;
let backgroundMusicVolume=.8;
let preferenceStorageAvailable=true;
let uiAudioContext=null;
let lastCardHoverSoundAt=0;
try{
    uiSoundsEnabled=localStorage.getItem(UI_SOUND_PREFERENCE_KEY)!=='off';
    uiReducedMotionEnabled=localStorage.getItem(UI_MOTION_PREFERENCE_KEY)==='on';
    backgroundMusicEnabled=localStorage.getItem(UI_MUSIC_PREFERENCE_KEY)!=='off';
    uiFocusAudioEnabled=localStorage.getItem(UI_FOCUS_AUDIO_PREFERENCE_KEY)!=='off';
    uiHighContrastEnabled=localStorage.getItem(UI_CONTRAST_PREFERENCE_KEY)==='on';
    const savedReadingSize=localStorage.getItem(UI_READING_SIZE_PREFERENCE_KEY);
    if(['standard','large','larger'].includes(savedReadingSize))uiReadingSize=savedReadingSize;
}catch{preferenceStorageAvailable=false;}
function readAudioVolume(key,fallback){
    try{
        const stored=localStorage.getItem(key);
        if(stored===null||stored.trim()==='')return fallback;
        const parsed=Number(stored);
        return Number.isFinite(parsed)?Math.min(100,Math.max(0,parsed))/100:fallback;
    }catch{preferenceStorageAvailable=false;return fallback;}
}
function syncPreferenceStorageStatus(){
    if(preferenceStorageAvailable)return;
    const title=document.querySelector('.settings-storage-badge strong');
    const detail=document.querySelector('.settings-storage-badge small');
    if(title)title.textContent='For this visit only';
    if(detail)detail.textContent='Browser storage is unavailable.';
    const explanation=document.querySelector('.settings-note-panel p');
    if(explanation)explanation.textContent='Your choices apply for this visit, but this browser could not save them. They do not change your class or learning progress.';
    document.querySelectorAll('.settings-saved-note').forEach(note=>{
        note.textContent='Changes apply for this visit. Your browser could not save them for next time.';
        note.setAttribute('role','status');
    });
}
function saveStudentPreference(key,value){
    try{localStorage.setItem(key,value);return true;}
    catch{preferenceStorageAvailable=false;syncPreferenceStorageStatus();return false;}
}
uiSoundVolume=readAudioVolume(UI_SOUND_VOLUME_KEY,.85);
backgroundMusicVolume=readAudioVolume(UI_MUSIC_VOLUME_KEY,.8);
document.body.classList.toggle('lakbay-reduce-motion',uiReducedMotionEnabled);
document.body.classList.toggle('lakbay-high-contrast',uiHighContrastEnabled);
function applyStudentReadingSize(){
    if(document.body.dataset.role==='student')document.documentElement.dataset.studentTextSize=uiReadingSize;
}
applyStudentReadingSize();
function getSharedAudioHost(){
    if(window.self===window.top)return null;
    try{return window.parent.LakbayStudentAudio||null;}catch{return null;}
}
function getUiAudioContext(){
    try{
        const AudioContextClass=window.AudioContext||window.webkitAudioContext;
        if(!AudioContextClass)return null;
        uiAudioContext??=new AudioContextClass();
        if(uiAudioContext.state==='suspended')uiAudioContext.resume().catch(()=>{});
        return uiAudioContext;
    }catch{return null;}
}
function playUiTone(context,frequency,endFrequency,duration,volume,type='sine',delay=0){
    const start=context.currentTime+delay;
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    oscillator.type=type;
    oscillator.frequency.setValueAtTime(frequency,start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency,start+duration);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(volume,start+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start+duration+.012);
}
function playUiSound(kind,force=false){
    if((!uiSoundsEnabled&&!force)||uiSoundVolume<=0)return;
    const sharedHost=getSharedAudioHost();
    if(sharedHost){sharedHost.playSound(kind,uiSoundVolume,force);return;}
    const context=getUiAudioContext();
    if(!context)return;
    if(kind==='hover'){
        playUiTone(context,620,740,.055,.07*uiSoundVolume,'sine');
    }else if(kind==='toggle'){
        playUiTone(context,650,820,.085,.11*uiSoundVolume,'triangle');
        playUiTone(context,850,1060,.105,.085*uiSoundVolume,'sine',.055);
    }else if(kind==='correct'){
        playUiTone(context,659,784,.09,.075*uiSoundVolume,'sine');
        playUiTone(context,784,988,.12,.07*uiSoundVolume,'sine',.075);
    }else if(kind==='challenge-start'){
        playUiTone(context,196,261.63,.2,.075*uiSoundVolume,'triangle');
        playUiTone(context,392,523.25,.2,.09*uiSoundVolume,'triangle',.1);
        playUiTone(context,523.25,659.25,.26,.085*uiSoundVolume,'sine',.2);
    }else if(kind==='chapter-complete'){
        playUiTone(context,523.25,659.25,.17,.075*uiSoundVolume,'triangle');
        playUiTone(context,659.25,783.99,.17,.08*uiSoundVolume,'triangle',.12);
        playUiTone(context,783.99,1046.5,.24,.085*uiSoundVolume,'sine',.24);
        playUiTone(context,523.25,523.25,.36,.045*uiSoundVolume,'sine',.34);
        playUiTone(context,659.25,659.25,.36,.045*uiSoundVolume,'sine',.34);
        playUiTone(context,783.99,783.99,.36,.045*uiSoundVolume,'sine',.34);
    }else if(kind==='needs-practice'){
        playUiTone(context,523.25,493.88,.2,.055*uiSoundVolume,'sine');
        playUiTone(context,659.25,587.33,.24,.05*uiSoundVolume,'triangle',.13);
    }else if(kind==='artifact'){
        playUiTone(context,784,1046,.16,.105*uiSoundVolume,'sine');
        playUiTone(context,988,1318,.19,.095*uiSoundVolume,'sine',.09);
        playUiTone(context,1318,1760,.28,.085*uiSoundVolume,'sine',.18);
        playUiTone(context,587,659,.32,.045*uiSoundVolume,'triangle',.12);
    }else if(kind==='mission'){
        playUiTone(context,392,523,.15,.075*uiSoundVolume,'triangle');
        playUiTone(context,523,659,.15,.085*uiSoundVolume,'triangle',.12);
        playUiTone(context,659,784,.2,.095*uiSoundVolume,'triangle',.24);
        playUiTone(context,523,523,.34,.065*uiSoundVolume,'sine',.28);
        playUiTone(context,659,659,.34,.065*uiSoundVolume,'sine',.28);
        playUiTone(context,784,784,.4,.07*uiSoundVolume,'sine',.28);
    }else{
        playUiTone(context,520,690,.09,.12*uiSoundVolume,'triangle');
        playUiTone(context,780,930,.105,.09*uiSoundVolume,'sine',.04);
    }
}
if(document.body.dataset.role==='student'){
    document.addEventListener('lakbay:answer-correct',()=>playUiSound('correct'));
    document.addEventListener('lakbay:chapter-challenge-started',()=>playUiSound('challenge-start'));
    document.addEventListener('lakbay:chapter-completed',()=>playUiSound('chapter-complete'));
    document.addEventListener('lakbay:needs-practice',event=>{
        const delay=Math.max(0,Number(event.detail?.delayMs)||0);
        window.setTimeout(()=>playUiSound('needs-practice'),delay);
    });
    document.addEventListener('lakbay:mission-completed',()=>playUiSound('mission'));
    document.addEventListener('lakbay:artifact-found',event=>{
        const delay=Math.max(0,Number(event.detail?.delayMs)||0);
        window.setTimeout(()=>playUiSound('artifact'),delay);
    });
}
const musicStepSeconds=60/104/2;
const musicStepsPerLoop=64;
const musicChords=[
    [98,196,246.94,293.66],
    [130.81,196,261.63,329.63],
    [146.83,220,293.66,369.99],
    [98,196,246.94,392]
];
const musicMelody=[
    [0,392],[4,493.88],[8,587.33],[12,659.25],
    [16,587.33],[20,493.88],[24,440],[28,493.88],
    [32,493.88],[36,587.33],[40,659.25],[44,587.33],
    [48,493.88],[52,587.33],[56,659.25],[60,392]
];
let backgroundMusicStarted=false;
let backgroundMusicGain=null;
let backgroundMusicTimer=null;
let nextMusicStep=0;
let musicEpoch=0;
let backgroundMusicFocusLevel=1;
let transientFocusActive=false;
function scheduleMusicVoice(context,destination,frequency,start,duration,peak,options={}){
    const oscillator=context.createOscillator();
    const filter=context.createBiquadFilter();
    const gain=context.createGain();
    oscillator.type=options.wave||'sine';
    oscillator.frequency.setValueAtTime(frequency,start);
    filter.type='lowpass';
    filter.frequency.setValueAtTime(options.cutoff||1400,start);
    filter.Q.setValueAtTime(.35,start);
    const attack=options.attack??.08;
    const release=Math.min(options.release??.18,duration-attack-.01);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(peak,start+attack);
    gain.gain.setValueAtTime(peak,start+duration-release);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    oscillator.start(start);
    oscillator.stop(start+duration+.04);
}
function scheduleFluteNote(context,destination,frequency,start,duration,peak){
    const flute=context.createOscillator();
    const fluteFilter=context.createBiquadFilter();
    const fluteGain=context.createGain();
    const vibrato=context.createOscillator();
    const vibratoDepth=context.createGain();
    flute.type='triangle';
    flute.frequency.setValueAtTime(frequency,start);
    fluteFilter.type='lowpass';
    fluteFilter.frequency.setValueAtTime(1450,start);
    fluteFilter.Q.setValueAtTime(.2,start);
    fluteGain.gain.setValueAtTime(.0001,start);
    fluteGain.gain.exponentialRampToValueAtTime(peak,start+.14);
    fluteGain.gain.setValueAtTime(peak,start+duration-.38);
    fluteGain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    vibrato.type='sine';
    vibrato.frequency.setValueAtTime(4.8,start);
    vibratoDepth.gain.setValueAtTime(.65,start);
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(flute.frequency);
    flute.connect(fluteFilter);
    fluteFilter.connect(fluteGain);
    fluteGain.connect(destination);
    flute.start(start);
    vibrato.start(start);
    flute.stop(start+duration+.04);
    vibrato.stop(start+duration+.04);
}
function scheduleSaxophoneNote(context,destination,frequency,start,duration,peak){
    const reed=context.createOscillator();
    const body=context.createOscillator();
    const band=context.createBiquadFilter();
    const warmth=context.createBiquadFilter();
    const mix=context.createGain();
    const gain=context.createGain();
    const vibrato=context.createOscillator();
    const vibratoDepth=context.createGain();
    reed.type='sawtooth';
    reed.frequency.setValueAtTime(frequency,start);
    body.type='triangle';
    body.frequency.setValueAtTime(frequency,start);
    band.type='bandpass';
    band.frequency.setValueAtTime(920,start);
    band.Q.setValueAtTime(.72,start);
    warmth.type='lowpass';
    warmth.frequency.setValueAtTime(1750,start);
    warmth.Q.setValueAtTime(.18,start);
    mix.gain.setValueAtTime(.58,start);
    vibrato.type='sine';
    vibrato.frequency.setValueAtTime(5.1,start);
    vibratoDepth.gain.setValueAtTime(.32,start);
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(reed.frequency);
    vibratoDepth.connect(body.frequency);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(peak,start+.075);
    gain.gain.setValueAtTime(peak,start+duration-.13);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    reed.connect(band);
    body.connect(band);
    band.connect(warmth);
    warmth.connect(mix);
    mix.connect(gain);
    gain.connect(destination);
    reed.start(start);
    body.start(start);
    vibrato.start(start);
    reed.stop(start+duration+.04);
    body.stop(start+duration+.04);
    vibrato.stop(start+duration+.04);
}
function scheduleStringHarmony(context,destination,frequency,start,duration,peak,pan=0){
    const filter=context.createBiquadFilter();
    const gain=context.createGain();
    const stereo=context.createStereoPanner();
    filter.type='lowpass';
    filter.frequency.setValueAtTime(760,start);
    filter.Q.setValueAtTime(.25,start);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(peak,start+.8);
    gain.gain.setValueAtTime(peak,start+duration-.9);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    stereo.pan.setValueAtTime(pan,start);
    filter.connect(gain);
    gain.connect(stereo);
    stereo.connect(destination);
    [-5,5].forEach(detune=>{
        const voice=context.createOscillator();
        voice.type='sawtooth';
        voice.frequency.setValueAtTime(frequency,start);
        voice.detune.setValueAtTime(detune,start);
        voice.connect(filter);
        voice.start(start);
        voice.stop(start+duration+.04);
    });
}
function getBackgroundMusicGainLevel(){
    return Math.max(.0001,Math.min(1.4,backgroundMusicVolume*1.4*backgroundMusicFocusLevel));
}
function getPageAudioFocusMode(){
    if(!uiFocusAudioEnabled)return 'normal';
    if(transientFocusActive)return 'focus';
    const page=window.location.pathname.split('/').pop()?.toLowerCase();
    if(page==='story.html')return 'reading';
    if(['quiz.html','practice.html','chapter-challenge.html'].includes(page))return 'focus';
    return 'normal';
}
function applyPageAudioFocus(){
    if(document.body.dataset.role!=='student')return;
    const mode=getPageAudioFocusMode();
    backgroundMusicFocusLevel=mode === 'focus' ? 0 : mode === 'reading' ? .28 : 1;
    const sharedHost=getSharedAudioHost();
    if(sharedHost?.setFocusMode)sharedHost.setFocusMode(mode);
    else if(backgroundMusicGain&&uiAudioContext){
        const now=uiAudioContext.currentTime;
        backgroundMusicGain.gain.cancelScheduledValues(now);
        backgroundMusicGain.gain.setTargetAtTime(getBackgroundMusicGainLevel(),now,mode==='normal'?1:.38);
    }
    const status=document.querySelector('[data-music-status]');
    if(status&&mode==='focus')status.textContent='Music is paused while you focus. It will return when you leave this activity.';
    else if(status&&mode==='reading')status.textContent='Music is softer while you read. It will return to normal afterward.';
    else if(status&&/while you (focus|read)/.test(status.textContent)){
        const playing=backgroundMusicEnabled&&Boolean(sharedHost?.isPlaying?.()||backgroundMusicStarted);
        updateMusicStatus(!backgroundMusicEnabled?'Background music is turned off.':playing?'The adventure theme is playing.':'Press Start music to begin playback.',playing);
    }
}
if(document.body.dataset.role==='student'){
    document.addEventListener('lakbay:daily-focus',event=>{
        transientFocusActive=Boolean(event.detail?.active);
        applyPageAudioFocus();
    });
}
function getMusicEpoch(){
    try{
        const stored=Number(sessionStorage.getItem(MUSIC_SESSION_EPOCH_KEY));
        if(Number.isFinite(stored)&&stored>0&&stored<=Date.now())return stored;
        const startedAt=Date.now();
        sessionStorage.setItem(MUSIC_SESSION_EPOCH_KEY,String(startedAt));
        return startedAt;
    }catch{return Date.now();}
}
function scheduleBackgroundMusicAhead(context){
    if(!backgroundMusicGain||!backgroundMusicEnabled)return;
    const elapsed=Math.max(0,(Date.now()-musicEpoch)/1000);
    const horizon=.2;
    while(nextMusicStep*musicStepSeconds-elapsed<horizon){
        const step=nextMusicStep%musicStepsPerLoop;
        const start=Math.max(context.currentTime+.015,context.currentTime+nextMusicStep*musicStepSeconds-elapsed);
        if(step%16===0){
            const chord=musicChords[Math.floor(step/16)];
            chord.forEach((frequency,index)=>scheduleMusicVoice(context,backgroundMusicGain,frequency,start,5.52,index===0 ? .034 : .026,{wave:'sine',cutoff:index===0?460:900,attack:.8,release:.9}));
            chord.slice(1).forEach((frequency,index)=>scheduleStringHarmony(context,backgroundMusicGain,frequency,start,5.52,.014,(index-1)*.28));
        }
        const melodyNote=musicMelody.find(note=>note[0]===step);
        if(melodyNote){
            if(step%8===0) scheduleSaxophoneNote(context,backgroundMusicGain,melodyNote[1],start,1.8,.055);
            else scheduleFluteNote(context,backgroundMusicGain,melodyNote[1],start,1.8,.034);
        }
        nextMusicStep++;
    }
}
function stopBackgroundMusic(preserveSharedPlayback=false){
    const sharedHost=getSharedAudioHost();
    if(sharedHost){
        backgroundMusicStarted=false;
        if(!preserveSharedPlayback)sharedHost.stop();
        return;
    }
    if(backgroundMusicTimer){clearInterval(backgroundMusicTimer);backgroundMusicTimer=null;}
    if(!backgroundMusicGain)return;
    const previousGain=backgroundMusicGain;
    backgroundMusicGain=null;
    backgroundMusicStarted=false;
    try{
        const now=uiAudioContext?.currentTime||0;
        previousGain.gain.cancelScheduledValues(now);
        previousGain.gain.setTargetAtTime(.0001,now,.12);
        window.setTimeout(()=>{try{previousGain.disconnect();}catch{}},900);
    }catch{try{previousGain.disconnect();}catch{}}
}
function startBackgroundMusic(){
    if(!backgroundMusicEnabled){updateMusicStatus('Background music is turned off.');return;}
    if(document.body.dataset.role!=='student'||!document.body.classList.contains('authenticated'))return;
    const sharedHost=getSharedAudioHost();
    if(getPageAudioFocusMode()==='focus'&&!(sharedHost?.isPlaying?.()||backgroundMusicStarted))return;
    if(sharedHost){
        sharedHost.start().then(playing=>{
            backgroundMusicStarted=Boolean(playing);
            updateMusicStatus(playing?'The adventure theme is playing.':'Your browser paused playback. Press Start music to try again.',Boolean(playing));
        });
        return;
    }
    if(backgroundMusicStarted){updateMusicStatus('The adventure theme is playing.',true);return;}
    const context=getUiAudioContext();
    if(!context){updateMusicStatus('This browser does not support the music player.');return;}
    const resume=context.state==='suspended'?context.resume():Promise.resolve();
    resume.then(()=>{
        if(!backgroundMusicEnabled||!document.body.classList.contains('authenticated'))return;
        if(context.state!=='running'){
            updateMusicStatus('Your browser paused playback. Press Start music to try again.');
            return;
        }
        if(backgroundMusicStarted)return;
        backgroundMusicStarted=true;
        document.removeEventListener('pointerdown',handleStudentAudioUnlock,true);
        document.removeEventListener('keydown',handleStudentAudioUnlock,true);
        musicEpoch=getMusicEpoch();
        backgroundMusicGain=context.createGain();
        backgroundMusicGain.gain.setValueAtTime(.0001,context.currentTime);
        backgroundMusicGain.gain.setTargetAtTime(getBackgroundMusicGainLevel(),context.currentTime,.9);
        backgroundMusicGain.connect(context.destination);
        const elapsed=Math.max(0,(Date.now()-musicEpoch)/1000);
        nextMusicStep=Math.floor(elapsed/musicStepSeconds);
        scheduleBackgroundMusicAhead(context);
        backgroundMusicTimer=window.setInterval(()=>scheduleBackgroundMusicAhead(context),50);
        updateMusicStatus('The adventure theme is playing.',true);
    }).catch(()=>updateMusicStatus('Your browser paused playback. Press Start music to try again.'));
}
function handleStudentAudioUnlock(){
    startBackgroundMusic();
    if(backgroundMusicStarted){
        document.removeEventListener('pointerdown',handleStudentAudioUnlock,true);
        document.removeEventListener('keydown',handleStudentAudioUnlock,true);
    }
}
if(document.body.dataset.role==='student'){
    document.addEventListener('pointerdown',handleStudentAudioUnlock,true);
    document.addEventListener('keydown',handleStudentAudioUnlock,true);
    let studentPageWasAuthenticated=document.body.classList.contains('authenticated');
    const musicAuthObserver=new MutationObserver(()=>{
        const authenticated=document.body.classList.contains('authenticated');
        if(authenticated){studentPageWasAuthenticated=true;startBackgroundMusic();}
        else if(studentPageWasAuthenticated){studentPageWasAuthenticated=false;stopBackgroundMusic();}
    });
    musicAuthObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
    window.addEventListener('pagehide',()=>stopBackgroundMusic(true));
    window.addEventListener('pageshow',startBackgroundMusic);
}
function updatePreferenceSwitch(button,enabled){
    button.setAttribute('aria-checked',String(enabled));
    button.dataset.enabled=String(enabled);
    const state=button.querySelector('[data-switch-state]');
    if(state)state.textContent=enabled?'On':'Off';
}
function updateMusicStatus(message,playing=false){
    document.querySelectorAll('[data-music-status]').forEach(status=>{status.textContent=message;});
    document.querySelectorAll('[data-music-start]').forEach(button=>{
        button.disabled=playing;
        button.textContent=playing?'Music is playing':'Start music';
    });
}
function syncPreferenceSwitches(){
    document.querySelectorAll('[data-preference-switch]').forEach(button=>{
        const preference=button.dataset.preferenceSwitch;
        const enabled=preference==='sounds'?uiSoundsEnabled:preference==='music'?backgroundMusicEnabled:preference==='motion'?uiReducedMotionEnabled:preference==='contrast'?uiHighContrastEnabled:uiFocusAudioEnabled;
        updatePreferenceSwitch(button,enabled);
    });
}
function syncVolumeControls(){
    document.querySelectorAll('[data-volume-control]').forEach(input=>{
        const value=input.dataset.volumeControl==='music'?backgroundMusicVolume:uiSoundVolume;
        const percent=Math.round(value*100);
        input.value=String(percent);
        input.style.setProperty('--range-fill',`${percent}%`);
        const output=input.closest('.settings-volume-row')?.querySelector('[data-volume-output]');
        if(output)output.textContent=`${percent}%`;
    });
}
function syncReadingSizeControl(){
    document.querySelectorAll('[data-reading-size]').forEach(select=>{select.value=uiReadingSize;});
}
function addStudentSettingsLink(){
    if(document.body.dataset.role!=='student')return;
    const nav=document.querySelector('.sidebar-nav');
    if(!nav||nav.querySelector('.settings-nav-link'))return;
    const link=document.createElement('a');
    link.href='settings.html';
    link.className='nav-link settings-nav-link';
    link.innerHTML='<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="m19.4 13.5 1.1.8-1.1 1.9-1.3-.5a7.8 7.8 0 0 1-1.5.9l-.2 1.4h-2.2l-.3-1.4a7.8 7.8 0 0 1-1.7 0l-.8 1.2-1.9-1.1.5-1.3a7.8 7.8 0 0 1-.9-1.5l-1.4-.2v-2.2l1.4-.3a7.8 7.8 0 0 1 0-1.7L7.9 8.7 9 6.8l1.3.5a7.8 7.8 0 0 1 1.5-.9l.2-1.4h2.2l.3 1.4a7.8 7.8 0 0 1 1.7 0l.8-1.2 1.9 1.1-.5 1.3a7.8 7.8 0 0 1 .9 1.5l1.4.2v2.2l-1.4.3a7.8 7.8 0 0 1 0 1.7Z"/></svg></span><span>Settings</span>';
    if(window.location.pathname.endsWith('/settings.html')){
        link.classList.add('active');
        link.setAttribute('aria-current','page');
    }
    nav.append(link);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{addStudentSettingsLink();syncPreferenceSwitches();syncVolumeControls();syncReadingSizeControl();syncPreferenceStorageStatus();},{once:true});
else{addStudentSettingsLink();syncPreferenceSwitches();syncVolumeControls();syncReadingSizeControl();syncPreferenceStorageStatus();}
function resetStudentPreferences(){
    uiSoundsEnabled=true;
    uiReducedMotionEnabled=false;
    backgroundMusicEnabled=true;
    uiFocusAudioEnabled=true;
    uiHighContrastEnabled=false;
    uiReadingSize='standard';
    uiSoundVolume=.85;
    backgroundMusicVolume=.8;
    for(const [key,value] of [[UI_SOUND_PREFERENCE_KEY,'on'],[UI_MOTION_PREFERENCE_KEY,'off'],[UI_MUSIC_PREFERENCE_KEY,'on'],[UI_FOCUS_AUDIO_PREFERENCE_KEY,'on'],[UI_CONTRAST_PREFERENCE_KEY,'off'],[UI_SOUND_VOLUME_KEY,'85'],[UI_MUSIC_VOLUME_KEY,'80'],[UI_READING_SIZE_PREFERENCE_KEY,'standard']])saveStudentPreference(key,value);
    document.body.classList.remove('lakbay-reduce-motion');
    document.body.classList.remove('lakbay-high-contrast');
    applyPageAudioFocus();
    applyStudentReadingSize();
    syncPreferenceSwitches();
    syncVolumeControls();
    syncReadingSizeControl();
    const status=document.querySelector('[data-preferences-reset-status]');
    if(status)status.textContent='Your settings are back to their defaults.';
    const host=getSharedAudioHost();
    if(host){
        host.setVolume(backgroundMusicVolume);
        host.setEnabled(true).then(playing=>updateMusicStatus(playing?'The adventure theme is playing.':'Press Start music to begin playback.',Boolean(playing)));
    }else startBackgroundMusic();
}
document.addEventListener('click',event=>{
    if(document.body.dataset.role!=='student')return;
    const target=event.target instanceof Element?event.target:null;
    if(target?.closest('[data-preferences-reset]')){
        resetStudentPreferences();
        return;
    }
    if(target?.closest('[data-sound-preview]')){
        playUiSound('toggle',true);
        return;
    }
    if(target?.closest('[data-music-start]')){
        if(!backgroundMusicEnabled){
            backgroundMusicEnabled=true;
            saveStudentPreference(UI_MUSIC_PREFERENCE_KEY,'on');
            syncPreferenceSwitches();
            getSharedAudioHost()?.setEnabled(true);
        }
        startBackgroundMusic();
        return;
    }
    const preferenceSwitch=target?.closest('[data-preference-switch]');
    if(preferenceSwitch){
        if(preferenceSwitch.dataset.preferenceSwitch==='sounds'){
            uiSoundsEnabled=!uiSoundsEnabled;
            saveStudentPreference(UI_SOUND_PREFERENCE_KEY,uiSoundsEnabled?'on':'off');
        }else if(preferenceSwitch.dataset.preferenceSwitch==='motion'){
            uiReducedMotionEnabled=!uiReducedMotionEnabled;
            saveStudentPreference(UI_MOTION_PREFERENCE_KEY,uiReducedMotionEnabled?'on':'off');
            document.body.classList.toggle('lakbay-reduce-motion',uiReducedMotionEnabled);
        }else if(preferenceSwitch.dataset.preferenceSwitch==='contrast'){
            uiHighContrastEnabled=!uiHighContrastEnabled;
            saveStudentPreference(UI_CONTRAST_PREFERENCE_KEY,uiHighContrastEnabled?'on':'off');
            document.body.classList.toggle('lakbay-high-contrast',uiHighContrastEnabled);
        }else if(preferenceSwitch.dataset.preferenceSwitch==='focus-audio'){
            uiFocusAudioEnabled=!uiFocusAudioEnabled;
            saveStudentPreference(UI_FOCUS_AUDIO_PREFERENCE_KEY,uiFocusAudioEnabled?'on':'off');
            applyPageAudioFocus();
        }else if(preferenceSwitch.dataset.preferenceSwitch==='music'){
            backgroundMusicEnabled=!backgroundMusicEnabled;
            saveStudentPreference(UI_MUSIC_PREFERENCE_KEY,backgroundMusicEnabled?'on':'off');
            const sharedHost=getSharedAudioHost();
            if(sharedHost){
                sharedHost.setEnabled(backgroundMusicEnabled).then(playing=>{
                    backgroundMusicStarted=Boolean(playing);
                    updateMusicStatus(playing?'The adventure theme is playing.':backgroundMusicEnabled?'Press Start music to begin playback.':'Background music is turned off.',Boolean(playing));
                });
            }else if(backgroundMusicEnabled)startBackgroundMusic();
            else{stopBackgroundMusic();updateMusicStatus('Background music is turned off.');}
        }
        syncPreferenceSwitches();
        if(uiSoundsEnabled)playUiSound('toggle');
        return;
    }
    if(uiSoundsEnabled&&target?.closest('#beginChallengeButton'))return;
    if(uiSoundsEnabled&&target?.closest('a[href],button:not(:disabled),[role="button"]:not([aria-disabled="true"]),summary,input[type="checkbox"]:not(:disabled),input[type="radio"]:not(:disabled)'))playUiSound('activate');
},true);
document.addEventListener('change',event=>{
    if(document.body.dataset.role!=='student')return;
    const select=event.target instanceof Element?event.target.closest('[data-reading-size]'):null;
    if(!select)return;
    const value=['standard','large','larger'].includes(select.value)?select.value:'standard';
    uiReadingSize=value;
    saveStudentPreference(UI_READING_SIZE_PREFERENCE_KEY,value);
    applyStudentReadingSize();
},true);
document.addEventListener('input',event=>{
    if(document.body.dataset.role!=='student')return;
    const input=event.target instanceof Element?event.target.closest('[data-volume-control]'):null;
    if(!input)return;
    const percent=Math.min(100,Math.max(0,Number(input.value)||0));
    const value=percent/100;
    if(input.dataset.volumeControl==='music'){
        backgroundMusicVolume=value;
        saveStudentPreference(UI_MUSIC_VOLUME_KEY,String(percent));
        const sharedHost=getSharedAudioHost();
        if(sharedHost)sharedHost.setVolume(value);
        else if(backgroundMusicGain&&uiAudioContext){
            const now=uiAudioContext.currentTime;
            backgroundMusicGain.gain.cancelScheduledValues(now);
            backgroundMusicGain.gain.setTargetAtTime(getBackgroundMusicGainLevel(),now,.08);
        }
    }else{
        uiSoundVolume=value;
        saveStudentPreference(UI_SOUND_VOLUME_KEY,String(percent));
    }
    syncVolumeControls();
},true);
const movingCardSelector='.dashboard-card,.stat-card,.home-lesson-row,.home-destinations>a,.home-collection-shelves>a,.journey-stats article,.journey-topic-card,.journey-chapter summary,.chapter-card,.era-card,.achievement-summary-card,.achievement-badge-card,.achievement-artifact-card,.evidence-journal-card,.class-assignment,.mission-path-item,.mission-step,.story-reading-card,.practice-card,.quiz-question-card,.chapter-challenge-intro,.feature-card,.destination-card,.student-class-card';
document.addEventListener('pointerover',event=>{
    if(!uiSoundsEnabled||document.body.dataset.role!=='student'||event.pointerType!=='mouse')return;
    const target=event.target instanceof Element?event.target:null;
    const card=target?.closest(movingCardSelector);
    if(!card)return;
    const previous=event.relatedTarget instanceof Element?event.relatedTarget.closest(movingCardSelector):null;
    if(previous===card)return;
    const style=getComputedStyle(card);
    if(!style.transitionDuration.split(',').some(value=>parseFloat(value)>0))return;
    const now=performance.now();
    if(now-lastCardHoverSoundAt<260)return;
    lastCardHoverSoundAt=now;
    playUiSound('hover');
},true);
if(document.body.dataset.role==='student'){
    applyPageAudioFocus();
    startBackgroundMusic();
}
