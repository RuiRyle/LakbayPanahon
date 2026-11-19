import {historyTopics} from './bayani-history-topics.js';
import {normalizeQuestion} from './bayani-knowledge.js';

function topicFor(question){
    const q=' '+normalizeQuestion(question)+' ';
    const matches=historyTopics.map(topic=>({topic,length:Math.max(0,...topic.aliases.filter(alias=>q.includes(' '+normalizeQuestion(alias)+' ')).map(a=>a.length))})).filter(x=>x.length>0).sort((a,b)=>b.length-a.length);
    return matches[0]?.topic||null;
}
export function preparedHistoryAnswer(message,history=[]){
    const q=normalizeQuestion(message);
    let topic=topicFor(message),more=false;
    if(!topic&&/^(tell me more|more details|explain more|dagdag pa|more please)$/.test(q)){
        // Only use the latest complete exchange; never carry topic state across accounts.
        const last=history.at(-1),previous=history.at(-2);
        if(last?.role==='model'&&previous?.role==='user')topic=topicFor(previous.parts?.[0]?.text||'');
        more=true;
    }
    if(!topic)return null;
    // A name match is not permission to invent answers to every question about that person.
    if(/\b(wife|husband|children|birthday|birth|born|age|height|religion|parents|asawa|anak|magulang|ipinanganak)\b/.test(q)&&!topic.answer.toLowerCase().includes('born'))return 'I know the main history of '+topic.title.replace(/^Who was |^What was |\?$/g,'')+', but I do not have a verified answer to that detail yet. Please ask your teacher or check a reliable historical source.';
    if(/\b(wife|husband|children|height|religion|parents|asawa|anak|magulang)\b/.test(q))return 'I do not have a verified answer to that personal detail. I can explain this person’s historical role instead.';
    if(/\b(killed|kill|pumatay|duel)\b/.test(q)&&['lapulapu','magellan'].includes(topic.id))return 'Magellan died at the Battle of Mactan. The available account does not establish that Lapulapu personally killed him or fought him in a one-to-one duel.\n\nSource: '+topic.source.title+'\n'+topic.source.url;
    const text=more?topic.more:topic.answer;
    return '**'+topic.title+'**\n\n'+text+'\n\nSource: '+topic.source.title+'\n'+topic.source.url+'\n\nYou can also ask:\n'+topic.next.map(x=>'- '+x).join('\n');
}
