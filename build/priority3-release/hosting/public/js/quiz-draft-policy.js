// Firestore map field order can differ between cached and server snapshots.
export function stableDraftVersion(value) {
    const canonical = item => Array.isArray(item) ? item.map(canonical)
        : item && typeof item === "object" ? Object.fromEntries(Object.keys(item).sort().map(key => [key, canonical(item[key])])) : item;
    return JSON.stringify(canonical(value));
}

// Only assessment-relevant content invalidates answers; feedback edits do not.
export function quizDraftVersion(quiz, questions, adaptiveQuestions = [], missionQuestionBank = []) {
    return stableDraftVersion({passingScore:quiz.passingScore,questionCount:quiz.questionCount,
        practicePolicy:quiz.practicePolicy||null,
        blueprint:quiz.questionBlueprint,
        questions:questions.map(question=>[question.id,question.question,question.optionA,question.optionB,
            question.optionC,question.optionD,question.correctAnswer,question.topic,question.difficulty]),
        adaptiveQuestions:adaptiveQuestions.map(question=>[question.id,question.question,question.optionA,question.optionB,
            question.optionC,question.optionD,question.correctAnswer,question.topic,question.difficulty]),
        missionQuestionBank:missionQuestionBank.map(question=>[question.id,question.question,question.optionA,question.optionB,
            question.optionC,question.optionD,question.correctAnswer,question.topic,question.difficulty])});
}
