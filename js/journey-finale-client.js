import {auth,db} from './firebase-config.js';
import {doc,getDocFromServer,collection,getDocsFromServer,query,where} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {journeyFinaleState} from './journey-finale-policy.js';
export async function loadJourneyFinale(uid,{collections=false}={}){
 if(!uid||auth.currentUser?.uid!==uid)throw Error('Sign in to view the journey finale.');
 const owned=name=>getDocsFromServer(query(collection(db,name),where('userId','==',uid)));
 const [config,profile,chapters,missions]=await Promise.all([getDocFromServer(doc(db,'learningSettings','journeyFinale')),getDocFromServer(doc(db,'users',uid)),owned('studentChapterProgress'),owned('studentProgress')]);
 if(auth.currentUser?.uid!==uid)throw Error('Your session changed.');
 if(!profile.exists()||profile.data().role!=='student'||profile.data().status!=='active'||!config.exists())throw Error('The journey finale is unavailable.');
 const rows=snapshot=>snapshot.docs.map(d=>({...d.data(),id:d.id})),definition=config.data(),state=journeyFinaleState({definition,userId:uid,chapterProgress:rows(chapters),missionProgress:rows(missions)});
 const result={definition,state,profile:profile.data(),artifacts:null,badges:null};
 if(collections&&state.eligible){const records=await Promise.allSettled([owned('studentArtifacts'),owned('studentBadges')]);if(auth.currentUser?.uid!==uid)throw Error('Your session changed.');for(const [index,name]of ['artifacts','badges'].entries())if(records[index].status==='fulfilled')result[name]=rows(records[index].value).filter(row=>row.userId===uid&&definition.chapters.some(chapter=>chapter.id===row.chapterId));}
 return result;
}
