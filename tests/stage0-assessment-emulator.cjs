// Reuse the full accepted assertions; only select the separate stage-0 package
// and its browser host. Original suite/accepted manifest stay unchanged.
const fs=require('fs'),path=require('path'),Module=require('module');
const original=path.join(__dirname,'student-assessment-emulator.cjs');let source=fs.readFileSync(original,'utf8');
for(const [from,to]of [["path.join(__dirname, '../functions/package.json')","path.join(__dirname, '../build/priority3-stage0-release/functions/package.json')"],["require('./secured-browser-emulator.cjs')","require('./stage0-browser-emulator.cjs')"],["require('../functions/student-assessment')","require('../build/priority3-stage0-release/functions/student-assessment')"]]){if(!source.includes(from))throw Error('Accepted suite shape changed');source=source.replaceAll(from,to);}
const compiled=new Module(original,module);compiled.filename=original;compiled.paths=Module._nodeModulePaths(__dirname);compiled._compile(source,original);
