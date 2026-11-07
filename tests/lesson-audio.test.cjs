const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
function environment(preferences={}){
    const listeners=new Map(),events=[];let now=1000;
    const document={baseURI:'https://lesson.test/pages/story.html',hidden:false,querySelector:()=>null,addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},dispatchEvent(event){events.push(event);for(const fn of listeners.get(event.type)||[])fn(event);}};
    const context={document,URL,CustomEvent,Math,Number,performance:{now:()=>now},localStorage:{getItem:key=>preferences[key]??null,setItem:(key,value)=>{preferences[key]=value;}},window:{addEventListener(){}},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}}};
    context.window.SpeechSynthesisUtterance=context.SpeechSynthesisUtterance;
    return {context,events,advance(){now+=200;},run(name){vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js',name),'utf8'),context);}};
}
test('narration uses exact recorded lines, cancels stale playback, and otherwise uses device speech',()=>{
    const env=environment(),spoken=[],recordings=[];
    env.context.window.speechSynthesis={getVoices:()=>[],speak:u=>spoken.push(u),cancel(){}};
    env.context.window.LakbayBayaniVoiceClips=[{text:'Kumusta, explorer!',src:'../assets/audio/bayani/welcome.mp3'}];
    env.context.Audio=class{constructor(src){this.src=src;recordings.push(this);}play(){return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){}};
    env.run('adventure-voice.js');const narrator=env.context.window.LakbayNarrator;
    narrator.play('Kumusta, explorer!');assert.equal(recordings.length,1);assert.equal(spoken.length,0);
    let ended=0;narrator.play('A different lesson.',{onend:()=>ended++});assert.equal(recordings[0].paused,true);assert.equal(spoken[0].text,'A different lesson.');
    recordings[0].onended();assert.equal(ended,0);assert.equal(env.events.at(-1).detail.active,true);
    spoken[0].onend();assert.equal(ended,1);assert.equal(env.events.at(-1).detail.active,false);
});
test('failed recordings fall back once to device speech and unsafe clip paths are ignored',async()=>{
    const env=environment(),spoken=[];env.context.window.speechSynthesis={getVoices:()=>[],speak:u=>spoken.push(u),cancel(){}};
    env.context.window.LakbayBayaniVoiceClips=[{text:'Hello',src:'../assets/audio/bayani/missing.mp3'},{text:'Unsafe',src:'https://other.test/audio.mp3'}];
    env.context.Audio=class{play(){return Promise.reject(Error('Missing'));}pause(){}};
    env.run('adventure-voice.js');const narrator=env.context.window.LakbayNarrator;
    narrator.play('Hello');await Promise.resolve();assert.equal(spoken.length,1);assert.equal(spoken[0].text,'Hello');
    narrator.play('Unsafe');assert.equal(spoken.length,2);assert.equal(spoken[1].text,'Unsafe');
});
test('muted narration does not start a clip or device voice',()=>{
    const env=environment({'lakbay.narration-enabled':'off'});let spoken=0;env.context.window.speechSynthesis={getVoices:()=>[],speak:()=>spoken++,cancel(){}};
    env.run('adventure-voice.js');env.context.window.LakbayNarrator.play('Hello');assert.equal(spoken,0);
});
test('recorded segments play in order and cancellation prevents a queued segment from starting',()=>{
    const env=environment(),recordings=[];
    env.context.window.speechSynthesis={getVoices:()=>[],speak(){throw Error('Unexpected device fallback');},cancel(){}};
    env.context.window.LakbayBayaniVoiceClips=[{text:'First',src:'../assets/audio/bayani/first.mp3'},{text:'Second',src:'../assets/audio/bayani/second.mp3'}];
    env.context.Audio=class{constructor(src){this.src=src;recordings.push(this);}play(){return Promise.resolve();}pause(){}removeAttribute(){}};
    env.run('adventure-voice.js');let ended=0;const narrator=env.context.window.LakbayNarrator;
    narrator.play(['First','Second'],{onend:()=>ended++});assert.equal(recordings.length,1);
    recordings[0].onended();assert.equal(recordings.length,2);assert.ok(recordings[1].src.endsWith('second.mp3'));recordings[1].onended();assert.equal(ended,1);
    narrator.play(['First','Second']);narrator.stop();recordings[2].onended();assert.equal(recordings.length,3);
});
function effects(preferences={}){
    const env=environment(preferences);let created=0,started=0,stopped=0;
    const parameter=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
    const node=()=>({frequency:parameter(),gain:parameter(),connect(){},disconnect(){},start(){started++;},stop(){stopped++;}});
    env.context.window.AudioContext=class{constructor(){created++;this.state='running';this.currentTime=0;this.sampleRate=48000;this.destination={};}createOscillator(){return node();}createGain(){return node();}createBiquadFilter(){return node();}createBufferSource(){return node();}createBuffer(channels,length){return{getChannelData:()=>new Float32Array(length)};}suspend(){return Promise.resolve();}};
    env.run('lesson-game-audio.js');return {...env,audio:env.context.window.LakbayLessonAudio,counts:()=>({created,started,stopped})};
}
test('game audio is idle on load, plays after interaction, and stops/suppresses effects during speech',()=>{
    const env=effects();assert.equal(env.counts().created,0);assert.equal(env.audio.play('paper'),true);assert.equal(env.counts().started,1);
    env.context.document.dispatchEvent(new CustomEvent('lakbay:narration-state',{detail:{active:true}}));assert.equal(env.counts().stopped,1);env.advance();assert.equal(env.audio.play('success'),false);
    env.context.document.dispatchEvent(new CustomEvent('lakbay:narration-state',{detail:{active:false}}));assert.equal(env.audio.play('success'),true);assert.equal(env.counts().started,3);
});
test('game audio respects lesson mute, app-wide mute, and zero volume',()=>{
    for(const prefs of [{'lakbay.lesson-effects':'off'},{'lakbay-ui-sounds':'off'},{'lakbay.lesson-effects-volume':'0'}]){const env=effects(prefs);assert.equal(env.audio.play('success'),false);assert.equal(env.counts().created,0);}
});
