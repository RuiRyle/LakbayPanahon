// Only load banks relevant to this learner's saved quiz/practice history.
// Keep this request-scoped: new attempts and teacher edits remain fresh.
export async function reviewQuestionSnapshot(userId, attempts, sessions, readMission) {
    if (typeof userId !== "string" || !userId) return {docs:[]};
    const missionIds = [...new Set([...attempts, ...sessions]
        .filter(row => row.userId === userId && typeof row.missionId === "string" && row.missionId.trim())
        .map(row => row.missionId))];
    const snapshots = await Promise.all(missionIds.map(readMission));
    return { docs: snapshots.flatMap(snapshot => snapshot.docs) };
}
