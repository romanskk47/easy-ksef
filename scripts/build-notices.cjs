'use strict';
// Collect installed runtime dependencies, not a hand-maintained partial list.
const fs = require('node:fs');
const path = require('node:path');
const {root, run, target} = require('./common.cjs');
const components = new Map();
const notices = [];
function licenseFiles(folder, depth = 0) {
  if (depth > 2) return [];
  const output = [];
  for (const item of fs.readdirSync(folder, {withFileTypes: true})) {
    if (item.isFile() && /^(licen[sc]e|notice|third-party-notices|copying)([._-]|$)/i.test(item.name)) output.push(path.join(folder, item.name));
    else if (item.isDirectory() && !['node_modules', '.git', 'bin', 'obj', 'runtimes', 'ref', 'lib', 'tools', 'data'].includes(item.name)) output.push(...licenseFiles(path.join(folder, item.name), depth + 1));
  }
  return output;
}
function add(component, folder) {
  const key = `${component.ecosystem}:${component.name}@${component.version}`;
  if (components.has(key)) return;
  const files = licenseFiles(folder);
  // Some older npm tarballs put their only license declaration in README.
  if (!files.length && component.ecosystem === 'npm') {
    const readme = fs.readdirSync(folder).find(name => /^readme([.]|$)/i.test(name));
    if (readme) files.push(path.join(folder, readme));
  }
  components.set(key, {...component, licenseFiles: files.map(file => path.relative(folder, file).replaceAll('\\', '/'))});
  notices.push(`\n${'='.repeat(72)}\n${key}\nLicense: ${component.license}\nSource: ${component.source || ''}\n`);
  for (const file of files) notices.push(`\n--- ${path.relative(folder, file)} ---\n${fs.readFileSync(file, 'utf8')}\n`);
}
function npmComponents(folder, bundle) {
  const result = run(process.execPath, [process.env.npm_execpath, 'ls', '--omit=dev', '--all', '--parseable'], {cwd: folder, stdio: 'pipe', encoding: 'utf8'});
  for (const line of result.stdout.trim().split(/\r?\n/)) {
    if (path.resolve(line) === folder) continue;
    const pkg = JSON.parse(fs.readFileSync(path.join(line, 'package.json'), 'utf8'));
    add({ecosystem: 'npm', name: pkg.name, version: pkg.version, license: pkg.license || (pkg.licenses || []).map(x => x.type).join(' OR ') || 'See included notice', author: pkg.author, source: typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url, bundle}, line);
  }
}
npmComponents(root, 'application');
npmComponents(path.join(root, 'vendor/ksef-pdf-generator'), 'PDF converter');
const assets = JSON.parse(fs.readFileSync(path.join(root, 'bridge/obj/project.assets.json'), 'utf8'));
const deps = JSON.parse(fs.readFileSync(path.join(root, 'bridge/publish/EasyKsefBridge.deps.json'), 'utf8'));
const packageRoots = Object.keys(assets.packageFolders);
function xmlValue(text, name) {
  return new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i').exec(text)?.[1]?.replaceAll('&amp;', '&').trim();
}
for (const [key, spec] of Object.entries(deps.libraries)) {
  if (!['package', 'runtimepack'].includes(spec.type)) continue;
  const slash = key.lastIndexOf('/');
  const name = key.slice(0, slash).replace(/^runtimepack\./, '');
  const version = key.slice(slash + 1);
  const relative = `${name.toLowerCase()}/${version}`;
  const folder = packageRoots.map(base => path.join(base, relative)).find(dir => fs.existsSync(dir));
  if (!folder) throw new Error(`Missing NuGet package notices: ${key}`);
  const nuspec = fs.readdirSync(folder).find(name => name.endsWith('.nuspec'));
  const metadata = nuspec ? fs.readFileSync(path.join(folder, nuspec), 'utf8') : '';
  add({ecosystem: 'nuget', name, version, license: xmlValue(metadata, 'license') || xmlValue(metadata, 'licenseUrl') || 'See included notice', copyright: xmlValue(metadata, 'copyright'), authors: xmlValue(metadata, 'authors'), source: `https://www.nuget.org/packages/${name}/${version}`}, folder);
}
const pins = require('./vendors.json');
for (const [name, source] of Object.entries(pins)) add({ecosystem: 'git', name, version: source.commit, license: 'MIT', source: source.repository}, path.join(root, 'vendor', name));
notices.push('\nRoboto font (embedded by pdfmake)\nCopyright 2011 The Roboto Project Authors (https://github.com/googlefonts/roboto-classic)\n');
notices.push(fs.readFileSync(path.join(__dirname, 'third-party/Roboto-OFL.txt'), 'utf8'));
for (const name of ['identitymodel', 'qrcoder', 'aspnetcore']) {
  notices.push(`\nSupplemental ${name} license (source and checksum: scripts/third-party/sources.json)\n`);
  notices.push(fs.readFileSync(path.join(__dirname, 'third-party', `${name}.txt`), 'utf8'));
}
notices.push('\nElectron and Chromium license files are also included in the installed application distribution.\n');
const output = path.join(root, 'app/licenses');
fs.mkdirSync(output, {recursive: true});
const list = [...components.values()].sort((a, b) => `${a.ecosystem}:${a.name}`.localeCompare(`${b.ecosystem}:${b.name}`));
fs.writeFileSync(path.join(output, 'dependencies.json'), JSON.stringify({application: require('../package.json').version, target: target().rid, components: list}, null, 2) + '\n');
fs.writeFileSync(path.join(output, 'dependencies.txt'), 'Third-party software notices for Easy KSeF\n' + notices.join('\n'));
console.log(`Included notices and inventory for ${list.length} components.`);
