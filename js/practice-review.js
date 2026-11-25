// Learning content and labels come from current Firestore question documents.
// For each question, the latest completed attempt replaces older mistakes.
export function reviewTopicsFromHistory(sessions, questions) {
    const catalog = new Map(questions.filter(question => question.status === "active" &&
        typeof question.topic === "string" && question.topic.trim())
        .map(question => [`${question.missionId}/${question.id}`, question]));
    const time = session => typeof session.completedAt?.toMillis === "function"
        ? session.completedAt.toMillis() : 0;
    const ordered = sessions.filter(session => time(session) > 0 && Array.isArray(session.questionResults))
        .slice().sort((a, b) => time(b) - time(a) || String(b.id || "").localeCompare(String(a.id || "")));
    const seen = new Set();
    const topics = new Map();
    for (const session of ordered) {
        for (const result of session.questionResults) {
            if (!result || typeof result.firstTryCorrect !== "boolean") continue;
            const key = `${session.missionId}/${result.questionId}`;
            const question = catalog.get(key);
            if (!question || seen.has(key)) continue;
            seen.add(key);
            const topic = question.topic.trim();
            const topicKey = JSON.stringify([question.missionId, topic]);
            if (!topics.has(topicKey)) topics.set(topicKey, {
                missionId: question.missionId, topic,
                label: typeof question.topicLabel === "string" && question.topicLabel.trim()
                    ? question.topicLabel.trim() : topic,
                attempted: 0, missed: 0, correct: 0
            });
            const summary = topics.get(topicKey);
            summary.attempted++;
            if (result.firstTryCorrect) summary.correct++;
            else summary.missed++;
        }
    }
    return [...topics.values()].sort((a, b) => b.missed - a.missed || a.label.localeCompare(b.label));
}

// Display-only history. Never feeds current-topic goals, difficulty, scores or rewards.
export function retiredPracticeActivity(sessions, questions, userId, now = Date.now()) {
    if (typeof userId !== 'string' || !userId) return [];
    const retired = new Map(questions.filter(q => q.status === 'inactive' && q.id && q.missionId)
        .map(q => [`${q.missionId}/${q.id}`, q]));
    const rows = [], seen = new Set();
    const time = session => {
        try { return typeof session?.completedAt?.toMillis === 'function' ? session.completedAt.toMillis() : NaN; }
        catch { return NaN; }
    };
    const ordered = sessions.filter(s => s?.userId === userId && Number.isFinite(time(s)) &&
        time(s) > 0 && time(s) <= now && Array.isArray(s.questionResults))
        .slice().sort((a,b) => time(b) - time(a) || String(b.id || '').localeCompare(String(a.id || '')));
    for (const session of ordered) for (const result of session.questionResults) {
        if (!result || typeof result.firstTryCorrect !== 'boolean') continue;
        const key = `${session.missionId}/${result.questionId}`, question = retired.get(key);
        if (!question || seen.has(key)) continue;
        seen.add(key);
        rows.push({questionId: question.id, missionId: question.missionId,
            label: question.topicLabel || question.topic || 'Earlier question',
            completedAt: time(session), firstTryCorrect: result.firstTryCorrect,
            attempts: Number.isInteger(result.attempts) && result.attempts > 0 ? result.attempts : null,
            hintRequested: typeof result.hintRequested === 'boolean' ? result.hintRequested : null});
    }
    return rows;
}

export function renderRetiredPractice(container, activity) {
    if (!activity.length) return;
    const section = document.createElement('section');section.className = 'practice-history';
    const heading = document.createElement('h3');heading.textContent = 'Earlier practice';
    const note = document.createElement('p');
    note.textContent = 'These questions have changed. Your earlier answers stay saved and do not count as answers to the current questions.';
    const details = document.createElement('details'), summary = document.createElement('summary'), list = document.createElement('ul');
    summary.textContent = 'Latest saved answers to earlier questions';
    for (const row of activity) {
        const item = document.createElement('li'), date = new Date(row.completedAt).toLocaleDateString();
        item.textContent = `${row.label} — ${date}: ${row.firstTryCorrect ? 'first answer correct' : 'first answer not correct'}.` +
            (row.attempts === null ? '' : ` Attempts: ${row.attempts}.`) +
            (row.hintRequested === true ? ' A hint was requested.' : row.hintRequested === null ? ' Hint use was not recorded.' : ' No hint request was recorded.');
        list.append(item);
    }
    details.append(summary,list);section.append(heading,note,details);container.append(section);
}

export function practiceTopicUrl(chapterId, missionId, topic) {
    const params = new URLSearchParams({ chapter: chapterId, mission: missionId, topic });
    return `practice.html?${params}`;
}

