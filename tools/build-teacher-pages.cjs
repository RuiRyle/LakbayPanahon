// Keep the common teacher shell consistent across independently addressable pages.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'pages/teacher-dashboard.html'), 'utf8');
const destinations = {classes:['teacher-classes.html','My Classes'],classroom:['teacher-classroom.html','Classroom details'],students:['teacher-students.html','Student Progress'],announcements:['teacher-announcements.html','Announcements'],assignments:['teacher-assignments.html','Assigned Missions'],settings:['teacher-settings.html','Account Settings']};
let failed = false;
for (const [name, [file, title]] of Object.entries(destinations)) {
    const html = source.replace('data-teacher-page="overview"', `data-teacher-page="${name==='classroom'?'classes':name}"`)
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${title} | LakbayPanahon</title>`)
        .replace(/data-teacher-tab="([^"]+)" aria-pressed="[^"]+"/g, (_, key) => `data-teacher-tab="${key}" aria-pressed="${key === (name==='classroom'?'classes':name)}"`);
    const target = path.join(root, 'pages', file);
    if (process.argv.includes('--check')) {
        if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== html) { console.error('Outdated teacher page: ' + file); failed = true; }
    } else fs.writeFileSync(target, html);
}
if (failed) process.exitCode = 1;
else console.log(process.argv.includes('--check') ? 'Teacher pages are consistent.' : 'Built six teacher destinations from the shared dashboard shell.');
