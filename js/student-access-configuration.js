import { firebaseEnvironment } from './firebase-environment.js';

export const studentAccessEndpoint = 'https://lakbaypanahon-assessment.onrender.com';
let configuration;

async function readConfiguration() {
    if (firebaseEnvironment?.mode === 'emulator') return { emulator: true, selfSignup: true };
    const response = await fetch(studentAccessEndpoint + '/student-access-config', { signal: AbortSignal.timeout(9000) });
    if (!response.ok) return null;
    const config = await response.json();
    return config.enabled === true && typeof config.siteKey === 'string' && config.siteKey
        ? { siteKey: config.siteKey, selfSignup: config.selfSignup === true } : null;
}

export function studentAccessConfiguration() {
    configuration ??= readConfiguration().catch(() => null).then(config => {
        if (!config) configuration = undefined;
        return config;
    });
    return configuration;
}

export async function studentAccessAvailable({ signup = false } = {}) {
    const config = await studentAccessConfiguration();
    return Boolean(config && (!signup || config.selfSignup));
}
