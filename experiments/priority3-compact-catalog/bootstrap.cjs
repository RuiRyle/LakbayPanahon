'use strict';
process.env.GCE_METADATA_HOST='127.0.0.1:9';
const crypto=require('crypto'),core=require('../priority3-netlify/service/student-assessment.js'),{assessmentStore}=require('../priority3-read-efficiency/memo-store.cjs'),catalog=require('./catalog.cjs');
// Ephemeral test-only signing key. Not a Firebase/Admin credential; never persisted.
const pair=crypto.generateKeyPairSync('ed25519'),factory=core.createAssessmentService;
let offset=0;core.createAssessmentService=(store,options={})=>factory(store,{...options,clock:()=>Date.now()+offset});
core.assessmentStore=(db,timestamp)=>catalog.wrapStore(assessmentStore(db,timestamp),pair.publicKey);
const p=require('../priority3-netlify/proof.cjs'),seed=p.fixture.seedLocalCatalog;
p.fixture.seedLocalCatalog=async()=>{await seed();const built=catalog.build(p.catalog);const start=Date.now();await p.meter.run('catalog-publication',()=>catalog.publish(p.db,built,0,pair.privateKey));module.exports.publication={...p.meter.total('catalog-publication'),packs:built.packs.size,maxPackBytes:Math.max(...[...built.packs.values()].map(x=>catalog.bytes(x).length)),durationMs:Date.now()-start};p.meter.events.length=0;};
module.exports={...p,advanceSchoolTime:()=>{offset+=5*60*1000;},catalogTools:catalog,signingFixture:pair};
