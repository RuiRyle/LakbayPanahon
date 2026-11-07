(() => {
    'use strict';
    const $ = id => document.getElementById(id);
    function make(tag, text, className) {
        const node = document.createElement(tag);
        if (text) node.textContent = text;
        if (className) node.className = className;
        return node;
    }
    const {scenes,clues,options,orderItems,goal,keyIdea,example,careReason,takeaways,narrationParts}=window.LakbayPlaygroundContent;
    let step=0, selected=null, solved=false, orderSolved=false;
    let order=['notify','record','leave'], opened=new Set(), journal=new Set(), activeClue=null;
    const speech=window.speechSynthesis;
    let illustrationImage=null;
    const imageViewer=window.LakbayImageViewer?.create({getImage:()=>illustrationImage,getCaption:()=> 'An imagined learning kit, not a photograph of a historical find.'});
    const character=window.LakbayBayaniNarration;character?.decorate($('labNarrate'),{scope:'scene'});let labSpeaking=false;
    function renderNarration(){const button=$('labNarrate'),reason=window.LakbayNarrator?.enabled===false?'off':button.disabled?'unavailable':'';if(character)character.update(button,{speaking:labSpeaking,reason});else button.textContent=reason==='off'?'Narration off':reason?'Audio unavailable':labSpeaking?'Stop story':'Hear the story';}
    function stopAudio(){if(window.LakbayNarrator)window.LakbayNarrator.stop();else speech?.cancel();$('labStop').hidden=true;labSpeaking=false;renderNarration();}
    function feedback(text,kind='success'){$('labFeedback').textContent=text;$('labFeedback').dataset.kind=kind;}
    function teachingBlock(title,text,className='lesson-explanation') {
        const block=make('section',null,className);block.append(make('h2',title),make('p',text));return block;
    }
    function reviewNotes() {
        const details=make('details',null,'lesson-review');details.append(make('summary','Review the lesson notes'));
        details.append(make('p','Context means the recorded place, layer and relationships of a find. A photograph shows appearance, but it does not replace those records.'));
        for(const clue of clues)details.append(make('p',clue.title+': '+clue.text+' '+clue.meaning));
        return details;
    }
    function renderJournal() {
        $('labJournal').replaceChildren();$('labBagCount').textContent=journal.size+' / 3';$('labJournalEmpty').hidden=journal.size>0;
        for(const id of journal){const clue=clues.find(item=>item.id===id);$('labJournal').append(make('li',clue.title+': '+clue.text+' '+clue.meaning));}
    }
    function renderSteps() {
        document.body.dataset.gameStep=String(step);$('labProgress').value=step;
        $('labProgressLabel').textContent=step===4?'Step 5 of 5 · Remember':'Step '+(step+1)+' of 5';
        $('labSteps').replaceChildren();
        ['Learn','Read evidence','Protect','Explain','Remember'].forEach((name,index)=>{
            const item=make('li',name);if(index===step)item.setAttribute('aria-current','step');$('labSteps').append(item);
        });
    }
    function visual() {
        const figure=make('figure',null,'lab-visual'),img=document.createElement('img');
        img.src='../assets/story/clue-desk.svg';img.alt='Illustrated photograph, field notebook and magnifying glass.';img.width=900;img.height=320;
        illustrationImage=img;
        const trigger=make('button',null,'lab-image-trigger');trigger.type='button';trigger.setAttribute('aria-label','View larger illustration');trigger.setAttribute('aria-haspopup','dialog');
        trigger.append(img,make('span','View larger','lab-image-hint'));trigger.addEventListener('click',()=>imageViewer?.open(trigger));
        figure.append(trigger,make('figcaption','An imagined learning kit, not a photograph of a historical find.','lab-caption'));return figure;
    }
    function syncNext() {
        const next=$('labNext');next.disabled=step===1?opened.size<3:step===2?!orderSolved:step===3?!solved:false;
        next.hidden=(step===2&&!orderSolved)||(step===3&&!solved);
        next.textContent=step===0?'Explore the notes':step===1?'Continue':step===2?'Continue':step===3?'See the takeaway':'Practise again';
        for(const id of ['labCheckOrder','labCheckExplanation']) {
            const button=$(id);if(!button)continue;
            const hide=(step===2&&orderSolved)||(step===3&&solved),focused=document.activeElement===button;
            button.hidden=hide;if(hide&&focused)next.focus({preventScroll:true});
        }
        $('labBack').hidden=step===0;
    }
    function renderClues(host) {
        const grid=make('div',null,'lab-clues'),note=make('section',null,'lab-note');
        note.id='labClueNote';note.setAttribute('aria-label','Evidence note');
        const count=make('p',opened.size+' of 3 notes opened','lab-progress-note');
        function show(clue) {
            note.replaceChildren(make('h2',clue.title),make('p',clue.text));
            const meaning=make('p',null,'clue-meaning');meaning.append(make('strong','Why it matters: '),document.createTextNode(clue.meaning));note.append(meaning);
            const save=make('button',journal.has(clue.id)?'Saved':'Save this note (optional)');save.type='button';save.disabled=journal.has(clue.id);
            save.addEventListener('click',()=>{journal.add(clue.id);save.textContent='Saved';save.disabled=true;renderJournal();});note.append(save);
        }
        for(const clue of clues) {
            const button=make('button',null,'lab-clue');button.type='button';button.dataset.clue=clue.id;
            button.setAttribute('aria-pressed',String(opened.has(clue.id)));button.setAttribute('aria-controls','labClueNote');
            button.dataset.active=String(clue.id===activeClue);button.append(make('span',clue.icon,'lab-clue-icon'),make('strong',clue.title),make('small',clue.hint));
            button.addEventListener('click',()=>{
                stopAudio();opened.add(clue.id);activeClue=clue.id;button.setAttribute('aria-pressed','true');
                for(const other of grid.children)other.dataset.active=String(other===button);
                show(clue);count.textContent=opened.size+' of 3 notes opened';syncNext();
            });grid.append(button);
        }
        host.append(grid,count,note);
        if(activeClue)show(clues.find(clue=>clue.id===activeClue));else note.append(make('p','Choose the Place note to begin, then read Layer and Care.'));
    }
    function renderOrder(host) {
        const list=make('div',null,'lab-order');
        function draw() {
            list.replaceChildren();order.forEach((id,index)=>{
                const row=make('div',null,'lab-order-row'),label=make('span');label.append(make('span',String(index+1),'lab-order-number'),make('strong',orderItems[id]));
                const controls=make('div',null,'lab-order-controls');
                for(const delta of [-1,1]) {
                    const button=make('button',delta===-1?'↑':'↓');button.type='button';
                    button.setAttribute('aria-label',(delta===-1?'Move up: ':'Move down: ')+orderItems[id]);button.disabled=index+delta<0||index+delta>=order.length;
                    button.addEventListener('click',()=>{
                        stopAudio();[order[index],order[index+delta]]=[order[index+delta],order[index]];orderSolved=false;
                        feedback('Order changed. Check your plan when you are ready.','hint');draw();syncNext();
                        list.children[index+delta].querySelector('button:not(:disabled)')?.focus({preventScroll:true});
                    });controls.append(button);
                }
                row.append(label,controls);list.append(row);
            });
        }
        host.append(teachingBlock('Why the order matters',careReason));
        draw();const check=make('button','Check my plan');check.type='button';check.id='labCheckOrder';
        check.addEventListener('click',()=>{
            orderSolved=order.join(',')==='leave,notify,record';
            feedback(orderSolved?'That protects the context: leave the object, notify site staff, then let responsible staff record its setting.':'Begin by leaving the object where it is. Next, notify responsible staff so they can decide how to record it.',orderSolved?'success':'hint');syncNext();
            window.LakbayLessonAudio?.play(orderSolved?'success':'retry');
        });host.append(list,check);
    }
    function renderExplanation(host) {
        const list=make('div',null,'lab-options'),check=make('button','Check my answer');check.type='button';check.id='labCheckExplanation';check.disabled=selected===null;
        options.forEach((option,index)=>{
            const button=make('button',null,'lab-option');button.type='button';button.dataset.option=String(index);button.setAttribute('aria-pressed',String(selected===index));
            button.append(make('span',String.fromCharCode(65+index)),make('strong',option.text));
            button.addEventListener('click',()=>{
                stopAudio();selected=index;solved=false;for(const other of list.children)other.setAttribute('aria-pressed',String(other===button));
                check.disabled=false;feedback('Check your answer to see the explanation.','hint');syncNext();
            });list.append(button);
        });
        check.addEventListener('click',()=>{solved=options[selected].correct;feedback(options[selected].hint,solved?'success':'hint');syncNext();window.LakbayLessonAudio?.play(solved?'success':'retry');});
        host.append(list,check,reviewNotes());if(solved)feedback(options[selected].hint);
    }
    function renderTransfer(host) {
        const details=make('details',null,'lesson-review');details.append(make('summary','Try a new situation'));
        details.append(make('p','A stone tool has a photograph and a cave name, but no layer record. Which question would help improve its context?'));
        const list=make('div',null,'lab-options'),status=make('p');status.setAttribute('role','status');
        ['Which layer was it found in, and what was nearby?','Could the photograph have brighter colours?'].forEach((text,index)=>{
            const button=make('button',text);button.type='button';button.dataset.transfer=String(index);
            button.addEventListener('click',()=>{status.textContent=index===0?'Yes. The layer and nearby finds add setting information that the photograph and cave name cannot replace.':'Brighter colours can help us see appearance, but they do not tell us the layer or nearby finds. Try the other question.';});list.append(button);
        });details.append(list,status);host.append(details);
    }
    function render(focus=false) {
        stopAudio();imageViewer?.close();const scene=scenes[step];$('labCaseLabel').textContent='';$('labSceneTitle').textContent=scene.title;
        $('labBrief').textContent=scene.brief;$('labGuide').textContent=scene.guide;$('labFeedback').textContent='';$('labBack').disabled=step===0;
        const host=$('labActivity');host.replaceChildren();renderSteps();
        if(step===0) {
            const goalBlock=make('section',null,'lesson-goal');goalBlock.append(make('strong','Your learning goal'),make('p',goal));host.append(goalBlock);
            host.append(teachingBlock('The key idea: context','Context means a find’s recorded place, layer and relationships to other finds. These details help connect the object to its setting.'));
            host.append(teachingBlock('An example',example,'lesson-example'));
            host.append(visual());
        }
        if(step===1)renderClues(host);
        if(step===2)renderOrder(host);
        if(step===3)renderExplanation(host);
        if(step===4) {
            host.append(make('div','✓','lab-stamp'));const list=make('ul',null,'lab-summary-list');
            takeaways.forEach(text=>list.append(make('li',text)));
            host.append(list);renderTransfer(host);
        }
        syncNext();renderJournal();if(focus)$('labSceneTitle').focus({preventScroll:true});
    }
    function restart(){stopAudio();step=0;selected=null;solved=false;orderSolved=false;order=['notify','record','leave'];opened=new Set();journal=new Set();activeClue=null;render(true);}
    $('labNext').addEventListener('click',()=>{if($('labNext').disabled)return;if(step===4){restart();return;}step++;render(true);});
    $('labBack').addEventListener('click',()=>{if(step>0){step--;render(true);}});$('labRestart').addEventListener('click',restart);
    function syncNarration(){ $('labNarrate').disabled=!(window.LakbayNarrator||speech&&window.SpeechSynthesisUtterance)||window.LakbayNarrator?.enabled===false;renderNarration(); }
    syncNarration();document.addEventListener('lakbay:narration-preference',()=>{stopAudio();syncNarration();});
    document.addEventListener('lakbay:narration-state',event=>{labSpeaking=Boolean(event.detail?.active);renderNarration();});
    $('labNarrate').addEventListener('click',()=>{
        if($('labNarrate').disabled)return;if(labSpeaking){stopAudio();return;}stopAudio();
        // Speak educational text, rather than control labels or hidden options.
        const parts=narrationParts(step,{activeClue,order});
        const failed=()=>{stopAudio();feedback('Audio could not play. The lesson text is available on screen.','hint');};
        $('labStop').hidden=true;labSpeaking=true;renderNarration();
        if(window.LakbayNarrator)window.LakbayNarrator.play(parts,{onend:stopAudio,onerror:failed});
        else {const utterance=new SpeechSynthesisUtterance(parts.join('. '));utterance.onend=stopAudio;utterance.onerror=failed;speech.speak(utterance);}
    });
    $('labStop').addEventListener('click',stopAudio);window.addEventListener('pagehide',stopAudio);
    $('labFullText').append(make('p','Context is a find’s recorded place, layer and relationships to other finds. Photographs record appearance, but do not replace this information.'));
    for(const clue of clues)$('labFullText').append(make('p',clue.title+': '+clue.text+' '+clue.meaning));
    render();
})();
