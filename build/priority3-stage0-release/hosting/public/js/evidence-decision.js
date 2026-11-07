import {auth,db} from "./firebase-config.js";
import {collection,doc,getDoc,getDocs,query,where} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

export function evidenceDecisionCorrect(question,answer){
    return !!question.evidenceTask && answer?.gameType==='evidenceDecision' &&
        answer.evidenceId===question.evidenceTask.correctEvidenceId &&
        answer.conclusion===String(question.correctAnswer).trim().toUpperCase();
}

export function validateEvidenceTask(question){
    const task=question.evidenceTask;
    if(!task || typeof task.instructions!=='string' || !Array.isArray(task.cards) || task.cards.length<2 ||
        new Set(task.cards.map(c=>c.id)).size!==task.cards.length ||
        !task.cards.every(c=>typeof c.id==='string'&&c.id&&typeof c.sceneId==='string'&&c.sceneId&&Number.isInteger(c.clueIndex)&&c.clueIndex>=0) ||
        !task.cards.some(c=>c.id===task.correctEvidenceId))throw Error('The evidence task needs valid lesson references.');
    return task;
}

export async function renderEvidenceDecision({question,host,submitButton,initialAnswer=null,onChange}){
    const uid=auth.currentUser?.uid,token={};host.evidenceRequest=token;submitButton.disabled=true;
    const current=()=>host.evidenceRequest===token&&host.isConnected&&auth.currentUser?.uid===uid;
    host.replaceChildren();
    const add=(tag,value)=>{const n=document.createElement(tag);n.textContent=value;host.append(n);return n;};
    add('h3','Use a Clue to Support Your Answer');
    const status=add('p','Loading lesson evidence...');status.setAttribute('role','status');
    try{
        const task=validateEvidenceTask(question);
        const ids=[...new Set(task.cards.map(c=>c.sceneId))];
        const scenes=await Promise.all(ids.map(id=>getDoc(doc(db,'storyScenes',id))));
        if(!current())return;
        const source=new Map(scenes.filter(d=>d.exists()).map(d=>[d.id,d.data()]));
        if(task.cards.some(c=>source.get(c.sceneId)?.status!=='active'||!source.get(c.sceneId)?.exploreItems?.[c.clueIndex]?.discovery))throw Error('Evidence source unavailable');
        add('p',task.instructions);
        const journalStatus=add('p','You can use all the lesson clues below, even if you have not saved them.');
        const cards=document.createElement('div');cards.className='challenge-evidence-cards';host.append(cards);
        const cardNodes=new Map();
        for(const card of task.cards){const clue=source.get(card.sceneId).exploreItems[card.clueIndex],article=document.createElement('article');article.className='challenge-evidence-card';const title=document.createElement('h4');title.textContent=clue.title;const copy=document.createElement('p');copy.textContent=clue.discovery;article.append(title,copy);cards.append(article);cardNodes.set(card.id,article);}
        const field=(title,className,options)=>{const label=document.createElement('label');label.textContent=title;const select=document.createElement('select');select.className=className;select.add(new Option('Choose an answer',''));for(const [id,text]of options)select.add(new Option(text,id));label.append(select);host.append(label);return select;};
        const evidence=field('1. Which clue supports your answer?','evidence-clue-select',task.cards.map(c=>[c.id,source.get(c.sceneId).exploreItems[c.clueIndex].title]));
        const conclusion=field('2. What does that clue help you conclude?','evidence-conclusion-select','ABCD'.split('').map(k=>[k,question['option'+k]]));
        const changed=()=>{submitButton.disabled=!evidence.value||!conclusion.value;onChange({gameType:'evidenceDecision',evidenceId:evidence.value,conclusion:conclusion.value});};
        evidence.addEventListener('change',changed);conclusion.addEventListener('change',changed);
        if(initialAnswer?.gameType==='evidenceDecision'){evidence.value=initialAnswer.evidenceId||'';conclusion.value=initialAnswer.conclusion||'';changed();}
        status.textContent='Choose both a clue and a conclusion. Your final review will explain how they connect.';
        const journal=document.createElement('a');journal.href='my-journey.html#evidenceJournal';journal.target='_blank';journal.rel='noopener';journal.textContent='Consult My Evidence Journal (opens a new tab)';journal.className='text-button';host.append(journal);
        try{
            const saved=await getDocs(query(collection(db,'studentEvidenceJournal'),where('userId','==',uid)));
            if(!current())return;
            const records=saved.docs.map(d=>d.data());let marked=0;
            for(const card of task.cards)if(records.some(r=>r.userId===uid&&r.sceneId===card.sceneId&&r.clueIndex===card.clueIndex)){const badge=document.createElement('strong');badge.textContent='Saved in your journal';cardNodes.get(card.id).prepend(badge);marked++;}
            journalStatus.textContent=marked?'Your saved discoveries are marked. Other lesson clues are available too.':'None of these clues are saved in your journal yet. You can still use all of them here.';
        }catch{if(current())journalStatus.textContent='Your saved-clue markers could not load. All lesson evidence is still available.';}
    }catch{
        if(!current())return;status.textContent='The lesson evidence could not load. Check your connection and try again; your challenge progress is kept.';
        const retry=add('button','Retry Evidence');retry.type='button';retry.className='text-button';retry.addEventListener('click',()=>renderEvidenceDecision({question,host,submitButton,initialAnswer,onChange}));
    }
}
