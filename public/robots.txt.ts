export async function get() {
    return {
      body: `User-agent: *
  Allow: /
  
  Sitemap: https://salairenet.ca/sitemap.xml
  `,
      headers: {
        'Content-Type': 'text/plain',
      },
    };
  }
  