export function renderReviewTopics(container, topics, chaptersByMission, emptyMessage) {
    container.replaceChildren();
    if (!topics.length) {
        const message = document.createElement("p");
        message.textContent = emptyMessage;
        container.append(message);
        return;
    }
    for (const topic of topics) {
        const chapterId = chaptersByMission.get(topic.missionId);
        if (!chapterId) continue;
        const card = document.createElement("article");
        card.className = "practice-review-topic";
        card.dataset.topic = topic.topic;
        const heading = document.createElement("h3");
        heading.textContent = topic.label;
        const detail = document.createElement("p");
        detail.textContent = topic.source === "quiz"
            ? "Your latest mission quiz identified this topic for review. A completed mission can still have topics to strengthen."
            : `${topic.correct} of ${topic.attempted} practice questions answered correctly on the first try in your latest attempts.`;
        const lessonUrl = "story.html?" + new URLSearchParams({chapter:chapterId,mission:topic.missionId,reviewTopic:topic.topic});
        const practiceUrl = "practice.html?" + new URLSearchParams({chapter:chapterId,mission:topic.missionId,topic:topic.topic,review:'1'});
        const practiceNext = topic.lessonRevisited === true || topic.state === 'practising';
        const link = document.createElement("a");
        link.className = "primary-button";
        link.textContent = practiceNext ? (topic.state === 'practising' ? "Continue Targeted Practice" : "Start Targeted Practice") : "Review Lesson Scenes";
        link.href = practiceNext ? practiceUrl : lessonUrl;
        const other = document.createElement('a');other.className='text-button';
        other.textContent=practiceNext?'Revisit Lesson':'Try Targeted Practice';other.href=practiceNext?lessonUrl:practiceUrl;
        const retry = document.createElement('a');retry.className='text-button';retry.textContent='Retry Mission Quiz';
        retry.href='quiz.html?'+new URLSearchParams({chapter:chapterId,mission:topic.missionId});
        const source = document.createElement("span");source.className="practice-review-source";source.textContent=topic.source==="quiz"?"Recommended from your quiz":"Recommended from practice";
        const stage=document.createElement('span');stage.className='review-learning-state';stage.dataset.state=topic.state||'review-needed';stage.textContent=({'review-needed':'Review recommended','lesson-revisited':'Lesson revisited','practising':'Practice in progress','practice-goal-reached':'Practice goal reached'})[topic.state]||'Review recommended';
        const evidence = document.createElement('div');
        evidence.className = 'review-evidence-progress';
        const note = document.createElement('p');
        if (topic.requiredQuestions && topic.requiredSessions) {
            const goals = document.createElement('dl');
            goals.className = 'practice-goal-list';
            const addGoal = (label, met, value) => {
                const row = document.createElement('div');
                row.dataset.met = String(met);
                const name = document.createElement('dt');
                name.textContent = label;
                const status = document.createElement('dd');
                if (met) {
                    const mark = document.createElement('span');
                    mark.textContent = '✓';
                    mark.setAttribute('aria-hidden', 'true');
                    status.append(mark, ' Goal met');
                } else status.textContent = value;
                row.append(name, status);
                goals.append(row);
            };
            addGoal('Different questions', topic.distinctCorrect >= topic.requiredQuestions, `${topic.distinctCorrect} of ${topic.requiredQuestions}`);
            addGoal('Successful practice rounds', topic.cleanSessions >= topic.requiredSessions, `${topic.cleanSessions} of ${topic.requiredSessions}`);
            if (topic.requiredDifficulty) {
                const difficulty = topic.requiredDifficulty;
                addGoal(`${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)} question`, topic.difficultyMet, 'Still needed');
            }
            evidence.append(goals);
            note.textContent = 'First-try answers count. A new mistake restarts these goals.';
        } else note.textContent = 'More saved practice is needed to check this goal.';
        if (topic.evidenceUncertain) note.textContent += ' Some saved results have dates we could not verify. This topic stays in your recommendations while those records are uncertain.';
        if (topic.lessonRevisited && topic.state !== 'lesson-revisited') note.textContent += ' Lesson revisited.';
        evidence.append(note);
        const actions = document.createElement("div");
        actions.className = "practice-review-actions";
        actions.append(link, other, retry);
        card.append(source, stage, heading, detail, evidence, actions);
        container.append(card);
    }
}
export function practiceRetryHint(question,chosenAnswer){
    const selected=String(chosenAnswer||'').trim().toUpperCase();
    // A full explanation or historical summary can contain the solution.
    // Only explicitly authored hints belong in the retry clue.
    const clue=[['A','B','C','D'].includes(selected)?question?.answerHints?.[selected]:null,question?.hint]
        .find(value=>typeof value==='string'&&value.trim());
    return clue?.trim()||'Compare the remaining choices with the evidence in the lesson.';
}
export function practiceMisconceptionSupport(question,chosenAnswer,missionId){
    if(!question||typeof missionId!=='string'||!missionId.trim()||(question.missionId&&question.missionId!==missionId))return null;
    const selected=String(chosenAnswer||'').trim().toUpperCase(),correct=String(question.correctAnswer||'').trim().toUpperCase();
    if(!['A','B','C','D'].includes(selected)||!['A','B','C','D'].includes(correct)||selected===correct)return null;
    const reason=question.answerExplanations?.[selected];if(typeof reason!=='string'||!reason.trim())return null;
    return {reason:reason.trim(),clue:practiceRetryHint(question,selected),topic:typeof question.topic==='string'?question.topic.trim():''};
}
export function renderPracticeMisconceptionClue(parent,support,chapterId,missionId){
    parent.querySelector('.practice-misconception-coaching')?.remove();
    const section=document.createElement('aside');section.className='practice-misconception-coaching';
    const heading=document.createElement('strong');heading.textContent='Hint for your next try';
    const clue=document.createElement('p');clue.textContent=support.clue;
    const prompt=document.createElement('p');prompt.textContent='Which detail helps you rule out that choice? Compare the evidence, then try again.';
    const lesson=document.createElement('a');lesson.className='text-button';lesson.textContent='Revisit this lesson topic';lesson.href='story.html?'+new URLSearchParams({chapter:chapterId,mission:missionId,...(support.topic?{reviewTopic:support.topic}:{})});
    section.append(heading,clue,prompt,lesson);parent.append(section);
}
// Describes only this application's hint request, never all assistance or independent understanding.
export function practiceHintEvidence(result){
    if(result?.hintRequested===true)return 'requested';
    if(result?.hintRequested===false)return 'not-requested';
    return 'unknown';
}
export function summarizePracticeHints(results){
    const counts={requested:0,notRequested:0,unknown:0};
    for(const result of results){const state=practiceHintEvidence(result);counts[state==='not-requested'?'notRequested':state]++;}
    return counts;
}
