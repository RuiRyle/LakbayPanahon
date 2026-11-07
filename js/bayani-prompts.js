// Navigation prepares a question only. The existing chat form remains the only sender.
export const dashboardBayaniPrompts = Object.freeze({
    communities:'How did early Filipino communities work together?',
    trade:'How did seafaring connect early Philippine communities?'
});
export function dashboardBayaniPrompt(search) {
    const key=new URLSearchParams(search).get('prompt');
    return Object.hasOwn(dashboardBayaniPrompts,key) ? dashboardBayaniPrompts[key] : '';
}
