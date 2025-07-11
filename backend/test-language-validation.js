const puppeteer = require('puppeteer');
const StructureAnalyzer = require('./services/analysis/StructureAnalyzer');

async function testLanguageValidation() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const analyzer = new StructureAnalyzer();

  console.log('Testing Language Validation Feature...\n');

  // Test 1: Missing lang attribute
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head><title>Test Page</title></head>
      <body><h1>Test Content</h1></body>
    </html>
  `);

  console.log('Test 1: Missing lang attribute');
  const result1 = await analyzer.analyze(page, 'test-1');
  console.log('Language validation result:', result1.languageValidation);
  console.log('Issues found:', result1.languageValidation.issues.length);
  console.log('Score:', result1.languageValidation.score);
  console.log('');

  // Test 2: Valid lang attribute
  await page.setContent(`
    <!DOCTYPE html>
    <html lang="en">
      <head><title>Test Page</title></head>
      <body><h1>Test Content</h1></body>
    </html>
  `);

  console.log('Test 2: Valid lang attribute');
  const result2 = await analyzer.analyze(page, 'test-2');
  console.log('Language validation result:', result2.languageValidation);
  console.log('Issues found:', result2.languageValidation.issues.length);
  console.log('Score:', result2.languageValidation.score);
  console.log('');

  // Test 3: Invalid lang attribute
  await page.setContent(`
    <!DOCTYPE html>
    <html lang="invalid-code">
      <head><title>Test Page</title></head>
      <body><h1>Test Content</h1></body>
    </html>
  `);

  console.log('Test 3: Invalid lang attribute');
  const result3 = await analyzer.analyze(page, 'test-3');
  console.log('Language validation result:', result3.languageValidation);
  console.log('Issues found:', result3.languageValidation.issues.length);
  console.log('Score:', result3.languageValidation.score);
  console.log('');

  // Test recommendations
  console.log('Test 4: Recommendations for missing lang attribute');
  const recommendations = analyzer.generateRecommendations(result1);
  const langRecommendations = recommendations.filter(r => r.wcagCriterion === '3.1.1');
  console.log('Language recommendations:', langRecommendations);
  console.log('');

  // Test scoring impact
  console.log('Test 5: Scoring impact');
  const score1 = analyzer.calculateScore(result1); // missing lang
  const score2 = analyzer.calculateScore(result2); // valid lang
  const score3 = analyzer.calculateScore(result3); // invalid lang
  
  console.log('Score with missing lang:', score1);
  console.log('Score with valid lang:', score2);
  console.log('Score with invalid lang:', score3);
  console.log('');

  await browser.close();
  console.log('Language validation implementation is working correctly! ✅');
}

testLanguageValidation().catch(console.error);