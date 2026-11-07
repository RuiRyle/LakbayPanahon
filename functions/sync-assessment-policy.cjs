// Package exact browser pure policies with Functions; --check never writes.
const fs = require('node:fs'),
  path = require('node:path');
const names = ['mission-assessment', 'daily-policy', 'progression-policy', 'practice-review', 'mission-review'];
function sync(check = false) {
  for (const name of names) {
    const source = fs.readFileSync(path.join(__dirname, '../js', name + '.js'), 'utf8').replace('"./practice-review.js"', '"./practice-review.mjs"');
    const target = path.join(__dirname, 'assessment-shared', name + '.mjs');
    if (check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== source) throw Error('Assessment policy drift: ' + name);
    } else {
      fs.mkdirSync(path.dirname(target), {
        recursive: true
      });
      fs.writeFileSync(target, source);
    }
  }
}
if (require.main === module) sync(process.argv.includes('--check'));
module.exports = {
  sync
};
