// Missing optional content never falls back to a bundled lesson or answer key.
export function validatedMissionLearningGuide(mission) {
    const guide = mission?.learningGuide;
    const text = value => typeof value === 'string' && value.trim().length > 0;
    if (!guide || typeof guide !== 'object' || Array.isArray(guide) ||
        !text(mission.id) || !text(mission.chapterId) ||
        guide.missionId !== mission.id || guide.chapterId !== mission.chapterId ||
        !['question', 'why', 'task'].every(key => text(guide[key])) ||
        !Array.isArray(guide.choices) || guide.choices.length < 2 || guide.choices.length > 6 ||
        !guide.choices.every(text) || new Set(guide.choices.map(choice => choice.trim())).size !== guide.choices.length ||
        !Array.isArray(guide.feedback) || guide.feedback.length !== guide.choices.length || !guide.feedback.every(text) ||
        !Number.isInteger(guide.answer) || guide.answer < 0 || guide.answer >= guide.choices.length) return null;
    return {...guide, choices: [...guide.choices], feedback: [...guide.feedback]};
}
