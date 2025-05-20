const fs = require('fs');
const path = require('path');

const replacements = {
  "Ã©": "é", "Ã¨": "è", "Ãª": "ê", "Ã ": "à", "Ã¢": "â", "Ã´": "ô",
  "Ã»": "û", "Ã¹": "ù", "Ã§": "ç", "Ã‰": "É", "Ã€": "À", "â€“": "–",
  "â€”": "—", "â€¦": "…", "â€œ": "“", "â€": "”", "â€™": "’",
  "â€²": "′", "â€³": "″", "â€¢": "•", "Â": ""
};

function fixBadChars(content) {
  for (const key in replacements) {
    content = content.split(key).join(replacements[key]);
  }
  return content;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const cleaned = fixBadChars(content);
  fs.writeFileSync(filePath, cleaned, 'utf8');
  console.log(`✅ Nettoyé : ${filePath}`);
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.astro')) {
      processFile(fullPath);
    }
  });
}

walk('src/pages/salaires');
