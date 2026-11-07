// Gentle, locally synthesized feedback. No audio is played on page load.
(() => {
    const key='lakbay.lesson-effects',volumeKey='lakbay.lesson-effects-volume';
    const read=(name,fallback)=>{try{return localStorage.getItem(name)??fallback;}catch{return fallback;}};
    const write=(name,value)=>{try{localStorage.setItem(name,String(value));}catch{}};
    let enabled=read(key,'on')!=='off',volume=Number(read(volumeKey,'35'));
    if(!Number.isFinite(volume))volume=35;volume=Math.min(100,Math.max(0,volume));
    let context,narrating=false,lastAt=-Infinity;
    const activeNodes=new Set();
    function silence(){for(const node of activeNodes){try{node.stop();}catch{}}activeNodes.clear();}
    function audioContext(){
        try{const Type=window.AudioContext||window.webkitAudioContext;if(!Type)return null;context??=new Type();if(context.state==='suspended')context.resume().catch(()=>{});return context;}catch{return null;}
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
        if(!enabled||narrating||document.hidden||read('lakbay-ui-sounds','on')==='off'||volume===0)return false;
        const now=performance.now();if(now-lastAt<90)return false;
        const audio=audioContext();if(!audio)return false;
        const globalVolume=Number(read('lakbay-ui-sound-volume','85'));
        const level=.09*(volume/100)*(Number.isFinite(globalVolume)?Math.min(100,Math.max(0,globalVolume))/100:.85);
        if(level<=0)return false;lastAt=now;
        if(kind==='paper')paper(audio,level);
        else if(kind==='success'){tone(audio,659.25,0,.17,level);tone(audio,880,.11,.25,level*.8);}
        else if(kind==='retry'){tone(audio,440,0,.22,level*.7);tone(audio,523.25,.14,.2,level*.55);}
        else tone(audio,587.33,0,.12,level*.65);
        return true;
    }
    window.LakbayLessonAudio={play,get enabled(){return enabled;},get narrating(){return narrating;}};
    document.addEventListener('lakbay:narration-state',event=>{narrating=Boolean(event.detail?.active);if(narrating)silence();});
    document.addEventListener('pointerdown',()=>{if(enabled&&read('lakbay-ui-sounds','on')!=='off')audioContext();},{once:true});
    document.addEventListener('keydown',()=>{if(enabled&&read('lakbay-ui-sounds','on')!=='off')audioContext();},{once:true});
    document.addEventListener('click',event=>{
        const target=event.target instanceof Element?event.target:null;
        if(target?.closest('.story-explore-choice,[data-clue]'))play('paper');
        else if(target?.closest('.lesson-flow button,#labNext,#labBack'))play('next');
    });
    document.addEventListener('lakbay:answer-correct',()=>play('success'));
    document.addEventListener('lakbay:lesson-retry',()=>play('retry'));
    window.addEventListener('pagehide',()=>{silence();context?.suspend().catch(()=>{});});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)silence();});
    const host=document.querySelector('.lesson-options')||document.querySelector('.lab-full');if(!host)return;
    const panel=document.createElement('div');panel.className='lesson-sound-options';
    const label=document.createElement('label'),toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=enabled;label.append(toggle,document.createTextNode('Game sounds'));
    const levelLabel=document.createElement('label');levelLabel.textContent='Effects volume';const slider=document.createElement('input');slider.type='range';slider.min='0';slider.max='100';slider.value=String(volume);levelLabel.append(slider);
    const sample=document.createElement('button');sample.type='button';sample.textContent='Try game sounds';
    const note=document.createElement('p');note.setAttribute('role','status');note.textContent='Soft paper and discovery sounds. Effects pause during narration.';
    toggle.addEventListener('change',()=>{enabled=toggle.checked;write(key,enabled?'on':'off');if(!enabled)silence();});
    slider.addEventListener('input',()=>{volume=Number(slider.value);write(volumeKey,volume);if(volume===0)silence();});
    sample.addEventListener('click',()=>{if(!play('success'))note.textContent=narrating?'Stop narration to try game sounds.':!enabled?'Turn on Game sounds to try them.':read('lakbay-ui-sounds','on')==='off'?'Sound effects are muted in your account Settings.':'Audio could not play, or the effects volume is set to zero.';else note.textContent='A soft discovery chime. Effects pause during narration.';});
    panel.append(label,levelLabel,sample,note);host.append(panel);
})();
