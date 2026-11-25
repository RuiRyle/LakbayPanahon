const existingScenes = new Map([
    ['chapter-1', 'chapter-1-mission-1-scene-1.png'],
    ['chapter-2', 'chapter-2-mission-1-scene-1.png'],
    ['chapter-3', 'chapter3-mission1-scene1.png']
]);

export function chapterArtworkFor(chapterId) {
    const scene = existingScenes.get(chapterId);
    if (scene) return {src: '../assets/story/' + scene, interpretation: false};
    if (chapterId === 'era1-prologue' || /^chapter-(?:[4-9]|1[0-5])$/.test(chapterId)) {
        return {src: '../assets/atlas/chapters/' + chapterId + '.jpg', interpretation: true};
    }
    return null;
}

export function createChapterBadgeArtwork(chapterId) {
    const medallion = document.createElement('span');
    medallion.className = 'chapter-badge-medallion';
    medallion.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img');
    const fallback = '../assets/brand/lakbay-sun.svg';
    const artwork = chapterArtworkFor(chapterId);
    image.alt = '';
    image.className = artwork ? 'chapter-badge-scene' : 'chapter-badge-seal';
    image.addEventListener('error', () => {
        image.className = 'chapter-badge-seal';
        image.src = fallback;
    }, {once:true});
    image.src = artwork?.src || fallback;
    medallion.append(image);
    return medallion;
}
