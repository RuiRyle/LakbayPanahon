'use strict';

const {failure, checkActive, BayaniError} = require('./errors.cjs');
const {MAX_ANSWER_CHARACTERS} = require('./core.cjs');
const API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2026-10-21';
const MAX_RESPONSE_BYTES = 65536;

async function boundedJson(response, signal) {
    if (!response.body?.getReader) throw failure('bayani/no-content', 502);
    const reader = response.body.getReader(), chunks = [];
    let length = 0;
    try {
        while (true) {
            checkActive(signal);
            const {done, value} = await reader.read();
            if (done) break;
            length += value.byteLength;
            if (length > MAX_RESPONSE_BYTES) throw failure('bayani/no-content', 502);
            chunks.push(value);
        }
        checkActive(signal);
        return JSON.parse(Buffer.concat(chunks, length).toString('utf8'));
    } catch (error) {
        try { await reader.cancel(); } catch {}
        if (error instanceof BayaniError) throw error;
        throw failure('bayani/no-content', 502);
    } finally { reader.releaseLock(); }
}

function createAnthropicGenerator({apiKey, workspaceId, fetchImpl = fetch, timeoutMs = 25000} = {}) {
    if (typeof apiKey !== 'string' || !apiKey.trim()) throw Error('Configure the private Anthropic credential.');
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 25000) throw Error('Invalid provider deadline.');
    return async function generateAnswer({message, history, settings, signal}) {
        checkActive(signal);
        const timeout = AbortSignal.timeout(timeoutMs);
        const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
        const headers = {'Content-Type': 'application/json', 'anthropic-version': API_VERSION,
            Authorization: 'Bearer ' + apiKey};
        if (workspaceId) headers['anthropic-workspace-id'] = workspaceId;
        try {
            const response = await fetchImpl(API_ENDPOINT, {method: 'POST', headers, redirect: 'error', signal: combined,
                body: JSON.stringify({model: settings.model, system: settings.systemInstruction,
                    max_tokens: settings.maxOutputTokens, stream: false,
                    messages: [...history.map(entry => ({role: entry.role === 'model' ? 'assistant' : 'user',
                        content: entry.parts[0].text})), {role: 'user', content: message}]})});
            checkActive(combined);
            if (!response.ok) {
                try { await response.body?.cancel(); } catch {}
                throw failure(response.status === 429 ? 'bayani/quota-exceeded' : 'bayani/unavailable', response.status === 429 ? 429 : 503);
            }
            const output = await boundedJson(response, combined);
            if (output?.type !== 'message' || output.role !== 'assistant' || output.stop_reason !== 'end_turn'
                || output.stop_details?.type === 'refusal' || !Array.isArray(output.content) || !output.content.length
                || output.content.some(block => !block || block.type !== 'text' || typeof block.text !== 'string')) {
                throw failure('bayani/no-content', 502);
            }
            const answer = output.content.map(block => block.text).join('\n').trim();
            if (!answer || answer.length > MAX_ANSWER_CHARACTERS) throw failure('bayani/no-content', 502);
            return answer;
        } catch (error) {
            if (combined.aborted) throw failure('bayani/deadline-exceeded', 504);
            if (error instanceof BayaniError) throw error;
            throw failure('bayani/unavailable', 503);
        }
    };
}

module.exports = {createAnthropicGenerator, API_ENDPOINT, API_VERSION, MAX_RESPONSE_BYTES};
