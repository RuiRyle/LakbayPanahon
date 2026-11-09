// A missing receipt after a transport failure does not prove the write aborted.
export async function executeAdminDecision(write,readReceipt,expected) {
    const matches=(actual,wanted)=>wanted&&typeof wanted==='object'
        ? actual&&Object.keys(wanted).every(key=>matches(actual[key],wanted[key]))
        : actual===wanted;
    const check=async()=>{
        const snapshot=await readReceipt();
        if(!snapshot.exists())return false;
        if(!matches(snapshot.data(),expected))throw Error('The saved decision does not match this request. Reload and inspect the decision history.');
        return true;
    };
    try {await write();}
    catch(error) {
        if(!['unavailable','deadline-exceeded','unknown','internal','cancelled'].includes(String(error.code||'').split('/').pop()))throw error;
        try{if(await check())return;}catch{}
        const uncertain=new Error('The decision could not be confirmed. Your review is kept here. Check the saved decision before submitting again.');
        uncertain.code='admin/decision-unknown';uncertain.checkDecision=check;throw uncertain;
    }
}
