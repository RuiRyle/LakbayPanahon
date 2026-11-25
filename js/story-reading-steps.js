// Presentation only: preserve authored text and existing lesson completion rules.
(() => {
    const host=document.getElementById('storyText');if(!host)return;
    const toolbar=document.createElement('div');toolbar.className='story-beat-toolbar';toolbar.setAttribute('aria-label','Reading controls');
    const count=document.createElement('span');count.setAttribute('role','status');
    const back=document.createElement('button'),next=document.createElement('button'),full=document.createElement('button'),listen=document.createElement('button');
    for(const button of [back,next,full,listen])button.type='button';
    back.textContent='← Previous part';next.textContent='Next part →';full.textContent='Read full scene';listen.textContent='Listen';
    full.className='story-full-text-toggle';
    toolbar.append(count,back,next,full,listen);host.before(toolbar);
    const character=window.LakbayBayaniNarration;character?.decorate(listen);
    let index=0,expanded=false,paragraphs=[],speaking=false,playbackVersion=0;
    const speech=window.speechSynthesis;
    function renderNarration(){const reason=window.LakbayNarrator?.enabled===false?'off':listen.disabled?'unavailable':'';if(character)character.update(listen,{speaking,reason});else listen.textContent=reason==='off'?'Narration off':reason?'Audio unavailable':speaking?'Stop story':'Hear the story';}
    function stop(){playbackVersion++;if(speaking){if(window.LakbayNarrator)window.LakbayNarrator.stop();else speech?.cancel();}speaking=false;renderNarration();}
    function update(){
        paragraphs.forEach(paragraph=>paragraph.classList.remove('story-read-along'));
        paragraphs.forEach((paragraph,i)=>{paragraph.hidden=!expanded&&i!==index;});
        toolbar.hidden=paragraphs.length===0;
        count.textContent=expanded?'Full scene':paragraphs.length>1?`Part ${index+1} of ${paragraphs.length}`:'';
        back.disabled=expanded||index===0;next.disabled=expanded||index===paragraphs.length-1;
        back.hidden=next.hidden=paragraphs.length<2;
        full.hidden=paragraphs.length<2;full.textContent=expanded?'Read in short parts':'Read full scene';full.setAttribute('aria-pressed',String(expanded));
        listen.disabled=!(window.LakbayNarrator||speech&&window.SpeechSynthesisUtterance)||window.LakbayNarrator?.enabled===false;
        renderNarration();
        document.dispatchEvent(new CustomEvent('mission-reading-state',{detail:{index,total:paragraphs.length,expanded}}));
    }
    function reset(){stop();paragraphs=[...host.children].filter(element=>element.tagName==='P');index=0;expanded=false;update();}
    back.addEventListener('click',()=>{stop();if(index>0)index--;update();});next.addEventListener('click',()=>{stop();if(index<paragraphs.length-1)index++;update();});
    full.addEventListener('click',()=>{stop();expanded=!expanded;update();});
    listen.addEventListener('click',()=>{
        if(speaking){stop();return;}if(listen.disabled)return;
        const passages=(expanded?paragraphs:[paragraphs[index]]).filter(element=>element?.textContent.trim());
        const parts=passages.map(element=>element.textContent);
        const version=++playbackVersion;
        const highlight=part=>{if(speaking&&version===playbackVersion)paragraphs.forEach(paragraph=>paragraph.classList.toggle('story-read-along',paragraph===passages[part]));};
        const failed=()=>{stop();count.textContent='Audio unavailable. Read the explanation below.';};
        speaking=true;renderNarration();
        if(window.LakbayNarrator)window.LakbayNarrator.play(parts,{onend:stop,onerror:failed,onpart:highlight});
        else {
            const readPart=part=>{
                if(!speaking||version!==playbackVersion)return;
                if(part>=parts.length){stop();return;}
                const utterance=new SpeechSynthesisUtterance(parts[part]);
                utterance.onstart=()=>highlight(part);
                utterance.onend=()=>readPart(part+1);
                utterance.onerror=()=>{if(version===playbackVersion)failed();};
                speech.speak(utterance);
            };
            readPart(0);
        }
    });
    new MutationObserver(reset).observe(host,{childList:true});window.addEventListener('pagehide',stop);reset();
    document.addEventListener('mission-reading-stop',stop);
    document.addEventListener('lakbay:narration-preference',()=>{stop();update();});
    document.addEventListener('lakbay:narration-state',event=>{speaking=Boolean(event.detail?.active);renderNarration();});
    document.addEventListener('mission-reading-command',event=>{
        stop();expanded=false;
        if(event.detail==='next'&&index<paragraphs.length-1)index++;
        if(event.detail==='back'&&index>0)index--;
        update();
    });
})();
