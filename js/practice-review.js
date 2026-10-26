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
        detail.textContent = `${topic.correct} of ${topic.attempted} answered correctly on the first try in your latest attempts.`;
        const link = document.createElement("a");
        link.className = "text-button";
        link.textContent = "Practice Again";
        link.href = practiceTopicUrl(chapterId, topic.missionId, topic.topic);
        card.append(heading, detail, link);
        container.append(card);
    }
}
