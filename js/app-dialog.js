// Shared asynchronous dialogs. Plain text only; Escape always cancels.
let active = null;
export function appConfirm(message, options = {}) { return show(message, {...options, confirm: true}); }
export function appAlert(message, options = {}) { return show(message, {...options, confirm: false}); }
function show(message, {title = 'LakbayPanahon', confirm = true} = {}) {
    if (active) return Promise.resolve(false);
    return new Promise(resolve => {
        const origin = document.activeElement;
        const protectedPage = document.body.classList.contains('authenticated');
        const dialog = document.createElement('dialog');
        dialog.className = 'lakbay-dialog';
        dialog.setAttribute('aria-labelledby', 'lakbayDialogTitle');
        dialog.setAttribute('aria-describedby', 'lakbayDialogMessage');
        const header = document.createElement('div');header.className = 'lakbay-dialog-header';
        const emblem = document.createElement('span');emblem.className = 'lakbay-dialog-emblem';emblem.setAttribute('aria-hidden','true');
        emblem.innerHTML = '<svg viewBox="0 0 64 64" focusable="false"><circle cx="32" cy="32" r="26"/><circle cx="32" cy="32" r="20"/><path class="compass-north" d="M32 10 38 32 32 28 26 32Z"/><path class="compass-south" d="M32 54 26 32 32 36 38 32Z"/><path d="M10 32h8m28 0h8M32 4v4m0 48v4"/><circle class="compass-center" cx="32" cy="32" r="3"/></svg>';
        const caption = document.createElement('span');caption.className = 'lakbay-dialog-caption';caption.textContent = confirm ? 'A moment before you continue' : 'A message for your journey';
        const heading = document.createElement('h2');heading.id = 'lakbayDialogTitle';heading.textContent = title;
        const titleGroup = document.createElement('div');titleGroup.append(caption,heading);header.append(emblem,titleGroup);
        const copy = document.createElement('p');copy.id = 'lakbayDialogMessage';copy.textContent = String(message ?? '');
        const actions = document.createElement('div');actions.className = 'lakbay-dialog-actions';
        const cancel = document.createElement('button');cancel.type = 'button';cancel.textContent = 'Cancel';cancel.className = 'lakbay-dialog-cancel';
        const ok = document.createElement('button');ok.type = 'button';ok.textContent = 'OK';ok.className = 'lakbay-dialog-ok';
        let finished = false;
        const finish = value => {
            if (finished) return;finished = true;active = null;
            window.removeEventListener('pagehide', leave);
            observer.disconnect();
            if(dialog.open)dialog.close();dialog.remove();
            if(origin?.isConnected)origin.focus({preventScroll:true});
            resolve(value);
        };
        const leave = () => finish(false);
        const observer = new MutationObserver(() => {
            if ((protectedPage && !document.body.classList.contains('authenticated')) || (origin && !origin.isConnected)) finish(false);
        });
        observer.observe(document.body, {attributes:true, attributeFilter:['class'], childList:true, subtree:true});
        active = dialog;
        cancel.addEventListener('click', () => finish(false));ok.addEventListener('click', () => finish(true));
        dialog.addEventListener('cancel', event => {event.preventDefault();finish(false);});
        dialog.addEventListener('close', () => finish(false));
        window.addEventListener('pagehide', leave, {once:true});
        if(confirm)actions.append(cancel);actions.append(ok);
        dialog.append(header,copy,actions);document.body.append(dialog);dialog.showModal();
        (confirm?cancel:ok).focus();
    });
}
