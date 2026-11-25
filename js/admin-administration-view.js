export function mountAdministration(root, { environment = null } = {}) {
    const add = (tag, copy, parent, className) => {
        const node = document.createElement(tag);
        if (copy) node.textContent = copy;
        if (className) node.className = className;
        parent?.append(node);
        return node;
    };
    const icon = (parent, path, className) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        if (className) svg.classList.add(className);
        const shape = document.createElementNS(svg.namespaceURI, 'path');
        shape.setAttribute('d', path);
        svg.append(shape);
        parent.append(svg);
    };
    const headingId = root.getAttribute('aria-labelledby');
    const banner = add('header', null, null, 'administration-banner');
    const title = add('h1', 'Admin Tools', banner);
    title.id = headingId;
    add('p', 'Find a decision, check an interrupted save, or go straight to approved teachers waiting for access.', banner);
    const art = add('img', null, banner);
    art.src = '../assets/brand/administration-landscape.svg';
    art.alt = '';

    const tools = add('div', null, null, 'admin-tools-content');
    const shortcuts = add('section', null, tools);
    const shortcutTitle = add('h2', 'Go to a task', shortcuts, 'admin-tools-heading');
    shortcutTitle.id = 'adminToolShortcuts';
    shortcuts.setAttribute('aria-labelledby', shortcutTitle.id);
    const grid = add('div', null, shortcuts, 'administration-tool-grid');
    for (const [key, label, description, href, shape] of [
        ['logs', 'Find a saved decision', 'Search your recent reviews and access changes.', 'admin-decisions.html',
            'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'],
        ['status', 'Check an account', 'Look up a student or teacher and open their full decision history.', 'admin-accounts.html',
            'M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM3 21v-3a8 8 0 0 1 12-7m1 7 2 2 4-4'],
        ['recovery', 'Activate approved teachers', 'Open applications that are approved and still need classroom access.', 'admin-applications.html?category=activation',
            'M9 3H5v18h14v-8M9 2h6v4H9zM9 13l3 3 8-8']
    ]) {
        const tile = add('a', null, grid, 'administration-tile');
        tile.href = href;
        tile.dataset.tool = key;
        icon(add('span', null, tile, 'administration-tile-icon'), shape);
        const copy = add('span', null, tile, 'administration-tile-copy');
        add('strong', label, copy);
        add('span', description, copy, 'administration-tile-description');
        add('span', '›', tile, 'administration-tile-arrow').setAttribute('aria-hidden', 'true');
    }

    const guide = add('section', null, tools, 'admin-recovery-guide');
    const guideHeading = add('div', null, guide, 'administration-guide-heading');
    icon(guideHeading, 'M5 7h14v14H5zM8 7V4h8v3M9 14l2 2 4-4', 'administration-guide-icon');
    const guideTitle = add('h2', 'Check whether a decision saved', guideHeading);
    guideTitle.id = 'adminRecoveryGuide';
    guide.setAttribute('aria-labelledby', guideTitle.id);
    add('p', 'If you lost your connection while saving, check for the existing decision before you submit again.', guide);

    const paths = add('div', null, guide, 'administration-recovery-paths');
    const current = add('details', null, paths, 'administration-recovery-step');
    add('summary', 'The review is still open', current);
    add('p', 'When the page offers Check saved decision or Check activation result, use it to look up the original attempt. Wait for confirmation before deciding whether to retry.', current);
    const history = add('details', null, paths, 'administration-recovery-step');
    add('summary', 'I left the review page', history);
    const steps = add('ol', null, history);
    add('li', 'Find the student or teacher in User Accounts and open View decision history.', steps);
    add('li', 'Match the action, saved reason, and time. Choose Load More Decisions if you need older records.', steps);
    add('li', 'Teacher approval and classroom activation may have separate records. Confirm the step you were saving before submitting again.', steps);
    add('a', 'Open User Accounts', history, 'administration-disclosure-link').href = 'admin-accounts.html';

    const info = add('details', null, tools, 'administration-platform');
    add('summary', 'What administrators can manage', info);
    const facts = add('dl', null, info);
    for (const [label, value] of [
        ['Teacher applications', 'Review qualifications, request changes, or record approval or decline.'],
        ['Account access', 'Manage access for students and approved teachers.'],
        ['Decision history', 'Check saved reasons, access changes, and timestamps.'],
        ['Environment', environment?.mode === 'emulator' ? 'Local test environment' : 'LakbayPanahon website']
    ]) {
        const row = add('div', null, facts);
        add('dt', label, row);
        add('dd', value, row);
    }
    root.replaceChildren(banner, tools);
    root.classList.add('administration-reference');
}
