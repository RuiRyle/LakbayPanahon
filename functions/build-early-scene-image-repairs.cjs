const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const input=require('../data/early-scene-image-repairs.json');
const snapshot=require('../docs/validation/learning-content-snapshot.json');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const wrap=(s,size)=>{const lines=[];let line='';for(const word of s.split(/\s+/)){if(line&&(line+' '+word).length>size){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines;};
const writes=input.scenes.map(item=>{
    const scene=snapshot.collections.storyScenes.find(s=>s.id===item.sceneId);
    if(!scene)throw Error('Scene missing from baseline: '+item.sceneId);
    const filename='learning-guide-'+item.sceneId+'.svg';
    const description='Modern learning diagram. '+item.labels.join('; ')+'. '+item.note;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620" role="img" aria-labelledby="title description">
<title id="title">${esc(scene.title)}</title><desc id="description">${esc(description)}</desc>
<rect width="900" height="620" rx="28" fill="#173f39"/>
<text x="44" y="46" font-family="sans-serif" font-size="16" fill="#e9c97f">BAYANI FIELD JOURNAL · LEARNING GUIDE</text>
<text x="44" y="94" font-family="sans-serif" font-size="28" fill="#fff5dd">${esc(scene.title)}</text>
${item.labels.map((label,i)=>`<rect x="44" y="${126+i*108}" width="812" height="88" rx="16" fill="#fff5dd"/><circle cx="83" cy="${170+i*108}" r="23" fill="#d6b568"/><text x="83" y="${177+i*108}" text-anchor="middle" font-family="sans-serif" font-size="21" fill="#173f39">${i+1}</text><text x="124" y="${178+i*108}" font-family="sans-serif" font-size="24" fill="#173f39">${esc(label)}</text>`).join('')}
<text x="44" y="482" font-family="sans-serif" font-size="18" fill="#fff5dd">${wrap(item.note,79).map((line,i)=>`<tspan x="44" dy="${i?26:0}">${esc(line)}</tspan>`).join('')}</text>
<text x="44" y="580" font-family="sans-serif" font-size="15" fill="#e9c97f">Modern teaching diagram — not an original object, script sample or historical route.</text></svg>`;
    fs.writeFileSync(path.join(root,'assets/story',filename),svg);
    return {path:'storyScenes/'+item.sceneId,create:false,
        expected:{missionId:scene.missionId,title:scene.title,content:scene.content,imageUrl:scene.imageUrl},
        fields:{imageUrl:'../assets/story/'+filename,imageFit:'contain',imageAlt:description,
            imageCaption:'Modern teaching diagram based on this lesson, not an original historical image.'}};
});
const plan={projectId:'lakbaypanahon-1797e',scope:'Image metadata only for 15 existing early-chapter scenes; no grading, rewards or learner changes',
    baselineSnapshotAt:snapshot.auditedAt,reviewStatus:input.reviewStatus,writes};
fs.writeFileSync(path.join(root,'data/early-scene-image-repairs-migration.json'),JSON.stringify(plan,null,2));
console.log('Built '+writes.length+' guarded image updates and teaching diagrams.');
