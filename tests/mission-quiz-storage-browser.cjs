// Run the complete quiz fixture with browser storage access denied.
// The ordinary fixture exercises Firestore-draft restoration, retry and rewards.
process.argv.push('--storage-blocked');
require('./mission-quiz-browser.cjs');
