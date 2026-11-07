import {auth} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {readTeacherEvidence} from './teacher-application-client.js';
let dialog,url;
function clearImage(){if(url){URL.revokeObjectURL(url);url=null;}dialog?.querySelector('img').removeAttribute('src');}
function close(){if(dialog?.open)dialog.close();clearImage();}
export async function showTeacherEvidence(uid,application){
 const user=auth.currentUser,data=await readTeacherEvidence(uid,application);
 if(auth.currentUser!==user)throw Error('Your session changed.');
 if(!data||data.expired||data.unavailable)throw Error('Evidence is missing or expired. Request an updated image if it is needed.');
 if(!['image/jpeg','image/png'].includes(data.mime)||typeof data.data!=='string'||data.data.length>341336)throw Error('Unsupported evidence image.');
 close();
 if(!dialog){dialog=document.createElement('dialog');dialog.className='private-evidence-dialog';dialog.setAttribute('aria-label','Private qualification evidence');const title=document.createElement('h2');title.textContent='Private qualification evidence';const image=document.createElement('img');image.className='application-image';image.alt='Applicant-provided qualification evidence';const button=document.createElement('button');button.type='button';button.textContent='Close Evidence';button.addEventListener('click',close);dialog.append(title,image,button);dialog.addEventListener('close',()=>{if(!dialog.open)clearImage();});document.body.append(dialog);}
 const bytes=Uint8Array.from(atob(data.data),c=>c.charCodeAt(0));url=URL.createObjectURL(new Blob([bytes],{type:data.mime}));dialog.querySelector('img').src=url;dialog.showModal();
}
window.addEventListener('pagehide',close);onAuthStateChanged(auth,close);
