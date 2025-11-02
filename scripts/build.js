/**
 * Minimal static "build": copies project files into /dist for preview or artifact.
 * GitHub Pages continues to deploy from repo root via existing workflow.
 */
import { promises as fs } from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const SKIP = new Set(['node_modules', 'dist', '.git']);
const SKIP_FILES = new Set([
  'package-lock.json'
]);

function shouldSkip(rel) {
  if (!rel) return false;
  const p = rel.split(path.sep);
  if (SKIP.has(p[0])) return true;
  if (rel.startsWith('.github' + path.sep)) return true;
  if (rel.startsWith('docs' + path.sep)) return true;
  return false;
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const srcPath = path.join(src, e.name);
    const rel = path.relative(ROOT, srcPath);
    if (shouldSkip(rel)) continue;
    if (SKIP_FILES.has(e.name)) continue;
    const destPath = path.join(dest, e.name);

    if (e.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (e.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  await fs.rm(DIST, { recursive: true, force: true });
  await copyDir(ROOT, DIST);
  // Drop dev-only files from /dist
  const devFiles = ['.eslintrc.json', '.eslintignore', '.prettierrc.json', '.prettierignore', 'CLEAN_REPORT.md'];
  for (const f of devFiles) {
    await fs.rm(path.join(DIST, f), { force: true });
  }
  console.log('Build complete → dist/');
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
