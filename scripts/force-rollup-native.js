// scripts/force-rollup-native.js
// Patch pour éviter le bug de Cloudflare avec rollup et les bindings natifs

import fs from 'fs';
import path from 'path';

const nativePath = path.join('node_modules', 'rollup', 'dist', 'native.js');

if (fs.existsSync(nativePath)) {
  let content = fs.readFileSync(nativePath, 'utf-8');

  // Patch le require qui échoue sur Cloudflare
  content = content.replace(
    /throw new Error\([^)]*\);/,
    `console.warn("⚠️ Patched rollup native require for Cloudflare"); return {};`
  );

  fs.writeFileSync(nativePath, content, 'utf-8');
  console.log('✅ rollup native.js patched for Cloudflare');
} else {
  console.warn('⚠️ rollup native.js not found — no patch applied');
}
