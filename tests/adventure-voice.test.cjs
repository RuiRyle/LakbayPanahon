const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/adventure-voice.js'),'utf8');
function load(preferred='',blockedStorage=false){
    let voices=[];
    const context={window:{speechSynthesis:{getVoices:()=>voices}},document:{querySelector:()=>null},localStorage:{getItem:()=>{if(blockedStorage)throw Error('blocked');return preferred;}},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}}};
    vm.runInNewContext(source,context);
    return {create:text=>context.window.LakbayNarrator.create(text),voices:list=>{voices=list;}};
}
test('late-loaded device voices are used without changing lesson text',()=>{
    const narrator=load();const text='Tabon is in Quezon, Palawan.';
    assert.equal(narrator.create(text).lang,'en-PH');
    const local={voiceURI:'ph',lang:'en-PH',name:'Device English'};
    narrator.voices([{voiceURI:'fr',lang:'fr-FR',name:'French',default:true},local]);
    const utterance=narrator.create(text);
    assert.equal(utterance.voice,local);assert.equal(utterance.text,text);
    assert.equal(utterance.pitch,1.12);assert.equal(utterance.rate,.96);
});
test('saved voice takes precedence over automatic selection',()=>{
    const narrator=load('chosen');const voice={voiceURI:'chosen',lang:'en-GB',name:'Chosen voice'};
    narrator.voices([{voiceURI:'ph',lang:'en-PH',name:'Local'},voice]);
    assert.equal(narrator.create('Hello').voice,voice);
});
test('unavailable saved voices and blocked storage fall back safely',()=>{
    for(const narrator of [load('missing'),load('',true)]){
        const voice={voiceURI:'available',lang:'en-US',name:'Natural English'};
        narrator.voices([voice]);assert.equal(narrator.create('Hello').voice,voice);
    }
});
