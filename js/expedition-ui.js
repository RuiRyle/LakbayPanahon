if(document.body.dataset.role==='teacher'){let paper=true;try{paper=localStorage.getItem('lakbay.reading-surface')!=='dark';}catch{}document.body.classList.toggle('paper-reading',paper);}
// Presentation preferences stay on this device; learning evidence stays in Firestore.
const readingToggle = document.getElementById('readingSurfaceToggle');
if (readingToggle) {
    let paper = true;
    try { paper = localStorage.getItem('lakbay.reading-surface') !== 'dark'; } catch {}
    const apply = () => {
        document.body.classList.toggle('paper-reading', paper);
        readingToggle.setAttribute('aria-pressed', String(paper));
        readingToggle.textContent = paper ? 'Soft navy reading: on' : 'Soft navy reading: off';
    };
    apply();
    readingToggle.addEventListener('click', () => {
        paper = !paper; apply();
        try { localStorage.setItem('lakbay.reading-surface', paper ? 'paper' : 'dark'); } catch {}
    });
}

// Prompt chips prepare a question for review; only the existing form sends it.
const bayaniInput = document.getElementById('bayaniInput');
if (bayaniInput) {
    const prompts = document.querySelectorAll('[data-bayani-prompt]');
    const sync = () => prompts.forEach(button => { button.disabled = bayaniInput.disabled; });
    for (const button of prompts) button.addEventListener('click', () => {
        if (bayaniInput.disabled) return;
        bayaniInput.value = button.dataset.bayaniPrompt.slice(0, bayaniInput.maxLength > 0 ? bayaniInput.maxLength : 2000);
        bayaniInput.dispatchEvent(new Event('input', { bubbles: true }));
        bayaniInput.focus();
    });
    new MutationObserver(sync).observe(bayaniInput, { attributes: true, attributeFilter: ['disabled'] });
    sync();
}
