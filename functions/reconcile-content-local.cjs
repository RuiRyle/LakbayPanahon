// Offline field-history analysis. Output is a review report, never an apply plan.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
const key=v=>v===undefined?'absent':crypto.createHash('sha256').update(canonical(v)).digest('hex');
function trace(baseline, revisions){
    const initial=key(baseline),edges=new Map(),values=new Map([[initial,baseline]]),unguarded=[];
    for(const r of revisions){
        const target=key(r.value);values.set(target,r.value);
        // Matching desired fields are already represented in the saved baseline.
        // This does not prove live publication, but requires no field transition here.
        if(target===initial&&!r.guarded)continue;
        if(!r.guarded){unguarded.push(r.file);continue;}
        const from=key(r.expected);values.set(from,r.expected);
        if(from!==target){const list=edges.get(from)||new Set();list.add(target);edges.set(from,list);}
    }
    const reached=new Set(),visiting=new Set();let cycle=false;
    function visit(node){if(visiting.has(node)){cycle=true;return;}if(reached.has(node))return;reached.add(node);visiting.add(node);for(const next of edges.get(node)||[])visit(next);visiting.delete(node);}
    visit(initial);
    const terminals=[...reached].filter(n=>!(edges.get(n)?.size));
    const disconnected=revisions.filter(r=>r.guarded&&!reached.has(key(r.expected))).map(r=>r.file);
    const status=cycle?'cycle':unguarded.length?'unguarded-review':terminals.length!==1?'branch-review':disconnected.length?'disconnected-review':'unique-field-terminal';
    const terminal=status==='unique-field-terminal'?terminals[0]:undefined;
    return {status,baselineHash:initial,reachableValues:reached.size,terminalHashes:terminals,
        candidateHash:terminal,candidateWriters:terminal?revisions.filter(r=>key(r.value)===terminal).map(r=>r.file):[],
        unguardedFiles:[...new Set(unguarded)],disconnectedFiles:[...new Set(disconnected)]};
}
function build(snapshot,inputs){
    const docs=new Map(Object.entries(snapshot.collections).flatMap(([c,rows])=>rows.map(d=>[c+'/'+d.id,d]))),fields=new Map();
    for(const {file,data} of inputs)for(const w of data.writes||(data.path&&data.fields?[data]:[])){
        if(!/^(eras|chapters|missions|quizzes|questions|practiceQuestions|storyScenes|chapterChallenges|chapterChallengeQuestions|artifacts|badges)\/[^/]+$/.test(w.path))continue;
        const guard=w.expected||w.expectedFirestoreFields||{};
        for(const [field,value] of Object.entries(w.fields||{})){
            const id=w.path+'#'+field,entry=fields.get(id)||{path:w.path,field,revisions:[]};
            entry.revisions.push({file,value,guarded:Object.hasOwn(guard,field)||w.expectedAbsent?.includes(field),expected:guard[field]});fields.set(id,entry);
        }
    }
    const overlaps=[...fields.values()].filter(e=>e.revisions.length>1).map(e=>({path:e.path,field:e.field,files:e.revisions.map(r=>r.file),
        ...trace(docs.get(e.path)?.[e.field],e.revisions)}));
    return {mode:'offline-review-only',snapshotAt:snapshot.auditedAt,executable:false,
        caution:'Field terminals do not establish a coherent whole-document revision, publication order, or live state. No values are selected for deployment.',
        overlappingFields:overlaps.length,statusCounts:overlaps.reduce((a,e)=>(a[e.status]=(a[e.status]||0)+1,a),{}),overlaps};
}
if(require.main===module){
    const snapshot=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/learning-content-snapshot.json'),'utf8'));
    const inputs=fs.readdirSync(path.join(root,'data')).filter(f=>f.endsWith('.json')&&!/^chapter\d+-/.test(f)).map(file=>({file,data:JSON.parse(fs.readFileSync(path.join(root,'data',file),'utf8'))}));
    const report=build(snapshot,inputs);fs.writeFileSync(path.join(root,'docs/validation/content-reconciliation-local.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({...report,overlaps:undefined},null,2));
}
module.exports={trace,build};
