// Allowlist only: public cards never contain answer keys, explanations or feedback.
function publicDailyCard(row){
 const keys=['status','order','question','optionA','optionB','optionC','optionD','xpReward'];
 if(!row||typeof row!=='object'||!['active','inactive','draft'].includes(row.status)||typeof row.question!=='string')throw Error('Invalid daily challenge');
 for(const key of ['optionA','optionB','optionC','optionD'])if(typeof row[key]!=='string')throw Error('Daily choices missing');
 if(!Number.isInteger(row.xpReward)||row.xpReward<0)throw Error('Invalid daily reward');
 return Object.fromEntries(keys.filter(key=>row[key]!==undefined).map(key=>[key,row[key]]));
}
module.exports={publicDailyCard};
