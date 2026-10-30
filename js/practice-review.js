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
        const stage=document.createElement('span');stage.className='review-learning-state';stage.dataset.state=topic.state||'review-needed';stage.textContent=({'review-needed':'Review recommended','lesson-revisited':'Lesson revisited','practising':'Building understanding','practice-goal-reached':'Practice goal reached'})[topic.state]||'Review recommended';
        const evidence=document.createElement('p');evidence.className='review-evidence-progress';
        if(topic.requiredQuestions&&topic.requiredSessions)evidence.textContent=topic.distinctCorrect+' / '+topic.requiredQuestions+' different questions answered correctly; '+topic.cleanSessions+' / '+topic.requiredSessions+' successful sessions. Include a more challenging practice question. These counts restart after a new mistake.';
        else evidence.textContent='More practice evidence is needed before this recommendation can be cleared.';
        if(topic.lessonRevisited&&topic.state!=='lesson-revisited')evidence.textContent+=' Lesson revisited.';
        const actions = document.createElement("div");
        actions.className = "practice-review-actions";
        actions.append(link, other, retry);
        card.append(source, stage, heading, detail, evidence, actions);
        container.append(card);
    }
}
