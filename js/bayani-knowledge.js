// Public lesson retrieval only. No answer banks, provider requests or reward writes.
export function normalizeQuestion(value) {
    return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
}
const stop=new Set('what why how when where who is are was were the a an of in on to about explain tell me ang mga ng sa ano sino bakit paano kailan saan please'.split(' '));
export function findLessonAnswer(message, passages) {
    if(typeof message!=='string'||!message.trim()||message.length>2000)throw Error('Please ask a history question of up to 2,000 characters.');
    const q=normalizeQuestion(message);
    if(/@|\b\d{9,}\b/.test(message))return 'Please leave out contact details and ask about a Philippine History topic.';
    if(/\b(answer key|correct answer|option [abcd]|quiz answer|test answer)\b/.test(q))return 'I can help explain a topic, but I cannot choose a quiz answer for you. Ask about the historical idea you want to understand.';
    if(/\b(coral|rocks|galleon|galyon)\b/.test(q))return 'That topic has an unresolved source or terminology review. Please check the source lesson with your teacher; I will not choose a disputed wording or start year.';
    const terms=[...new Set(q.split(' ').filter(t=>t.length>2&&!stop.has(t)))];
    if(!terms.length)return 'Ask a specific Philippine History question, for example about a historical person, event or lesson term.';
    const ranked=passages.map(p=>{const title=normalizeQuestion(p.title),body=normalizeQuestion(p.text);const matched=terms.filter(t=>(' '+title+' '+body+' ').includes(' '+t+' '));return {p,score:matched.length/terms.length,matched:matched.length,title:terms.filter(t=>(' '+title+' ').includes(' '+t+' ')).length};}).filter(x=>x.score>=0.6&&x.matched>=Math.min(2,terms.length)).sort((a,b)=>b.score-a.score||b.title-a.title);
    if(!ranked.length)return 'I do not have a close enough match in the available lesson materials. Try the name of a person, event or term, or check your lesson with a teacher. I cannot answer every Philippine History question yet.';
    const p=ranked[0].p;
    return 'Here is a relevant passage from your published lesson. It may answer only part of your question:\n\n'+p.text+'\n\nLesson reference: '+p.title+'\n'+p.url+'\n\nThis is a lesson-based response, not a newly generated historical explanation.';
}
