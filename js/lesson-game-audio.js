// Gentle, locally synthesized feedback. No audio is played on page load.
(() => {
    const key='lakbay.lesson-effects',volumeKey='lakbay.lesson-effects-volume';
    const read=(name,fallback)=>{try{return localStorage.getItem(name)??fallback;}catch{return fallback;}};
    const write=(name,value)=>{try{localStorage.setItem(name,String(value));}catch{}};
    let enabled=read(key,'on')!=='off',volume=Number(read(volumeKey,'35'));
    if(!Number.isFinite(volume))volume=35;volume=Math.min(100,Math.max(0,volume));
    let context,narrating=false,lastAt=-Infinity;
    const activeNodes=new Set();
    const heardClues=new WeakSet();
    const gameSoundsEnabled=()=>window.LakbayStudentEffects?.enabled??(read('lakbay-ui-sounds','on')!=='off');
    function gameSoundVolume(){
        if(window.LakbayStudentEffects)return window.LakbayStudentEffects.volume;
        const stored=read('lakbay-ui-sound-volume','85');
        const value=stored.trim()===''?85:Number(stored);
        return Number.isFinite(value)?Math.min(100,Math.max(0,value))/100:.85;
    }
    function silence(){for(const node of activeNodes){try{node.stop();}catch{}}activeNodes.clear();}
    function audioContext(){
        try{const Type=window.AudioContext||window.webkitAudioContext;if(!Type)return null;if(!context||context.state==='closed')context=new Type();if(context.state!=='running')context.resume().catch(()=>{});return context;}catch{return null;}
    }
    function tone(audio,frequency,delay,duration,level){
        const source=audio.createOscillator(),gain=audio.createGain(),start=audio.currentTime+delay;
        source.type='sine';source.frequency.value=frequency;
        gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,level),start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
        source.connect(gain);gain.connect(audio.destination);activeNodes.add(source);
        source.onended=()=>{activeNodes.delete(source);source.disconnect();gain.disconnect();};source.start(start);source.stop(start+duration+.02);
    }
    function paper(audio,level){
        const length=Math.floor(audio.sampleRate*.13),buffer=audio.createBuffer(1,length,audio.sampleRate),data=buffer.getChannelData(0);
        for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/length);
        const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=1300;gain.gain.value=level*.55;
        source.connect(filter);filter.connect(gain);gain.connect(audio.destination);activeNodes.add(source);
        source.onended=()=>{activeNodes.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start();
    }
    function play(kind){
        const level=.09*(volume/100)*gameSoundVolume();
        if(!enabled||narrating||document.hidden||!gameSoundsEnabled()||level<=0)return false;
        const now=performance.now();if(now-lastAt<90)return false;
        const audio=audioContext();
        if(!audio||(audio.state!=='running'&&window.navigator?.userActivation?.isActive===false))return false;
        lastAt=now;
        if(kind==='paper')paper(audio,level);
        else if(kind==='map')tone(audio,784,0,.065,level*.63);
        else if(kind==='success'){tone(audio,659.25,0,.14,level*.8);tone(audio,880,.09,.2,level*.7);tone(audio,1046.5,.18,.24,level*.45);}
        else if(kind==='retry'){tone(audio,440,0,.16,level*.55);tone(audio,523.25,.1,.17,level*.45);}
        else tone(audio,587.33,0,.12,level*.65);
        return true;
    }
    window.LakbayLessonAudio={play,get enabled(){return enabled;},get narrating(){return narrating;}};
    document.addEventListener('lakbay:narration-state',event=>{narrating=Boolean(event.detail?.active);if(narrating)silence();});
    document.addEventListener('lakbay:game-sound-preference',()=>{if(!gameSoundsEnabled()||gameSoundVolume()===0)silence();});
    const unlock=event=>{
        if(event.isTrusted&&!event.repeat&&!document.hidden&&enabled&&gameSoundsEnabled()&&volume>0&&gameSoundVolume()>0)audioContext();
    };
    for(const event of ['pointerup','keydown','click'])document.addEventListener(event,unlock,true);
    document.addEventListener('click',event=>{
        const target=event.target instanceof Element?event.target:null;
        const clue=target?.closest('[data-clue]');
        if(clue&&!heardClues.has(clue)&&play('paper'))heardClues.add(clue);
    });
    document.addEventListener('lakbay:answer-correct',()=>play('success'));
    document.addEventListener('lakbay:lesson-retry',()=>play('retry'));
    window.addEventListener('pagehide',()=>{silence();context?.suspend().catch(()=>{});});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)silence();});
    const host=document.getElementById('lessonAudioSettings')||document.querySelector('.lesson-options')||document.querySelector('.lab-full');if(!host)return;
    const panel=document.createElement('div');panel.className='lesson-sound-options';
    const label=document.createElement('label'),toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=enabled;label.append(toggle,document.createTextNode('Lesson effects'));
    const levelLabel=document.createElement('label');levelLabel.textContent='Lesson effect volume';const slider=document.createElement('input');slider.type='range';slider.min='0';slider.max='100';slider.value=String(volume);levelLabel.append(slider);
    const sample=document.createElement('button');sample.type='button';sample.dataset.lessonSoundPreview='';sample.textContent='Try lesson effects';
    const note=document.createElement('p');note.setAttribute('role','status');note.textContent='Soft paper and discovery sounds. Effects pause during narration.';
    toggle.addEventListener('change',()=>{enabled=toggle.checked;write(key,enabled?'on':'off');if(!enabled)silence();});
    slider.addEventListener('input',()=>{volume=Number(slider.value);write(volumeKey,volume);if(volume===0)silence();});
    sample.addEventListener('click',()=>{if(!play('success'))note.textContent=narrating?'Stop narration to try lesson effects.':!enabled?'Turn on Lesson effects to try them.':!gameSoundsEnabled()?'Turn on Game sounds to hear lesson effects.':volume===0||gameSoundVolume()===0?'Raise the effect volume to hear the sample.':'Sound could not play. Select the sample to try again.';else note.textContent='A soft discovery chime. Effects pause during narration.';});
    panel.append(label,levelLabel,sample,note);host.append(panel);
})();
