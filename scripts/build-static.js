// Builds the static GitHub Pages site: copies public/ to _site/ and writes
// the public catalog (same shape as GET /api/catalog) to _site/catalog.json.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, '_site');
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'public'), out, { recursive: true });

const cat = JSON.parse(fs.readFileSync(path.join(root, 'data', 'catalog.json'), 'utf8'));
fs.writeFileSync(path.join(out, 'catalog.json'), JSON.stringify({
  settings: { businessName: cat.settings.businessName, currencyCode: cat.settings.currencyCode || 'COP', deliveryFee: cat.settings.deliveryFee },
  categories: cat.categories,
  sizes: cat.sizes.filter(s => s.active),
  products: cat.products.filter(p => p.active),
}));
fs.writeFileSync(path.join(out, 'CNAME'), 'cheese-picks.websportal.dev\n');
console.log('Static site built in _site/');
