import fs from 'fs';
import path from 'path';

const file = path.join('node_modules', 'rollup', 'dist', 'native.js');

if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('⚠️ Patched rollup')) {
    content = content.replace(
      /throw new Error\([^)]*\);/,
      `console.warn("⚠️ Patched rollup native require for Cloudflare"); return {};`
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log('✅ rollup native.js patched for Cloudflare');
  }
} else {
  console.warn('⚠️ rollup native.js not found — no patch applied');
}
