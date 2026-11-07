// One source for preview text, browser narration and batch audio generation.
(() => {
    const scenes = [
        {title:"A find's story needs more than a photo", brief:'Today we will learn why a find needs a record of where it was found.', guide:'Look for the difference between seeing an object and knowing its setting.'},
        {title:'Read the three evidence notes', brief:'Open each note. Ask yourself: what does this information help us understand?', guide:'The place and layer notes connect the object to its setting. The care note explains how to protect that information.'},
        {title:'Protect the evidence', brief:'You notice a possible old object at a managed heritage site. Move the steps into a careful order, then check your plan.', guide:'Leave the object in place first. Responsible site staff should decide what happens next.'},
        {title:'Explain why the notes matter', brief:'A museum has a photograph of a find, but no record of its place or layer. Which explanation uses what you learned?', guide:'You can reopen the lesson notes below. Use the evidence to explain your answer.'},
        {title:'What will you remember?', brief:'A photograph shows appearance. Context connects the find to its recorded setting. Both can help us learn about the past.', guide:'Try explaining context in your own words: what would you record, and why?'}
    ];
    const clues = [
        {id:'place',icon:'1',title:'Place',hint:'Where was it found?',text:'A place record tells us where a find was noticed. Tabon is in Quezon, Palawan. Callao Cave is in Peñablanca, Cagayan. They are different sites.',meaning:'Keep a find with its correct site label. A map locates a site; it does not, by itself, prove how ancient people travelled.'},
        {id:'layer',icon:'2',title:'Layer and surroundings',hint:'What was around it?',text:'A layer record describes the layer and relationships to other finds. These details are part of the find’s context.',meaning:'A photograph can show the object’s appearance. It cannot replace a record of its layer and surroundings.'},
        {id:'care',icon:'3',title:'Care',hint:'How do we protect it?',text:'At a managed heritage site, leave a possible old object in place and notify responsible site staff. Let staff decide how to record and handle it.',meaning:'Moving or washing an object can disturb the information around it. Protecting the setting protects opportunities to learn.'}
    ];
    const options = [
        {text:'A clear photograph can replace the missing place and layer records.',correct:false,hint:'A photograph shows appearance. It does not replace the recorded place and layer. Reopen the Layer note and compare the two kinds of information.'},
        {text:'Without its place and layer notes, we know less about the find.',correct:true,hint:'Yes. Place and layer are parts of context. Losing those records makes it harder to connect the object with its setting, even when the photograph is clear.'},
        {text:'The missing notes do not matter if the object looks very old.',correct:false,hint:'Appearance alone cannot replace context. We still need the recorded place, layer and relationships to other finds.'}
    ];
    const orderItems = {leave:'Leave the object where it is.',notify:'Notify responsible site staff.',record:'Let responsible staff record its setting.'};

    const goal='Explain why place and layer records matter, and choose a careful way to protect a find.';
    const keyIdea='Context means a find?s recorded place, layer and relationships to other finds. These details help connect the object to its setting.';
    const example='A photograph shows a stone tool. A field note records its cave and layer. The photo shows what the tool looks like; the note connects it to where it was found. Together they tell us more than the photo alone.';
    const careReason='Recording a find helps most when its setting is still undisturbed. Leave it in place before telling staff. Moving the object first can separate it from useful information.';
    const takeaways=['Context includes recorded place, layer and relationships to other finds.','A photograph helps show appearance. It does not replace the setting records.','At a managed heritage site, leave a possible find in place and notify responsible staff.'];
    function narrationParts(step,{activeClue=null,order=['notify','record','leave']}={}){
        const parts=[scenes[step].title,scenes[step].brief];
        if(step===0)parts.push('Your goal is to explain why place and layer records matter.',goal,keyIdea,example);
        if(step===1){const clue=clues.find(item=>item.id===activeClue);if(clue)parts.push(clue.title,clue.text,'Why it matters.',clue.meaning);else parts.push('Open a note, then tap Listen to hear it.');}
        if(step===2)parts.push(careReason,...order.map(id=>orderItems[id]));
        if(step===3)parts.push(...options.map((option,i)=>String.fromCharCode(65+i)+'. '+option.text));
        if(step===4)parts.push(...takeaways);
        return parts;
    }
    const api={scenes,clues,options,orderItems,goal,keyIdea,example,careReason,takeaways,narrationParts};
    if(typeof module!=='undefined'&&module.exports)module.exports=api;
    if(typeof window!=='undefined')window.LakbayPlaygroundContent=api;
})();
