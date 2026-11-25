import {discoveryLessonUrl} from './discovery-cases.js';
import {loadDiscoveryCase} from './discovery-case-loader.js';
import {artifactLessonArt} from './artifact-lesson-art.js';

const maritimeEvidence = "https://www.nationalmuseum.gov.ph/2022/09/20/the-9th-to-10th-century-archaeological-evidence-of-maritime-relations-between-the-philippines-and-the-islands-of-southeast-asia/";
const burialJars = "https://www.nationalmuseum.gov.ph/our-collections/archaeology/burial-jars/";
const manunggulJar = {
    name: "Manunggul Jar",
    image: "manunggul",
    details: [["Period", "c. 890–710 BCE"], ["Found at", "Manunggul Cave, Lipuun Point, Quezon, Palawan"], ["Material", "Earthenware (fired clay)"], ["Use", "Secondary burial"]],
    inspection: "Find the two figures on the boat-shaped lid. The front figure has crossed arms, and the figure behind holds a paddle on the original jar.",
    description: "This burial jar from Palawan held human bones after an initial burial. Moving the remains to a vessel afterward is called secondary burial.",
    lessonConnection: "The clay vessel and its sculpted lid show how potters used their skills to make objects for burial rituals.",
    context: "The National Museum of the Philippines lists the Manunggul Jar as a National Cultural Treasure. The boat on its lid is commonly interpreted as a journey to the afterlife. That interpretation draws on the carving and the jar’s burial use.",
    reflection: "Which part of the lid would you point to as evidence for the idea of a journey?",
    sources: [
        ["National Museum of the Philippines · Burial jars", burialJars],
        ["Cultural Center of the Philippines · The Manunggul Jar", "https://epa.culturalcenter.gov.ph/3/82/2227/"]
    ]
};

const historicalObjects = new Map([
    ["chapter3-mission1-artifact", {
        name: "Butuan Boat",
        image: "balangay",
        details: [["Period", "Mostly 8th–10th centuries CE"], ["Found at", "Butuan City, Mindanao"], ["Material", "Wood"], ["Type", "Plank-built watercraft"]],
        caption: "Reconstruction of a Butuan boat",
        inspection: "Follow the rows of planks along the hull. On the surviving wood, the joints help archaeologists work out how the planks were attached.",
        description: "Several early wooden boats were excavated in Butuan City. This exhibit represents those surviving boat remains as a group.",
        lessonConnection: "The shape and construction of the hull help explain the skills early boatbuilders used to make vessels for travel by water.",
        context: "Much of the dated wood falls between the 8th and 10th centuries CE. Archaeologists found related boatbuilding techniques elsewhere in Southeast Asia. The similarities help researchers study connections between boatbuilding traditions.",
        reflection: "What kinds of clues would you compare if you wanted to find out whether two boats were made using similar techniques?",
        sources: [
            ["National Museum of the Philippines · Butuan boats and maritime connections", maritimeEvidence],
            ["Ligaya Lacsina · Study of the Butuan boat remains", "https://minpaku.repo.nii.ac.jp/record/8907/files/KH_047_1_04.pdf"]
        ]
    }],
    ["chapter4-mission1-artifact", {
        name: "Laguna Copperplate Inscription",
        image: "copperplate",
        caption: "Illustration of the copper sheet",
        details: [["Inscribed date", "900 CE"], ["Reported findspot", "Lumbang River, Laguna"], ["Material", "Copper"], ["Script", "Early Kawi-style"]],
        inspection: "Use the National Museum’s photo of the original to find the rows of writing. Then compare what you see with the linked translation.",
        description: "This thin copper sheet records the cancellation of a debt owed by a man named Namwaran. According to Antoon Postma’s translation, the release also covered his descendants.",
        lessonConnection: "The plate shows how a community could keep an important agreement in writing so it could be checked later.",
        context: "The inscription dates itself to the Saka year 822, which corresponds to 900 CE. Its script resembles Early Kawi, a writing tradition used in Southeast Asia. Postma’s translation identifies people, places, and units for weighing gold.",
        reflection: "What can a written record tell you that a tool or pot might leave unanswered?",
        sources: [
            ["National Museum of the Philippines · Laguna Copperplate Inscription", maritimeEvidence],
            ["Antoon Postma · Translation and commentary", "https://www.sealang.net/oldmalay/archives/postma1992laguna.pdf"]
        ]
    }],
    ["chapter4-mission2-artifact", manunggulJar],
    ["chapter-2-artifact-2", manunggulJar]
]);

