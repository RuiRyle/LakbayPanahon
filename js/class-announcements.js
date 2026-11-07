export function publishedAnnouncements(rows,classId){
 const time=row=>{try{return row.publishedAt?.toMillis?.()||0;}catch{return 0;}};
 return rows.filter(row=>row.classId===classId&&row.status==='published'&&typeof row.title==='string'&&row.title.trim()&&typeof row.body==='string'&&row.body.trim())
  .sort((a,b)=>time(b)-time(a)||String(a.id).localeCompare(String(b.id)));
}
export function renderClassAnnouncements(host,record){
 const section=document.createElement('section');section.className='class-announcements';
 const heading=document.createElement('h3');heading.textContent='Class Announcements';section.append(heading);
 if(record.announcementError){const note=document.createElement('p');note.className='class-warning';note.textContent='Announcements could not load. Use Refresh Classes to try again. Your lessons are still available.';section.append(note);}
 else{
  const entries=publishedAnnouncements(record.announcements||[],record.id);
  if(!entries.length){const empty=document.createElement('p');empty.textContent='No announcements have been published for this class.';section.append(empty);}
  for(const row of entries){
   const article=document.createElement('article');article.className='class-announcement';const title=document.createElement('h4'),body=document.createElement('p');title.textContent=row.title;body.textContent=row.body;body.className='class-announcement-body';const author=document.createElement('span');author.className='class-announcement-author';author.textContent=record.teacherName?'From '+record.teacherName:'From your teacher';article.dataset.announcementId=row.id;article.append(author,title,body);
   let date;try{date=row.publishedAt?.toDate?.();}catch{}
   if(date&&Number.isFinite(date.getTime())){const time=document.createElement('time');time.dateTime=date.toISOString();time.textContent=new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(date);article.append(time);}
   section.append(article);
  }
 }
 host.append(section);
}
