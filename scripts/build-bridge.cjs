'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {root, run, target} = require('./common.cjs');
const ridArgument = process.argv.indexOf('--rid');
const rid = ridArgument === -1 ? target().rid : process.argv[ridArgument + 1];
if (!['osx-arm64', 'osx-x64', 'win-x64', 'linux-x64'].includes(rid)) throw new Error('Invalid runtime target');
const sdk = process.env.DOTNET_COMMAND || 'dotnet';
const projects = {
  bridge: 'bridge',
  client: 'vendor/ksef-client-csharp/KSeF.Client',
  core: 'vendor/ksef-client-csharp/KSeF.Client.Core',
};
const update = process.argv.includes('--update-locks');
const locks = path.join(root, 'scripts/locks', rid);
if (!update) {
  for (const [name, folder] of Object.entries(projects)) {
    const lock = path.join(locks, `${name}.json`);
    if (!fs.existsSync(lock)) throw new Error(`Missing NuGet lock: ${rid}/${name}.json`);
    fs.copyFileSync(lock, path.join(root, folder, 'packages.lock.json'));
  }
}
const properties = ['-p:RestorePackagesWithLockFile=true', `-p:RuntimeIdentifier=${rid}`];
run(sdk, ['restore', 'bridge/EasyKsefBridge.csproj', '--runtime', rid, ...properties, ...(update ? ['--force-evaluate'] : ['--locked-mode'])]);
if (update) {
  fs.mkdirSync(locks, {recursive: true});
  for (const [name, folder] of Object.entries(projects)) fs.copyFileSync(path.join(root, folder, 'packages.lock.json'), path.join(locks, `${name}.json`));
}
if (process.argv.includes('--locks-only')) {
  if (!update) throw new Error('--locks-only requires --update-locks');
  process.exit(0);
}
if (process.argv.includes('--restore-only')) process.exit(0);
// Prevent binaries from a previous architecture leaking into an installer.
fs.rmSync(path.join(root, 'bridge/publish'), {recursive: true, force: true});
run(sdk, ['publish', 'bridge/EasyKsefBridge.csproj', '--configuration', 'Release', '--framework', 'net10.0', '--runtime', rid, '--self-contained', 'true', '--no-restore', '--output', 'bridge/publish', ...properties]);
fs.writeFileSync(path.join(root, 'bridge/publish/build-target.json'), JSON.stringify({rid, sdk: run(sdk, ['--version'], {stdio: 'pipe', encoding: 'utf8'}).stdout.trim()}, null, 2) + '\n');