export function historicalObjectFor(artifact) {
    return historicalObjects.get(artifact.id);
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
const exhibitSubjects = new Map([
    [goldOrnamentId, {
        kind: "Representative object",
        caption: "Illustration of a gold bead necklace",
        description: "This model represents a type of gold ornament. The National Museum’s collection includes beads, necklaces, and other ornaments. People used gold ornaments for personal adornment and in some burial practices.",
        context: "Archaeologists record where an ornament was found and what lay beside it. An ornament found in a grave can help researchers understand burial customs.",
        sources: [["National Museum of the Philippines · Ornaments collection", "https://www.nationalmuseum.gov.ph/our-collections/archaeology/ornaments/"]]
    }],
    ["chapter-2-artifact-3", {
        kind: "Historic site",
        caption: "Lesson map of the southern Philippines",
        details: [["Location", "Tubig Indangan, Simunul, Tawi-Tawi"], ["Date in local tradition", "1380 CE"], ["Designation", "National Historical Landmark"]],
        description: "The historical marker associates this mosque site with Sheik Makhdum’s arrival in 1380. The date belongs to the tradition about the site. The standing mosque has been rebuilt.",
        context: "The National Historical Commission’s registry identifies the mosque as a National Historical Landmark. The marker records that ipil wood posts attributed to the earlier mosque were preserved.",
        sources: [["National Historical Commission of the Philippines · Mosque marker", "https://philhistoricsites.nhcp.gov.ph/registry_database/sheik-makhdum-mosque/"]]
    }],
    ["chapter2-mission2-learning-keepsake", {
        caption: "Lesson illustration for the evidence card",
        description: "Use this evidence card to examine the boat and figures on the Manunggul Jar’s lid. The real vessel was found in Manunggul Cave in Palawan.",
        context: manunggulJar.context,
        sources: manunggulJar.sources
    }],
    ["prologue-mission3-learning-keepsake", {
        description: "This card compares finds from two caves. Callao Cave in Cagayan yielded remains that researchers identified as Homo luzonensis. Tabon Cave in Palawan yielded remains of Homo sapiens.",
        context: "The two sites preserve evidence from different periods. Scientists study where the fossils were found and how old they are to build a picture of early life in the Philippine islands.",
        sources: [
            ["National Museum of the Philippines · Cagayan collections", "https://www.nationalmuseum.gov.ph/our-museums/regional-area-and-site-museums/cagayan-2-2/"],
            ["National Museum of the Philippines · Tabon Cave research", "https://www.nationalmuseum.gov.ph/2022/10/28/60th-anniversary-of-the-tabon-caves-archaeological-research-and-opening-of-the-stories-of-origins-exhibit/"]
        ]
    }]
]);

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
    if (className !== "museum-exhibit-visual") visual.setAttribute("aria-hidden", "true");

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
    const alternatives = (historicalObjectFor(artifact) ? [] : [...new Set([lessonArtwork, collectionArtwork])])
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
 const subject = object || exhibitSubjects.get(artifact.id);
 if(!isCurrent())return;closeMuseumExhibit();const origin=trigger,dialog=document.createElement('dialog');currentDialog=dialog;dialog.className='museum-exhibit';dialog.setAttribute('aria-labelledby','museumExhibitTitle');
 const el=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;return n;};
 const header=el('header');header.className='museum-exhibit-header';const close=el('button','Close');close.type='button';close.className='museum-exhibit-close';close.setAttribute('aria-label','Close exhibit');const title=el('h2',artifactDisplayName(artifact));title.id='museumExhibitTitle';const label=el('p','Discovery Museum');label.className='museum-exhibit-kicker';const heading=el('div');heading.append(label,title);header.append(heading,close);dialog.append(header);
 const visual = createArtifactArtwork(artifact, "museum-exhibit-visual");
 const figure = el('figure');
 figure.className = 'museum-exhibit-display';
 const caption = el('figcaption', subject?.caption || (object ? 'Illustration of the object' : 'Mission illustration'));
 caption.className = 'museum-artwork-credit';
 figure.append(visual, caption);
 dialog.append(figure);
 const tabs=el('div');tabs.className='discovery-inline museum-exhibit-views';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Exhibit views');const body=el('div');body.className='museum-exhibit-body';body.setAttribute('aria-live','polite');body.tabIndex=0;body.setAttribute('role','region');body.setAttribute('aria-label','Exhibit text');const learning=artifact.learningDetails||{};let activity=null,caseState='idle',selectedSection=0;
 const validMission=typeof artifact.chapterId==='string'&&artifact.chapterId&&!artifact.chapterId.includes('/')&&typeof artifact.missionId==='string'&&artifact.missionId&&!artifact.missionId.includes('/');
 const current=()=>currentDialog===dialog&&dialog.open&&isCurrent();
 const galleryArt=origin?.closest('.achievement-artifact-card, .chapter-exhibit-objects > button')?.querySelector('img.artifact-card-illustration');
 const exhibitArt=visual.querySelector('img.artifact-card-illustration');
 const kind = object ? 'Historical artifact' : subject?.kind || 'Learning keepsake';
 if (exhibitArt) {
  const inspect = el('button', 'Enlarge artwork');
  inspect.type = 'button';
  inspect.className = 'museum-artwork-toggle';
  inspect.setAttribute('aria-expanded', 'false');
  inspect.hidden = exhibitArt.hidden;
  exhibitArt.addEventListener('load', () => { inspect.hidden = false; }, {once:true});
  inspect.addEventListener('click', () => {
   const enlarged = figure.classList.toggle('museum-display-enlarged');
   inspect.setAttribute('aria-expanded', String(enlarged));
   inspect.textContent = enlarged ? 'Reduce artwork' : 'Enlarge artwork';
   figure.scrollIntoView({block:'nearest', behavior:'instant'});
  });
  figure.append(inspect);
 }
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

 function sourceLink(label, url) {
  const source = el('a', label);
  source.href = url;
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  source.className = 'museum-fact-source';
  return source;
 }

 function addSources() {
  if (!subject?.sources?.length) return;
  const section = el('section');
  section.className = 'museum-sources';
  const list = el('ul');
  for (const [label, url] of subject.sources) {
   const entry = el('li');
   entry.append(sourceLink(label, url));
   list.append(entry);
  }
  section.append(el('h3', 'Sources'), list);
  body.append(section);
 }

 function renderOverview() {
  const typeLabel = el('p', kind);
  typeLabel.className = 'museum-exhibit-kind';
  body.append(typeLabel);
  const summary = [subject?.description, artifact.description, learning.represents].find(text => typeof text === 'string' && text.trim())
   || 'This collectible marks a mission discovery.';
  addInfo(object ? 'About this artifact' : subject?.kind ? 'About this exhibit' : 'About this keepsake', summary, 'museum-info-intro');
  if (subject?.details?.length) {
   const details = el('dl');
   details.className = 'museum-exhibit-details';
   for (const [term, value] of subject.details) {
    const item = el('div');
    item.append(el('dt', term), el('dd', value));
    details.append(item);
   }
   body.append(details);
  }
  addInfo('Look closely', object?.inspection || object?.reflection || learning.reflectionQuestion);
  const connection = object?.lessonConnection || learning.lessonConnection || learning.represents;
  if (connection?.trim?.() !== summary.trim()) addInfo('Why it matters', connection);
  addSources();
  const fact = museumFacts.get(artifact.id);
  if (fact) {
   const section = el('section');
   section.className = 'museum-info museum-info-note museum-info-fact';
   const source = sourceLink(fact.source, fact.url);
   section.append(el('h3', 'Did you know?'), el('p', fact.text), source);
   body.append(section);
  }
  if (validMission) {
   const missionLink = el('a', 'Revisit the mission');
   missionLink.className = 'text-button museum-exhibit-lesson';
   missionLink.href = discoveryLessonUrl({chapterId:artifact.chapterId, missionId:artifact.missionId});
   body.append(missionLink);
  }
 }

 function renderContext() {
  body.append(el('h3', 'Historical context'));
  const explanation = subject?.context || learning.historicalUse || activity?.explanation;
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
  addSources();
  addInfo('Reflection question', object?.reflection || learning.reflectionQuestion || 'Find one claim in the lesson and the clue that supports it.', 'museum-info-reflection');
 }

 function renderCollection() {
  const date = artifact.earnedAt?.toDate?.();
  if (date instanceof Date && Number.isFinite(date.getTime())) {
   const label = date.toLocaleDateString('en-PH', {timeZone:'Asia/Manila', year:'numeric', month:'long', day:'numeric'});
   addInfo('Collected on', label);
  }
  addInfo('About this collectible', learning.collectibleNote || 'You collected this learning token by completing its associated mission.');
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
