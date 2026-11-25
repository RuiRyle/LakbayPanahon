import { app, functions } from './firebase-config.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js';
import { verifyAppCheck } from './app-verification.js';
import { studentAccessConfiguration, studentAccessEndpoint } from './student-access-configuration.js';

export async function studentAccessRequest(data) {
    const config = await studentAccessConfiguration();
    if (!config || (data.action === 'register' && !config.selfSignup)) throw new Error('Student account access is unavailable. Try again shortly.');
    if (config.siteKey) await verifyAppCheck(config.siteKey);
    const service = config.emulator ? functions : getFunctions(app, studentAccessEndpoint);
    const result = await httpsCallable(service, 'studentClassroomAccess', { timeout: 15000 })(data);
    return result.data;
}
