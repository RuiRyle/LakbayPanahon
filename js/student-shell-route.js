const studentRoutes = new Set([
    'student-dashboard.html', 'my-journey.html', 'chapters.html', 'era.html',
    'mission.html', 'story.html', 'quiz.html', 'practice.html',
    'chapter-challenge.html', 'my-class.html', 'achievements.html',
    'my-profile.html', 'bayani-ai.html', 'settings.html'
]);

export function studentRouteForPage(page, pagesDirectory) {
    try {
        const directory = new URL('.', pagesDirectory);
        const candidate = new URL(page, directory);
        const fileName = candidate.pathname.split('/').pop();
        return candidate.origin === directory.origin && studentRoutes.has(fileName) &&
            candidate.pathname === new URL(fileName, directory).pathname
            ? fileName + candidate.search + candidate.hash : null;
    } catch {
        return null;
    }
}

export function shellUrlForPage(shellHref, pageHref) {
    try {
        const shell = new URL(shellHref);
        const route = studentRouteForPage(pageHref, shell);
        if (!route) return null;
        shell.searchParams.set('route', route);
        return shell.href;
    } catch {
        return null;
    }
}
