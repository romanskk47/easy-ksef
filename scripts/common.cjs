'use strict';
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {cwd: root, stdio: 'inherit', ...options});
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`);
  return result;
}
function npm(args, cwd = root) {
  // npm.cmd requires a shell on Windows. Invoke npm's JS entry with Node instead.
  const cli = process.env.npm_execpath;
  if (!cli) throw new Error('Uruchom przez npm run, aby użyć tej samej wersji npm.');
  return run(process.execPath, [cli, ...args], {cwd});
}
function target() {
  const platform = {darwin: 'osx', win32: 'win', linux: 'linux'}[process.platform];
  const arch = process.env.EASY_KSEF_ARCH || process.arch;
  const rid = `${platform}-${arch}`;
  if (!['osx-arm64', 'osx-x64', 'win-x64', 'linux-x64'].includes(rid)) {
    throw new Error(`Nieobsługiwany cel kompilacji: ${rid}`);
  }
  return {platform, arch, rid};
}
module.exports = {root, run, npm, target};
