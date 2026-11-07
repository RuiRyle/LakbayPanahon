// Optional callable services must not block sign-in or ordinary learning pages.
import {app} from './firebase-config.js';
import {firebaseEnvironment} from './firebase-environment.js';
import {getFunctions,connectFunctionsEmulator} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-functions.js';

const functions=getFunctions(app,'asia-southeast1');
if(firebaseEnvironment?.mode==='emulator')connectFunctionsEmulator(functions,'127.0.0.1',5001);
export {functions};
