// A character-shaped control for lesson narration, not an AI chat entry point.
(() => {
 const still='../assets/brand/bayani-explorer-still.svg',animated='../assets/brand/bayani-explorer.svg';
 function decorate(button,{scope='part'}={}){
  button.classList.add('bayani-narration-button');button.dataset.narrationScope=scope;button.replaceChildren();
  const portrait=document.createElement('span');portrait.className='bayani-narration-portrait';portrait.setAttribute('aria-hidden','true');
  const image=document.createElement('img');image.src=still;image.alt='';image.width=80;image.height=84;portrait.append(image);
  const bubble=document.createElement('span');bubble.className='bayani-narration-bubble';
  for(const [tag,className,value]of [['span','bayani-narration-name','BAYANI · YOUR STORY GUIDE'],['strong','bayani-narration-action','Hear the story'],['span','bayani-narration-hint','Tap Bayani to hear this '+scope+'.']]){const n=document.createElement(tag);n.className=className;n.textContent=value;bubble.append(n);}
  button.append(portrait,bubble);update(button);
 }
 function update(button,{speaking=false,reason=''}={}){
  const action=button.querySelector('.bayani-narration-action');if(!action)return;
  const off=reason==='off',unavailable=reason==='unavailable';
  button.dataset.speaking=String(speaking);button.setAttribute('aria-pressed',String(speaking));
  action.textContent=off?'Narration is off':unavailable?'Read along with Bayani':speaking?'Stop story':'Hear the story';
  button.querySelector('.bayani-narration-hint').textContent=off?'Turn on Narration in the lesson audio options.':unavailable?'Audio is unavailable. Read the story below.':speaking?'Bayani is speaking. Tap to stop.':'Tap Bayani to hear this '+(button.dataset.narrationScope||'part')+'.';
  button.setAttribute('aria-label',off?'Bayani narration is off':unavailable?'Bayani narration is unavailable':speaking?'Stop Bayani’s story narration':'Hear the story with Bayani');
  const reduce=document.body.classList.contains('lakbay-reduce-motion')||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const image=button.querySelector('img'),path=speaking&&!reduce?animated:still;if(image.getAttribute('src')!==path)image.setAttribute('src',path);
 }
 window.LakbayBayaniNarration={decorate,update};
})();
