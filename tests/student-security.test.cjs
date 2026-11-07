// Current security release gate: use firebase.assessment-emulator.json and all
// three local emulators. Old browser-authority fixtures are superseded, not
// treated as passing. Every canonical client write must now be denied.
require('./student-assessment-emulator.cjs');
