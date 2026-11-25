import {discoveryLessonUrl} from './discovery-cases.js';
import {loadDiscoveryCase} from './discovery-case-loader.js';
import {artifactLessonArt} from './artifact-lesson-art.js';

const historicalObjects = new Map([
    ["chapter3-mission1-artifact", {
        name: "Butuan Boat",
        image: "balangay",
        inspection: "Look for the planks along the hull. Their joins are clues to how boatbuilders assembled the vessel.",
        description: "A wooden boat from Butuan, Mindanao. Its surviving planks offer clues about how early Philippine communities built boats for travel by sea.",
        lessonConnection: "In Seafaring and the Balangay, the boat’s construction is a clue to the skills that made sea travel possible.",
        context: "The National Museum dates the Butuan boats to between the late 8th and early 10th centuries. Similar construction techniques appear elsewhere in Southeast Asia.",
        reflection: "What can the way a boat is built tell us about connections between communities?",
        source: "National Museum · Butuan boats and maritime connections",
        url: "https://www.nationalmuseum.gov.ph/2022/09/20/the-9th-to-10th-century-archaeological-evidence-of-maritime-relations-between-the-philippines-and-the-islands-of-southeast-asia/"
    }],
    ["chapter4-mission1-artifact", {
        name: "Laguna Copperplate Inscription",
        image: "copperplate",
        inspection: "Look for the rows of writing on the plate. The marks show how a record could be kept on metal.",
        description: "A thin sheet of copper bearing an inscription in a script resembling Early Kawi. The date recorded in the inscription corresponds to 900 CE.",
        lessonConnection: "In Ancient Writing and Communication, this copperplate shows that people could record information on materials other than paper.",
        context: "The inscription gives historians a written record to study alongside archaeological finds. Its script also offers a clue to connections between communities in Southeast Asia.",
        reflection: "What can a written record tell you that a tool or pot might leave unanswered?",
        source: "National Museum · Laguna Copperplate Inscription",
        url: "https://www.nationalmuseum.gov.ph/2022/09/20/the-9th-to-10th-century-archaeological-evidence-of-maritime-relations-between-the-philippines-and-the-islands-of-southeast-asia/"
    }],
    ["chapter4-mission2-artifact", {
        name: "Manunggul Jar",
        image: "manunggul",
        inspection: "Look for the small boat on the lid. Its placement connects the decoration to the jar's ceremonial use.",
        description: "An earthenware burial vessel from Palawan. Its lid carries a small boat, connecting pottery craftsmanship with ideas about a journey after death.",
        lessonConnection: "In Indigenous Arts, Crafts, and Technologies, the jar shows how potters used clay and decoration to make an object for a ceremony.",
        context: "The National Museum identifies the jar as an example of secondary burial. Its exhibition places it alongside other objects that help explain burial traditions in Philippine communities.",
        reflection: "Which detail would help you explain what this vessel was used for?",
        source: "National Museum · Kaban ng Lahi Gallery",
        url: "https://www.nationalmuseum.gov.ph/exhibitions/anthropology/kaban/"
    }]
]);

export function historicalObjectFor(artifact) {
    const byId = historicalObjects.get(artifact.id);
    if (byId) return byId;
    const name = (artifact.name || artifact.title || '').trim().toLowerCase();
    return [...historicalObjects.values()].find(object => object.name.toLowerCase() === name);
}

export function artifactDisplayName(artifact) {
    return historicalObjectFor(artifact)?.name || artifact.name || artifact.title || 'Mission collectible';
}

export function artifactExhibitHref(id) {
    return id ? 'achievements.html?' + new URLSearchParams({exhibit: id}) : 'achievements.html';
}

const tokenArtwork = new Map([
    ["artifact-1", "community"],
    ["chapter3-mission2-artifact", "compass"],
    ["chapter3-mission3-artifact", "basket"],
    ["chapter3-mission4-artifact", "anchor"],
    ["chapter4-mission3-artifact", "community"],
    ["chapter4-mission4-artifact", "heritage"]
]);
const goldOrnamentId = 'chapter-2-artifact-1';

