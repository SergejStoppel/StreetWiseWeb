const puppeteer = require('puppeteer');
const StructureAnalyzer = require('../services/analysis/StructureAnalyzer');

describe.skip('StructureAnalyzer', () => {
  let browser;
  let page;
  let analyzer;

  beforeAll(async () => {
    browser = await puppeteer.launch({ 
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    analyzer = new StructureAnalyzer();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    if (browser) {
      page = await browser.newPage();
    }
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('Language Validation', () => {
    test('should detect missing lang attribute', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head><title>Test Page</title></head>
          <body><h1>Test Content</h1></body>
        </html>
      `);

      const results = await analyzer.analyze(page, 'test-id');
      
      expect(results.languageValidation.hasLangAttribute).toBe(false);
      expect(results.languageValidation.issues).toHaveLength(1);
      expect(results.languageValidation.issues[0].type).toBe('missing_lang');
      expect(results.languageValidation.issues[0].severity).toBe('critical');
      expect(results.languageValidation.score).toBeLessThan(100);
    });

    test('should detect valid lang attribute', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="en">
          <head><title>Test Page</title></head>
          <body><h1>Test Content</h1></body>
        </html>
      `);

      const results = await analyzer.analyze(page, 'test-id');
      
      expect(results.languageValidation.hasLangAttribute).toBe(true);
      expect(results.languageValidation.langValue).toBe('en');
      expect(results.languageValidation.isValidLangCode).toBe(true);
      expect(results.languageValidation.issues).toHaveLength(0);
      expect(results.languageValidation.score).toBe(100);
    });

    test('should detect invalid lang attribute', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="invalid-code">
          <head><title>Test Page</title></head>
          <body><h1>Test Content</h1></body>
        </html>
      `);

      const results = await analyzer.analyze(page, 'test-id');
      
      expect(results.languageValidation.hasLangAttribute).toBe(true);
      expect(results.languageValidation.langValue).toBe('invalid-code');
      expect(results.languageValidation.isValidLangCode).toBe(false);
      expect(results.languageValidation.issues).toHaveLength(1);
      expect(results.languageValidation.issues[0].type).toBe('invalid_lang');
      expect(results.languageValidation.issues[0].severity).toBe('serious');
    });

    test('should detect lang attribute with region code', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="en-US">
          <head><title>Test Page</title></head>
          <body><h1>Test Content</h1></body>
        </html>
      `);

      const results = await analyzer.analyze(page, 'test-id');
      
      expect(results.languageValidation.hasLangAttribute).toBe(true);
      expect(results.languageValidation.langValue).toBe('en-US');
      expect(results.languageValidation.isValidLangCode).toBe(true);
      expect(results.languageValidation.issues).toHaveLength(0);
      expect(results.languageValidation.score).toBe(100);
    });

    test('should detect mismatched lang and xml:lang attributes', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="en" xml:lang="fr">
          <head><title>Test Page</title></head>
          <body><h1>Test Content</h1></body>
        </html>
      `);

      const results = await analyzer.analyze(page, 'test-id');
      
      expect(results.languageValidation.hasLangAttribute).toBe(true);
      expect(results.languageValidation.hasXmlLang).toBe(true);
      expect(results.languageValidation.langMatchesXmlLang).toBe(false);
      expect(results.languageValidation.issues).toHaveLength(1);
      expect(results.languageValidation.issues[0].type).toBe('mismatched_lang');
    });

    test('should detect invalid lang attributes in content', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="en">
          <head><title>Test Page</title></head>
          <body>
            <h1>Test Content</h1>
            <p lang="xyz">Some text in invalid language</p>
          </body>
        </html>
      `);

      const results = await analyzer.analyze(page, 'test-id');
      
      expect(results.languageValidation.contentLanguageChanges).toHaveLength(1);
      expect(results.languageValidation.contentLanguageChanges[0].lang).toBe('xyz');
      expect(results.languageValidation.contentLanguageChanges[0].isValid).toBe(false);
      expect(results.languageValidation.issues).toHaveLength(1);
      expect(results.languageValidation.issues[0].type).toBe('invalid_content_lang');
    });
  });

  describe('Recommendations', () => {
    test('should generate recommendations for missing lang attribute', async () => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head><title>Test Page</title></head>
          <body><h1>Test Content</h1></body>
        </html>
      `);

      const results = await analyzer.analyze(page, 'test-id');
      const recommendations = analyzer.generateRecommendations(results);
      
      const langRecommendations = recommendations.filter(r => r.wcagCriterion === '3.1.1');
      expect(langRecommendations).toHaveLength(1);
      expect(langRecommendations[0].priority).toBe('high');
      expect(langRecommendations[0].suggestion).toContain('Add lang="en"');
    });
  });

  describe('Scoring', () => {
    test('should reduce score for missing lang attribute', async () => {
      const htmlWithLang = `
        <!DOCTYPE html>
        <html lang="en">
          <head><title>Test Page</title></head>
          <body><main><h1>Test Content</h1></main></body>
        </html>
      `;

      const htmlWithoutLang = `
        <!DOCTYPE html>
        <html>
          <head><title>Test Page</title></head>
          <body><main><h1>Test Content</h1></main></body>
        </html>
      `;

      await page.setContent(htmlWithLang);
      const resultsWithLang = await analyzer.analyze(page, 'test-id-1');
      const scoreWithLang = analyzer.calculateScore(resultsWithLang);

      await page.setContent(htmlWithoutLang);
      const resultsWithoutLang = await analyzer.analyze(page, 'test-id-2');
      const scoreWithoutLang = analyzer.calculateScore(resultsWithoutLang);

      expect(scoreWithLang).toBeGreaterThan(scoreWithoutLang);
    });
  });
});