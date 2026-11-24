// Runs every test script in this folder.
const { execFileSync } = require('child_process');
const path = require('path');
for (const f of ['smoke.js']) {
  console.log('== ' + f);
  execFileSync(process.execPath, [path.join(__dirname, f)], { stdio: 'inherit' });
}
