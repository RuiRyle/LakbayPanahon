function configureLocalAppCheckDebug() {
    const loopback = ['localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname);
    try {
        if (loopback && globalThis.sessionStorage?.getItem('bayaniAppCheckDebug') === 'true') {
            globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        }
    } catch { /* Optional local preference; ordinary verification still applies. */ }
}
configureLocalAppCheckDebug();
