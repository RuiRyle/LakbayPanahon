import {dashboardBayaniPrompt} from './bayani-prompts.js';

const suggestedQuestion=dashboardBayaniPrompt(window.location.search);
const promptInput=document.getElementById('bayaniInput');
if(suggestedQuestion&&promptInput){
    let used=false;
    const observer=new MutationObserver(prepareQuestion);
    function prepareQuestion(){
        if(used||promptInput.disabled)return;
        used=true;observer.disconnect();
        if(promptInput.value.trim())return;
        promptInput.value=suggestedQuestion.slice(0,promptInput.maxLength>0?promptInput.maxLength:2000);
        promptInput.dispatchEvent(new Event('input',{bubbles:true}));
        const hint=document.createElement('p');hint.className='bayani-draft-hint';
        hint.textContent='Your suggested question is ready. You can edit it before sending.';
        hint.setAttribute('role','status');promptInput.closest('form')?.prepend(hint);
    }
    observer.observe(promptInput,{attributes:true,attributeFilter:['disabled']});prepareQuestion();
    window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
}
