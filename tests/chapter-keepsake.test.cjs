const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/chapter-keepsake.js'),'utf8').replace(/^import[^\n]+\n/gm,'').replace(/export /g,'');
const context=vm.createContext({});vm.runInContext(source,context);
test('completion keepsakes use owned references for only the completed chapter',()=>{
 const rows=[{userId:'ana',chapterId:'c',artifactId:'a'},{userId:'ana',chapterId:'c',artifactId:'a'},{userId:'ben',chapterId:'c',artifactId:'b'},{userId:'ana',chapterId:'other',artifactId:'x'},{userId:'ana',chapterId:'c',artifactId:'bad/id'}];
 assert.deepEqual(Array.from(context.chapterArtifactIds(rows,'ana','c')),['a']);
 for(let i=0;i<6;i++)rows.push({userId:'ana',chapterId:'c',artifactId:'item'+i});
 assert.equal(context.chapterArtifactIds(rows,'ana','c').length,3);
});
