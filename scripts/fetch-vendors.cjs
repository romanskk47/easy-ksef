'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {root, run} = require('./common.cjs');
const vendors = require('./vendors.json');
for (const [name, source] of Object.entries(vendors)) {
  if (!/^[a-z0-9-]+$/.test(name) || !/^[a-f0-9]{40}$/.test(source.commit)) throw new Error('Invalid vendor pin');
  const folder = path.join(root, 'vendor', name);
  if (fs.existsSync(folder)) {
    if (fs.lstatSync(folder).isSymbolicLink()) throw new Error(`Refusing symlink: ${name}`);
    const head = run('git', ['rev-parse', 'HEAD'], {cwd: folder, stdio: 'pipe', encoding: 'utf8'}).stdout.trim();
    const remote = run('git', ['remote', 'get-url', 'origin'], {cwd: folder, stdio: 'pipe', encoding: 'utf8'}).stdout.trim();
    if (head !== source.commit || remote !== source.repository) throw new Error(`Wrong vendor source: ${name}. Remove only this generated vendor folder and fetch again.`);
    run('git', ['diff', '--exit-code', 'HEAD', '--'], {cwd: folder});
  } else {
    fs.mkdirSync(folder, {recursive: true});
    run('git', ['init', '--quiet'], {cwd: folder});
    run('git', ['remote', 'add', 'origin', source.repository], {cwd: folder});
    run('git', ['fetch', '--depth', '1', 'origin', source.commit], {cwd: folder});
    run('git', ['checkout', '--detach', 'FETCH_HEAD'], {cwd: folder});
  }
  console.log(`${name}: ${source.commit}`);
}
