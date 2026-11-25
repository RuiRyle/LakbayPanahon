export function publishedAnnouncements(rows,classId){
 const time=row=>{try{return row.publishedAt?.toMillis?.()||0;}catch{return 0;}};
 return rows.filter(row=>row.classId===classId&&row.status==='published'&&typeof row.title==='string'&&row.title.trim()&&typeof row.body==='string'&&row.body.trim())
  .sort((a,b)=>time(b)-time(a)||String(a.id).localeCompare(String(b.id)));
}
function announcementDate(row){
 try{
  const date=row.publishedAt?.toDate?.();
  if(date&&Number.isFinite(date.getTime()))return date;
 }catch{}
 return null;
}
const announcementDateFormat=new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'});
const announcementAuthor=teacherName=>teacherName?'From '+teacherName:'From your teacher';
export function classAnnouncementSeenKey(uid,classId){
 return 'lakbay:class-updates:'+uid+':'+classId;
}
export function classAnnouncementVersion(entries,teacherName){
 if(!entries.length)return '';
 // Preserve the existing fingerprint of the text shown in the Announcements tab.
 const content=entries.map(row=>{
  const date=announcementDate(row);
  return row.title+announcementAuthor(teacherName)+(date?announcementDateFormat.format(date):'')+row.body;
 }).join('|');
 let hash=2166136261;
 for(const char of content)hash=Math.imul(hash^char.charCodeAt(0),16777619);
 return String(hash>>>0);
}
export function renderClassAnnouncements(host,record){
 const section=document.createElement('section');section.className='class-announcements';
 const heading=document.createElement('h3');heading.textContent='Class Announcements';section.append(heading);
 if(record.announcementError){const note=document.createElement('p');note.className='class-warning';note.textContent='Announcements could not load. Use Refresh Classes to try again. Your lessons are still available.';section.append(note);}
 else{
  const entries=publishedAnnouncements(record.announcements||[],record.id);
  if(!entries.length){
   const empty=document.createElement('div');
   empty.className='class-announcements-empty';
   const title=document.createElement('strong');
   title.textContent='No announcements yet';
   const note=document.createElement('p');
   note.textContent='Reminders and updates from your teacher will appear here.';
   empty.append(title,note);
   section.append(empty);
  }
  for(const row of entries){
   const article=document.createElement('article');article.className='class-announcement';const title=document.createElement('h4'),body=document.createElement('p');title.textContent=row.title;body.textContent=row.body;body.className='class-announcement-body';const author=document.createElement('span');author.className='class-announcement-author';author.textContent=announcementAuthor(record.teacherName);article.dataset.announcementId=row.id;
   const meta=document.createElement('div');meta.className='class-announcement-meta';meta.append(author);
   article.append(title,meta,body);
   const date=announcementDate(row);
   if(date){const time=document.createElement('time');time.dateTime=date.toISOString();time.textContent=announcementDateFormat.format(date);meta.append(time);}
   section.append(article);
  }
 }
 host.append(section);
}
