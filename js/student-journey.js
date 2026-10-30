const ordered = rows => rows.slice().sort((a,b) => (Number(a.order)||0)-(Number(b.order)||0) || a.id.localeCompare(b.id));
const timestamp = row => row.completedAt?.toMillis?.() || 0;
export function resolveStudentJourney({userId, chapters, eras = [], missions, challenges, chapterProgress, missionProgress, attempts, drafts = [], reviewTopics, practiceSessions = []}) {
    const activeEras = new Set(eras.filter(row=>row.status === "active").map(row=>row.id));
    const ready = chapters.filter(row => row.status === "active" && row.contentReady !== false && (!row.eraId || activeEras.has(row.eraId)));
    if (!ready.length) return {kind:"unavailable"};
    const owned = rows => rows.filter(row => row.userId === userId);
    const completedChapters = new Set(owned(chapterProgress).filter(row=>row.completed===true).map(row=>row.chapterId));
    const completedMissions = new Set(owned(missionProgress).filter(row=>row.completed===true).map(row=>row.missionId));
    const history = owned(attempts).slice().sort((a,b)=>timestamp(b)-timestamp(a)||String(b.id||"").localeCompare(String(a.id||"")));
    const eraOrder = new Map(ordered(eras).map((era,index)=>[era.id,index]));
    const groups = new Map();
    for (const chapter of ready) { if (!groups.has(chapter.eraId)) groups.set(chapter.eraId,[]); groups.get(chapter.eraId).push(chapter); }
    const candidates = [];
    let lockedEras = 0;
    for (const [eraId,group] of groups) {
        const era = eras.find(row=>row.id===eraId);
        const requirements = era?.requiredChapterIds === undefined ? [] : era.requiredChapterIds;
        if (!Array.isArray(requirements) || !requirements.every(id=>typeof id==='string'&&id&&completedChapters.has(id))) {
            if (group.some(chapter=>!completedChapters.has(chapter.id))) lockedEras++;
            continue;
        }
        const hasProgress=[...owned(attempts),...owned(drafts)].some(p=>group.some(c=>c.requiredForProgression!==false&&c.id===p.chapterId))||owned(missionProgress).some(p=>p.completed===true&&group.some(c=>c.requiredForProgression!==false&&c.id===p.chapterId))||group.some(c=>c.requiredForProgression!==false&&completedChapters.has(c.id));
        const orderedGroup=ordered(group);const chapter=orderedGroup.find(row=>!completedChapters.has(row.id)&&(!hasProgress||row.requiredForProgression!==false))||orderedGroup.find(row=>!completedChapters.has(row.id));
        if (!chapter) continue;
        const chapterMissions = ordered(missions.filter(row=>row.chapterId===chapter.id && row.status==="active"));
        const mission = chapterMissions.find(row=>!completedMissions.has(row.id));
        const completedCount = chapterMissions.filter(row=>completedMissions.has(row.id)).length;
        const challenge = ordered(challenges.filter(row=>row.chapterId===chapter.id&&row.status==="active"))[0];
        const attempt = mission ? history.find(row=>row.missionId===mission.id&&row.chapterId===chapter.id) : null;
        const draft = mission ? owned(drafts).filter(row => row.missionId === mission.id && row.chapterId === chapter.id &&
            row.state && ['story','quiz','practice'].includes(row.kind) && row.updatedAt?.toMillis?.() > 0 &&
            (row.kind !== 'practice' || (typeof row.state.sessionId === 'string' && !owned(practiceSessions).some(session=>session.id===row.state.sessionId))) &&
            (row.kind !== 'quiz' || (typeof row.state.attemptId === 'string' && !history.some(attempt=>attempt.attemptId===row.state.attemptId))))
            .sort((a,b)=>b.updatedAt.toMillis()-a.updatedAt.toMillis() || String(a.id).localeCompare(String(b.id)))[0] || null : null;
        candidates.push({draft,kind:mission?"mission":chapterMissions.length&&challenge?"challenge":"waiting",chapter,mission,attempt,
            totalMissions:chapterMissions.length,completedCount,eraOrder:eraOrder.get(eraId)??Number.MAX_SAFE_INTEGER});
    }
    if (!candidates.length) {
        if (lockedEras) return {kind:'locked'};
        const readyIds = new Set(ready.map(chapter=>chapter.id));
        const savedAt = id => Math.max(0,...owned(chapterProgress).filter(row=>row.chapterId===id&&row.completed===true).map(timestamp));
        const latestChapter = ready.slice().sort((a,b)=>savedAt(b.id)-savedAt(a.id) ||
            (eraOrder.get(b.eraId)??-1)-(eraOrder.get(a.eraId)??-1) || (Number(b.order)||0)-(Number(a.order)||0) || a.id.localeCompare(b.id))[0];
        const review = Array.isArray(reviewTopics) ? reviewTopics.find(topic=>topic && typeof topic.topic==='string' && topic.topic.trim() && topic.missed>0 &&
            missions.some(mission=>mission.id===topic.missionId&&mission.status==='active'&&readyIds.has(mission.chapterId)&&completedChapters.has(mission.chapterId))) : null;
        const reviewMission = review ? missions.find(mission=>mission.id===review.missionId&&mission.status==='active'&&readyIds.has(mission.chapterId)) : null;
        return {kind:'complete',completion:{chapterCount:readyIds.size,
            missionCount:new Set(missions.filter(mission=>mission.status==='active'&&readyIds.has(mission.chapterId)&&completedMissions.has(mission.id)).map(mission=>mission.id)).size,
            latestChapter,review:reviewMission?{...review,chapterId:reviewMission.chapterId}:null}};
    }
    candidates.sort((a,b)=> (a.kind==="waiting")-(b.kind==="waiting") || Math.max(timestamp(b.attempt||{}),b.draft?.updatedAt.toMillis()||0)-Math.max(timestamp(a.attempt||{}),a.draft?.updatedAt.toMillis()||0) ||
        (b.completedCount>0)-(a.completedCount>0) || a.eraOrder-b.eraOrder || (Number(a.chapter.order)||0)-(Number(b.chapter.order)||0) || a.chapter.id.localeCompare(b.chapter.id));
    const selected = candidates[0];
    if(selected.kind === "challenge") selected.draft = owned(drafts).filter(row=>row.kind === "chapter" && row.chapterId===selected.chapter.id && row.state?.version && row.updatedAt?.toMillis?.()>0).sort((a,b)=>b.updatedAt.toMillis()-a.updatedAt.toMillis())[0] || null;
    selected.started = completedMissions.size>0 || completedChapters.size>0 || history.length>0 || !!selected.draft;
    if (Array.isArray(reviewTopics)) selected.reviewTopics = reviewTopics.filter(topic=>topic.missionId===selected.mission?.id);
    return selected;
}
export function missionRecoveryAction(state) {
    const topics = state.reviewTopics ?? state.attempt?.topicsForReview ?? [];
    const pending = topics.find(topic => typeof topic === 'string' || topic.lessonRevisited !== true) ?? topics[0];
    const topic = typeof pending === 'string' ? pending : pending?.topic;
    const reviewed = pending && typeof pending === 'object' && pending.lessonRevisited === true;
    const params = {chapter: state.chapter.id, mission: state.mission.id};
    return reviewed
        ? {label: 'Practise This Topic', page: 'practice.html', params: {...params, ...(topic ? {topic} : {}), review: '1'},
            message: 'You revisited the lesson. Try practice to check your understanding, then retry the mission quiz.'}
        : {label: 'Review Missed Topic', page: 'story.html', params: {...params, ...(topic ? {reviewTopic: topic} : {})},
            message: 'First revisit the lesson for a missed topic. Then try practice and return to the mission quiz.'};
}
export function renderStudentJourney(container, state, retry) {
    container.replaceChildren();
    const details = document.createElement("div"); details.className="journey-details";
    const text = (tag,value,className) => {const element=document.createElement(tag);element.textContent=value;if(className)element.className=className;details.append(element);return element;};
    const link = (label,page,params,secondary=false) => {const element=document.createElement("a");element.className=secondary?"text-button journey-review-link":"primary-button journey-action-button";element.textContent=label;element.href=page+(params?'?'+new URLSearchParams(params):'');details.append(element);return element;};
    if (state.kind === "error") {
        text("h3","We could not load your journey.");text("p","Try again when your connection is ready.");
        const button=text("button","Retry Loading Journey","primary-button");button.type="button";button.addEventListener("click",retry);
    } else if (state.kind === "unavailable") {
        text("h3","Your learning journey is being prepared.");text("p","No lessons are currently available. Check back soon.");
    } else if (state.kind === "locked") {
        text("h3","Complete the earlier chapters to continue.");
        text("p","Open your learning path to see the requirements. You can still revisit completed lessons.");
        link("View Learning Path","my-journey.html");
    } else if (state.kind === "complete") {
        details.classList.add('journey-completion');
        text('span','YOUR LEARNING CONTINUES','journey-status');
        text('h3','You completed all available chapters!');
        text('p','Your progress stays with you. Revisit a lesson, explore your collection, and keep your discoveries fresh.');
        const summary=state.completion;
        if(summary){
            const stats=document.createElement('dl');stats.className='journey-completion-stats';
            for(const [label,count] of [['Chapters completed',summary.chapterCount],['Missions completed',summary.missionCount]]){
                const item=document.createElement('div'),name=document.createElement('dt'),value=document.createElement('dd');
                name.textContent=label;value.textContent=String(count);item.append(name,value);stats.append(item);
            }
            details.append(stats);
        }
        if(summary?.review){
            const topic=summary.review;
            text('p','A topic to revisit: '+(topic.label||topic.topic)+'. Start with the lesson, then use practice to check your understanding.','journey-completion-review');
            link('Revisit This Topic','story.html',{chapter:topic.chapterId,mission:topic.missionId,reviewTopic:topic.topic});
        }else if(summary?.latestChapter?.eraId){
            link('Revisit Your Latest Era','era.html',{era:summary.latestChapter.eraId});
        }else link('Review Chapters','chapters.html');
        if(summary?.latestChapter){
            text('p','A chapter you can revisit: '+(summary.latestChapter.title||'Historical Chapter'),'journey-completion-chapter');
            link('Review This Chapter','mission.html',{chapter:summary.latestChapter.id},true);
        }
        link('Explore Your Collection','achievements.html',null,true);
        if(summary?.review||summary?.latestChapter?.eraId)link('Choose an Era','chapters.html',null,true);
    } else {
        text("span",state.kind==="challenge"?"FINAL CHALLENGE READY":state.kind==="waiting"?"CONTENT PREPARING":state.started?"YOUR NEXT MISSION":"YOUR FIRST MISSION","journey-status");
        text("span",state.chapter.title || "Historical Chapter","journey-chapter-label");
        text("h3",state.mission?.title || (state.kind==="challenge"?"Chapter Challenge":"More lessons are being prepared."));
        if (state.mission?.introduction) text("p",state.mission.introduction);
        text("p",state.completedCount+" / "+state.totalMissions+" missions completed","journey-progress-header");
        const track=document.createElement("div"),fill=document.createElement("div");
        const percent=state.totalMissions?Math.round(state.completedCount/state.totalMissions*100):0;
        track.className="journey-progress-track";track.setAttribute("role","progressbar");
        track.setAttribute("aria-label","Chapter mission completion");track.setAttribute("aria-valuemin","0");
        track.setAttribute("aria-valuemax","100");track.setAttribute("aria-valuenow",String(percent));
        fill.className="journey-progress-fill";fill.style.width=percent+"%";track.append(fill);details.append(track);
        if (state.kind === "mission") {
            const params={chapter:state.chapter.id,mission:state.mission.id};
            const remainingTopics = state.reviewTopics ?? state.attempt?.topicsForReview;
            const needsPractice = state.attempt?.passed === false && Array.isArray(remainingTopics) && remainingTopics.length > 0;
            const readyToRetry = state.attempt?.passed === false && Array.isArray(state.reviewTopics) && !state.reviewTopics.length;
            if (state.draft?.kind === "practice") {
                link("Resume Practice","practice.html",{...params,...(state.draft.state.topic ? {topic:state.draft.state.topic} : {})});
                text("p","Continue your saved questions and adaptive practice progress.");
                link("Review Lesson","story.html",params,true);
                link("Retry Mission Quiz","quiz.html",params,true);
            } else if (needsPractice && state.draft?.kind !== "quiz") {
                const action = missionRecoveryAction(state);
                link(action.label, action.page, action.params);
                text("p", action.message);
                if (action.page === 'story.html') link('Targeted Practice', 'practice.html', {...params, ...(action.params.reviewTopic ? {topic: action.params.reviewTopic} : {}), review: '1'}, true);
                else link('Review Lesson', 'story.html', {...params, ...(action.params.topic ? {reviewTopic: action.params.topic} : {})}, true);
                link("Retry Mission Quiz", "quiz.html", params, true);
            } else if (readyToRetry && state.draft?.kind !== "quiz") {
                link("Retry Mission Quiz", "quiz.html", params);
                text("p", "Your saved review evidence currently shows no topics needing extra practice. Retry the main quiz when ready; practice alone does not complete the mission.");
                link(state.draft?.kind === "story" ? "Resume Lesson" : "Review Lesson", "story.html", params, true);
            } else {
                link(state.draft ? (state.draft.kind === "quiz" ? "Resume Quiz" : "Resume Lesson") : state.started?"Continue Mission":"Start Learning", state.draft?.kind === "quiz" ? "quiz.html" : "story.html",params);
                if (state.draft) text("p", "Your saved place will be restored when you open this activity.");
                if (state.attempt?.passed === false) {
                    if (needsPractice) link("Review Missed Topics", "practice.html", params, true);
                    if (state.draft?.kind !== "quiz") link("Retry Mission Quiz", "quiz.html", params, true);
                }
            }
        } else if (state.kind === "challenge") link(state.draft ? "Resume Chapter Challenge" : "Take Chapter Challenge","chapter-challenge.html",{chapter:state.chapter.id});
        else link("Explore Other Chapters","chapters.html");
    }
    if (state.optionalGuidanceUnavailable) {
        text("p", "Some saved resume or practice details are temporarily unavailable. You can still open your mission; existing saved work will be checked there.");
        const button = text("button", "Refresh Saved Guidance", "text-button");
        button.type = "button";button.addEventListener("click",retry);
    }
    container.append(details);
}
