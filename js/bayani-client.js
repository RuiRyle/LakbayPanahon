import {auth,db} from './firebase-config.js';
import {collection,query,where,getDocsFromServer} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {findLessonAnswer,normalizeQuestion} from './bayani-knowledge.js';

export async function connectBayani(){
    const user=auth.currentUser;
    const current=()=>{if(!user||auth.currentUser?.uid!==user.uid)throw Object.assign(Error('Please sign in again.'),{code:'bayani/unauthenticated'});};
    current();
    // Load only published active mission metadata; retrieve scenes for matching missions on demand.
    const snapshot=await getDocsFromServer(query(collection(db,'missions'),where('status','==','active')));
    current();
    const missions=snapshot.docs.map(d=>({...d.data(),id:d.id}));
    return {settings:{maxMessageCharacters:2000,welcomeMessage:'I am Bayani, your lesson-based Philippine History chatbot. Ask about a lesson topic. I find published lesson passages; I do not generate new facts or reveal quiz answers.'},async send(message){
        current();
        const early=findLessonAnswer(message,[]);
        if(/contact details|quiz answer|unresolved source/.test(early))return early;
        // Match titles/objectives first; avoid downloading the entire lesson catalog.
        const terms=normalizeQuestion(message).split(' ').filter(t=>t.length>3);
        const candidates=missions.map(m=>({m,score:terms.filter(t=>normalizeQuestion([m.title,m.name,...(Array.isArray(m.learningObjectives)?m.learningObjectives:[])].join(' ')).includes(t)).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
        const passages=[];
        for(const {m} of candidates){
            const scenes=await getDocsFromServer(query(collection(db,'storyScenes'),where('missionId','==',m.id)));
            current();
            for(const d of scenes.docs){const s=d.data();if(s.status&&s.status!=='active')continue;
                if(typeof s.content!=='string')continue;
                for(const text of s.content.split(/\n\s*\n/).map(t=>t.trim()).filter(t=>t.length>40&&t.length<=1800)){
                    if(/coral|galleon|galyon/i.test(text))continue;
                    passages.push({title:[m.title||m.name||m.id,s.title||d.id].join(' — '),text,url:new URL('story.html?'+new URLSearchParams({mission:m.id,chapter:m.chapterId}),location.href).href});
                }
            }
        }
        current();return findLessonAnswer(message,passages);
    }};
}
