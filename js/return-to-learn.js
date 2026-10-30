const DAY_MS = 24 * 60 * 60 * 1000;
export function requireReturnPolicy(value) {
    if (!Number.isSafeInteger(value?.reviewAfterDays) || value.reviewAfterDays < 1 || value.reviewAfterDays > 365)
        throw new Error('Configure reviewAfterDays in learningSettings/progression.');
    return value.reviewAfterDays;
}

const millis = value => value?.toMillis?.() || (typeof value === 'number' && Number.isFinite(value) ? value : 0);

export function listReturnTopics({userId, policy, missions = [], missionProgress = [], attempts = [], practiceSessions = [], questions = [], now = Date.now()}) {
    const reviewAfterDays = requireReturnPolicy(policy);
    if (!userId || !Number.isFinite(now)) return [];
    const active = new Map(missions.filter(m => m.status === 'active' && m.id && m.chapterId).map(m => [m.id, m]));
    const completed = new Map();
    for (const row of missionProgress) {
        if (row.userId !== userId || row.completed !== true || !active.has(row.missionId)) continue;
        const at = millis(row.completedAt);
        if (at > 0 && at <= now) completed.set(row.missionId, Math.max(at, completed.get(row.missionId) || 0));
    }
    const latestQuiz = new Map();
    for (const row of attempts) {
        if (row.userId !== userId || !completed.has(row.missionId)) continue;
        const at = millis(row.completedAt);
        if (at <= 0 || at > now) continue;
        latestQuiz.set(row.missionId, Math.max(at, latestQuiz.get(row.missionId) || 0));
    }
    const latestPractice = new Map();
    for (const row of practiceSessions) {
        if (row.userId !== userId || !completed.has(row.missionId)) continue;
        const at = millis(row.completedAt);
        if (at <= 0 || at > now || !Array.isArray(row.questionResults)) continue;
        const topics = row.questionResults.map(result => result?.topic);
        for (const topic of topics) {
            if (typeof topic !== 'string' || !topic.trim()) continue;
            const key = JSON.stringify([row.missionId, topic.trim()]);
            latestPractice.set(key, Math.max(at, latestPractice.get(key) || 0));
        }
    }
    const candidates = [];
    const seen = new Set();
    for (const question of questions) {
        if (question.status !== 'active' || !completed.has(question.missionId) || typeof question.topic !== 'string' || !question.topic.trim()) continue;
        const mission = active.get(question.missionId);
        const topic = question.topic.trim();
        const key = JSON.stringify([mission.id, topic]);
        if (seen.has(key)) continue;
        seen.add(key);
        const lastStudied = Math.max(completed.get(mission.id), latestQuiz.get(mission.id) || 0, latestPractice.get(key) || 0);
        if (now - lastStudied < reviewAfterDays * DAY_MS) continue;
        candidates.push({missionId: mission.id, chapterId: mission.chapterId, topic,
            label: typeof question.topicLabel === 'string' && question.topicLabel.trim() ? question.topicLabel.trim() : topic,
            missionTitle: mission.title || 'Past mission', lastStudied});
    }
    return candidates.sort((a,b) => a.lastStudied - b.lastStudied || a.missionId.localeCompare(b.missionId) || a.topic.localeCompare(b.topic));
}

export function chooseReturnTopic(input) { return listReturnTopics(input)[0] || null; }

export function chooseRecallQuestion(topic, questions = []) {
    if (!topic) return null;
    return questions.filter(question => question.status === 'active' && question.missionId === topic.missionId &&
        question.topic?.trim() === topic.topic && typeof question.question === 'string' && question.question.trim() &&
        ['A','B','C','D'].includes(question.correctAnswer) &&
        ['A','B','C','D'].every(key => typeof question['option'+key] === 'string' && question['option'+key].trim()))
        .sort((a,b) => (a.difficulty === 'easy' ? 0 : 1) - (b.difficulty === 'easy' ? 0 : 1) || String(a.id).localeCompare(String(b.id)))[0] || null;
}

export function renderReturnToLearn(container, topic, question = null, onNext = null) {
    if (!container) return;
    container.replaceChildren();
    if (!topic) {
        const message = document.createElement('p');
        message.textContent = 'Keep exploring. A short memory check will appear here after you have had time to learn a topic.';
        container.append(message);
        return;
    }
    const card = document.createElement('article');
    card.className = 'return-topic-card';
    const label = document.createElement('span');
    label.className = 'eyebrow';
    label.textContent = 'A TOPIC FROM YOUR JOURNEY';
    const heading = document.createElement('h3');
    heading.textContent = topic.label;
    const description = document.createElement('p');
    description.textContent = 'Remember what you learned in ' + topic.missionTitle + '? '+(question?'Try one quick question, then revisit the clue or practise more.':'Revisit the story clue, then try practice to check your memory.')+' This card does not change your saved progress or rewards.';
    if (question) {
        const check = document.createElement('div');
        check.className = 'return-recall-check';
        const prompt = document.createElement('p');
        prompt.className = 'return-recall-prompt';
        prompt.textContent = question.question;
        const choices = document.createElement('div');
        choices.className = 'return-recall-options';
        const feedback = document.createElement('p');
        feedback.className = 'return-recall-feedback';
        feedback.setAttribute('role','status');
        feedback.setAttribute('aria-live','polite');
        const next = typeof onNext === 'function' ? document.createElement('button') : null;
        if (next) {
            next.type='button';
            next.className='text-button';
            next.textContent='Another Memory Clue';
            next.hidden=true;
            next.addEventListener('click',onNext);
        }
        const buttons=[];
        for (const key of ['A','B','C','D']) {
            const button=document.createElement('button');
            button.type='button';
            button.textContent=key+'. '+question['option'+key];
            button.dataset.option=key;
            button.addEventListener('click',()=>{
                for(const choice of buttons)choice.disabled=true;
                const correct=key===question.correctAnswer;
                button.dataset.result=correct?'correct':'review';
                const authored=question.answerExplanations?.[question.correctAnswer] || question.explanation;
                feedback.textContent=(correct?'Good thinking! ':'Have another look at the clue. ')+(typeof authored==='string'&&authored.trim()?authored.trim():'Open the story clue to learn more.');
                feedback.tabIndex=-1;
                feedback.focus?.();
                if(next)next.hidden=false;
            });
            buttons.push(button);
            choices.append(button);
        }
        check.append(prompt,choices,feedback);
        if(next)check.append(next);
        card.append(check);
    }
    const story = document.createElement('a');
    story.className = 'primary-button';
    story.textContent = 'Revisit Story Clue';
    story.href = 'story.html?' + new URLSearchParams({chapter:topic.chapterId,mission:topic.missionId,reviewTopic:topic.topic});
    const practice = document.createElement('a');
    practice.className = 'text-button';
    practice.textContent = 'Try Memory Practice';
    practice.href = 'practice.html?' + new URLSearchParams({chapter:topic.chapterId,mission:topic.missionId,topic:topic.topic,review:'1'});
    const actions = document.createElement('div');
    actions.className = 'return-topic-actions';
    actions.append(story, practice);
    card.prepend(label, heading, description);
    card.append(actions);
    container.append(card);
}
