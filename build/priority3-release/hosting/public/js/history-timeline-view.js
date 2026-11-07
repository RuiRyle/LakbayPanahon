export function renderHistoryTimeline(host,groups,selected=''){
 host.replaceChildren();
 const text=(tag,value,className)=>{const n=document.createElement(tag);n.textContent=value;if(className)n.className=className;return n;};
 for(const era of groups.filter(group=>!selected||(group.id||'unassigned')===selected)){
  const section=document.createElement('section');section.className='timeline-period';section.append(text('h2',era.title||'Learning chapters'));
  if(era.dateRange)section.append(text('p',era.dateRange,'timeline-date'));
  if(era.description)section.append(text('p',era.description));
  const list=document.createElement('ol');list.className='history-timeline-list';
  for(const chapter of era.chapters){
   const item=document.createElement('li');item.className='history-timeline-stop';item.dataset.state=chapter.completed?'complete':chapter.accessible?'available':'locked';
   item.append(text('span',chapter.completed?'Completed':chapter.accessible?'Ready to explore':'Continue earlier chapters first','timeline-state'),text('h3',chapter.title||'History chapter'));
   if(chapter.dateRange)item.append(text('p',chapter.dateRange,'timeline-date'));
   if(chapter.description)item.append(text('p',chapter.description));
   const details=document.createElement('details'),summary=text('summary','What happens in this chapter?');details.append(summary);
   const topics=document.createElement('ul');for(const mission of chapter.missions)topics.append(text('li',mission.title||'History mission'));details.append(topics);item.append(details);
   if(chapter.accessible){const link=text('a',chapter.completed?'Revisit Chapter':'Explore Chapter','text-button');link.href='mission.html?'+new URLSearchParams({chapter:chapter.id});item.append(link);}
   list.append(item);
  }
  section.append(list);host.append(section);
 }
}
