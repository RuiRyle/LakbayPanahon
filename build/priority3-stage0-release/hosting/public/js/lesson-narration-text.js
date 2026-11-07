// Shared by the browser and the offline narration generator.
(() => {
    const normalize=value=>String(value??'').replace(/\s+/g,' ').trim();
    function readingParts(content){
        const result=[];
        for(const raw of String(content??'').split(/\n\s*\n/)){
            const text=raw.trim();if(!text)continue;
            if(text.split(/\s+/).length<=45||typeof Intl.Segmenter!=='function'){result.push(text);continue;}
            let current='';
            for(const {segment} of new Intl.Segmenter('en',{granularity:'sentence'}).segment(text)){
                if(current&&(current+segment).split(/\s+/).length>45){result.push(current.trim());current='';}current+=segment;
            }
            if(current.trim())result.push(current.trim());
        }
        return result;
    }
    const api={normalize,readingParts};
    if(typeof module!=='undefined'&&module.exports)module.exports=api;
    if(typeof window!=='undefined')window.LakbayLessonText=api;
})();
