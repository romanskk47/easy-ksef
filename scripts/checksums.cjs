'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {root, target} = require('./common.cjs');
const destination = path.join(root, 'dist');
const names = fs.readdirSync(destination).filter(name => /^Easy-KSeF-.*\.(exe|dmg|zip|AppImage|deb)$/.test(name)).sort();
if (!names.length) throw new Error('No installers to checksum');
(async () => {
  const rows = [];
  for (const name of names) {
    const hash = crypto.createHash('sha256');
    for await (const chunk of fs.createReadStream(path.join(destination, name))) hash.update(chunk);
    rows.push(`${hash.digest('hex')}  ${name}`);
  }
  fs.writeFileSync(path.join(destination, `SHA256SUMS-${target().rid}.txt`), rows.join('\n') + '\n');
  console.log(rows.join('\n'));
})().catch(error => {console.error(error.message); process.exitCode = 1;});
