'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),catalog=require('../priority3-compact-catalog/catalog.cjs');
const allowed=new Set(['missions','chapters','eras','quizzes','questions','practiceQuestions','chapterChallenges','chapterChallengeQuestions','artifacts','badges','dailyChallenges']);
const normalize=c=>{if(Object.keys(c).length!==allowed.size)throw Error('authority/source-schema');return Object.fromEntries(Object.entries(c).sort(([a],[b])=>a.localeCompare(b)).map(([name,rows])=>{if(!allowed.has(name)||!Array.isArray(rows)||new Set(rows.map(r=>r.id)).size!==rows.length||rows.some(r=>typeof r.id!=='string'||!/^[A-Za-z0-9_-]+$/.test(r.id)))throw Error('authority/source-schema');return[name,[...rows].sort((a,b)=>a.id.localeCompare(b.id))];}));};
const digest=c=>catalog.hash(normalize(c));
function createAuthority({db,journal,approvalSecret,privateKey,publicKey}){
 let anchor=null,pending=null,frozen=true,publishing=false,leases=0,tail='root';const waiting=[];
 fs.mkdirSync(path.dirname(journal),{recursive:true});
 function apply(record){if(record.prev!==tail||catalog.hash({prev:record.prev,body:record.body})!==record.digest)throw Error('authority/journal-corrupt');tail=record.digest;const r=record.body;if(r.type==='prepare'){if(pending||r.next.generation!==(anchor?.generation||0)+1)throw Error('authority/journal-order');pending=r.next;}else if(r.type==='commit'){if(!pending||catalog.hash(pending)!==catalog.hash(r.next))throw Error('authority/journal-order');anchor=pending;pending=null;}else if(r.type==='abort'){if(!pending)throw Error('authority/journal-order');pending=null;}else throw Error('authority/journal-type');}
 if(fs.existsSync(journal))for(const line of fs.readFileSync(journal,'utf8').trim().split('\n').filter(Boolean))apply(JSON.parse(line));
 function append(body){const record={prev:tail,body,digest:catalog.hash({prev:tail,body})},fd=fs.openSync(journal,'a');try{fs.writeSync(fd,JSON.stringify(record)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}apply(record);}
 function authorize(secret){if(typeof secret!=='string'||secret.length!==approvalSecret.length||!crypto.timingSafeEqual(Buffer.from(secret),Buffer.from(approvalSecret)))throw Error('authority/not-authorized');}
 async function currentHead(){return db.runTransaction(async tx=>{const s=await tx.get(db.doc(catalog.headPath)),head=s.exists?s.data():null,actual=head?catalog.hash(head):null,expected=pending?.headHash===actual?pending:anchor?.headHash===actual?anchor:null;if(expected){const sources={};for(const name of allowed){const rows=await tx.get(db.collection(name));sources[name]=rows.docs.map(d=>({id:d.id,...d.data()}));}if(digest(sources)!==expected.sourceHash)throw Error('authority/unsupported-source-edit');}return head;});}
 async function recover(secret){authorize(secret);if(leases||publishing)throw Error('authority/busy');frozen=true;const head=await currentHead(),actual=head?catalog.hash(head):null;if(pending){if(actual===pending.headHash)append({type:'commit',next:pending});else if(actual===(anchor?.headHash||null))append({type:'abort'});else throw Error('authority/recovery-head-mismatch');}if((anchor?.headHash||null)!==actual)throw Error('authority/anchor-mismatch');frozen=false;return anchor?.generation||0;}
 async function publish(secret,{nextCatalog,previousCatalog,expectedGeneration,failAt}){
  authorize(secret);if(frozen||publishing)throw Error('authority/paused-or-busy');if((anchor?.generation||0)!==expectedGeneration)throw Error('authority/version-conflict');
  publishing=true;frozen=true;try{if(leases)await new Promise(resolve=>waiting.push(resolve));
   const next=structuredClone(nextCatalog),previous=structuredClone(previousCatalog),sourceHash=digest(next);if(anchor&&anchor.sourceHash!==digest(previous))throw Error('authority/source-version-conflict');
   const built=catalog.build(next),head=catalog.signedHead(built.mapping,expectedGeneration+1,privateKey);catalog.verifyHead(head,publicKey);const checkpoint={generation:head.generation,headHash:catalog.hash(head),sourceHash};
   const changes=[];for(const name of new Set([...Object.keys(previous),...Object.keys(next)])){const old=new Map((previous[name]||[]).map(r=>[r.id,r])),fresh=new Map((next[name]||[]).map(r=>[r.id,r]));for(const id of new Set([...old.keys(),...fresh.keys()]))if(catalog.hash(old.get(id)||null)!==catalog.hash(fresh.get(id)||null))changes.push({name,id,row:fresh.get(id)});}
   if(changes.length+built.packs.size+1>450)throw Error('authority/publication-too-large');
   append({type:'prepare',next:checkpoint});if(failAt==='beforeCommit')throw Error('fixture/interrupted-before-commit');
   await db.runTransaction(async tx=>{const oldHead=(await tx.get(db.doc(catalog.headPath))).data();if((oldHead?catalog.hash(oldHead):null)!==(anchor?.headHash||null))throw Error('authority/head-replayed');
    const actual={};for(const name of Object.keys(previous)){const snap=await tx.get(db.collection(name));actual[name]=snap.docs.map(d=>({id:d.id,...d.data()}));}if(digest(actual)!==digest(previous))throw Error('authority/unsupported-source-edit');
    const missing=[];for(const[id,payload]of built.packs){const s=await tx.get(db.doc('experimentalCatalogPacks/'+id));if(s.exists){if(catalog.hash(s.data())!==id)throw Error('authority/pack-corrupt');}else missing.push([id,payload]);}
    for(const c of changes){const ref=db.doc(c.name+'/'+c.id);if(c.row){const{id,...data}=c.row;tx.set(ref,data);}else tx.delete(ref);}
    for(const[id,payload]of missing)tx.create(db.doc('experimentalCatalogPacks/'+id),payload);tx.set(db.doc(catalog.headPath),head);if(failAt==='insideTransaction')throw Error('fixture/interrupted-inside-transaction');
   });if(failAt==='afterCommit')throw Error('fixture/interrupted-after-commit');append({type:'commit',next:checkpoint});frozen=false;return{generation:checkpoint.generation,sourceChanges:changes.length};
  }catch(error){frozen=true;throw error;}finally{publishing=false;}
 }
 return Object.freeze({publish,recover,publicKey,
  acquire(){if(frozen||!anchor)throw Error('authority/paused');leases++;const checkpoint=structuredClone(anchor);let released=false;return Object.freeze({checkpoint,release(){if(released)return;released=true;leases--;if(!leases)waiting.splice(0).forEach(resolve=>resolve());}});},
  status(){return{generation:anchor?.generation||0,frozen,publishing,leases,pending:!!pending};}
 });
}
module.exports={createAuthority,digest};
