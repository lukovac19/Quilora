import fs from 'fs';
const path = process.argv[2];
const out = process.argv[3];
const xml = fs.readFileSync(path, 'utf8');
const parts = [];
for (const m of xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)) {
  parts.push(
    m[1]
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>'),
  );
}
let t = parts.join('');
const bad = 'Would you like me to help you draft';
const i = t.indexOf(bad);
if (i >= 0) t = t.slice(0, i).trim();
fs.writeFileSync(out, t);
console.log('wrote', out, 'chars', t.length);
