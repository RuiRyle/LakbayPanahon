// One authored activity at a time. Grading and persistence remain in story.js.
(() => {
    const card = document.getElementById('storyReadingCard');
    const tip = document.getElementById('missionBayaniTip');
    const oldNav = document.getElementById('missionQuestSteps');
    if (!card || !tip) return;
    document.body.classList.add('simple-lesson');
    oldNav.hidden = true;
    const flow = document.createElement('div');
    flow.className = 'lesson-flow';
    const counter = document.createElement('p');
    counter.className = 'lesson-step-count';
    counter.setAttribute('role','status');
    card.before(counter);
    const goal=document.createElement('section');goal.className='lesson-goal';goal.hidden=true;
    document.getElementById('storyText').before(goal);
    const understanding=document.createElement('section');understanding.id='lessonUnderstanding';understanding.hidden=true;
    document.getElementById('storyText').after(understanding);
    const supporting=['storyDiscovery','storyKeyTerm','historicalInsight'].map(id=>document.getElementById(id)).filter(Boolean);
    const sceneImage=document.getElementById('storySceneImage');
    const enlarge=document.createElement('button');enlarge.type='button';enlarge.className='lesson-image-open';enlarge.textContent='View larger';
    document.getElementById('storyVisual').append(enlarge);
    const viewer=window.LakbayImageViewer?.create({getImage:()=>sceneImage,getCaption:()=>document.getElementById('storyVisualCaption').textContent});
    enlarge.addEventListener('click',()=>viewer?.open(enlarge));
    sceneImage.setAttribute('role','button');sceneImage.setAttribute('aria-haspopup','dialog');sceneImage.tabIndex=0;
    sceneImage.addEventListener('click',()=>viewer?.open(sceneImage));
    sceneImage.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();viewer?.open(sceneImage);}
    });
    const review=document.createElement('details');review.className='lesson-review';review.hidden=true;
    const back = document.createElement('button');
    const next = document.createElement('button');
    back.type = next.type = 'button';
    back.className = 'text-button';
    next.className = 'begin-mission-button';
    back.textContent = 'Back';
    flow.append(back,next);
    card.querySelector('.story-reading-content').append(review,document.querySelector('.mission-bayani'),flow);
    const ids = ['storyText','lessonUnderstanding','storyExplore',
        'storyClueHunt','storyTradeActivity','storyRouteActivity','storyExhibitActivity','storyDecision','storyQuickCheck'];
    const labels = ['Read the story','Understand the idea','Explore the clues',
        'Use the clues','Plan an exchange','Choose a route','Build your exhibit','Make a choice','Check your understanding'];
    function block(title,text) {
        const section=document.createElement('section');section.className='lesson-explanation';
        const heading=document.createElement('h3');heading.textContent=title;
        const paragraph=document.createElement('p');paragraph.textContent=text;section.append(heading,paragraph);return section;
    }
    function prepareTeaching(teaching={}) {
        goal.replaceChildren();const goalText=teaching.goal||teaching.goals?.[0];goal.hidden=!goalText;
        if(!goal.hidden){
            const label=document.createElement('strong');label.textContent='Your lesson goal';const text=document.createElement('p');text.textContent=goalText;goal.append(label,text);
            if(teaching.goals?.length>1){
                const all=document.createElement('details');all.className='lesson-goal-details';const summary=document.createElement('summary');summary.textContent='All lesson goals';const list=document.createElement('ul');
                for(const item of teaching.goals){const entry=document.createElement('li');entry.textContent=item;list.append(entry);}all.append(summary,list);goal.append(all);
            }
        }
        understanding.replaceChildren();
        const help=teaching.help;
        if(help?.explanation)understanding.append(block('The key idea',help.explanation));
        if(typeof help?.example==='string'&&help.example.trim()){const example=block('An example',help.example);example.classList.add('lesson-example');understanding.append(example);}
        if(Array.isArray(help?.vocabulary)){
            for(const word of help.vocabulary){if(typeof word.term==='string'&&typeof word.definition==='string')understanding.append(block(word.term,word.definition));}
        }
        // Keep authored discoveries, terms and insights together instead of separate pages.
        const notes=document.createElement('details');notes.className='lesson-review';const notesLabel=document.createElement('summary');notesLabel.textContent='More detail from this scene';notes.append(notesLabel);
        for(const node of supporting){node.classList.remove('lesson-shelved');(help?.explanation?notes:understanding).append(node);}
        if(help?.explanation&&supporting.some(node=>!node.hidden))understanding.append(notes);
        understanding.hidden=!help?.explanation&&!supporting.some(node=>!node.hidden);
        review.replaceChildren();review.open=false;
        const summary=document.createElement('summary');summary.textContent='Review the lesson notes';review.append(summary);
        if(help?.explanation)review.append(block('The key idea',help.explanation));
        if(typeof help?.example==='string'&&help.example.trim())review.append(block('An example',help.example));
        if(teaching.content)review.append(block('Story notes',teaching.content));
    }
    let state = {}, sceneId, activeId = 'storyText', reading = {index:0,total:1}, queued = false;
    const available = () => ids.filter(id => {
        const node = document.getElementById(id);
        return node && !node.hidden && node.textContent.trim();
    });
    function render() {
        queued = false;
        const units = available();
        if (!units.includes(activeId)) activeId = units[0];
        const index = units.indexOf(activeId);
        for (const id of ids) document.getElementById(id)?.classList.toggle('lesson-shelved',id !== activeId);
        const isRead = activeId === 'storyText';
        goal.classList.toggle('lesson-shelved',!isRead);
        const hideReview=isRead||activeId==='lessonUnderstanding'||card.hidden;
        if(review.hidden!==hideReview)review.hidden=hideReview;
        const sceneHeading=document.getElementById('sceneTitle');
        const headingText=isRead?state.teaching?.title:labels[ids.indexOf(activeId)]||state.teaching?.title;
        if(sceneHeading&&headingText&&sceneHeading.textContent!==headingText)sceneHeading.textContent=headingText;
        card.classList.toggle('lesson-reading',isRead);
        const hideEnlarge=!viewer||typeof viewer.dialog.showModal!=='function'||sceneImage.hidden||!sceneImage.getAttribute('src');
        if(enlarge.hidden!==hideEnlarge)enlarge.hidden=hideEnlarge;
        card.querySelector('.story-beat-toolbar')?.classList.toggle('lesson-shelved',!isRead);
        card.querySelector('.story-ai-assistance')?.classList.toggle('lesson-shelved',!isRead);
        const saver=document.getElementById('sceneEvidenceSaver');
        if(saver && !saver.parentElement.classList.contains('lesson-journal-options')){
            document.querySelector('.lesson-journal-options')?.remove();
            const details=document.createElement('details');details.className='lesson-journal-options';
            const summary=document.createElement('summary');summary.textContent='Keep these clues (optional)';
            saver.before(details);details.append(summary,saver);
        }
        saver?.parentElement.classList.toggle('lesson-shelved',activeId !== 'storyExplore');
        counter.hidden = flow.hidden = card.hidden || !units.length;
        counter.textContent = `Activity ${index+1} of ${units.length} · ${labels[ids.indexOf(activeId)] || 'Learn'}`;
        const pending = state.completed?.[activeId] === false;
        document.querySelector('.mission-bayani').classList.toggle('is-ready',!pending && !isRead);
        next.disabled = pending;
        const moreReading = isRead && reading.index < reading.total-1;
        next.textContent = moreReading ? 'Next part' : index < units.length-1 ? 'Continue' : 'Finish this scene';
        back.disabled = index <= 0 && (!isRead || reading.index === 0) && document.getElementById('previousStoryButton').disabled;
        tip.textContent = card.hidden ? 'Well done! Review what you learned, then try the mission quiz.'
            : isRead ? 'Start with this short part of the story.'
            : pending ? (activeId === state.targetId ? state.tip : 'Complete this activity, then continue.')
            : 'Take your time. Continue when you are ready.';
    }
    function schedule() { if (!queued) { queued=true;queueMicrotask(render); } }
    function move(id) {
        document.dispatchEvent(new CustomEvent('mission-reading-stop'));
        activeId = id;render();
        const target = document.getElementById(activeId);
        if(target){target.tabIndex=-1;target.focus({preventScroll:true});}
        counter.scrollIntoView({block:'start',behavior:'auto'});
    }
    next.addEventListener('click',()=>{
        if(next.disabled)return;
        if(activeId==='storyText' && reading.index<reading.total-1){
            document.dispatchEvent(new CustomEvent('mission-reading-command',{detail:'next'}));return;
        }
        const units=available(),index=units.indexOf(activeId);
        if(index<units.length-1)move(units[index+1]);
        else if(!document.getElementById('continueStoryButton').disabled)document.getElementById('continueStoryButton').click();
        else if(state.targetId)move(state.targetId);
    });
    back.addEventListener('click',()=>{
        if(activeId==='storyText'&&reading.index>0){
            document.dispatchEvent(new CustomEvent('mission-reading-command',{detail:'back'}));return;
        }
        const units=available(),index=units.indexOf(activeId);
        if(index>0)move(units[index-1]);
        else document.getElementById('previousStoryButton').click();
    });
    document.addEventListener('mission-quest-update',event=>{
        const previous=state;
        state=event.detail;
        if(sceneId===state.sceneId&&Object.entries(state.completed||{}).some(([id,complete])=>complete&&previous.completed?.[id]===false))window.LakbayLessonAudio?.play('success');
        if(sceneId!==state.sceneId){activeId='storyText';sceneId=state.sceneId;reading={index:0,total:1};prepareTeaching(state.teaching);render();}
        schedule();
    });
    document.addEventListener('mission-scene-start',()=>{sceneId=undefined;activeId='storyText';viewer?.close();});
    document.addEventListener('mission-reading-state',event=>{reading=event.detail;schedule();});
    new MutationObserver(records=>{
        if(records.some(record=>!record.target.closest('.lesson-flow, .story-beat-toolbar, .mission-bayani')))schedule();
    }).observe(card,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
    new MutationObserver(()=>{
        if(document.getElementById('storyContent').hidden){
            viewer?.close();
        }
    }).observe(document.getElementById('storyContent'),{attributes:true,attributeFilter:['hidden']});
    const toggle=document.getElementById('missionMotionToggle');
    toggle.addEventListener('click',()=>{
        const paused=toggle.getAttribute('aria-pressed')!=='true';
        toggle.setAttribute('aria-pressed',String(paused));
        toggle.textContent=paused?'Animate mascot':'Pause mascot';
        document.querySelector('.mission-bayani img').src=paused?'../assets/brand/bayani-explorer-still.svg':'../assets/brand/bayani-explorer.svg';
    });
    render();
})();
