export function navigatePage(destination, { replace = false } = {}) {
    if (window.LakbayPageTransition) window.LakbayPageTransition(destination, { replace });
    else if (replace) window.location.replace(destination);
    else window.location.assign(destination);
}

export function reloadPage() {
    if (window.LakbayPageTransition) window.LakbayPageTransition(window.location.href, { reload: true });
    else window.location.reload();
}
