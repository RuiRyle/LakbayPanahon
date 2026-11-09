// Legacy entrypoint now checks the redirect and current unified setup.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const legacy = fs.readFileSync(path.join(__dirname, '../pages/teacher-register.html'), 'utf8');
assert.ok(legacy.includes('http-equiv="refresh" content="0;url=teacher-application.html"'));
assert.ok(legacy.includes('href="teacher-application.html"'));
assert.ok(!legacy.includes('id="teacherRegisterForm"'));
require('./teacher-unified-setup-browser.cjs');
