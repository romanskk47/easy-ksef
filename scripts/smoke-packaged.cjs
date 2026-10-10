'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {root, run, target} = require('./common.cjs');
const {arch, rid} = target();
if (arch !== process.arch) throw new Error('Run the packaged smoke test on the target architecture.');
const paths = {
  darwin: path.join('dist', arch === 'arm64' ? 'mac-arm64' : 'mac', 'Easy KSeF.app/Contents/MacOS/Easy KSeF'),
  win32: 'dist/win-unpacked/Easy KSeF.exe',
  linux: 'dist/linux-unpacked/easy-ksef',
};
const executable = path.join(root, paths[process.platform]);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'easy-ksef-smoke-'));
try {
  const args = ['--self-test', '--ui-check', `--user-data-dir=${path.join(temp, 'profile')}`];
  // Linux CI runs this script under xvfb. Keep Chromium's sandbox enabled.
  const result = run(executable, args, {stdio: 'pipe', encoding: 'utf8', timeout: 120000,
    env: {...process.env, EASY_KSEF_TEST_OUTPUT: temp, EASY_KSEF_UI_DOCUMENTS: path.join(temp, 'documents')}});
  const records = result.stdout.split(/\r?\n/).filter(Boolean).flatMap(line => {try {return [JSON.parse(line)];} catch {return [];}});
  const record = records.find(item => item.selfTest === 'passed');
  if (!record || !record.buyerValidated || !record.filesVerified || record.pdfBytes < 1000) throw new Error('Packaged smoke test did not report a verified PDF and archive.');
  const pdf = fs.readFileSync(path.join(temp, 'przykladowa-faktura-test.pdf'));
  if (pdf.subarray(0, 5).toString() !== '%PDF-') throw new Error('Smoke output is not a PDF');
  fs.mkdirSync(path.join(root, 'artifacts'), {recursive: true});
  fs.writeFileSync(path.join(root, 'artifacts', `smoke-${rid}.json`), JSON.stringify({rid, ...record}, null, 2) + '\n');
  console.log(JSON.stringify({rid, ...record}));
} finally {
  fs.rmSync(temp, {recursive: true, force: true});
}
