const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {readingParts,normalize}=require('../js/lesson-narration-text.js');
const content=require('../js/story-playground-content.js');
const {jobsFromScenes,previewJobs,deduplicate,profileFor,filenameFor,generate,parseArgs,providerError,checkConnection}=require('../tools/generate-lesson-audio.cjs');
const audio=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(200)]);
function temp(){return fs.mkdtempSync(path.join(os.tmpdir(),'lakbay-narration-'));}
function config(extra={}){return{voiceId:'bayani',modelId:'eleven_multilingual_v2',profile:profileFor('bayani','eleven_multilingual_v2'),apiKey:'test-only',limit:1,maxCharacters:5000,...extra};}
test('all active scene reading parts preserve the source text and skip inactive scenes',()=>{
    const long=Array.from({length:25},(_,i)=>'This sentence number '+i+' retains all its words.').join(' ');
    assert.ok(readingParts(long).length>1);assert.equal(normalize(readingParts(long).join(' ')),normalize(long));
    const jobs=jobsFromScenes([{id:'a',missionId:'m',status:'active',content:long},{id:'b',status:'draft',content:'Do not send.'}]);
    assert.equal(jobs.length,readingParts(long).length);assert.ok(jobs.every(job=>job.reference.startsWith('m/a/')));
});
test('preview export contains every spoken segment including reordered care steps',()=>{
    const texts=new Set(deduplicate(previewJobs()).map(job=>job.text));
    for(let step=0;step<5;step++)for(const order of [['leave','notify','record'],['record','leave','notify']]){
        for(const activeClue of [null,'place','layer','care'])for(const text of content.narrationParts(step,{activeClue,order}))assert.ok(texts.has(normalize(text)),text);
    }
});
test('default is planning and paid mode requires an explicit non-conflicting switch',()=>{
    assert.equal(parseArgs(['--preview']).generate,false);assert.equal(parseArgs(['--preview','--generate']).limit,1);
    assert.throws(()=>parseArgs(['--preview','--plan','--generate']),/Choose/);assert.throws(()=>parseArgs(['--preview','--limit','0']),/positive/);
});
test('generator caps paid requests, reuses cached files, and sends the selected voice',async()=>{
    const folder=temp(),jobs=deduplicate([{text:'First lesson.',reference:'a'},{text:'Second lesson.',reference:'b'},{text:'First  lesson.',reference:'c'}]);
    const calls=[];const request=async(url,options)=>{calls.push({url,options});return new Response(audio,{headers:{'content-type':'audio/mpeg'}});};
    const first=await generate(jobs,config(),{folder,request});assert.equal(first.requests,1);assert.equal(first.entries.length,1);
    assert.ok(calls[0].url.includes('/bayani?'));assert.equal(calls[0].options.headers['xi-api-key'],'test-only');assert.equal(JSON.parse(calls[0].options.body).text,'First lesson.');
    const second=await generate(jobs,config(),{folder,request});assert.equal(second.requests,1);assert.equal(second.entries.length,2);
    const third=await generate(jobs,config(),{folder,request});assert.equal(third.requests,0);assert.equal(calls.length,2);
    assert.notEqual(filenameFor('First lesson.',config().profile),filenameFor('First lesson.',profileFor('different','eleven_multilingual_v2')));
});
test('character limit prevents spending past the requested cap',async()=>{
    let calls=0;const result=await generate([{text:'Longer than the cap',references:[]}],config({maxCharacters:3}),{folder:temp(),request:async()=>{calls++;}});
    assert.equal(calls,0);assert.equal(result.requests,0);
});
test('provider failures are not retried and non-audio responses are never cached',async()=>{
    let calls=0;await assert.rejects(generate([{text:'Hello'}],config(),{folder:temp(),request:async()=>{calls++;return new Response('denied',{status:401});}}),/HTTP 401/);assert.equal(calls,1);
    const folder=temp();await assert.rejects(generate([{text:'Hello'}],config(),{folder,request:async()=>new Response('{}',{headers:{'content-type':'application/json'}})}),/did not return audio/);
    assert.equal(fs.readdirSync(folder).length,0);
});
test('provider errors include the actual status and reason while redacting credentials',async()=>{
    const response=new Response(JSON.stringify({detail:{status:'model_not_available',message:'This voice cannot use the model. Key test-private-key and sk_anotherSecret. Bearer another-token'}}),{status:400,headers:{'request-id':'request-123'}});
    const error=await providerError(response,'test-private-key');
    assert.match(error.message,/model_not_available/);assert.match(error.message,/cannot use the model/);assert.match(error.message,/request-123/);
    assert.ok(!error.message.includes('test-private-key'));assert.ok(!error.message.includes('sk_anotherSecret'));assert.ok(!error.message.includes('another-token'));
});
test('validation and non-JSON error responses are handled without dumping response bodies',async()=>{
    const validation=await providerError(new Response(JSON.stringify({detail:[{msg:'Invalid model'},null]}),{status:422}));assert.match(validation.message,/Invalid model/);
    const html=await providerError(new Response('<html>Private upstream page</html>',{status:502}));assert.match(html.message,/HTTP 502/);assert.ok(!html.message.includes('Private upstream page'));
});
test('connection check uses only read-only voice and model metadata requests',async()=>{
    const calls=[];
    const result=await checkConnection(config(),{request:async(url,options)=>{
        calls.push({url,options});return Response.json(url.endsWith('/models')?[{model_id:'eleven_multilingual_v2',can_do_text_to_speech:true},{model_id:'voice_designer',can_do_text_to_speech:false}]:{high_quality_base_model_ids:['eleven_v3']});
    }});
    assert.equal(calls.length,2);assert.ok(calls.every(call=>call.options.method==='GET'&&!call.options.body&&!call.url.includes('text-to-speech')));
    assert.equal(result.selectedModelSupportsSpeech,true);assert.deepEqual(result.voiceRecommendedModels,['eleven_v3']);assert.equal(result.speechModels.length,1);
    assert.equal(parseArgs(['--check']).check,true);assert.throws(()=>parseArgs(['--check','--generate']),/separately/);
});
