import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
const target = path.join(root, 'dist', 'cc-udemy');
await mkdir(path.join(root, 'dist'), { recursive: true });
await rm(target, { recursive: true, force: true });
await mkdir(target);
for (const item of ['manifest.json', 'src', 'README.md']) {
  await cp(path.join(root, item), path.join(target, item), { recursive: true });
}
const archive = `lecturesub-for-udemy-${manifest.version}.zip`;
const archivePath = path.join(root, 'dist', archive);
await rm(archivePath, { force: true });
execFileSync('zip', ['-qr', archivePath, '.'], { cwd: target });
execFileSync('cp', [archivePath, path.join(root, 'dist', `cc-udemy-${manifest.version}.zip`)]);
console.log(`Unpacked: ${target}\nZIP: ${archivePath}`);
