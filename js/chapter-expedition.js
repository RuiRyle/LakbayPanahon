// Presentation only. Access, progress and mission selection remain in mission.js.
import {chapterArtworkFor} from './chapter-artwork.js';

const artwork = document.getElementById('chapterOverviewArtwork');
const chapter = new URLSearchParams(location.search).get('chapter');
const chapterArtwork = chapterArtworkFor(chapter);
const content = document.getElementById('missionContent');
let handoff;
try {
 const key = 'lakbay-chapter-art-handoff';
 handoff = JSON.parse(sessionStorage.getItem(key));
 sessionStorage.removeItem(key);
} catch {}

if (content && artwork && chapterArtwork && handoff?.chapter === chapter &&
    Date.now() - handoff.at >= 0 && Date.now() - handoff.at < 12000 &&
    [handoff.x, handoff.y, handoff.width, handoff.height].every(Number.isFinite) &&
    handoff.width > 0 && handoff.height > 0) {
 let started = false;
 const startHandoff = async () => {
  if (started || content.hidden) return;
  started = true;
  observer.disconnect();
  try { await artwork.decode(); } catch { return; }
  if (content.hidden || artwork.src !== new URL(chapterArtwork.src, document.baseURI).href ||
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.body.classList.contains('lakbay-reduce-motion')) return;
  const destination = artwork.getBoundingClientRect();
  if (!destination.width || !destination.height || destination.top >= innerHeight || destination.bottom <= 0) return;
  const flight = artwork.cloneNode();
  flight.removeAttribute('id');
  flight.className = 'chapter-art-handoff';
  flight.setAttribute('aria-hidden','true');
  document.body.append(flight);
  const frame = ({x,y,width,height}, radius) => ({
   left:x+'px', top:y+'px', width:width+'px', height:height+'px', borderRadius:radius
  });
  try {
   const motion = flight.animate([frame(handoff,'10px'), frame(destination,'0px')], {
    duration:420, easing:'cubic-bezier(.22,.8,.25,1)', fill:'both'
   });
   await motion.finished;
   await flight.animate([{opacity:1},{opacity:0}],{duration:90,fill:'both'}).finished;
  } catch {} finally { flight.remove(); }
 };
 const observer = new MutationObserver(startHandoff);
 observer.observe(content,{attributes:true,attributeFilter:['hidden']});
 requestAnimationFrame(startHandoff);
}
const investigationQuestions = new Map([
 ['era1-prologue', 'How can a map help you find and compare places in the Philippines?'],
 ['chapter-1', 'How did people build communities around the places they lived?'],
 ['chapter-2', 'What do everyday objects tell us about how people lived and worked together?'],
 ['chapter-3', 'What clues show that the sea connected early Philippine communities to other places?'],
 ['chapter-4', 'How did people record and pass on what they knew?'],
 ['chapter-5', 'How might people on each side have understood an early encounter differently?'],
 ['chapter-6', 'How did Spanish rule take hold in some communities?'],
 ['chapter-7', 'Who made decisions under colonial rule, and how did those decisions affect towns?'],
 ['chapter-8', 'What clues show how religious institutions shaped community life?'],
 ['chapter-9', 'How did colonial policies change the way people worked and traded?'],
 ['chapter-10', 'What changed in daily life, and what traditions continued?'],
 ['chapter-11', 'Why did colonial rule reach some communities more than others?'],
 ['chapter-12', 'What led communities to resist Spanish rule in different ways?'],
 ['chapter-13', 'What changes did reformers ask for, and how did they share their ideas?'],
 ['chapter-14', 'How did people begin to see local concerns as part of a shared story?'],
 ['chapter-15', 'How did learning and wider connections help people share their concerns?']
]);
// Symbolic objects match the chapter topic; they are not historical reconstructions.
const symbols = {
 'era1-prologue':'navigation', 'chapter-4':'archive', 'chapter-5':'navigation',
 'chapter-6':'archive', 'chapter-7':'archive', 'chapter-8':'archive',
 'chapter-9':'maritime', 'chapter-10':'archive', 'chapter-11':'voices',
 'chapter-12':'voices', 'chapter-13':'archive', 'chapter-14':'voices', 'chapter-15':'voices'
};
if (artwork && symbols[chapter]) artwork.src = '../assets/atlas/' + symbols[chapter] + '.svg';
if (artwork && chapterArtwork) {
 const figure = artwork.parentElement;
 const fallback = artwork.getAttribute('src');
 let caption;
 if(chapterArtwork.interpretation){
  caption = document.createElement('figcaption');
  caption.textContent = 'Historical interpretation';
  caption.className = 'chapter-art-caption';
  figure.removeAttribute('aria-hidden');
  figure.append(caption);
 }
 figure.dataset.scene = 'true';
 artwork.addEventListener('error', () => {
  artwork.src = fallback || '../assets/atlas/archive.svg';
  delete figure.dataset.scene;
  caption?.remove();
  if(caption)figure.setAttribute('aria-hidden','true');
 }, {once:true});
 artwork.src = chapterArtwork.src;
}

const missionArtworkFrame = document.getElementById('selectedMissionArtwork');
const missionImage = missionArtworkFrame?.querySelector('img');
if (artwork && missionImage) {
 const markSharedArtwork = () => {
  missionArtworkFrame.toggleAttribute('data-shared-artwork',
   artwork.complete && artwork.naturalWidth > 0 && missionImage.src === artwork.src);
 };
 const observer = new MutationObserver(markSharedArtwork);
 for (const image of [artwork, missionImage]) {
  observer.observe(image, {attributes:true, attributeFilter:['src']});
 }
 artwork.addEventListener('load', markSharedArtwork);
 markSharedArtwork();
}
// mission.js replaces this progress element after every saved-progress reload.
const header = document.querySelector('.mission-chapter-header');
const copy = header?.querySelector('.chapter-header-copy');
if (header && copy) {
 const question = investigationQuestions.get(chapter);
 if (question) {
  const prompt = document.createElement('p');
  prompt.className = 'chapter-investigation-question';
  prompt.textContent = question;
  copy.querySelector('h1')?.after(prompt);
 }
 const placeProgress = () => {
  const progress = header.querySelector(':scope > #chapterExpeditionProgress');
  if (progress) copy.append(progress);
 };
 new MutationObserver(placeProgress).observe(header, {childList:true});
 placeProgress();
}
