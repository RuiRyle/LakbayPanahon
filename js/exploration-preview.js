// Temporary, tab-local developer exploration. Hosted student pages stay normal.
export function initializeExplorationPreview() {
    const local=['localhost','127.0.0.1','[::1]'].includes(window.location.hostname);
    let enabled=false;
    if(local){try{enabled=sessionStorage.getItem('lakbayExplorationPreview')!=='off';}catch{}}
    globalThis.__lakbayExplorationPreview=enabled;
    if(!local||document.getElementById('explorationPreviewBar'))return;
    const bar=document.createElement('aside');bar.id='explorationPreviewBar';
    bar.setAttribute('aria-label','Local testing mode');
    Object.assign(bar.style,{position:'fixed',bottom:'12px',left:'12px',right:'12px',zIndex:'10000',padding:'12px 16px',background:'#203e36',color:'#fff9e9',border:'2px solid #c5a665',borderRadius:'12px',boxShadow:'0 4px 18px #0003',display:'flex',gap:'12px',alignItems:'center',flexWrap:'wrap',font:'14px/1.5 system-ui'});
    const message=document.createElement('span');message.style.flex='1';
    message.textContent=enabled?'Testing preview: all published lessons are open. Quiz and challenge results do not save completion or rewards.':'Normal learning locks are active.';
    const toggle=document.createElement('button');toggle.type='button';toggle.textContent=enabled?'Restore normal locks':'Open all lessons for testing';
    Object.assign(toggle.style,{padding:'8px 12px',font:'inherit',borderRadius:'8px',border:'1px solid #ddc68e',background:'#fff7e3',color:'#203e36',cursor:'pointer'});
    toggle.addEventListener('click',()=>{try{sessionStorage.setItem('lakbayExplorationPreview',enabled?'off':'on');window.location.reload();}catch{message.textContent='Allow tab storage to change testing mode.';}});
    bar.append(message,toggle);document.body.append(bar);
    document.body.style.paddingBottom='100px';
}
