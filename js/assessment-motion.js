const activeTransitions = new WeakMap();
const renderedStates = new WeakMap();

export function animateAssessmentArrival(element, state) {
    if (!element?.animate) return;
    if (state !== undefined) {
        if (renderedStates.get(element) === state) return;
        renderedStates.set(element, state);
    }
    activeTransitions.get(element)?.cancel();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.querySelector('.lakbay-reduce-motion')) return;

    activeTransitions.set(element, element.animate(
        [{ opacity: 0.84 }, { opacity: 1 }],
        { duration: 160, easing: 'ease-out' }
    ));
}
