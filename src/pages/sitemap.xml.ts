// src/pages/sitemap.xml.js
export async function get() {
    const salaires = [
      31696, 32884, 33488, 35000, 40000, 42884, 45000,
      50000, 52000, 55000, 60000, 65000, 70000,
      72800, 75000, 80000, 85000, 90000, 95000, 100000
    ];
  
    const urls = salaires.map((salaire) => `
      <url>
        <loc>https://salairenet.ca/${salaire}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
      </url>
    `).join('\n');
  
    return {
      body: `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urls}
      </urlset>`,
      headers: {
        'Content-Type': 'application/xml',
      },
    };
  }
  