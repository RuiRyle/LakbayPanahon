function configureLocalAppCheckDebug() {
    const loopback = ['localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname);
    try {
        if (loopback && globalThis.sessionStorage?.getItem('bayaniAppCheckDebug') === 'true') {
            const replacement = globalThis.sessionStorage.getItem('bayaniAppCheckDebugToken');
            globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = typeof replacement === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(replacement) ? replacement : true;
        }
    } catch { /* Optional local preference; ordinary verification still applies. */ }
}
configureLocalAppCheckDebug();
