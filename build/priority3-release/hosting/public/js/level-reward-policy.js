// Cosmetic milestones only. Learning access, assessment and XP use their existing policies.
export const explorerRewards=Object.freeze([
 Object.freeze({level:1,title:'History Scout',frameId:'none',frameName:'Classic Explorer'}),
 Object.freeze({level:3,title:'Clue Detective',frameId:'bamboo',frameName:'Bamboo Explorer'}),
 Object.freeze({level:5,title:'Heritage Explorer',frameId:'sunburst',frameName:'Golden Sun'}),
 Object.freeze({level:10,title:'History Guardian',frameId:'guardian',frameName:'History Guardian'})
]);
export function explorerRewardState(level){
 if(!Number.isSafeInteger(level)||level<1)return null;
 const unlocked=explorerRewards.filter(reward=>reward.level<=level);
 return {level,title:unlocked[unlocked.length-1].title,unlocked,next:explorerRewards.find(reward=>reward.level>level)||null};
}
export function equippedExplorerFrame(level,frameId){
 return explorerRewardState(level)?.unlocked.some(reward=>reward.frameId===frameId)?frameId:'none';
}
