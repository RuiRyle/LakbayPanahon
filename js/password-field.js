for (const button of document.querySelectorAll('.password-field > .password-toggle[aria-controls]')) {
    const input = document.getElementById(button.getAttribute('aria-controls'));
    if (!input) continue;
    button.addEventListener('click', () => {
        const label = button.dataset.passwordLabel || 'password';
        const reveal = input.type === 'password';
        input.type = reveal ? 'text' : 'password';
        button.setAttribute('aria-label', (reveal ? 'Hide ' : 'Show ') + label);
    });
}
