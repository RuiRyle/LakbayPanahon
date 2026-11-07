// Run the legacy collection assertions with their newly imported UI helpers
// explicitly stubbed. Production sources and original fixtures stay untouched.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const file=process.argv[2];if(!['student-artifacts-browser.cjs','student-achievements-browser.cjs'].includes(file))throw Error('Choose an approved local collection fixture');
const stubs="function closeMuseumExhibit(){} function openMuseumExhibit(){} function createDiscoveryPinControl(){return document.createElement('span');} function studentLoadMessage(error,fallback){return fallback;}\n";
const filename=path.join(__dirname,file),original=fs.readFileSync(filename,'utf8'),source=original.includes('function closeMuseumExhibit()')?original:original.replace('const source=fs.readFileSync','const source='+JSON.stringify(stubs)+'+fs.readFileSync');
const moduleFixture=new Module(filename,module);moduleFixture.filename=filename;moduleFixture.paths=Module._nodeModulePaths(__dirname);moduleFixture._compile(source,filename);
