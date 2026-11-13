'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const folder = path.join(__dirname, 'assets', 'audio', 'ngoc-linh');
const { clips } = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
const missing = [], invalid = [];
for (const [id, { file }] of Object.entries(clips)) {
  if (file !== id + '.mp3') { invalid.push(id); continue; }
  const location = path.join(folder, file);
  if (!fs.existsSync(location)) { missing.push(id); continue; }
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,duration', '-of', 'json', location], { encoding: 'utf8' });
  if (probe.error) throw probe.error;
  if (probe.status !== 0 || !JSON.parse(probe.stdout).streams.some(s => s.codec_name === 'mp3' && Number(s.duration) > 0)) invalid.push(id);
}
console.log(JSON.stringify({ expected: Object.keys(clips).length, valid: Object.keys(clips).length - missing.length - invalid.length, missing, invalid }, null, 2));
if (missing.length || invalid.length) process.exitCode = 1;
