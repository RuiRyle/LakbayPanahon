// Browser-provided voices; shared by the mission and the practice preview.
(() => {
    const speech = window.speechSynthesis;
    const key = 'lakbay.narrator-voice';
    let preferred = '';
    try { preferred = localStorage.getItem(key) || ''; } catch {}
    const read=(name,fallback)=>{try{return localStorage.getItem(name)??fallback;}catch{return fallback;}};
    const save=(name,value)=>{try{localStorage.setItem(name,String(value));}catch{}};
    let enabled=read('lakbay.narration-enabled','on')!=='off';
    let volume=Number(read('lakbay.narration-volume','80'));if(!Number.isFinite(volume))volume=80;volume=Math.min(100,Math.max(0,volume));
    let playback=null,version=0;
    const notify=active=>document.dispatchEvent(new CustomEvent('lakbay:narration-state',{detail:{active}}));
    function stopPlayback(){
        version++;
        if(playback?.audio){playback.audio.pause();playback.audio.removeAttribute('src');}
        if(playback?.utterance)speech?.cancel();
        playback=null;notify(false);
    }
    function recordedClip(text){
        const normal=value=>value.replace(/\s+/g,' ').trim();
        const clips=Array.isArray(window.LakbayBayaniVoiceClips)?window.LakbayBayaniVoiceClips:[];
        const clip=clips.find(item=>item&&typeof item.text==='string'&&normal(item.text)===normal(text));
        if(!clip||typeof clip.src!=='string')return null;
        try{
            const base=new URL('../assets/audio/bayani/',document.baseURI),url=new URL(clip.src,document.baseURI);
            return url.href.startsWith(base.href)&&/\.(mp3|wav|ogg|m4a)$/i.test(url.pathname)?url.href:null;
        }catch{return null;}
    }
    const voices = () => (speech?.getVoices() || []).filter(voice => /^en(?:-|_|$)/i.test(voice.lang));
    function selectedVoice() {
        const list = voices();
        return list.find(voice => voice.voiceURI === preferred)
            || list.find(voice => /^en[-_]PH$/i.test(voice.lang))
            || list.find(voice => /natural|premium|enhanced/i.test(voice.name))
            || list.find(voice => voice.default)
            || list[0];
    }
    window.LakbayNarrator = {
        get enabled(){return enabled;},
        stop:stopPlayback,
        play(text,{onend=()=>{},onerror=()=>{}}={}){
            stopPlayback();if(!enabled||volume===0){onend();return;}
            const parts=(Array.isArray(text)?text:[text]).filter(part=>typeof part==='string'&&part.trim());
            if(!parts.length){onend();return;}
            const token=++version;
            const finish=error=>{if(token!==version)return;version++;playback=null;notify(false);(error?onerror:onend)();};
            function deviceVoice(part,next){
                if(token!==version)return;
                if(!speech||!window.SpeechSynthesisUtterance){finish(true);return;}
                const utterance=window.LakbayNarrator.create(part);playback={utterance};
                utterance.onend=next;utterance.onerror=()=>finish(true);
                try{speech.speak(utterance);}catch{finish(true);}
            }
            notify(true);
            function next(index){
                if(token!==version)return;
                if(index>=parts.length){finish(false);return;}
                const part=parts[index],advance=()=>next(index+1),clip=recordedClip(part);
                if(clip){
                    const audio=new Audio(clip);audio.volume=volume/100;playback={audio};let failed=false;
                    const fallback=()=>{if(failed||token!==version)return;failed=true;audio.pause();deviceVoice(part,advance);};
                    audio.onended=advance;audio.onerror=fallback;audio.play().catch(fallback);
                }else deviceVoice(part,advance);
            }
            next(0);
        },
        create(text) {
            const utterance = new SpeechSynthesisUtterance(text);
            const voice = selectedVoice();
            if (voice) utterance.voice = voice;
            utterance.lang = voice?.lang || 'en-PH';
            // A slightly brighter delivery while keeping explanations unhurried.
            utterance.rate = .96;
            utterance.pitch = 1.12;
            utterance.volume=volume/100;
            return utterance;
        }
    };
    const host = document.querySelector('.lesson-options') || document.querySelector('.lab-full');
    if (!host || !speech || !window.SpeechSynthesisUtterance) return;
    const panel = document.createElement('div');panel.className = 'narrator-options';
    const label = document.createElement('label');label.textContent = 'Narrator voice';
    const select = document.createElement('select');label.append(select);
    const sample = document.createElement('button');sample.type='button';sample.textContent='Try voice';
    const note = document.createElement('p');note.textContent='Choose a voice you enjoy. Voices depend on this device.';
    const status = document.createElement('p');status.setAttribute('role','status');
    const narrationLabel=document.createElement('label'),toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=enabled;
    narrationLabel.append(toggle,document.createTextNode('Narration'));
    const volumeLabel=document.createElement('label');volumeLabel.textContent='Voice volume';const volumeControl=document.createElement('input');volumeControl.type='range';volumeControl.min='0';volumeControl.max='100';volumeControl.value=String(volume);volumeLabel.append(volumeControl);
    panel.append(narrationLabel,label,volumeLabel,sample,note,status);host.append(panel);
    function refresh() {
        const list = voices();select.replaceChildren();
        const automatic = document.createElement('option');automatic.value='';automatic.textContent='Automatic · adventure guide';select.append(automatic);
        for(const voice of list){const option=document.createElement('option');option.value=voice.voiceURI;option.textContent=`${voice.name} (${voice.lang})`;select.append(option);}
        select.value=list.some(voice=>voice.voiceURI===preferred)?preferred:'';
        note.textContent=window.LakbayBayaniVoiceClips?.length
            ? 'Try voice plays Bayani’s recorded greeting. Other lesson text uses the selected voice until its recording is added.'
            : list.length?'A bright, clear delivery. Voices depend on this device.':'Using the device voice while the voice list loads.';
    }
    const stop = () => {
        document.dispatchEvent(new CustomEvent('mission-reading-stop'));
        document.getElementById('labStop')?.click();
        speech.cancel();
        stopPlayback();
    };
    select.addEventListener('change',()=>{
        stop();preferred=select.value;
        try { localStorage.setItem(key,preferred); } catch {}
        status.textContent='Voice selected. Tap Try voice or Listen to hear it.';
    });
    toggle.addEventListener('change',()=>{enabled=toggle.checked;save('lakbay.narration-enabled',enabled?'on':'off');stop();document.dispatchEvent(new CustomEvent('lakbay:narration-preference'));});
    volumeControl.addEventListener('input',()=>{volume=Number(volumeControl.value);save('lakbay.narration-volume',volume);if(volume===0)stop();});
    sample.addEventListener('click',()=>{
        stop();
        if(!enabled){status.textContent='Turn on Narration to try a voice.';return;}
        status.textContent='Playing voice sample…';
        window.LakbayNarrator.play("Kumusta, explorer! I'm Bayani. Ready to discover Philippine history? Let's look closely at our first clue. Take your time—we'll figure it out together!",{
            onend:()=>{status.textContent='Voice sample finished. Lesson narration uses a recording when one is available.';},
            onerror:()=>{status.textContent='Audio could not play. Try another available voice.';}
        });
    });
    speech.addEventListener('voiceschanged',refresh);
    window.addEventListener('pagehide',stopPlayback);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    refresh();
})();