const museumFacts = new Map([
    ["chapter3-mission1-artifact", {
        text: "Boatbuilders joined the wooden planks of the Butuan boats edge to edge with wooden pegs. Archaeologists can study those joints to learn how the boats were built.",
        source: "Cultural Center of the Philippines · Balanghai",
        url: "https://epa.culturalcenter.gov.ph/3/82/2135/"
    }],
    ["chapter3-mission2-artifact", {
        text: "Archaeologists found wooden boats and ceramic wares at the same sites in Butuan. Together, those finds help explain why Butuan matters to the history of sea trade.",
        source: "Philippine Information Agency · Butuan excavation sites",
        url: "https://pia.gov.ph/news/butuan-showcases-excavation-sites-of-balangay/"
    }],
    ["chapter3-mission3-artifact", {
        text: "Some stoneware jars brought to the Philippines through trade became valued objects used in rituals. A traded object can take on a new meaning in the community that receives it.",
        source: "National Museum of the Philippines · Ritual Objects",
        url: "https://www.nationalmuseum.gov.ph/our-collections/ethnology/ritual-objects/"
    }],
    ["chapter4-mission1-artifact", {
        text: "Traditional Philippine scripts are still used today. The National Museum highlights writing traditions among the Hanunoo and Buhid of Mindoro and the Tagbanua and Pala’wan of Palawan.",
        source: "National Museum of the Philippines · Baybayin Gallery",
        url: "https://www.nationalmuseum.gov.ph/2022/10/21/baybayin-ancient-and-traditional-scripts-of-the-philippines-gallery/"
    }],
    ["chapter4-mission2-artifact", {
        text: "Pottery could serve a purpose beyond holding food or water. The Manunggul Jar was used for secondary burial, a practice in which a person’s bones were placed in another vessel after an earlier burial.",
        source: "National Museum of the Philippines · Burial Jars",
        url: "https://www.nationalmuseum.gov.ph/our-collections/archaeology/burial-jars/"
    }],
    ["chapter9-mission4-artifact", {
        text: "The San Diego started as a merchant ship before it was converted for battle. It sank in 1600, and researchers later found its wreck more than 50 metres below the sea near Fortune Island.",
        source: "National Museum of the Philippines · Treasures of San Diego",
        url: "https://www.nationalmuseum.gov.ph/our-collections/maritime-and-underwater-cultural-heritage/treasures-of-san-diego/"
    }],
    ["chapter11-mission3-artifact", {
        text: "In Ifugao rice culture, carved wooden figures called bulul are placed in rice granaries. They show how growing and storing rice can have cultural meaning as well as a practical purpose.",
        source: "National Museum of the Philippines · Ritual Objects",
        url: "https://www.nationalmuseum.gov.ph/our-collections/ethnology/ritual-objects/"
    }]
]);

function artifactArtworkName(artifact) {
    const object = historicalObjectFor(artifact);
    if (object) return object.image;
    const token = tokenArtwork.get(artifact.id);
    if (token) return token;
    const title = artifact.name || artifact.title || "";
    if (/\bjournal\b/i.test(title)) return "journal";
    if (/\b(?:portfolio|case file)\b/i.test(title)) return "portfolio";
    if (/\bexhibit (?:pass|card)\b/i.test(title)) return "pass";
    if (/\bfield guide\b/i.test(title)) return "guide";
    return null;
}

