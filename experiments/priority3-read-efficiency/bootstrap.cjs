'use strict';
// Patch exports in this process only, before callable construction. Disk copies
// of Stage 0 and the prior proof remain unchanged.
const core=require('../priority3-netlify/service/student-assessment.js'),original=core.createAssessmentService;
let offset=0;
core.createAssessmentService=(store,options={})=>original(store,{...options,clock:()=>Date.now()+offset});
if(process.env.READ_EFFICIENCY_MODE==='optimized')core.assessmentStore=require('./memo-store.cjs').assessmentStore;
const p=require('../priority3-netlify/proof.cjs');
module.exports={...p,advanceSchoolTime:()=>{offset+=5*60*1000;}};
