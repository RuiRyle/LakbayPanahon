'use strict';

const ERROR_MESSAGES = Object.freeze({
    'bayani/unauthenticated': 'Sign in again to use Bayani AI.',
    'bayani/permission-denied': 'Bayani AI is not available for this account.',
    'bayani/app-check-required': 'Bayani AI could not verify this app. Try connecting again later.',
    'bayani/rate-limit': 'Please wait a moment before asking another question.',
    'bayani/quota-exceeded': 'Bayani AI has reached its usage limit for now. Continue your lesson and try again later.',
    'bayani/privacy-blocked': 'Keep personal information out of chat. Remove contact details and ask about your history lesson.',
    'bayani/invalid-request': 'Try asking a shorter history question, or start a New Chat.',
    'bayani/unavailable': 'Bayani AI is unavailable right now. You can continue your lesson.',
    'bayani/deadline-exceeded': 'Bayani AI took too long to reply. You can continue your lesson and try again later.',
    'bayani/no-content': 'Bayani AI could not write a reply. Try asking your history question in a different way.'
});

class BayaniError extends Error {
    constructor(code, status = 503) {
        super(ERROR_MESSAGES[code] || ERROR_MESSAGES['bayani/unavailable']);
        this.code = Object.hasOwn(ERROR_MESSAGES, code) ? code : 'bayani/unavailable';
        this.status = status;
    }
}

function failure(code, status) { return new BayaniError(code, status); }

function publicFailure(error) {
    const safe = error instanceof BayaniError ? error : failure('bayani/unavailable', 503);
    return {status: safe.status, body: {error: {code: safe.code, message: ERROR_MESSAGES[safe.code]}}};
}

function checkActive(signal) {
    if (signal?.aborted) throw failure('bayani/deadline-exceeded', 504);
}

module.exports = {BayaniError, ERROR_MESSAGES, failure, publicFailure, checkActive};
