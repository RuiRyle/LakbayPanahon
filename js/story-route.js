export function validateRouteActivity(activity) {
    const text = value => typeof value === 'string' && value.trim();
    if (!activity || !text(activity.title) || !text(activity.instructions) || !text(activity.mapDescription) ||
        !Array.isArray(activity.conditions) || !activity.conditions.length || !activity.conditions.every(text) ||
        !Array.isArray(activity.routes) || activity.routes.length < 2 ||
        new Set(activity.routes.map(route => route.id)).size !== activity.routes.length ||
        !activity.routes.every(route => text(route.id) && text(route.name) && text(route.description) &&
            text(route.feedback) && typeof route.suitable === 'boolean') ||
        !activity.routes.some(route => route.suitable)) throw Error('Configure valid route investigation content in Firestore.');
    return activity;
}

export function evaluateRoute(activity, routeId) {
    validateRouteActivity(activity);
    const route = activity.routes.find(item => item.id === routeId);
    return route ? {valid: route.suitable, message: route.feedback} :
        {valid: false, message: 'Choose a route, then compare it with the travel clues.'};
}

export function renderRouteInvestigation({scene, host, state, explored, onChange, onConfirmed}) {
    let activity;
    try { activity = validateRouteActivity(scene.routeActivity); }
    catch { host.textContent = 'This route activity could not be prepared. Please ask your teacher for help.'; return; }
    host.className = 'story-route-activity';
    const add = (tag, value, className) => {
        const node = document.createElement(tag); node.textContent = value;
        if (className) node.className = className; host.append(node); return node;
    };
    add('span', 'INVESTIGATE · CHOOSE A ROUTE · EXPLAIN', 'eyebrow');
    add('h3', activity.title);
    add('p', activity.instructions);
    add('p', 'Open every scene clue before planning your route.', 'route-clue-lock').hidden = explored;
    const journal = document.createElement('div'); journal.className = 'route-evidence-journal'; journal.hidden = !explored;
    const heading = document.createElement('h4'); heading.textContent = 'Travel evidence'; journal.append(heading);
    for (const condition of activity.conditions) { const line = document.createElement('p'); line.textContent = condition; journal.append(line); }
    host.append(journal);
    // The diagram is symbolic; the full route descriptions below are equivalent text controls.
    const map = document.createElement('div'); map.className = 'route-symbolic-map'; map.setAttribute('aria-hidden', 'true');
    for (const [index, route] of activity.routes.entries()) {
        const line = document.createElement('div'); line.className = 'route-map-line';
        const marker = document.createElement('span'); marker.textContent = String(index + 1);
        const name = document.createElement('span'); name.textContent = route.name;
        line.append(marker, name); map.append(line);
    }
    host.append(map); add('p', activity.mapDescription, 'route-map-description');
    const fieldset = document.createElement('fieldset'); fieldset.className = 'route-plan-options';
    const legend = document.createElement('legend'); legend.textContent = 'Choose your travel plan'; fieldset.append(legend);
    const confirmed = state?.confirmed === true && evaluateRoute(activity, state.routeId).valid;
    let selected = activity.routes.some(route => route.id === state?.routeId) ? state.routeId : '';
    const feedback = document.createElement('p'); feedback.className = 'route-plan-feedback'; feedback.setAttribute('role', 'status');
    for (const [index, route] of activity.routes.entries()) {
        const label = document.createElement('label');
        const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'story-route-plan'; radio.value = route.id;
        radio.checked = selected === route.id; radio.disabled = !explored || confirmed;
        const copy = document.createElement('span'); const name = document.createElement('strong'); name.textContent = (index + 1) + '. ' + route.name;
        const description = document.createElement('span'); description.textContent = route.description; copy.append(name, description);
        radio.addEventListener('change', () => { selected = route.id; feedback.textContent = ''; onChange({routeId: selected, confirmed: false}); });
        label.append(radio, copy); fieldset.append(label);
    }
    host.append(fieldset);
    const check = document.createElement('button'); check.type = 'button'; check.className = 'begin-mission-button'; check.textContent = 'Check My Route'; check.disabled = !explored || confirmed;
    const revise = document.createElement('button'); revise.type = 'button'; revise.className = 'text-button'; revise.textContent = 'Revise My Route'; revise.hidden = !confirmed;
    revise.addEventListener('click', () => { onChange({routeId: selected, confirmed: false}); host.replaceChildren(); renderRouteInvestigation({scene, host, state: {routeId: selected}, explored, onChange, onConfirmed}); });
    check.addEventListener('click', () => {
        const outcome = evaluateRoute(activity, selected); feedback.textContent = outcome.message; feedback.dataset.valid = String(outcome.valid);
        onChange({routeId: selected, confirmed: outcome.valid});
        if (outcome.valid) { fieldset.querySelectorAll('input').forEach(input => input.disabled = true); check.disabled = true; revise.hidden = false; onConfirmed(); }
    });
    if (confirmed) { feedback.textContent = evaluateRoute(activity, selected).message; feedback.dataset.valid = 'true'; }
    host.append(check, revise, feedback);
}
