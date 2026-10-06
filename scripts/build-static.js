// Builds the static GitHub Pages site: copies public/ to _site/ and writes a fallback
// catalog.json (same shape as GET /api/catalog), used only if the API can't be reached.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicCatalog } from '../src/core.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '_site');
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'public'), out, { recursive: true });

const cat = JSON.parse(fs.readFileSync(path.join(root, 'data', 'catalog.json'), 'utf8'));
fs.writeFileSync(path.join(out, 'catalog.json'), JSON.stringify(publicCatalog(cat)));
fs.writeFileSync(path.join(out, 'CNAME'), 'cheese-picks.websportal.dev\n');
console.log('Static site built in _site/');
