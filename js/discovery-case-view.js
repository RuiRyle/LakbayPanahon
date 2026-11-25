import {discoveryResponse,discoveryLessonUrl} from './discovery-cases.js';
const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(cls)n.className=cls;return n;};
const button=(label,fn)=>{const b=el('button',label,'discovery-choice');b.type='button';b.addEventListener('click',fn);return b;};
// Owns only its host. Disposal removes all account-specific activity state.
export function mountDiscoveryCase(host,activity,{isCurrent=()=>true}={}){
 let step=0,disposed=false,explanationDraft='';const visited=new Set(),answers=[null,null],comparison=new Map();
 const current=()=>!disposed&&isCurrent();
 function render(focus=false){
  if(!current())return;host.replaceChildren();
  const label=el('p',['1 of 3 · Examine clues','2 of 3 · Compare then and now','3 of 3 · Explain your evidence','Case complete'][step],'discovery-kicker');
  const heading=el('h3',step===3?'A discovery you can explain':activity.title);heading.tabIndex=-1;host.append(label,heading);
  const feedback=el('p','', 'discovery-feedback');feedback.setAttribute('role','status');
  if(step===0){
   host.append(el('p',activity.goal),el('p',activity.setting));
   const clues=el('div',undefined,'discovery-clues'),detail=el('p','Open each clue before deciding.','discovery-clue-note');
   activity.clues.forEach((clue,index)=>{const b=button((index+1)+'. '+clue.title,()=>{if(!current())return;visited.add(index);detail.textContent=clue.text;b.dataset.examined='true';b.setAttribute('aria-pressed','true');check.disabled=visited.size!==activity.clues.length||answers[0]===null;});b.setAttribute('aria-pressed',String(visited.has(index)));b.dataset.examined=String(visited.has(index));clues.append(b);});host.append(clues,detail,el('h4',activity.question));
   const options=el('div',undefined,'discovery-options');
   activity.claims.forEach((claim,index)=>{const b=button(claim,()=>{if(!current())return;answers[0]=index;for(const n of options.children)n.setAttribute('aria-pressed',String(n===b));check.disabled=visited.size!==activity.clues.length;feedback.textContent='';});b.setAttribute('aria-pressed',String(answers[0]===index));options.append(b);});
   const check=button('Check My Conclusion',()=>{if(!current())return;if(!discoveryResponse(activity,answers[0])){feedback.textContent='Look again: which statement stays within what the clues actually show? You can choose another answer.';return;}feedback.textContent=activity.explanation;check.disabled=true;host.append(button('Compare Then and Now',()=>{step=1;render(true);}));});check.disabled=visited.size!==activity.clues.length||answers[0]===null;host.append(options,check,feedback);
  }else if(step===1){
   host.append(el('p','Compare two simplified examples. Choose what changed or stayed similar. These scenes do not show every community.'));
   const scenes=el('div',undefined,'discovery-compare');
   for(const [period,title,alt] of [
    ['then','Then · Early community teaching model','Raised wooden houses, people exchanging goods, and a boat with a sail.'],
    ['now','Now · Present-day teaching model','Houses, people exchanging goods, and a powered boat with a cabin.']
   ]){
    const figure=el('figure');
    const image=el('img');image.src='../assets/discovery/'+period+'-community.svg';image.alt=alt;image.width=520;image.height=320;
    const visual=el('div',undefined,'discovery-compare-visual');
    const marker=el('span','', 'discovery-compare-marker');marker.hidden=true;marker.setAttribute('aria-hidden','true');
    visual.append(image,marker);figure.append(visual,el('figcaption',title));scenes.append(figure);
   }
   const markers=[...scenes.querySelectorAll('.discovery-compare-marker')];
   const detailControls=el('div',undefined,'discovery-inline');
   detailControls.setAttribute('role','group');detailControls.setAttribute('aria-label','Choose a detail to compare');
   const explanation=el('p','','discovery-feedback');explanation.setAttribute('role','status');
   for(const [label,positions,copy] of [
    ['Compare the boats',[[78,78],[78,80]],'The early boat has a sail. The modern boat has a powered cabin. Both use the water to get from place to place.'],
    ['Compare the homes',[[20,47],[20,47]],'The early home is raised on posts. The modern home shown here has walls that reach the ground. Both give people a place to live.'],
    ['Compare the goods',[[37,60],[37,60]],'Both scenes show goods on a table. The goods look different, and people still meet to exchange them.']
   ]){
    const control=button(label,()=>{
     if(!current())return;
     for(const item of detailControls.children)item.setAttribute('aria-pressed',String(item===control));
     markers.forEach((marker,index)=>{
      const [x,y]=positions[index];
      marker.style.setProperty('--detail-x',x+'%');marker.style.setProperty('--detail-y',y+'%');
      marker.hidden=false;
      marker.getAnimations?.().forEach(animation=>animation.cancel());
      if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.body.classList.contains('lakbay-reduce-motion')){
       marker.animate?.([{scale:.55,opacity:.4},{scale:1,opacity:1}],{duration:240,easing:'ease-out'});
      }
     });
     explanation.textContent='Bayani: '+copy;
    });
    control.setAttribute('aria-pressed','false');detailControls.append(control);
   }
   host.append(scenes,detailControls,explanation);
   const proceed=button('Explain My Discovery',()=>{step=2;render(true);});proceed.disabled=true;
   activity.compare.forEach((item,index)=>{const row=el('div',undefined,'discovery-comparison-item');row.append(el('h4',item.label));const reply=el('p',comparison.has(index)?item.reason:'');reply.setAttribute('role','status');const choices=el('div',undefined,'discovery-inline');for(const [value,label]of [['changed','Changed'],['similar','Stayed similar']]){const b=button(label,()=>{if(!current())return;const correct=value===item.answer;for(const n of choices.children)n.setAttribute('aria-pressed',String(n===b));if(correct){comparison.set(index,value);reply.textContent='Good observation. '+item.reason;}else{comparison.delete(index);reply.textContent='Look at this feature in both scenes. '+(value==='changed'?'Could the same purpose still matter?':'Do the examples show different forms?');}proceed.disabled=comparison.size!==activity.compare.length;});b.setAttribute('aria-pressed',String(comparison.get(index)===value));choices.append(b);}row.append(choices,reply);host.append(row);});host.append(proceed);
  }else if(step===2){
   host.append(el('h4','The claim'),el('p',activity.claim),el('p','Choose the clue that gives the strongest support for this claim.'));
   const options=el('div',undefined,'discovery-options');
   const reflection=el('section',undefined,'discovery-reflection');
   reflection.hidden=true;
   activity.clues.forEach((clue,index)=>{
    const choice=button(clue.title+' — '+clue.text,()=>{
     if(!current())return;
     answers[1]=index;
     for(const option of options.children)option.setAttribute('aria-pressed',String(option===choice));
     check.disabled=false;
     feedback.textContent='';
     reflection.hidden=true;
    });
    choice.setAttribute('aria-pressed',String(answers[1]===index));options.append(choice);
   });
   const prompt=el('h4','Explain it in your own words');
   prompt.tabIndex=-1;
   const draft=el('textarea');
   draft.rows=3;
   draft.maxLength=600;
   draft.value=explanationDraft;
   draft.setAttribute('aria-label','Your explanation (optional)');
   draft.addEventListener('input',()=>{if(current())explanationDraft=draft.value;});
   const example=el('details');
   example.append(el('summary','Compare with a sample explanation'),
    el('p',activity.explanation),el('p',activity.limit));
   reflection.append(prompt,el('p','Try one sentence: “This clue supports the claim because…”'),
    draft,el('p','Optional. Your writing stays on this page and is not graded.','discovery-small'),
    example,el('p','Before you finish, check that your explanation names a clue and says how it supports the claim.'),
    button('Finish This Case',()=>{step=3;render(true);}));
   const check=button('Check My Clue',()=>{
    if(!current())return;
    if(answers[1]!==activity.support){
     feedback.textContent='Another clue connects more directly to this claim. Look for a detail that supports what the claim says.';
     return;
    }
    feedback.textContent='This clue supports the claim. Now explain the connection in your own words.';
    reflection.hidden=false;
    example.open=false;
    check.disabled=true;
    prompt.focus();
   });
   check.disabled=answers[1]===null;
   host.append(options,check,feedback,reflection);
  }else{
   host.append(el('p','You examined clues, compared examples, and found evidence for a historical claim.'),el('p','Optional practice complete. Your official mission progress and XP still come from the mission quiz.','discovery-small'));
   const lesson=el('a','Return to the Lesson','text-button');lesson.href=discoveryLessonUrl(activity);host.append(lesson,button('Try This Case Again',()=>{step=0;visited.clear();answers.fill(null);comparison.clear();explanationDraft='';render(true);}));
  }
  if(step>0&&step<3)host.append(button('Back',()=>{step--;render(true);}));
  const sources=el('details'),summary=el('summary','Where did these ideas come from?'),a=el('a',activity.source.title);a.href=activity.source.lesson?discoveryLessonUrl(activity):activity.source.url;if(!activity.source.lesson){a.target='_blank';a.rel='noopener noreferrer';}sources.append(summary,a,el('p','Teaching illustrations simplify ideas. Independent teacher review of these activities is still pending.','discovery-small'));host.append(sources);
  if(focus)heading.focus();
 }
 render();return()=>{disposed=true;host.replaceChildren();};
}
