// Actual accepted browser flow against separate stage-0 pages; no assertion
// or security bypass changes. Loopback environment comes from original harness.
const fs=require('fs'),path=require('path'),Module=require('module'),original=path.join(__dirname,'secured-browser-emulator.cjs');let source=fs.readFileSync(original,'utf8');
if(!source.includes("path.join(root,'build/priority3-release/hosting/public')"))throw Error('Browser harness changed');
source=source.replace("process.env.PRIORITY3_PACKAGE_BROWSER === '1' ? path.join(root,'build/priority3-release/hosting/public') : root","path.join(root,'build/priority3-stage0-release/hosting/public')").replaceAll('priority-3-browser-emulator-2026-11-07.json','priority-3-stage0-browser-emulator-2026-11-07.json');
const compiled=new Module(original,module);compiled.filename=original;compiled.paths=Module._nodeModulePaths(__dirname);compiled._compile(source,original);module.exports=compiled.exports;
