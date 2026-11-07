import {auth, db} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {collection, doc, getDocFromServer, getDocsFromServer, query, where, orderBy, documentId, startAfter, limit} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {collectLearningData} from './student-data-export.js';

const button = document.getElementById('downloadLearningData');
const status = document.getElementById('learningDataDownloadStatus');
let generation = 0;
const deadline = task => {
    let timer;
    return Promise.race([task, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('The download took too long. Check your connection and try again.')), 20000); })]).finally(() => clearTimeout(timer));
};
onAuthStateChanged(auth, () => { generation++; if (button) button.disabled = !auth.currentUser; if (status) status.textContent = ''; });
window.addEventListener('pagehide', () => { generation++; });
button?.addEventListener('click', async () => {
    const user = auth.currentUser, request = ++generation;
    if (!user) { status.textContent = 'Sign in again to download your learning data.'; return; }
    const current = () => {
        if (generation !== request || auth.currentUser !== user) throw Error('Your session changed. No file was downloaded.');
    };
    const read = async (name, uid) => {
        current();
        const result = await deadline(getDocFromServer(doc(db, name, uid)));
        current();
        return result.exists() ? {id: result.id, data: result.data()} : null;
    };
    button.disabled = true;
    status.textContent = 'Preparing your learning data. Keep this page open.';
    try {
        const result = await collectLearningData({
            user, assertCurrent: current,
            readProfile: uid => read('users', uid), readCosmetics: uid => read('studentCosmetics', uid),
            listPage: async (name, uid, cursor) => {
                current();
                const constraints = [where('userId', '==', uid), orderBy(documentId()), limit(100)];
                if (cursor) constraints.push(startAfter(cursor));
                const page = await deadline(getDocsFromServer(query(collection(db, name), ...constraints)));
                current();
                return page.docs.map(row => ({id: row.id, data: row.data()}));
            }
        });
        current();
        const blob = new Blob([JSON.stringify(result, (_, value) => value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = 'lakbaypanahon-learning-data-' + result.generatedAt.slice(0, 10) + '.json';
        document.body.append(link);
        try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
        status.textContent = 'Your learning-data file is ready. Check your browser downloads.';
    } catch (error) {
        if (generation === request && auth.currentUser === user) status.textContent = error?.code === 'permission-denied' ? 'Your account cannot read all required records. No file was downloaded. Sign in again or ask for help.' : 'Download unsuccessful. ' + (error?.message || 'Check your connection and try again.');
    } finally {
        if (generation === request && auth.currentUser === user) button.disabled = false;
    }
});
