export const LEARNING_DATA_COLLECTIONS = Object.freeze([
    'studentProgress', 'studentChapterProgress', 'studentDailyChallenges',
    'studentQuizAttempts', 'studentPracticeProgress', 'studentReviewEvents',
    'studentLearningDrafts', 'studentEvidenceJournal', 'studentArtifacts',
    'studentBadges', 'classMembers'
]);

// Read-only, owner-scoped snapshot. Failures never produce a partial download.
export async function collectLearningData({user, assertCurrent, readProfile, readCosmetics, listPage, now = () => new Date(), maxRecords = 5000}) {
    if (!user || typeof user.uid !== 'string' || !user.uid || /[\/\u0000-\u001f]/.test(user.uid)) throw Error('Sign in again to download your learning data.');
    const check = () => assertCurrent(user);
    check();
    const profile = await readProfile(user.uid);
    check();
    if (!profile || profile.id !== user.uid || profile.data?.role !== 'student' || profile.data?.status !== 'active') throw Error('An active student account is required.');
    const cosmetics = await readCosmetics(user.uid);
    check();
    if (cosmetics && cosmetics.id !== user.uid) throw Error('The account changed. No file was downloaded.');
    const records = {};
    for (const name of LEARNING_DATA_COLLECTIONS) {
        const rows = [], seen = new Set();
        let cursor = null;
        for (;;) {
            check();
            const page = await listPage(name, user.uid, cursor);
            check();
            if (!Array.isArray(page) || page.length > 100) throw Error('The download could not verify a page of records.');
            for (const row of page) {
                if (!row || typeof row.id !== 'string' || !row.id || row.id.includes('/') || row.data?.userId !== user.uid || seen.has(row.id)) throw Error('The download could not verify record ownership.');
                seen.add(row.id);
                rows.push(row);
            }
            if (rows.length > maxRecords) throw Error('This account has too many records for a browser download. No file was downloaded.');
            if (page.length < 100) break;
            cursor = page.at(-1).id;
        }
        records[name] = rows;
    }
    check();
    return {
        format: 'lakbaypanahon-learning-data-v1', generatedAt: now().toISOString(),
        account: {uid: user.uid, email: user.email || null}, profile, cosmetics, records,
        scope: 'Saved records readable by this signed-in student. A snapshot, not a complete copy of records held by every service.',
        excluded: ['Passwords and sign-in tokens', 'Other accounts and shared classroom records', 'Service logs', 'Outside AI-provider records', 'Private server-side records', 'Browser-only preferences and unsaved answers']
    };
}
