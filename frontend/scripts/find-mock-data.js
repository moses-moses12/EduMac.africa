const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '../src/app/dashboard');

function getPageFiles(d) {
  let results = [];
  const list = fs.readdirSync(d);
  list.forEach(file => {
    const fPath = path.join(d, file);
    const stat = fs.statSync(fPath);
    if (stat && stat.isDirectory()) results = results.concat(getPageFiles(fPath));
    else if (file === 'page.tsx') results.push(fPath);
  });
  return results;
}

const files = getPageFiles(dir);

console.log('--- SCANNING ALL DASHBOARD FILES FOR MOCK DATA & STATIC ARRAYS ---');

files.forEach(f => {
  const rel = path.relative(path.resolve(__dirname, '..'), f);
  const content = fs.readFileSync(f, 'utf8');
  
  // Find tabs
  const tabMatches = [...content.matchAll(/activeTab === ['"]([^'"]+)['"]/g)].map(m => m[1]);
  const uniqueTabs = [...new Set(tabMatches)];
  
  // Search for mock markers
  const mockMatches = [];
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (/mock|demo|dummy|sample|fake|placeholder|fallback/i.test(l)) {
      mockMatches.push({ line: idx + 1, text: l.trim() });
    }
  });

  console.log(`\n[${rel}] (${lines.length} lines)`);
  console.log(`  Tabs: ${uniqueTabs.join(', ')}`);
  console.log(`  Mock keyword matches: ${mockMatches.length}`);
  mockMatches.slice(0, 10).forEach(m => console.log(`    L${m.line}: ${m.text}`));
});
