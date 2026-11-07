export const DISCOVERY_PIN_LIMIT=3;
export function validDiscoveryPin(pin) {
    return pin&&['artifact','journal'].includes(pin.kind)&&typeof pin.id==='string'&&pin.id.trim()===pin.id&&pin.id.length>0&&pin.id.length<=256&&!pin.id.includes('/');
}
export function discoveryPinKey(userId) {
    if(typeof userId!=='string'||!userId.trim())throw Error('Sign in to pin a discovery.');
    return 'lakbay.discovery-wall.v1.'+encodeURIComponent(userId);
}
export function readDiscoveryPins(userId,storage) {
    try{
        const raw=(storage||globalThis.localStorage).getItem(discoveryPinKey(userId));
        let values=[];try{values=raw?JSON.parse(raw):[];}catch{}
        const seen=new Set();
        const pins=(Array.isArray(values)?values:[]).filter(pin=>{
            if(!validDiscoveryPin(pin))return false;
            const key=pin.kind+':'+pin.id;if(seen.has(key))return false;seen.add(key);return true;
        }).slice(0,DISCOVERY_PIN_LIMIT).map(({kind,id})=>({kind,id}));
        return {available:true,pins};
    }catch{return {available:false,pins:[]};}
}
export function toggleDiscoveryPin(userId,pin,storage) {
    if(!validDiscoveryPin(pin))return {ok:false,message:'This discovery cannot be pinned.'};
    const previous=readDiscoveryPins(userId,storage);
    if(!previous.available)return {ok:false,message:'Pins could not be saved in this browser. You can still use your journal and collections.'};
    const exists=previous.pins.some(item=>item.kind===pin.kind&&item.id===pin.id);
    if(!exists&&previous.pins.length>=DISCOVERY_PIN_LIMIT)return {ok:false,message:'Your wall has three discoveries. Remove a pin in My Profile to make room.'};
    const pins=exists?previous.pins.filter(item=>item.kind!==pin.kind||item.id!==pin.id):[...previous.pins,{kind:pin.kind,id:pin.id}];
    try{(storage||globalThis.localStorage).setItem(discoveryPinKey(userId),JSON.stringify(pins));}
    catch{return {ok:false,message:'Your pin change could not be saved. Try again when browser storage is available.'};}
    return {ok:true,pinned:!exists,pins,message:exists?'Removed from your discovery wall.':'Pinned to your profile on this browser.'};
}
export function createDiscoveryPinControl({userId,kind,id,isCurrent,onChange,showWallLink=true}) {
    const control=document.createElement('div');control.className='discovery-pin-control';
    const button=document.createElement('button');button.type='button';button.className='text-button discovery-pin-button';
    const status=document.createElement('p');status.className='discovery-pin-status';status.setAttribute('role','status');
    const sync=()=>{
        const saved=readDiscoveryPins(userId);const pinned=saved.pins.some(pin=>pin.kind===kind&&pin.id===id);
        button.textContent=pinned?'Remove pin':'Pin to My Profile';button.setAttribute('aria-pressed',String(pinned));
    };
    sync();button.addEventListener('click',()=>{
        if(!isCurrent())return;
        const result=toggleDiscoveryPin(userId,{kind,id});status.textContent=result.message;
        if(result.ok){sync();onChange?.();}
    });
    control.append(button);
    if(showWallLink){const link=document.createElement('a');link.href='my-profile.html#discoveryWall';link.className='text-button';link.textContent='View my wall';control.append(link);}
    control.append(status);return control;
}
