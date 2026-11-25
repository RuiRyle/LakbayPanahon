const navigation = document.querySelector('[data-learning-navigation]');
if (navigation) {
    document.body.classList.add('story-focus-view');
    navigation.addEventListener('click', () => {
        const focused = document.body.classList.toggle('story-focus-view');
        navigation.setAttribute('aria-expanded', String(!focused));
        navigation.textContent = focused ? 'Show navigation' : 'Hide navigation';
    });
}

const fullscreen = document.querySelector('[data-learning-fullscreen]');
if (fullscreen && document.fullscreenEnabled && document.documentElement.requestFullscreen) {
    fullscreen.hidden = false;
    const status = document.querySelector('[data-learning-fullscreen-status]');
    document.addEventListener('fullscreenchange', () => {
        fullscreen.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
    });
    fullscreen.addEventListener('click', async () => {
        status.textContent = '';
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await document.documentElement.requestFullscreen();
        } catch {
            status.textContent = 'Full screen could not open. You can keep learning here.';
        }
    });
}
