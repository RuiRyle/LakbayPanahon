// Tab-local, bounded cache for JSON instructional catalogs only.
// Access checks and student records must never use this cache.
export function createContentCache({storage = null, now = Date.now, ttl = 120000, maxEntries = 24} = {}) {
    const prefix = "lakbay-content-v1:";
    const memory = new Map(), pending = new Map();
    let scope, generation = 0;
    const purge = () => {
        memory.clear(); pending.clear(); generation++;
        try {
            for (let i = storage.length - 1; i >= 0; i--) {
                const key = storage.key(i);
                if (key?.startsWith(prefix)) storage.removeItem(key);
            }
        } catch { /* Storage can be disabled. */ }
    };
    const snapshot = rows => {
        const docs = rows.map(row => ({id:row.id, data:()=>JSON.parse(JSON.stringify(row.data))}));
        return {docs, size:docs.length, empty:!docs.length, forEach:fn=>docs.forEach(fn)};
    };
    return {
        clear() { purge(); scope = null; },
        async read(uid, key, load) {
            if (uid !== scope) { if (scope !== undefined) purge(); scope = uid; }
            if (!uid) return load();
            const fullKey = prefix + JSON.stringify([uid,key]);
            let entry = memory.get(fullKey);
            if (!entry) { try { entry = JSON.parse(storage.getItem(fullKey)); } catch {} }
            if (entry && Number.isFinite(entry.at) && now() >= entry.at && now()-entry.at < ttl &&
                Array.isArray(entry.rows) && entry.rows.every(row=>typeof row.id==='string' && row.data && typeof row.data==='object')) {
                memory.set(fullKey,entry);
                return snapshot(entry.rows);
            }
            memory.delete(fullKey);
            try { storage.removeItem(fullKey); } catch {}
            if (pending.has(fullKey)) return pending.get(fullKey);
            const version = generation;
            const request = (async()=>{
                const result = await load();
                // Don't persist non-JSON Firestore values (for example Timestamp).
                const rows = result.docs.map(doc=>({id:doc.id,data:doc.data()}));
                const plain = value => value === null || ['string','number','boolean'].includes(typeof value) ||
                    (Array.isArray(value) ? value.every(plain) : typeof value==='object' &&
                    Object.getPrototypeOf(value)===Object.prototype && Object.values(value).every(plain));
                if (scope === uid && version === generation && rows.every(plain)) {
                    entry = {at:now(),rows:JSON.parse(JSON.stringify(rows))};
                    memory.set(fullKey,entry);
                    while (memory.size > maxEntries) {
                        const oldest = memory.keys().next().value;
                        memory.delete(oldest); try { storage.removeItem(oldest); } catch {}
                    }
                    try {
                        storage.setItem(fullKey,JSON.stringify(entry));
                        const keys = [];
                        for (let i=0;i<storage.length;i++) {
                            const key = storage.key(i);
                            if (key?.startsWith(prefix)) keys.push(key);
                        }
                        keys.sort((a,b)=>(JSON.parse(storage.getItem(a))?.at||0)-(JSON.parse(storage.getItem(b))?.at||0));
                        while(keys.length>maxEntries) storage.removeItem(keys.shift());
                    } catch {}
                }
                return result;
            })();
            pending.set(fullKey,request);
            try { return await request; }
            finally { if (pending.get(fullKey) === request) pending.delete(fullKey); }
        }
    };
}
