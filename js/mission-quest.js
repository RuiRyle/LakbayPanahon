// One authored activity at a time. Grading and persistence remain in story.js.
(() => {
    const card = document.getElementById('storyReadingCard');
    const tip = document.getElementById('missionBayaniTip');
    const oldNav = document.getElementById('missionQuestSteps');
    const sceneHeading = document.getElementById('sceneTitle');
    const sceneHeader = sceneHeading?.closest('.lesson-scene-header');
    if (!card || !tip || !sceneHeading) return;
    document.body.classList.add('simple-lesson');
    card.classList.add('lesson-expedition');
    oldNav.hidden = true;
    const flow = document.createElement('div');
    flow.className = 'lesson-flow';
    const status = document.createElement('div');
    status.className = 'lesson-scene-step';
    const counter = document.createElement('p');
    counter.className = 'lesson-step-count';
    counter.setAttribute('role','status');
    const stepProgress = document.createElement('progress');
    stepProgress.className = 'lesson-scene-step-progress';
    stepProgress.setAttribute('aria-hidden', 'true');
    status.append(counter, stepProgress);
    if (sceneHeader) sceneHeader.append(status);
    else card.before(status);
    const goal=document.createElement('section');goal.className='lesson-goal';goal.hidden=true;
    document.getElementById('storyText').before(goal);
    const pilot=document.createElement('div');
    pilot.className='lesson-island-pilot';pilot.hidden=true;
    document.getElementById('storyText').before(pilot);
    const scenePrompts = [
        ['Can you help a new explorer find the Philippines?', 'Start with the green islands. Look for a nearby place and the line marking the Equator.'],
        ['Which city is farther south, Cebu City or Davao City?', 'Find the north arrow first, then compare the two labelled dots.'],
        ['Find the north arrow. Which island group is farthest north?', 'Use the north arrow to compare the labels from top to bottom.'],
        ['How might living near water shape the work people do?', 'Look at the water around the islands. Think about the skills and tools people would need.'],
        ['What can this map tell you about the two cities?', 'Read the legend and compare the dots. Think about what the map leaves out.'],
        ['What can the map tell you about the islands, and what can it leave out?', 'Separate what you can see on the map from what you learned about people and their choices.']
    ];
    const islandGroups = [
        ['Luzon','Luzon is generally north of the Visayas.','47.5%','31.3%'],
        ['Visayas','The Visayas lie between Luzon and Mindanao.','52.5%','52.4%'],
        ['Mindanao','Mindanao is generally south of the Visayas.','57.6%','68.7%']
    ];
    const islandSceneNumber = id => Number(/^prologue-mission1-scene([1-6])$/.exec(id || '')?.[1] || 0);
    const mapFrame = document.createElement('div');
    mapFrame.className = 'lesson-island-map-frame';
    const mapImage = document.getElementById('storySceneImage');
    mapImage.before(mapFrame);
    mapFrame.append(mapImage);

    function renderMapEvidence(guidance) {
        const panel = document.createElement('section');
        panel.className = 'lesson-island-hint lesson-map-evidence';
        const body = document.createElement('div');
        const briefing = document.createElement('header');
        briefing.className = 'lesson-map-briefing';
        const portrait = document.createElement('img');
        portrait.src = '../assets/brand/bayani-explorer-still.svg';
        portrait.alt = '';
        portrait.width = 52;
        portrait.height = 55;
        const title = document.createElement('h3');
        title.className = 'lesson-island-question';
        panel.setAttribute('aria-labelledby', 'bayani-map-question');
        briefing.append(portrait, title);
        const choices = document.createElement('div');
        choices.className = 'lesson-map-answers';
        choices.setAttribute('role', 'group');
        title.id = 'bayani-map-question';
        title.textContent = 'Look at the map. Which island group is farthest north?';
        choices.setAttribute('aria-labelledby', title.id);
        const feedback = document.createElement('p');
        feedback.className = 'lesson-map-coaching';
        feedback.setAttribute('role', 'status');
        const replay = document.createElement('button');
        replay.type = 'button';
        replay.className = 'text-button lesson-map-replay';
        replay.textContent = 'Replay map highlight';
        replay.hidden = true;
        const reveal = (correct) => {
            mapFrame.classList.remove('is-evidence-revealed', 'is-evidence-hint');
            void mapFrame.offsetWidth;
            mapFrame.classList.add(correct ? 'is-evidence-revealed' : 'is-evidence-hint');
            mapFrame.scrollIntoView({block:'nearest', behavior:'instant'});
        };
        replay.addEventListener('click', () => reveal(true));
        for (const [label] of islandGroups) {
            const answer = document.createElement('button');
            answer.type = 'button';
            answer.textContent = label;
            answer.setAttribute('aria-pressed', 'false');
            answer.addEventListener('click', () => {
                for (const choice of choices.children) {
                    choice.setAttribute('aria-pressed', String(choice === answer));
                }
                feedback.textContent = label === 'Luzon'
                    ? 'You got it! The north arrow points up. Luzon is above the Visayas and Mindanao.'
                    : 'Try again. Find the north arrow. It points up. Which label is highest on the map?';
                replay.hidden = label !== 'Luzon';
                reveal(label === 'Luzon');
            });
            choices.append(answer);
        }
        const hint = document.createElement('details');
        const hintLabel = document.createElement('summary');
        hintLabel.textContent = 'Ask Bayani for a clue';
        const hintText = document.createElement('p');
        hintText.textContent = guidance;
        hint.append(hintLabel, hintText);
        body.append(briefing, choices, hint, feedback, replay);
        panel.append(body);
        return panel;
    }

    function renderIslandPilot(id) {
        pilot.replaceChildren();
        mapFrame.classList.remove('is-evidence-revealed', 'is-evidence-hint');
        for (const pin of mapFrame.querySelectorAll('button')) pin.remove();
        const number = islandSceneNumber(id);
        mapFrame.classList.toggle('is-interactive-map', number === 3);
        if (!number) return;
        const [prompt, guidance] = scenePrompts[number-1];
        const question = document.createElement('p');
        question.className = 'lesson-island-question';
        question.textContent = prompt;
        if (number !== 3) pilot.append(question);
        if (number === 3) {
            const choices = document.createElement('div');
            choices.className = 'lesson-island-choices';
            choices.setAttribute('role','group');
            choices.setAttribute('aria-label','Explore the island groups');
            const clue = document.createElement('p');
            const revealedDetails = new Set();
            clue.className = 'lesson-island-clue';
            clue.setAttribute('role','status');
            clue.textContent = 'Choose an island group to see a clue.';
            function selection(label, copy) {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = label;
                button.setAttribute('aria-pressed','false');
                button.addEventListener('click',()=>{
                    clue.textContent = copy;
                    if (!revealedDetails.has(label)) {
                        revealedDetails.add(label);
                        window.LakbayLessonAudio?.play('map');
                    }
                    mapFrame.classList.remove('is-evidence-revealed');
                    mapFrame.classList.toggle('is-evidence-hint', label === 'North arrow');
                    for (const option of choices.children) option.setAttribute('aria-pressed',String(option === button));
                    for (const pin of mapFrame.querySelectorAll('button')) pin.setAttribute('aria-pressed',String(pin.getAttribute('aria-label') === label));
                });
                return button;
            }
            for (const [label, copy, x, y] of islandGroups) {
                const button = selection(label, copy);
                const pin = document.createElement('button');
                pin.type = 'button';
                pin.setAttribute('aria-label',label);
                pin.setAttribute('aria-pressed','false');
                pin.style.left = x;
                pin.style.top = y;
                pin.addEventListener('click',()=>button.click());
                choices.append(button);
                mapFrame.append(pin);
            }
            const north = selection('North arrow', 'The north arrow points up. Use it to compare which label is farthest north.');
            choices.children[0].after(north);
            pilot.append(choices,clue,renderMapEvidence(guidance));
            return;
        }
        const hint = document.createElement('details');
        hint.className = 'lesson-island-hint';
        const summary = document.createElement('summary');
        summary.textContent = 'Need a hint?';
        const hintText = document.createElement('p');
        hintText.textContent = guidance;
        hint.append(summary,hintText);
        pilot.append(hint);
    }
    const understanding=document.createElement('section');understanding.id='lessonUnderstanding';understanding.hidden=true;
    const storyText=document.getElementById('storyText');
    storyText.after(understanding);
    const supporting=['storyDiscovery','storyKeyTerm','historicalInsight'].map(id=>document.getElementById(id)).filter(Boolean);
    const sceneImage=document.getElementById('storySceneImage');
    const storyVisual=document.getElementById('storyVisual');
    const enlarge=document.createElement('button');enlarge.type='button';enlarge.className='lesson-image-open';enlarge.textContent='View larger';enlarge.hidden=true;
    storyVisual.append(enlarge);
    const viewer=window.LakbayImageViewer?.create({getImage:()=>sceneImage,getCaption:()=>document.getElementById('storyVisualCaption').textContent});
    enlarge.setAttribute('aria-haspopup','dialog');
    enlarge.addEventListener('click',()=>viewer?.open(enlarge));
    sceneImage.addEventListener('click',()=>viewer?.open(enlarge));
    const review=document.createElement('details');review.className='lesson-field-notes';review.hidden=true;
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
    const activityActions = {
        lessonUnderstanding:'See the key idea',
        storyExplore:'Explore the clues',
        storyClueHunt:'Compare the clues',
        storyDecision:'Choose an answer',
        storyQuickCheck:'Try the quick check'
    };
    function block(title,text) {
        const section=document.createElement('section');section.className='lesson-explanation';
        const heading=document.createElement('h3');heading.textContent=title;
        const paragraph=document.createElement('p');paragraph.textContent=text;section.append(heading,paragraph);return section;
    }
    function prepareTeaching(teaching={}) {
        storyText.after(goal);
        goal.replaceChildren();const goalText=teaching.goal||teaching.goals?.[0];goal.hidden=!goalText;
        if(!goal.hidden){
            const label=document.createElement('strong');label.textContent='Your lesson goal';const text=document.createElement('p');text.textContent=goalText;goal.append(label,text);
            if(teaching.goals?.length>1){
                const all=document.createElement('details');all.className='lesson-goal-details';const summary=document.createElement('summary');summary.textContent='All lesson goals';const list=document.createElement('ul');
                for(const item of teaching.goals){const entry=document.createElement('li');entry.textContent=item;list.append(entry);}all.append(summary,list);goal.append(all);
            }
            const disclosure=document.createElement('details');const summary=document.createElement('summary');
            summary.textContent='Lesson goals';disclosure.append(summary,...goal.children);
            goal.append(disclosure);
        }
        understanding.replaceChildren();
        const help=teaching.help;
        const addExplanation=(parent,title,copy,kind)=>{
            const section=block(title,copy);
            section.classList.add(kind);
            parent.append(section);
        };
        const overview=document.createElement('div');
        overview.className='lesson-idea-overview';
        if(help?.explanation)addExplanation(overview,'The key idea',help.explanation,'lesson-key-idea');
        if(typeof help?.example==='string'&&help.example.trim())addExplanation(overview,'Worked example',help.example,'lesson-example');
        if(overview.childElementCount)understanding.append(overview);
        const companion = document.createElement('details');
        companion.className = 'lesson-bayani-help';
        const companionTitle = document.createElement('summary');
        const portrait = document.createElement('img');
        portrait.src = '../assets/brand/bayani-explorer-still.svg';
        portrait.alt = '';
        portrait.width = 40;
        portrait.height = 42;
        companionTitle.append(portrait, document.createTextNode('Help from Bayani'));
        companion.append(companionTitle);
        if(Array.isArray(help?.vocabulary)){
            const glossary=document.createElement('section');
            glossary.className='lesson-glossary';
            const heading=document.createElement('h3');
            heading.textContent='What these words mean';
            const definitions=document.createElement('dl');
            for(const word of help.vocabulary){
                if(typeof word?.term!=='string'||!word.term.trim()||typeof word.definition!=='string'||!word.definition.trim())continue;
                const term=document.createElement('dt');
                term.textContent=word.term;
                const definition=document.createElement('dd');
                definition.textContent=word.definition;
                const entry=document.createElement('div');
                entry.append(term,definition);
                definitions.append(entry);
            }
            if(definitions.childElementCount){glossary.append(heading,definitions);companion.append(glossary);}
        }
        if (typeof help?.guidingQuestion === 'string' && help.guidingQuestion.trim()) {
            const clue = block('A clue to look for', help.guidingQuestion.trim());
            clue.className = 'lesson-bayani-clue';
            companion.append(clue);
        }
        if (companion.children.length > 1) understanding.append(companion);
        // Keep authored discoveries, terms and insights together instead of separate pages.
        const notes=document.createElement('details');notes.className='lesson-review';const notesLabel=document.createElement('summary');notesLabel.textContent='Read the scene notes';notes.append(notesLabel);
        for(const node of supporting){node.classList.remove('lesson-shelved');(help?.explanation?notes:understanding).append(node);}
        if(help?.explanation&&supporting.some(node=>!node.hidden))understanding.append(notes);
        understanding.hidden=!help?.explanation&&!supporting.some(node=>!node.hidden);
        review.replaceChildren();review.open=false;
        const summary=document.createElement('summary');
        const icon=document.createElement('span');
        icon.className='interface-icon interface-icon--book-open';
        icon.setAttribute('aria-hidden','true');
        const title=document.createElement('span');
        title.textContent='Review the lesson notes';
        summary.append(icon,title);
        const pages=document.createElement('div');
        pages.className='lesson-field-pages';
        if(help?.explanation)addExplanation(pages,'The key idea',help.explanation,'lesson-field-key');
        if(typeof help?.example==='string'&&help.example.trim())addExplanation(pages,'Worked example',help.example,'lesson-field-example');
        if(teaching.content)addExplanation(pages,'Story notes',teaching.content,'lesson-field-story');
        for (const page of pages.children) page.classList.replace('lesson-explanation', 'lesson-field-page');
        const storyNotes = pages.querySelector('.lesson-field-story');
        if (storyNotes) {
            const paragraph = storyNotes.querySelector('p');
            const paragraphs = paragraph.textContent.trim().split(/\r?\n\s*\r?\n/).map(text => {
                const part = document.createElement('p');
                part.textContent = text;
                return part;
            });
            paragraph.replaceWith(...paragraphs);
        }
        review.append(summary,pages);
        if(document.getElementById('storyDecisionChoices')){
            const retry=document.createElement('button');
            retry.type='button';
            retry.className='text-button lesson-return-choice';
            retry.textContent='Back to my choices';
            retry.addEventListener('click',()=>{
                const choice=document.querySelector('#storyDecisionChoices button:not(:disabled)');
                if(!choice)return;
                review.open=false;
                choice.focus();
            });
            review.append(retry);
        }
    }
    let state = {}, sceneId, activeId = 'storyText', reading = {index:0,total:1}, queued = false;
    let displayedStep;
    const arrivals = new WeakMap();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function animateArrival(element) {
        if (!element?.animate || reducedMotion.matches || document.querySelector('.lakbay-reduce-motion')) return;
        arrivals.get(element)?.cancel();
        arrivals.set(element, element.animate(
            [{opacity:.8, transform:'translateX(8px)'}, {opacity:1, transform:'translateX(0)'}],
            {duration:220, easing:'ease-out'}
        ));
    }
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
        card.classList.toggle('lesson-field-desk', isRead || ['lessonUnderstanding','storyExplore','storyDecision'].includes(activeId));
        card.style.setProperty('--lesson-part-progress',`${100*(reading.expanded?1:(reading.index+1)/Math.max(1,reading.total))}%`);
        const investigatingMap = islandSceneNumber(sceneId) === 3 && activeId === 'lessonUnderstanding';
        const hidePilot=(!isRead && !investigatingMap)||!pilot.childElementCount;
        if(pilot.hidden!==hidePilot)pilot.hidden=hidePilot;
        goal.classList.toggle('lesson-shelved',!isRead);
        const hideReview=isRead||activeId==='lessonUnderstanding'||card.hidden||!review.querySelector('.lesson-field-page');
        if(review.hidden!==hideReview)review.hidden=hideReview;
        card.classList.toggle('lesson-reading',isRead);
        card.classList.toggle('lesson-understanding',activeId==='lessonUnderstanding');
        const artworkState=storyVisual.dataset.artworkState;
        const hideEnlarge=!viewer||typeof viewer.dialog.showModal!=='function'||!['loading','ready','unavailable'].includes(artworkState);
        if(enlarge.hidden!==hideEnlarge)enlarge.hidden=hideEnlarge;
        if(enlarge.disabled!==sceneImage.hidden)enlarge.disabled=sceneImage.hidden;
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
        const hideFlow = card.hidden || !units.length;
        if (status.hidden !== hideFlow) status.hidden = hideFlow;
        flow.hidden = hideFlow;
        const activityLabel=labels[ids.indexOf(activeId)]||'Learn';
        const statusText = `${activityLabel} · Step ${index+1} of ${units.length}`;
        if (counter.textContent !== statusText) counter.textContent = statusText;
        stepProgress.max = Math.max(1, units.length);
        stepProgress.value = index + 1;
        const pending = state.completed?.[activeId] === false;
        document.querySelector('.mission-bayani').classList.toggle('is-ready',!pending && !isRead);
        next.disabled = pending;
        const moreReading = isRead && !reading.expanded && reading.index < reading.total-1;
        const nextId=units[index+1];
        next.textContent = pending ? 'Continue' : moreReading ? 'Read on'
            : nextId ? (activityActions[nextId] || labels[ids.indexOf(nextId)])
            : state.lastScene ? 'Finish lesson' : 'Next scene';
        const firstStep = index <= 0 && (!isRead || reading.expanded || reading.index === 0);
        const hideBack = firstStep && document.getElementById('previousStoryButton').disabled;
        if (back.hidden !== hideBack) back.hidden = hideBack;
        back.disabled = hideBack;
        back.textContent = firstStep ? 'Previous scene' : 'Back';
        const nextTip = card.hidden ? 'Well done! Review what you learned, then try the mission quiz.'
            : pending ? (activeId === state.targetId ? state.tip : 'Complete this activity to continue.')
            : '';
        const bayani = tip.closest('.mission-bayani');
        if (bayani.hidden !== !nextTip) bayani.hidden = !nextTip;
        if (tip.textContent !== nextTip) {
            tip.textContent = nextTip;
            const portrait = tip.closest('.mission-bayani')?.querySelector('img');
            if (!card.hidden && document.getElementById('missionMotionToggle')?.getAttribute('aria-pressed') !== 'true' &&
                !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
                !document.body.classList.contains('lakbay-reduce-motion')) {
                portrait?.animate([{ translate: '0 0' }, { translate: '0 -3px' }, { translate: '0 0' }],
                    { duration: 260, easing: 'ease-out' });
            }
        }
        if (!card.hidden && sceneId && activeId) {
            const step = JSON.stringify([sceneId, activeId, isRead && reading.index, isRead && Boolean(reading.expanded)]);
            if (displayedStep && displayedStep !== step) {
                animateArrival(document.getElementById(activeId));
            }
            displayedStep = step;
        }
    }
    function schedule() { if (!queued) { queued=true;queueMicrotask(render); } }
    function move(id) {
        document.dispatchEvent(new CustomEvent('mission-reading-stop'));
        activeId = id;render();
        const target = document.getElementById(activeId);
        if (!target) return;
        const heading = [...target.querySelectorAll('h3, h4')].find(element => element.getClientRects().length) || target;
        heading.tabIndex = -1;
        heading.focus({preventScroll:true});
        target.scrollIntoView({block:'start',behavior:'instant'});
    }
    function moveReading(direction) {
        document.dispatchEvent(new CustomEvent('mission-reading-command',{detail:direction}));
        storyText.tabIndex = -1;
        storyText.focus({preventScroll:true});
        storyText.scrollIntoView({block:'nearest',behavior:'instant'});
    }
    next.addEventListener('click',()=>{
        if(next.disabled)return;
        if(activeId==='storyText' && !reading.expanded && reading.index<reading.total-1){
            moveReading('next');return;
        }
        const units=available(),index=units.indexOf(activeId);
        if(index<units.length-1)move(units[index+1]);
        else if(!document.getElementById('continueStoryButton').disabled)document.getElementById('continueStoryButton').click();
        else if(state.targetId)move(state.targetId);
    });
    back.addEventListener('click',()=>{
        if(activeId==='storyText'&&!reading.expanded&&reading.index>0){
            moveReading('back');return;
        }
        const units=available(),index=units.indexOf(activeId);
        if(index>0)move(units[index-1]);
        else document.getElementById('previousStoryButton').click();
    });
    document.addEventListener('mission-quest-update',event=>{
        const previous=state;
        state=event.detail;
        if(sceneId===state.sceneId&&Object.entries(state.completed||{}).some(([id,complete])=>complete&&previous.completed?.[id]===false))window.LakbayLessonAudio?.play('success');
        if (sceneId !== state.sceneId) {
            sceneId = state.sceneId;
            reading = {index:0,total:1};
            prepareTeaching(state.teaching);
            renderIslandPilot(sceneId);
            activeId = state.startAtEvidence && !understanding.hidden ? 'lessonUnderstanding' : 'storyText';
            card.querySelector('.lesson-review-bookmark')?.remove();
            if (state.reviewBookmark) {
                const bookmark = document.createElement('p');
                bookmark.className = 'lesson-review-bookmark';
                bookmark.textContent = 'Start your review here';
                document.getElementById('sceneTitle').before(bookmark);
            }
            if (activeId === 'lessonUnderstanding') {
                const help = understanding.querySelector('.lesson-bayani-help');
                if (help) help.open = true;
            }
            render();
        }
        schedule();
    });
    document.addEventListener('mission-scene-start',()=>{sceneId=undefined;activeId='storyText';viewer?.close();});
    document.addEventListener('mission-reading-state',event=>{reading=event.detail;schedule();});
    card.addEventListener('toggle',event=>{
        if (event.target instanceof HTMLDetailsElement && event.target.open) {
            for (const child of event.target.children) {
                if (child.tagName !== 'SUMMARY') animateArrival(child);
            }
        }
    },true);
    const feedbackSelector = '#storyAiExplainResponse, #storyClueHuntFeedback, #storyDecisionFeedback, #quickCheckFeedback, .lesson-map-coaching, .trade-plan-feedback';
    new MutationObserver(records=>{
        if(records.some(record=>!record.target.closest('.lesson-flow, .story-beat-toolbar, .mission-bayani')))schedule();
        const feedback = new Set(records.map(record=>record.target.closest(feedbackSelector)));
        for (const panel of feedback) {
            if (panel && !panel.closest('[hidden]') && panel.textContent.trim()) animateArrival(panel);
        }
    }).observe(card,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','data-artwork-state']});
    new MutationObserver(()=>{
        if(document.getElementById('storyContent').hidden){
            viewer?.close();
        }
    }).observe(document.getElementById('storyContent'),{attributes:true,attributeFilter:['hidden']});
    const completion = document.getElementById('storyCompleteSection');
    if (completion) {
        new MutationObserver(()=>{
            if (!completion.hidden) animateArrival(completion);
        }).observe(completion,{attributes:true,attributeFilter:['hidden']});
    }
    const toggle=document.getElementById('missionMotionToggle');
    toggle.addEventListener('click',()=>{
        const paused=toggle.getAttribute('aria-pressed')!=='true';
        toggle.setAttribute('aria-pressed',String(paused));
        toggle.textContent=paused?'Animate mascot':'Pause mascot';
        if(paused)document.querySelector('.mission-bayani img')?.getAnimations().forEach(animation=>animation.cancel());
    });
    render();
})();
