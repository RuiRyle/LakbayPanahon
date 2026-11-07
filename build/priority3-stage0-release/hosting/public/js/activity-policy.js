// Content policy comes from the activity document, never a fallback score.
export function requirePassingScore(activity) {
    const score = activity?.passingScore;
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 100) {
        throw new Error("This activity is not ready: its Firestore passingScore must be a number from 0 to 100.");
    }
    return score;
}
