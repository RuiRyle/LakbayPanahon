// Actual application modules and pages, real loopback Auth/Functions/Firestore.
const fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  http = require('node:http'),
  {
    spawn
  } = require('node:child_process');
const root = path.resolve(__dirname, '..'),
  pause = ms => new Promise(r => setTimeout(r, ms));
async function runSecuredBrowser() {
  if (process.env.GCLOUD_PROJECT !== 'demo-lakbaypanahon' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8180') throw Error('Local demo emulators required');
  const webRoot = process.env.PRIORITY3_PACKAGE_BROWSER === '1' ? path.join(root,'build/priority3-release/hosting/public') : root;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/bootstrap.html') {
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><title>Local assessment fixture</title>');
      return;
    }
    if (url.pathname === '/js/firebase-environment.js') {
      res.setHeader('Content-Type', 'text/javascript');
      res.end("export const firebaseEnvironment={mode:'emulator',projectId:'demo-lakbaypanahon'};");
      return;
    }
    const name = path.resolve(webRoot, '.' + url.pathname);
    if (!name.startsWith(webRoot + path.sep) || !/^\/(js|pages|css|assets)\//.test(url.pathname)) {
      res.writeHead(404);
      res.end();
      return;
    }
    fs.readFile(name, (err, b) => {
      if (err) {
        res.writeHead(404);
        res.end();
        return;
      }
      // Only the isolated test host adapts the unchanged production config's
      // dedicated demo project name. No production config bytes are published.
      if(webRoot!==root&&url.pathname==='/js/firebase-config.js')b=Buffer.from(b.toString().replaceAll('demo-lakbay-local','demo-lakbaypanahon'));
      res.setHeader('Content-Type', {
        '.js': 'text/javascript',
        '.html': 'text/html',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
        '.mp3': 'audio/mpeg'
      }[path.extname(name)] || 'application/octet-stream');
      res.end(b);
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port,
    temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lakbay-secured-')),
    profile = path.join(temp, 'chrome');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], {
    windowsHide: true,
    stdio: 'ignore'
  });
  let ws,
    sequence = 0;
  const pending = new Map(),
    contexts = new Map(),
    errors = [],
    checks = [];
  try {
    const active = path.join(profile, 'DevToolsActivePort');
    let port;
    for (let i = 0; i < 100 && !port; i++) {
      try {
        port = fs.readFileSync(active, 'utf8').split('\n')[0];
      } catch {}
      if (!port) await pause(100);
    }
    if (!port) throw Error('Chrome startup unavailable');
    const tabs = await (await fetch('http://127.0.0.1:' + port + '/json')).json();
    ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r, {
      once: true
    }));
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence,
        timer = setTimeout(() => {
          pending.delete(id);
          reject(Error('Browser timeout ' + method));
        }, 30000);
      pending.set(id, {
        resolve: r => {
          clearTimeout(timer);
          resolve(r);
        },
        reject
      });
      ws.send(JSON.stringify({
        id,
        method,
        params
      }));
    });
    let interruptedSubmission=false;
    ws.addEventListener('message', e => {
      const m = JSON.parse(e.data);
      if(m.method==='Fetch.requestPaused'){
        const p=m.params;
        if(!interruptedSubmission&&p.request.method==='POST'&&p.responseStatusCode===200){interruptedSubmission=true;send('Fetch.failRequest',{requestId:p.requestId,errorReason:'Failed'}).then(()=>send('Fetch.disable')).catch(()=>{});}
        else send('Fetch.continueRequest',{requestId:p.requestId}).catch(()=>{});
      }
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id);
        pending.delete(m.id);
        m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result);
      }
      if (m.method === 'Runtime.executionContextCreated' && m.params.context.auxData?.isDefault) contexts.set(m.params.context.auxData.frameId, m.params.context.id);
      if (m.method === 'Runtime.executionContextsCleared') contexts.clear();
      if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      if (m.method === 'Page.javascriptDialogOpening') send('Page.handleJavaScriptDialog', {
        accept: true
      }).catch(() => {});
    });
    await send('Page.enable');
    await send('Runtime.enable');
    const evaluate = async expression => {
      const tree = await send('Page.getFrameTree'),
        frame = tree.frameTree.childFrames?.find(f => f.frame.url.startsWith(base + '/pages/')),
        contextId = frame && contexts.get(frame.frame.id);
      const r = await send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
        ...(contextId ? {
          contextId
        } : {})
      });
      if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    };
    const wait = async (expression, label) => {
      for (let i = 0; i < 150; i++) {
        try {
          if (await evaluate(expression)) return;
        } catch {}
        await pause(150);
      }
      throw Error('Browser wait ' + label + '; ' + (await evaluate('document.body.innerText.slice(-1200)')));
    };
    await send('Page.navigate', {
      url: base + '/bootstrap.html'
    });
    await wait('document.readyState==="complete"', 'bootstrap');
    await evaluate(`(async()=>{const {auth}=await import('/js/firebase-config.js');const a=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js');await a.signInWithEmailAndPassword(auth,'alice@example.com','Local-fixture-only-7362');})()`);
    // Local fixtures prefill profile setup so the real auth guard reaches the quiz.
    await send('Page.navigate', {
      url: base + '/pages/quiz.html?chapter=c1&mission=m1'
    });
    await wait(`document.getElementById('quizOptions')?.querySelector('button')&&!document.getElementById('quizContent').hidden`, 'actual quiz ready');
    checks.push('Real quiz HTML/Auth guard and Functions issuance load');
    await evaluate(`document.querySelector('#quizMissionBriefing button')?.click()`);
    for (let i = 0; i < 5; i++) {
      await wait(`!!document.querySelector('#quizOptions button[data-option="A"]')`, 'question action ' + i);
      await evaluate(`document.querySelector('#quizOptions button[data-option="A"]').click()`);
      // App markup uses nextQuestionButton ID; select the actual variable by DOM.
      if(i===2)await send('Fetch.enable',{patterns:[{urlPattern:'*submitStudentActivity*',requestStage:'Response'}]});
      await evaluate(`document.querySelector('#nextQuestionButton, #nextQuestion').click()`);
      await wait(`(async()=>{const c=await import('/js/student-assessment-client.js');return Object.keys(c.assessmentState({kind:'mission',chapterId:'c1',missionId:'m1',quizId:'quiz1'})?.answers||{}).length===${i+1};})()`, 'server checkpoint ' + i);
      if(i===1){await send('Page.reload');await wait(`document.querySelector('#quizOptions button')&&!document.getElementById('quizContent').hidden`,'refreshed quiz');await wait(`(async()=>{const c=await import('/js/student-assessment-client.js');return Object.keys(c.assessmentState({kind:'mission',chapterId:'c1',missionId:'m1',quizId:'quiz1'})?.answers||{}).length===2;})()`,'restored server answers');checks.push('Real page reload restores the issued sequence and two saved server answers');}
    }
    const state = await evaluate(`(async()=>{const c=await import('/js/student-assessment-client.js');return c.assessmentState({kind:'mission',chapterId:'c1',missionId:'m1',quizId:'quiz1'});})()`);
    if (Object.keys(state.answers).length !== 5) throw Error('Server answers not saved');
    checks.push('Five actual quiz checkpoint answers saved through callable advancement');
    // Confirmation is part of the existing review flow.
    await wait(`!!document.querySelector('#flagReviewPanel button:last-child')`, 'confirmation');
    await evaluate(`document.querySelector('#flagReviewPanel button:last-child').click()`);
    await wait(`document.getElementById('questionNumber').textContent.includes('PERSONALIZED')`, 'followup');
    for (let i = 0; i < 3; i++) {
      await evaluate(`document.querySelector('#quizOptions button[data-option="B"]').click();document.querySelector('#nextQuestionButton, #nextQuestion').click()`);
      await wait(`!document.getElementById('historicalClueCard')?.hidden`, 'feedback ' + i);
      await evaluate(`document.querySelector('#nextQuestionButton, #nextQuestion').click()`);
      if (i < 2) await wait(`document.getElementById('questionNumber').textContent.includes('${i + 2}')&&!document.querySelector('#quizOptions button').disabled`, 'followup next ' + i);
    }
    for(let i=0;i<100&&!interruptedSubmission;i++)await pause(100);
    if(!interruptedSubmission)throw Error('Lost acknowledgement fixture did not intercept the committed response');
    await send('Page.reload');
    await wait(`!document.getElementById('quizResult')?.hidden&&!!document.getElementById('quizScore')?.textContent`, 'saved result after lost-response reload');
    checks.push('Lost callable response after commit recovers the saved result on an actual page reload');
    checks.push('Existing followup UI receives feedback and saves a passing result despite wrong followups');
    await send('Page.navigate', {
      url: base + '/bootstrap.html'
    });
    await wait('document.readyState==="complete"', 'resume bootstrap');
    const result = await evaluate(`(async()=>{const {auth,db}=await import('/js/firebase-config.js');await auth.authStateReady();const f=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js');return(await f.getDocFromServer(f.doc(db,'users','alice'))).data();})()`);
    if (result.xp !== 25) throw Error('Browser quiz balance mismatch');
    checks.push('Actual saved profile has exactly 25 XP after navigation');
    const transport=await evaluate(`(async()=>{
      const {app,functions}=await import('/js/firebase-config.js');
      await import('/js/ai-assistance-client.js');
      const sdk=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app-check.js');
      const f=await import('https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js');
      const ac=sdk.initializeAppCheck(app,{provider:new sdk.CustomProvider({getToken:async()=>({token:'isolated-local-attestation',expireTimeMillis:Date.now()+600000})}),isTokenAutoRefreshEnabled:false});
      const token=await sdk.getToken(ac,false),original=window.fetch;let captured;
      window.fetch=async(url,init)=>{if(String(url).includes('transportOnlyProbe')){captured=new Headers(init.headers).get('X-Firebase-AppCheck');return new Response(JSON.stringify({data:{ok:true}}),{headers:{'Content-Type':'application/json'}});}return original(url,init);};
      try{const r=await f.httpsCallable(functions,'transportOnlyProbe')({});return{sent:captured===token.token,ok:r.data.ok};}finally{window.fetch=original;}
    })()`);
    if(!transport.sent||!transport.ok)throw Error('Real SDK App Check header transport failed');
    checks.push('Production AI helper import resolves; real Functions SDK sends local CustomProvider App Check token (not production reCAPTCHA attestation)');
    const report = {
      status: 'pass',
      checks,
      errors,
      physicalDevice: false
    };
    fs.writeFileSync(path.join(root, 'docs/validation/priority-3-browser-emulator-2026-11-07.json'), JSON.stringify(report, null, 2));
    return report;
  } catch (error) {
    fs.writeFileSync(path.join(root, 'docs/validation/priority-3-browser-emulator-2026-11-07.json'), JSON.stringify({
      status: 'fail',
      checks,
      errors,
      error: error.message
    }, null, 2));
    throw error;
  } finally {
    ws?.close();
    chrome.kill();
    await new Promise(r => server.close(r));
  }
}
module.exports = {
  runSecuredBrowser
};
