import {auth} from './firebase-config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {requireLearningAccess} from './learning-access.js';
import {validatedDiscoveryCase} from './discovery-cases.js';
import {mountDiscoveryCase} from './discovery-case-view.js';
const disclosure=document.getElementById('missionDiscovery');
if(disclosure){
    const host=disclosure.querySelector('[data-discovery-activity]');
    let activity=null,owner=null,generation=0,dispose=null,suspended=false;
    function reset(){
        generation++;dispose?.();dispose=null;activity=null;owner=null;
        disclosure.open=false;host.replaceChildren();disclosure.hidden=true;
    }
    function receive(event){
        reset();
        const {mission,user}=event.detail||{};
        if(suspended||!user||user!==auth.currentUser)return;
        activity=validatedDiscoveryCase(mission);
        if(!activity)return;
        owner=user;disclosure.hidden=false;
    }
    async function open(){
        if(!disclosure.open||suspended||!activity||owner!==auth.currentUser)return;
        const request=++generation,user=owner,selected=activity;
        const current=()=>!suspended&&request===generation&&auth.currentUser===user&&disclosure.open;
        dispose?.();dispose=null;host.replaceChildren();host.textContent='Checking access to this mission...';
        try{
            await requireLearningAccess(selected.chapterId,selected.missionId);
            if(!current())return;
            dispose=mountDiscoveryCase(host,selected,{isCurrent:current});
        }catch{
            if(current())host.textContent='This activity could not open. Check your connection and mission access, then close and reopen this panel to retry.';
        }
    }
    function request(){reset();if(!suspended&&auth.currentUser)document.dispatchEvent(new Event('lakbay:request-mission-guide'));}
    disclosure.addEventListener('toggle',()=>{if(disclosure.open)open();else{generation++;dispose?.();dispose=null;host.replaceChildren();}});
    document.addEventListener('lakbay:mission-guide',receive);
    onAuthStateChanged(auth,request);
    window.addEventListener('pagehide',()=>{suspended=true;reset();});
    window.addEventListener('pageshow',event=>{suspended=false;if(event.persisted)request();});
}
