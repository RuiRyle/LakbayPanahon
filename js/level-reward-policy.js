// Cosmetic milestones only. Learning access, assessment and XP use their existing policies.
export const unframedExplorer='unframed';
export const explorerRewards=Object.freeze([
 Object.freeze({level:1,title:'History Scout',frameId:'none',frameName:'Classic Explorer'}),
 Object.freeze({level:3,title:'Clue Detective',frameId:'bamboo',frameName:'Bamboo Explorer'}),
 Object.freeze({level:5,title:'Heritage Explorer',frameId:'sunburst',frameName:'Golden Sun'}),
 Object.freeze({level:10,title:'History Guardian',frameId:'guardian',frameName:'History Guardian'}),
 Object.freeze({level:15,title:'Cartographer',frameId:'compass',frameName:'Cartographer\'s Compass'}),
 Object.freeze({level:30,title:'Navigator',frameId:'navigator',frameName:'Navigator'})
]);
export function explorerRewardState(level){
 if(!Number.isSafeInteger(level)||level<1)return null;
 const unlocked=explorerRewards.filter(reward=>reward.level<=level);
 return {level,title:unlocked[unlocked.length-1].title,unlocked,next:explorerRewards.find(reward=>reward.level>level)||null};
}
export function equippedExplorerFrame(level,frameId){
 if(frameId===unframedExplorer)return unframedExplorer;
 return explorerRewardState(level)?.unlocked.some(reward=>reward.frameId===frameId)?frameId:'none';
}

const designs = [
 [2,'journal','Compass','reward-covers/compass.jpg'], [4,'banner','Sunrise','reward-covers/banner-sunrise.jpg'],
 [6,'journal','Wave pattern','reward-covers/wave.jpg'], [8,'banner','River journey','reward-covers/banner-river.jpg'],
 [12,'journal','Illustrated harbor','reward-covers/harbor.jpg'], [14,'banner','Starlit sea','reward-covers/banner-starlit.jpg'],
 [16,'journal','Coastal chart','reward-covers/coast.jpg'], [18,'banner','Boatbuilding','reward-covers/banner-boatbuilding.jpg'],
 [20,'journey','Illustrated journey','butuan-boatbuilding.jpg'], [22,'journal','Field notebook','reward-covers/notebook.jpg'],
 [24,'banner','Museum gallery','reward-covers/banner-gallery.jpg'], [25,'artifact','Featured artifact','voices.svg'],
 [26,'journal','Woven pattern','reward-covers/woven.jpg'], [28,'banner','Island passage','reward-covers/banner-passage.jpg'],
 [32,'journal','Night voyage','reward-covers/night.jpg'], [34,'banner','Gold expedition','reward-covers/banner-expedition.jpg']
];
export const rewardTrack = Object.freeze([
 ...explorerRewards.map(frame=>({...frame,kind:'frame',name:frame.frameName})),
 ...designs.map(([level,kind,name,art])=>({level,kind,name,art}))
].sort((a,b)=>a.level-b.level));
export function nextMilestone(level){return rewardTrack.find(item=>item.level>level);}
