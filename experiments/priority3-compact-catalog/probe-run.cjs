const fs=require('fs'),p=require('./bootstrap.cjs');
(async()=>{await p.fixture.seedLocalCatalog();const result=await require('./probes.cjs')(p);fs.writeFileSync('docs/validation/priority-3-compact-catalog-security-2026-11-07.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));})().catch(e=>{console.error(e);process.exitCode=1;}).finally(p.cleanup);
