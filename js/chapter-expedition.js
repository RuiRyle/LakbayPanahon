// Presentation only. Access, progress and mission selection remain in mission.js.
const artwork = document.getElementById('chapterOverviewArtwork');
const chapter = new URLSearchParams(location.search).get('chapter');
const scenes = {
 'chapter-1':'chapter-1-mission-1-scene-1.png',
 'chapter-2':'chapter-2-mission-1-scene-1.png',
 'chapter-3':'chapter3-mission1-scene1.png'
};
// Symbolic objects match the chapter topic; they are not historical reconstructions.
const symbols = {
 'era1-prologue':'navigation', 'chapter-4':'archive', 'chapter-5':'navigation',
 'chapter-6':'archive', 'chapter-7':'archive', 'chapter-8':'archive',
 'chapter-9':'maritime', 'chapter-10':'archive', 'chapter-11':'voices',
 'chapter-12':'voices', 'chapter-13':'archive', 'chapter-14':'voices', 'chapter-15':'voices'
};
if (artwork && symbols[chapter]) artwork.src = '../assets/atlas/' + symbols[chapter] + '.svg';
// Later chapters need reviewed scene assets before fuller narrative artwork can be used.
if (artwork && scenes[chapter]) {
 artwork.src = '../assets/story/' + scenes[chapter];
 artwork.parentElement.dataset.scene = 'true';
 artwork.addEventListener('error', () => {
  artwork.src = '../assets/atlas/archive.svg';
  delete artwork.parentElement.dataset.scene;
 }, {once:true});
}
// mission.js replaces this progress element after every saved-progress reload.
const header = document.querySelector('.mission-chapter-header');
const copy = header?.querySelector('.chapter-header-copy');
if (header && copy) {
 const placeProgress = () => {
  const progress = header.querySelector(':scope > #chapterExpeditionProgress');
  if (progress) copy.append(progress);
 };
 new MutationObserver(placeProgress).observe(header, {childList:true});
 placeProgress();
}
