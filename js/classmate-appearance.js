import { auth, db } from './firebase-config.js';
import { doc, runTransaction } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

const rosterEntry = (classId, uid) => doc(db, 'classes', classId, 'classmates', uid);

async function readAppearance(transaction, uid) {
    const profile = await transaction.get(doc(db, 'users', uid));
    const cosmetics = await transaction.get(doc(db, 'studentCosmetics', uid));
    return {
        avatarId: profile.data()?.avatarId || '',
        frameId: cosmetics.data()?.frameId || 'none'
    };
}

export function shareClassmateAppearance(classId, uid, displayName) {
    return runTransaction(db, async transaction => {
        const entry = rosterEntry(classId, uid);
        const appearance = await readAppearance(transaction, uid);
        if (auth.currentUser?.uid !== uid) throw Error('The student session changed.');
        transaction.set(entry, { displayName, ...appearance });
    });
}

export function saveStudentAppearance(uid, target, changes) {
    return runTransaction(db, async transaction => {
        const slot = await transaction.get(doc(db, 'studentClassSlots', uid));
        const classId = slot.data()?.classId;
        let sharedEntry;
        if (classId) {
            const membership = await transaction.get(doc(db, 'classMembers', uid + '_' + classId));
            if (membership.data()?.status === 'active') {
                sharedEntry = await transaction.get(rosterEntry(classId, uid));
            }
        }
        // Existing name-only shares stay name-only until the student shares their look.
        const shared = sharedEntry?.data();
        const appearance = shared && 'avatarId' in shared ? await readAppearance(transaction, uid) : null;
        if (auth.currentUser?.uid !== uid) throw Error('The student session changed.');

        if (target === 'users') transaction.update(doc(db, target, uid), changes);
        else transaction.set(doc(db, target, uid), changes);

        if (appearance) {
            transaction.set(sharedEntry.ref, {
                displayName: shared.displayName,
                avatarId: changes.avatarId ?? appearance.avatarId,
                frameId: changes.frameId ?? appearance.frameId
            });
        }
    });
}
