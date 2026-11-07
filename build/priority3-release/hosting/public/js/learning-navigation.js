export function classroomLearningContext(search){
    const params=new URLSearchParams(search),classroom=params.get('classroom'),activity=params.get('activity');
    const valid=value=>typeof value==='string'&&value.length>0&&value.length<=150&&!/[\/\\\u0000-\u001f]/.test(value);
    return valid(classroom)&&valid(activity)&&params.get('chapter')&&params.get('mission')?{classroom,activity,chapter:params.get('chapter'),mission:params.get('mission')}:null;
}
export function carryClassroomContext(href,search,base){
    const context=classroomLearningContext(search);if(!context)return href;
    try{const target=new URL(href,base),origin=new URL(base);if(target.origin!==origin.origin||!['story.html','practice.html','quiz.html'].includes(target.pathname.split('/').pop())||target.searchParams.get('chapter')!==context.chapter||target.searchParams.get('mission')!==context.mission)return href;
        target.searchParams.set('classroom',context.classroom);target.searchParams.set('activity',context.activity);return target.href;
    }catch{return href;}
}
export function learningTopicRoutes(search){
    const params=new URLSearchParams(search),chapter=params.get('chapter'),mission=params.get('mission');
    const topic=(params.get('reviewTopic')||params.get('topic')||'').trim();
    if(!chapter||!mission||!topic)return null;
    return {
        lesson:'story.html?'+new URLSearchParams({chapter,mission,reviewTopic:topic}),
        practice:'practice.html?'+new URLSearchParams({chapter,mission,topic,review:'1'})
    };
}
export function mountLearningNavigation(container, activity, search = window.location.search) {
    if (!container) return;
    const chapter = new URLSearchParams(search).get("chapter");
    const nav = document.createElement("nav");
    nav.className = "learning-navigation";
    nav.setAttribute("aria-label", "Learning path");
    const list = document.createElement("ol");
    const add = (label, href) => {
        const item = document.createElement("li");
        const element = document.createElement(href ? "a" : "span");
        element.textContent = label;
        if (href) element.href = href;
        else element.setAttribute("aria-current", "page");
        item.append(element);list.append(item);
    };
    add("Chapters", "chapters.html");
    if (chapter) add("Mission Journey", "mission.html?" + new URLSearchParams({chapter}));
    const topicRoutes=learningTopicRoutes(search);
    add(activity);
    nav.append(list);
    if(topicRoutes&&['Lesson','Adaptive Practice'].includes(activity)){
        const shortcut=document.createElement('a');shortcut.className='learning-topic-return';
        shortcut.textContent=activity==='Lesson'?'Back to targeted practice':'Review this lesson topic';
        shortcut.href=activity==='Lesson'?topicRoutes.practice:topicRoutes.lesson;
        nav.append(shortcut);
    }
    const context=classroomLearningContext(search),carry=href=>carryClassroomContext(href,search,window.location.href);
    if(context){
        const back=document.createElement('a');back.className='learning-classroom-return';back.textContent='Back to my class activity';back.href='my-class.html?'+new URLSearchParams({classroom:context.classroom,activity:context.activity});nav.append(back);
    }
    container.prepend(nav);
    if(context){
        const update=()=>{for(const anchor of container.querySelectorAll('a[href]')){const href=carry(anchor.href);if(anchor.href!==href)anchor.href=href;}};
        update();
        const observer=new MutationObserver(update);observer.observe(container,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});
        window.addEventListener('pagehide',event=>{if(!event.persisted)observer.disconnect();});
    }
    return {carry,classroomReturn:context?'my-class.html?'+new URLSearchParams({classroom:context.classroom,activity:context.activity}):null};
}
