// Student pages always use the original saved-progression flow on every host.
// Keep this initializer name for existing imports and clear only the retired mode flag.
export function initializeExplorationPreview() {
    globalThis.__lakbayExplorationPreview = false;
    try {
        sessionStorage.removeItem('lakbayExplorationPreview');
    } catch {
        // Unavailable browser storage must never enable a learning-lock bypass.
    }
    document.getElementById('explorationPreviewBar')?.remove();
}
