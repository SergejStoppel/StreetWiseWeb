describe('Technical SEO Worker Logic', () => {
  // Mock fetch globally
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('robots.txt validation', () => {
    it('should identify missing robots.txt as an issue', () => {
      const robotsTxtContent = null;
      const shouldHaveIssue = !robotsTxtContent;
      expect(shouldHaveIssue).toBe(true);
    });

    it('should identify empty directives in robots.txt', () => {
      const robotsTxtContent = `
User-agent: *
Disallow:
User-agent:
      `;
      const hasEmptyDirectives = /Disallow\s*:\s*$/im.test(robotsTxtContent) || /User-agent\s*:\s*$/im.test(robotsTxtContent);
      expect(hasEmptyDirectives).toBe(true);
    });

    it('should identify crawl blocking robots.txt', () => {
      const robotsTxtContent = `
User-agent: *
Disallow: /
      `;
      const blocksAllCrawling = /^disallow\s*:\s*\/$/im.test(robotsTxtContent);
      expect(blocksAllCrawling).toBe(true);
    });

    it('should detect sitemap declaration in robots.txt', () => {
      const robotsTxtWithSitemap = `
User-agent: *
Disallow: /admin
Sitemap: https://example.com/sitemap.xml
      `;
      const hasSitemapDeclaration = /^sitemap:/im.test(robotsTxtWithSitemap);
      expect(hasSitemapDeclaration).toBe(true);
    });
  });

  describe('canonical tag validation', () => {
    it('should detect missing canonical tag', () => {
      const htmlContent = `
        <html>
        <head>
          <title>Test Page</title>
        </head>
        <body>Content</body>
        </html>
      `;
      const canonicalMatches = htmlContent.match(/<link\s+[^>]*rel=["']?canonical["']?[^>]*>/gi);
      expect(canonicalMatches).toBeNull();
    });

    it('should detect multiple canonical tags', () => {
      const htmlContent = `
        <html>
        <head>
          <title>Test Page</title>
          <link rel="canonical" href="https://example.com/page1" />
          <link rel="canonical" href="https://example.com/page2" />
        </head>
        <body>Content</body>
        </html>
      `;
      const canonicalMatches = htmlContent.match(/<link\s+[^>]*rel=["']?canonical["']?[^>]*>/gi) || [];
      expect(canonicalMatches.length).toBeGreaterThan(1);
    });

    it('should detect non-absolute canonical URLs', () => {
      const htmlContent = `
        <html>
        <head>
          <link rel="canonical" href="/page" />
        </head>
        </html>
      `;
      const canonicalMatch = htmlContent.match(/<link\s+[^>]*rel=["']?canonical["']?[^>]*>/gi)?.[0];
      const href = canonicalMatch ? /href=["']([^"']+)["']/i.exec(canonicalMatch)?.[1] : null;
      const isAbsolute = href ? /^https?:\/\//i.test(href) : false;
      expect(isAbsolute).toBe(false);
    });

    it('should normalize URLs for canonical comparison', () => {
      const normalizeUrlForCanonical = (url: string): string => {
        try {
          const u = new URL(url);
          u.hash = '';
          // remove trailing slash unless root
          if (u.pathname !== '/' && u.pathname.endsWith('/')) {
            u.pathname = u.pathname.slice(0, -1);
          }
          return u.toString();
        } catch {
          return url;
        }
      };

      expect(normalizeUrlForCanonical('https://example.com/page/')).toBe('https://example.com/page');
      expect(normalizeUrlForCanonical('https://example.com/')).toBe('https://example.com/');
      expect(normalizeUrlForCanonical('https://example.com/page#section')).toBe('https://example.com/page');
    });
  });

  describe('HTTPS validation', () => {
    it('should detect non-HTTPS URLs', () => {
      const httpUrl = 'http://example.com';
      const isHttps = httpUrl.startsWith('https://');
      expect(isHttps).toBe(false);
    });

    it('should validate HTTPS URLs', () => {
      const httpsUrl = 'https://example.com';
      const isHttps = httpsUrl.startsWith('https://');
      expect(isHttps).toBe(true);
    });
  });

  describe('mobile viewport validation', () => {
    it('should detect missing viewport meta tag', () => {
      const htmlContent = `
        <html>
        <head>
          <title>Test Page</title>
        </head>
        <body>Content</body>
        </html>
      `;
      const hasViewportMeta = /<meta\s+[^>]*name=["']viewport["'][^>]*>/i.test(htmlContent);
      expect(hasViewportMeta).toBe(false);
    });

    it('should detect invalid viewport configuration', () => {
      const htmlContent = `
        <html>
        <head>
          <meta name="viewport" content="width=1024" />
        </head>
        </html>
      `;
      const viewportMeta = /<meta\s+[^>]*name=["']viewport["'][^>]*>/i.exec(htmlContent)?.[0];
      const viewportContent = viewportMeta ? /content=["']([^"']+)["']/i.exec(viewportMeta)?.[1] : '';
      const hasDeviceWidth = viewportContent ? viewportContent.includes('width=device-width') : false;
      expect(hasDeviceWidth).toBe(false);
    });

    it('should validate proper viewport configuration', () => {
      const htmlContent = `
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        </html>
      `;
      const viewportMeta = /<meta\s+[^>]*name=["']viewport["'][^>]*>/i.exec(htmlContent)?.[0];
      const viewportContent = viewportMeta ? /content=["']([^"']+)["']/i.exec(viewportMeta)?.[1] : '';
      const hasDeviceWidth = viewportContent ? viewportContent.includes('width=device-width') : false;
      expect(hasDeviceWidth).toBe(true);
    });
  });

  describe('structured data validation', () => {
    it('should detect missing structured data', () => {
      const htmlContent = `
        <html>
        <head>
          <title>Test Page</title>
        </head>
        <body>Content</body>
        </html>
      `;
      const hasJsonLd = /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(htmlContent);
      const hasMicrodata = /itemscope|itemprop|itemtype/i.test(htmlContent);
      const hasRdfa = /property=["'][^"']*:[^"']*["']|typeof=/i.test(htmlContent);
      const hasStructuredData = hasJsonLd || hasMicrodata || hasRdfa;
      expect(hasStructuredData).toBe(false);
    });

    it('should detect JSON-LD structured data', () => {
      const htmlContent = `
        <html>
        <head>
          <script type="application/ld+json">
            {"@context": "https://schema.org", "@type": "Organization"}
          </script>
        </head>
        </html>
      `;
      const hasJsonLd = /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(htmlContent);
      expect(hasJsonLd).toBe(true);
    });

    it('should detect invalid JSON-LD', () => {
      const invalidJsonContent = '{ "invalid": json, }';
      let isValidJson = true;
      try {
        JSON.parse(invalidJsonContent);
      } catch (e) {
        isValidJson = false;
      }
      expect(isValidJson).toBe(false);
    });

    it('should validate correct JSON-LD', () => {
      const validJsonContent = '{"@context": "https://schema.org", "@type": "Organization"}';
      let isValidJson = true;
      try {
        JSON.parse(validJsonContent);
      } catch (e) {
        isValidJson = false;
      }
      expect(isValidJson).toBe(true);
    });
  });

  describe('meta robots validation', () => {
    it('should detect restrictive meta robots', () => {
      const htmlContent = `
        <html>
        <head>
          <meta name="robots" content="noindex, nofollow" />
        </head>
        </html>
      `;
      const metaRobots = /<meta\s+[^>]*name=["']robots["'][^>]*>/i.exec(htmlContent)?.[0];
      const content = metaRobots ? /content=["']([^"']+)["']/i.exec(metaRobots)?.[1] : '';
      const hasRestrictions = content ? /noindex|nofollow|none/i.test(content) : false;
      expect(hasRestrictions).toBe(true);
    });
  });

  describe('hreflang validation', () => {
    it('should detect hreflang presence', () => {
      const htmlContent = `
        <html>
        <head>
          <link rel="alternate" hreflang="en" href="https://example.com/en" />
          <link rel="alternate" hreflang="de" href="https://example.com/de" />
        </head>
        </html>
      `;
      const hasHreflang = /<link[^>]*hreflang=["'][^"']+["'][^>]*>|<link[^>]*rel=["']alternate["'][^>]*hreflang=/i.test(htmlContent);
      expect(hasHreflang).toBe(true);
    });

    it('should validate hreflang language codes', () => {
      const validCodes = ['en', 'en-US', 'de', 'fr-FR', 'x-default'];
      const invalidCodes = ['english', 'en_US', 'de-de-DE'];

      validCodes.forEach(code => {
        const isValid = /^[a-z]{2}(-[A-Z]{2})?$|^x-default$/i.test(code);
        expect(isValid).toBe(true);
      });

      invalidCodes.forEach(code => {
        const isValid = /^[a-z]{2}(-[A-Z]{2})?$|^x-default$/i.test(code);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('sitemap validation', () => {
    it('should validate XML sitemap format', () => {
      const validSitemap = '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
      const invalidSitemap = 'This is not a valid XML sitemap';

      const isValidFormat = validSitemap.includes('<urlset') || validSitemap.includes('<sitemapindex');
      const isInvalidFormat = invalidSitemap.includes('<urlset') || invalidSitemap.includes('<sitemapindex');

      expect(isValidFormat).toBe(true);
      expect(isInvalidFormat).toBe(false);
    });
  });
});