// Firebase Admin is injected at startup; tests do not load credentials or an SDK.
export function createAssessmentStore(db,serverTimestamp) {
    const ref=path=>db.doc(path);
    return {runTransaction:callback=>db.runTransaction(async transaction=>{
        const tx={
            async get(path){const snapshot=await transaction.get(ref(path));return snapshot.exists?{...snapshot.data(),id:snapshot.id}:null;},
            async list(collection,field,value){
                const snapshot=await transaction.get(db.collection(collection).where(field,'==',value).limit(401));
                if(snapshot.size>400)throw Error('Assessment catalog exceeds its reviewed bound.');
                return snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));
            },
            timestamp:serverTimestamp,
            create:(path,data)=>transaction.create(ref(path),data),
            set:(path,data)=>transaction.set(ref(path),data),
            update:(path,data)=>transaction.update(ref(path),data)
        };
        return callback(tx);
    })};
}