export function createArtifactArtwork(artifact, className) {
    const visual = document.createElement("div");
    visual.className = className;
    visual.setAttribute("aria-hidden", "true");

    const fallback = document.createElement("small");
    fallback.className = "artifact-image-status";
    fallback.hidden = true;
    visual.append(fallback);
    const unavailable = () => {
        visual.dataset.artworkState = 'unavailable';
        fallback.textContent = 'Illustration unavailable';
        fallback.hidden = false;
    };

    const name = artifactArtworkName(artifact);
    const collectionArtwork = name ? '../assets/artifacts/' + name + '.png' : null;
    const lessonArtwork = Object.hasOwn(artifactLessonArt, artifact.id)
        ? '../assets/story/' + artifactLessonArt[artifact.id] : null;
    const source = artifact.id === goldOrnamentId ? '../assets/artifacts/gold-bead-ornament.png'
        : historicalObjectFor(artifact) ? collectionArtwork
        : /^[a-z0-9][a-z0-9_-]*\.(?:svg|png)$/i.test(artifact.learningImage || '')
        ? '../assets/story/' + artifact.learningImage
        : ['prologue-mission1-map-keepsake', 'prologue-mission1-artifact'].includes(artifact.id)
        ? '../assets/story/prologue-island-map.svg'
        : lessonArtwork || collectionArtwork;
    if (!source) {
        unavailable();
        return visual;
    }

    const image = document.createElement("img");
    image.className = "artifact-card-illustration";
    image.alt = "";
    image.decoding = "async";
    if (className !== "museum-exhibit-visual") image.fetchPriority = "low";
    image.hidden = true;
    image.addEventListener("load", () => {
        fallback.hidden = true;
        image.hidden = false;
        visual.dataset.artworkState = 'ready';
    }, {once: true});
    const alternatives = [...new Set([lessonArtwork, collectionArtwork])]
        .filter(url => url && url !== source);
    image.addEventListener("error", () => {
        const next = alternatives.shift();
        if (next) {
            image.src = next;
            return;
        }
        image.remove();
        unavailable();
    });
    visual.dataset.artworkState = 'loading';
    if (['achievement-artifact-icon', 'museum-exhibit-visual', 'quiz-artifact-art'].includes(className)) {
        fallback.textContent = 'Loading illustration…';
        fallback.hidden = false;
    }
    visual.append(image);
    image.src = source;
    return visual;
}

