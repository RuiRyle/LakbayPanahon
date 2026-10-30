export function validateExhibit(activity) {
    const text=value=>typeof value==='string'&&value.trim();
    if(!activity||!text(activity.title)||!text(activity.instructions)||!text(activity.successMessage)||!text(activity.retryMessage)||
        !Array.isArray(activity.pairs)||activity.pairs.length<2||activity.pairs.length>6||
        !Array.isArray(activity.effects)||activity.effects.length!==activity.pairs.length||
        !activity.effects.every(item=>text(item.id)&&text(item.label))||new Set(activity.effects.map(item=>item.id)).size!==activity.effects.length||
        !activity.pairs.every(item=>text(item.id)&&text(item.label)&&text(item.action)&&text(item.feedback)&&activity.effects.some(effect=>effect.id===item.effectId))||
        new Set(activity.pairs.map(item=>item.id)).size!==activity.pairs.length||new Set(activity.pairs.map(item=>item.effectId)).size!==activity.pairs.length)
        throw Error('Configure the contribution exhibit in Firestore.');
    return activity;
}
export function evaluateExhibit(activity,matches={}) {
    validateExhibit(activity);
    const checks=activity.pairs.map(pair=>({id:pair.id,correct:matches?.[pair.id]===pair.effectId}));
    return {valid:checks.every(item=>item.correct),correct:checks.filter(item=>item.correct).length,total:checks.length,checks};
}
export function renderExhibit({host,activity,state,explored,onChange,onConfirmed}) {
    try{validateExhibit(activity);}catch{host.textContent='This exhibit could not be prepared. Ask your teacher for help.';return;}
    host.className='story-exhibit-activity';
    const add=(tag,value,className)=>{const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;host.append(node);return node;};
    add('span',typeof activity.eyebrow==='string'?activity.eyebrow:'BUILD YOUR EVIDENCE EXHIBIT','eyebrow');add('h3',activity.title);add('p',activity.instructions);
    add('p','Open every scene clue before matching the exhibit cards.','exhibit-clue-lock').hidden=explored;
    const matches=Object.fromEntries(activity.pairs.map(pair=>[pair.id,activity.effects.some(effect=>effect.id===state?.matches?.[pair.id])?state.matches[pair.id]:'']));
    let confirmed=state?.confirmed===true&&evaluateExhibit(activity,matches).valid;
    const board=document.createElement('div');board.className='exhibit-card-grid';host.append(board);
    const inputs=[],notes=[];
    const notify=()=>onChange({matches:{...matches},confirmed});
    for(const pair of activity.pairs){
        const card=document.createElement('article');card.className='exhibit-match-card';
        const name=document.createElement('h4');name.textContent=pair.label;
        const action=document.createElement('p');action.className='exhibit-action-copy';action.textContent=pair.action;
        const label=document.createElement('label');label.textContent=typeof activity.matchPrompt==='string'?activity.matchPrompt:'Connect this card with its meaning';
        const select=document.createElement('select');const empty=document.createElement('option');empty.value='';empty.textContent='Choose a connection';select.append(empty);
        for(const effect of activity.effects){const option=document.createElement('option');option.value=effect.id;option.textContent=effect.label;select.append(option);}
        select.value=matches[pair.id];label.append(select);
        const selected=document.createElement('p');selected.className='exhibit-selected-contribution';
        const showSelected=()=>{selected.textContent=activity.effects.find(effect=>effect.id===select.value)?.label||'';};showSelected();
        const note=document.createElement('p');note.className='exhibit-match-note';notes.push({pair,note,card});
        select.addEventListener('change',()=>{matches[pair.id]=select.value;showSelected();confirmed=false;notes.forEach(item=>{item.note.textContent='';delete item.card.dataset.correct;});feedback.textContent='Check the connections when you are ready.';notify();sync();});
        inputs.push(select);card.append(name,action,label,selected,note);board.append(card);
    }
    const check=add('button','Check My Exhibit','begin-mission-button');check.type='button';
    const revise=add('button','Revise My Exhibit','text-button');revise.type='button';
    const feedback=add('p','','exhibit-match-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
    function explain(outcome){
        feedback.textContent=outcome.correct+' of '+outcome.total+' connections fit the clues. '+(outcome.valid?activity.successMessage:activity.retryMessage);
        for(const {pair,note,card}of notes){const correct=outcome.checks.find(item=>item.id===pair.id).correct;card.dataset.correct=String(correct);note.textContent=correct?pair.feedback:'Read this card again and compare it with the connection you selected.';}
    }
    function sync(){inputs.forEach(input=>input.disabled=!explored||confirmed);check.disabled=!explored||confirmed;revise.hidden=!confirmed;}
    check.addEventListener('click',()=>{if(!explored)return;const outcome=evaluateExhibit(activity,matches);confirmed=outcome.valid;explain(outcome);notify();sync();if(confirmed)onConfirmed();});
    revise.addEventListener('click',()=>{confirmed=false;feedback.textContent='You can change the exhibit. Check it again before explaining.';notes.forEach(item=>{item.note.textContent='';delete item.card.dataset.correct;});notify();sync();});
    if(confirmed)explain(evaluateExhibit(activity,matches));sync();
}
