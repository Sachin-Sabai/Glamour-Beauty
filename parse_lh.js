const fs = require('fs');
const data = JSON.parse(fs.readFileSync('c:/Users/Lenovo/Desktop/GlamourBeauty/glamour-beauty-theme/lh-report.json', 'utf8'));

console.log("=== Performance Score ===");
console.log(data.categories.performance.score * 100);

console.log("\n=== Opportunities ===");
Object.values(data.audits)
  .filter(a => a.details && a.details.type === 'opportunity' && a.score !== 1 && a.score !== null)
  .sort((a, b) => b.details.overallSavingsMs - a.details.overallSavingsMs)
  .forEach(o => {
    console.log(`${o.title}: ${o.details.overallSavingsMs}ms`);
    if (o.details.items) {
      o.details.items.slice(0, 3).forEach(i => console.log(`  - ${i.url}`));
    }
  });

console.log("\n=== Diagnostics ===");
['lcp-lazy-loaded', 'render-blocking-resources', 'modern-image-formats', 'uses-optimized-images', 'uses-responsive-images', 'total-byte-weight', 'unminified-javascript', 'unminified-css', 'unused-javascript', 'unused-css-rules'].forEach(id => {
  const audit = data.audits[id];
  if (audit && audit.score !== 1) {
    console.log(`${audit.title} (${audit.displayValue || ''})`);
  }
});