let currentDialog=null;
let previousOverflow=null;
function unlockMuseumScroll(){if(!currentDialog&&previousOverflow!==null){document.documentElement.style.overflow=previousOverflow;previousOverflow=null;}}
export function closeMuseumExhibit(){if(currentDialog){const dialog=currentDialog;currentDialog=null;dialog.close();dialog.remove();}unlockMuseumScroll();}
export function openMuseumExhibit(artifact,{isCurrent=()=>true,trigger=document.activeElement}={}){
 const object = historicalObjectFor(artifact);
 if(!isCurrent())return;closeMuseumExhibit();const origin=trigger,dialog=document.createElement('dialog');currentDialog=dialog;dialog.className='museum-exhibit';dialog.setAttribute('aria-labelledby','museumExhibitTitle');
 const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n;};
 const header=el('header');header.className='museum-exhibit-header';const close=el('button','Close');close.type='button';close.className='museum-exhibit-close';close.setAttribute('aria-label','Close exhibit');const title=el('h2',artifactDisplayName(artifact));title.id='museumExhibitTitle';const label=el('p','YOUR DISCOVERY MUSEUM');label.className='museum-exhibit-kicker';const heading=el('div');heading.append(label,title);header.append(heading,close);dialog.append(header);
 const visual = createArtifactArtwork(artifact, "museum-exhibit-visual");
 dialog.append(visual);
 const tabs=el('div');tabs.className='discovery-inline museum-exhibit-views';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Exhibit views');const body=el('div');body.className='museum-exhibit-body';body.setAttribute('aria-live','polite');body.tabIndex=0;body.setAttribute('role','region');body.setAttribute('aria-label','Exhibit text');const learning=artifact.learningDetails||{};let activity=null,caseState='idle',selectedSection=0;
 const validMission=typeof artifact.chapterId==='string'&&artifact.chapterId&&!artifact.chapterId.includes('/')&&typeof artifact.missionId==='string'&&artifact.missionId&&!artifact.missionId.includes('/');
 const current=()=>currentDialog===dialog&&dialog.open&&isCurrent();
 const galleryArt=origin?.closest('.achievement-artifact-card, .chapter-exhibit-objects > button')?.querySelector('img.artifact-card-illustration');
 const exhibitArt=visual.querySelector('img.artifact-card-illustration');
 let flight, closing=false;
 function moveArtwork(source, destination) {
  if (!current() || matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.body.classList.contains('lakbay-reduce-motion') ||
      !source?.naturalWidth || !destination?.naturalWidth || !source.animate) return;
  const bounds = [source, destination].map(image => image.getBoundingClientRect());
  if (bounds.some(rect => !rect.width || !rect.height || rect.bottom <= 0 || rect.top >= innerHeight)) return;
  flight?.remove();
  const copy = source.cloneNode();
  flight = copy;
  copy.className = 'museum-art-flight';
  copy.setAttribute('aria-hidden','true');
  dialog.append(copy);
  const frames = bounds.map(({x,y,width,height}) => ({
   left:x+'px', top:y+'px', width:width+'px', height:height+'px'
  }));
  const motion = copy.animate(frames,{duration:300,easing:'cubic-bezier(.22,.8,.25,1)',fill:'both'});
  visual.classList.add('museum-art-in-flight');
  return motion.finished.catch(()=>{}).finally(()=>{
   copy.remove();
   if (flight === copy) {
    flight = null;
    visual.classList.remove('museum-art-in-flight');
   }
  });
 }
 async function dismiss() {
  if (closing || !dialog.open) return;
  closing = true;
  const motion = moveArtwork(exhibitArt,galleryArt);
  if (motion) await motion;
  if (dialog.open) dialog.close();
 }
 close.addEventListener('click',dismiss);
 dialog.addEventListener('cancel',event=>{event.preventDefault();void dismiss();});
 async function requestMeaning(){
  if(!validMission||caseState==='loading'||caseState==='loaded')return;caseState='loading';
  try{const result=await loadDiscoveryCase(artifact.chapterId,artifact.missionId);if(!current())return;activity=result;caseState='loaded';}
  catch{if(!current())return;caseState='error';}
  if(selectedSection===1){body.replaceChildren();sections[1][1]();}
 }

 function addInfo(headingText, text, className = '') {
  if (typeof text !== 'string' || !text.trim()) return;
  const section = el('section');
  section.className = ['museum-info', className].filter(Boolean).join(' ');
  section.append(el('h3', headingText), el('p', text));
  body.append(section);
 }

 function renderOverview() {
 if (artifact.id === goldOrnamentId) {
  const caption = el('p', 'Representative illustration of a gold bead necklace.');
  caption.className = 'museum-artwork-credit';
  const reference = el('a', 'National Museum ornaments collection');
  reference.href = 'https://www.nationalmuseum.gov.ph/our-collections/archaeology/ornaments/';
  caption.append(' ', reference);
  body.append(caption);
 } else if (!object && Object.hasOwn(artifactLessonArt, artifact.id)) {
  const caption = el('p', artifact.id === 'chapter-2-artifact-3'
   ? 'Lesson map showing regional context for this site.'
   : 'Lesson illustration for this collectible.');
  caption.className = 'museum-artwork-credit';
  body.append(caption);
 }
  const summary = [object?.description, artifact.description, learning.represents].find(text => typeof text === 'string' && text.trim())
   || 'This collectible marks a mission discovery.';
  addInfo(object ? 'The historical object' : 'Your mission collectible', summary);
  addInfo('Look closely', object?.inspection || object?.reflection || learning.reflectionQuestion);
  const connection = object?.lessonConnection || learning.lessonConnection || learning.represents;
  if (connection?.trim?.() !== summary.trim()) addInfo('Why it matters', connection);
  const image = visual.querySelector('img');
  if (image) {
   const inspect = el('button', 'Enlarge artwork');
   inspect.type = 'button';
   inspect.className = 'discovery-choice';
   inspect.setAttribute('aria-pressed', String(visual.classList.contains('museum-art-enlarged')));
   inspect.hidden = image.hidden;
   image.addEventListener('load', () => { inspect.hidden = image.hidden; }, {once:true});
   inspect.addEventListener('click', () => {
    const enlarged = visual.classList.toggle('museum-art-enlarged');
    inspect.setAttribute('aria-pressed', String(enlarged));
    visual.scrollIntoView({block:'nearest', behavior:'instant'});
   });
   body.append(inspect);
  }
  if (validMission) {
   const missionLink = el('a', 'Revisit the mission');
   missionLink.className = 'text-button museum-exhibit-lesson';
   missionLink.href = discoveryLessonUrl({chapterId:artifact.chapterId, missionId:artifact.missionId});
   body.append(missionLink);
  }
  const fact = museumFacts.get(artifact.id);
  if (fact) {
   const section = el('section');
   section.className = 'museum-info museum-info-note museum-info-fact';
   const source = el('a', fact.source);
   source.href = fact.url;
   source.target = '_blank';
   source.rel = 'noopener noreferrer';
   source.className = 'museum-fact-source';
   section.append(el('h3', 'Did you know?'), el('p', fact.text), source);
   body.append(section);
  }
 }

 function renderContext() {
  body.append(el('h3', 'Historical context'));
  const explanation = object?.context || learning.historicalUse || activity?.explanation;
  if (explanation) {
   body.append(el('p', explanation));
  } else if (!validMission) {
   body.append(el('p', learning.lessonConnection || artifact.description || 'Historical context is unavailable for this exhibit.'));
  } else {
   if (caseState === 'idle') requestMeaning();
   if (caseState === 'loading') body.append(el('p', 'Loading the mission explanation...'));
   if (caseState === 'loaded') body.append(el('p', learning.lessonConnection || artifact.description || 'This lesson has no additional explanation.'));
   if (caseState === 'error') {
    body.append(el('p', 'The mission explanation could not load. Your collectible is still saved.'));
    const retry = el('button', 'Retry Explanation');
    retry.type = 'button';
    retry.className = 'text-button';
    retry.addEventListener('click', () => {
     if (!current()) return;
     caseState = 'idle';
     body.replaceChildren();
     renderContext();
     body.focus({preventScroll:true});
    });
    body.append(retry);
   }
  }
  if (object) {
   const source = el('a', object.source);
   source.href = object.url;
   source.target = '_blank';
   source.rel = 'noopener noreferrer';
   source.className = 'museum-fact-source';
   body.append(source);
  }
  addInfo('Reflection question', object?.reflection || learning.reflectionQuestion || 'Find one claim in the lesson and the clue that supports it.', 'museum-info-reflection');
 }

 function renderCollection() {
  const date = artifact.earnedAt?.toDate?.();
  if (date instanceof Date && Number.isFinite(date.getTime())) {
   const label = date.toLocaleDateString('en-PH', {timeZone:'Asia/Manila', year:'numeric', month:'long', day:'numeric'});
   addInfo('Collected on', label);
  }
  addInfo('About this collectible', learning.collectibleNote || 'You collected this learning token by completing its associated mission.');
  addInfo('About the artwork', object ? 'This digital exhibit uses an illustrative interpretation of the historical object.' : 'Illustrative interpretation of an in-game collectible.');
  if (validMission) {
   const link = el('a', 'Revisit the mission that earned this');
   link.className = 'text-button museum-exhibit-lesson';
   link.href = discoveryLessonUrl({chapterId:artifact.chapterId, missionId:artifact.missionId});
   body.append(link);
  } else {
   body.append(el('p', 'The original mission link is unavailable. You can find completed topics in My Journey.'));
  }
 }

 const sections = [['Overview', renderOverview], ['Historical Context', renderContext], ['My Collection', renderCollection]];
 sections.forEach(([label,render],index)=>{const b=el('button',label);b.type='button';b.className='discovery-choice';b.setAttribute('aria-pressed',String(index===0));b.addEventListener('click',()=>{if(!isCurrent()){closeMuseumExhibit();return;}selectedSection=index;for(const button of tabs.children)button.setAttribute('aria-pressed',String(button===b));body.replaceChildren();body.scrollTop=0;render();});tabs.append(b);});dialog.append(tabs,body);sections[0][1]();
 dialog.addEventListener('close',()=>{if(currentDialog===dialog)currentDialog=null;dialog.remove();unlockMuseumScroll();if(origin?.isConnected&&isCurrent()&&!currentDialog)origin.focus({preventScroll:true});});document.body.append(dialog);if(previousOverflow===null)previousOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';dialog.showModal();close.focus({preventScroll:true});
 if(galleryArt?.naturalWidth && exhibitArt) {
  exhibitArt.decode?.().then(()=>{if(!closing) moveArtwork(galleryArt,exhibitArt);}).catch(()=>{});
 }
}
window.addEventListener('pagehide',closeMuseumExhibit);
