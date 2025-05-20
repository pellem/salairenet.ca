import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.join(__dirname, 'src/pages/salaires');

function fixAstroFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // ✅ Regex robuste : gère BOM + espaces + retour chariot
  const frontmatterMatch = content.match(/^(\uFEFF)?\s*---[\s\S]*?---/);

  if (!frontmatterMatch) {
    console.warn(`❌ Pas de frontmatter détecté dans : ${filePath}`);
    return;
  }

  const frontmatter = frontmatterMatch[0];
  const rest = content.slice(frontmatter.length).trimStart();

  // Supprime tous les imports Base existants
  const cleanedRest = rest
    .replace(/^import\s+Base\s+from\s+['"].*?['"];?\s*/gm, '')
    .replace(/^(\r\n|\n|\r)+/, '');

  const newImport = "import Base from '../../layouts/Base.astro';";

  const finalContent = `${frontmatter}\n\n${newImport}\n\n${cleanedRest}`;
  fs.writeFileSync(filePath, finalContent, 'utf8');
  console.log(`✅ Corrigé : ${filePath}`);
}

function walkAndFix(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkAndFix(fullPath);
    } else if (file.endsWith('.astro')) {
      fixAstroFile(fullPath);
    }
  }
}

walkAndFix(targetDir);
