'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {root, npm} = require('./common.cjs');
const folder = path.join(root, 'vendor/ksef-pdf-generator');
npm(['ci', '--ignore-scripts', '--no-audit', '--no-fund'], folder);
npm(['run', 'build'], folder);
fs.mkdirSync(path.join(root, 'app/converter'), {recursive: true});
fs.copyFileSync(path.join(folder, 'dist/ksef-fe-invoice-converter.umd.cjs'), path.join(root, 'app/converter/ksef-fe-invoice-converter.umd.cjs'));
for (const name of ['ksef-pdf-generator', 'ksef-client-csharp']) {
  const license = name === 'ksef-client-csharp' ? 'LICENCE.txt' : 'LICENSE';
  fs.copyFileSync(path.join(root, 'vendor', name, license), path.join(root, 'app/licenses', `${name}.txt`));
}
