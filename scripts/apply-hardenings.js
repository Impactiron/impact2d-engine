/**
 * apply-hardenings.js
 * Usage: node scripts/apply-hardenings.js
 * - Patches engine/renderer-pixi.js traversal to support any iterable children.
 */
import { promises as fs } from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const file = path.join(ROOT, 'engine', 'renderer-pixi.js');

async function run() {
  let src = await fs.readFile(file, 'utf8');

  // Patch variant 1: replace plain for-of over node.children
  let next = src.replace(
    /for\s*\(\s*const\s+ch\s+of\s+node\.children\s*\)\s*create\(ch\);/g,
    "const __kids = (node && node.children) ? (Array.isArray(node.children) ? node.children : Array.from(node.children)) : [];\n      for (const ch of __kids) create(ch);"
  );

  // Patch variant 2: if earlier 'Array.isArray(node.children)?' version exists
  if (next === src) {
    next = src.replace(
      /const\s+kids\s*=\s*Array\.isArray\(node\.children\)\s*\?\s*node\.children\s*:\s*\[\s*\];\s*\n\s*for\s*\(\s*const\s+ch\s+of\s+kids\s*\)\s*create\(ch\);/g,
      "const kids = (node && node.children) ? (Array.isArray(node.children) ? node.children : Array.from(node.children)) : [];\n      for (const ch of kids) create(ch);"
    );
  }

  if (next === src) {
    console.log('No known traversal pattern found; file left unchanged.');
  } else {
    await fs.writeFile(file, next, 'utf8');
    console.log('Patched renderer-pixi.js traversal successfully.');
  }
}

run().catch(err => { console.error(err); process.exit(1); });
