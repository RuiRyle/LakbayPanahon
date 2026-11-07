import {discoveryResponse,discoveryLessonUrl} from './discovery-cases.js';
const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(cls)n.className=cls;return n;};
const button=(label,fn)=>{const b=el('button',label,'discovery-choice');b.type='button';b.addEventListener('click',fn);return b;};
// Owns only its host. Disposal removes all account-specific activity state.
export function mountDiscoveryCase(host,activity,{isCurrent=()=>true}={}){
 let step=0,disposed=false;const visited=new Set(),answers=[null,null],comparison=new Map();
 const current=()=>!disposed&&isCurrent();
 function render(focus=false){
  if(!current())return;host.replaceChildren();
  const label=el('p',['1 · History Detective','2 · Then and Now','3 · Explain It to Bayani','Practice complete'][step],'discovery-kicker');
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
   const scenes=el('div',undefined,'discovery-compare');for(const [period,title]of [['then','An early community · teaching model'],['now','A community today · one example']]){const figure=el('figure'),img=document.createElement('img');img.src='../assets/discovery/'+period+'-community.svg';img.alt=period==='then'?'Illustration of wooden homes, exchange of goods and a wooden boat on a water route.':'Illustration of homes, exchange of goods and a powered vessel on a water route.';img.width=520;img.height=320;figure.append(img,el('figcaption',title));scenes.append(figure);}host.append(scenes);
   const proceed=button('Explain My Discovery',()=>{step=2;render(true);});proceed.disabled=true;
   activity.compare.forEach((item,index)=>{const row=el('div',undefined,'discovery-comparison-item');row.append(el('h4',item.label));const reply=el('p',comparison.has(index)?item.reason:'');reply.setAttribute('role','status');const choices=el('div',undefined,'discovery-inline');for(const [value,label]of [['changed','Changed'],['similar','Stayed similar']]){const b=button(label,()=>{if(!current())return;const correct=value===item.answer;for(const n of choices.children)n.setAttribute('aria-pressed',String(n===b));if(correct){comparison.set(index,value);reply.textContent='Good observation. '+item.reason;}else{comparison.delete(index);reply.textContent='Look at this feature in both scenes. '+(value==='changed'?'Could the same purpose still matter?':'Do the examples show different forms?');}proceed.disabled=comparison.size!==activity.compare.length;});b.setAttribute('aria-pressed',String(comparison.get(index)===value));choices.append(b);}row.append(choices,reply);host.append(row);});host.append(proceed);
  }else if(step===2){
   const guide=el('div',undefined,'discovery-bayani'),img=document.createElement('img');img.src='../assets/brand/bayani-explorer-still.svg';img.alt='Bayani, your explorer guide';img.width=90;img.height=94;guide.append(img,el('p','Help me understand! Which clue best supports your explanation?'));host.append(guide,el('h4','My explanation: '+activity.claim));
   const options=el('div',undefined,'discovery-options');activity.clues.forEach((clue,index)=>{const b=button(clue.title+' — '+clue.text,()=>{if(!current())return;answers[1]=index;for(const n of options.children)n.setAttribute('aria-pressed',String(n===b));check.disabled=false;feedback.textContent='';});b.setAttribute('aria-pressed',String(answers[1]===index));options.append(b);});
   const check=button('Tell Bayani',()=>{if(!current())return;if(answers[1]!==activity.support){feedback.textContent='That is a clue, but another clue connects more directly to this explanation. Try again.';return;}feedback.textContent='Bayani: You connected a claim to evidence! '+activity.limit;check.disabled=true;host.append(button('Finish This Case',()=>{step=3;render(true);}));});check.disabled=answers[1]===null;host.append(options,check,feedback,el('p','This is authored practice feedback, not an AI chat response.','discovery-small'));
  }else{
   host.append(el('p','You examined clues, compared examples, and explained a claim using evidence. '+activity.limit),el('p','Optional practice complete. Your official mission progress and XP still come from the mission quiz.','discovery-small'));
   const lesson=el('a','Return to the Lesson','text-button');lesson.href=discoveryLessonUrl(activity);host.append(lesson,button('Try This Case Again',()=>{step=0;visited.clear();answers.fill(null);comparison.clear();render(true);}));
  }
  if(step>0&&step<3)host.append(button('Back',()=>{step--;render(true);}));
  const sources=el('details'),summary=el('summary','Where did these ideas come from?'),a=el('a',activity.source.title);a.href=activity.source.lesson?discoveryLessonUrl(activity):activity.source.url;if(!activity.source.lesson){a.target='_blank';a.rel='noopener noreferrer';}sources.append(summary,a,el('p','Teaching illustrations simplify ideas. Independent teacher review of these activities is still pending.','discovery-small'));host.append(sources);
  if(focus)heading.focus();
 }
 render();return()=>{disposed=true;host.replaceChildren();};
}
