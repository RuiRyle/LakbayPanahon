for (const button of document.querySelectorAll('.password-field > .password-toggle[aria-controls]')) {
    const input = document.getElementById(button.getAttribute('aria-controls'));
    if (!input) continue;
    const label = button.dataset.passwordLabel || 'password';

    button.addEventListener('click', () => {
        const reveal = input.type === 'password';
        input.type = reveal ? 'text' : 'password';
        button.setAttribute('aria-label', (reveal ? 'Hide ' : 'Show ') + label);
    });
}
