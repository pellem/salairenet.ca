import fs from 'fs';
import path from 'path';

export async function get() {
  const baseUrl = 'https://salairenet.ca';
  const salairesPath = path.resolve('./src/pages/salaires');
  const files = fs.readdirSync(salairesPath);

  const urls = files
    .filter(file => file.endsWith('.astro'))
    .map(file => {
      const slug = file.replace('.astro', '');
      return `
<url>
  <loc>${baseUrl}/salaires/${slug}</loc>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>`;
    })
    .join('\n');

  return {
    body: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
  <loc>${baseUrl}/</loc>
  <changefreq>weekly</changefreq>
  <priority>1.0</priority>
</url>
${urls}
</urlset>`,
    headers: {
      'Content-Type': 'application/xml',
    },
  };
}
