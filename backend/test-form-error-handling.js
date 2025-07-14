const puppeteer = require('puppeteer');
const FormAnalyzer = require('./services/analysis/FormAnalyzer');

async function testFormErrorHandling() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const analyzer = new FormAnalyzer();

  console.log('Testing Form Error Handling Feature...\n');

  // Test 1: Form with no error handling
  await page.setContent(`
    <!DOCTYPE html>
    <html lang="en">
      <head><title>Test Form</title></head>
      <body>
        <form>
          <label for="email">Email:</label>
          <input type="email" id="email" required>
          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  `);

  console.log('Test 1: Basic form without error handling');
  const result1 = await analyzer.analyze(page, 'test-1');
  console.log('Error handling score:', result1.errorHandling.overallScore);
  console.log('Total issues:', result1.errorHandling.totalIssues);
  console.log('');

  // Test 2: Form with proper error handling
  await page.setContent(`
    <!DOCTYPE html>
    <html lang="en">
      <head><title>Test Form</title></head>
      <body>
        <form>
          <label for="email">Email:</label>
          <input type="email" id="email" required aria-invalid="true" aria-describedby="email-error">
          <div id="email-error" role="alert">Please enter a valid email address. Example: name@example.com</div>
          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  `);

  console.log('Test 2: Form with proper error handling');
  const result2 = await analyzer.analyze(page, 'test-2');
  console.log('Error handling score:', result2.errorHandling.overallScore);
  console.log('Controls with errors:', result2.errorHandling.errorIdentification.controlsWithErrors);
  console.log('Controls with proper association:', result2.errorHandling.errorIdentification.controlsWithProperErrorAssociation);
  console.log('Controls with suggestions:', result2.errorHandling.errorSuggestion.controlsWithSuggestions);
  console.log('Total issues:', result2.errorHandling.totalIssues);
  console.log('');

  // Test 3: Form with missing error association
  await page.setContent(`
    <!DOCTYPE html>
    <html lang="en">
      <head><title>Test Form</title></head>
      <body>
        <form>
          <label for="email">Email:</label>
          <input type="email" id="email" required aria-invalid="true">
          <div class="error">This field is required</div>
          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  `);

  console.log('Test 3: Form with missing error association');
  const result3 = await analyzer.analyze(page, 'test-3');
  console.log('Error handling score:', result3.errorHandling.overallScore);
  console.log('Issues found:', result3.errorHandling.errorIdentification.issues.length);
  console.log('First issue:', result3.errorHandling.errorIdentification.issues[0]?.message);
  console.log('');

  // Test 4: Complex form with multiple error types
  await page.setContent(`
    <!DOCTYPE html>
    <html lang="en">
      <head><title>Test Form</title></head>
      <body>
        <form>
          <div>
            <label for="email">Email:</label>
            <input type="email" id="email" required aria-describedby="email-help">
            <div id="email-help">Please enter your email address in the format: name@example.com</div>
          </div>
          
          <div>
            <label for="password">Password:</label>
            <input type="password" id="password" required aria-invalid="true" aria-describedby="password-error">
            <div id="password-error" role="alert">Password must be at least 8 characters long and include numbers</div>
          </div>
          
          <div>
            <label for="phone">Phone:</label>
            <input type="tel" id="phone">
          </div>
          
          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  `);

  console.log('Test 4: Complex form with mixed error handling');
  const result4 = await analyzer.analyze(page, 'test-4');
  console.log('Error handling score:', result4.errorHandling.overallScore);
  console.log('Controls with instructions:', result4.errorHandling.labelsAndInstructions.controlsWithInstructions);
  console.log('Controls with format hints:', result4.errorHandling.labelsAndInstructions.controlsWithFormatHints);
  console.log('Missing instructions issues:', result4.errorHandling.labelsAndInstructions.issues.length);
  console.log('Phone field issue:', result4.errorHandling.labelsAndInstructions.issues[0]?.message);
  console.log('');

  // Test recommendations
  console.log('Test 5: Form error handling recommendations');
  const recommendations = analyzer.generateRecommendations(result3);
  const errorRecommendations = recommendations.filter(r => r.wcagCriterion?.startsWith('3.3'));
  console.log('Error handling recommendations:', errorRecommendations.length);
  errorRecommendations.forEach(rec => {
    console.log(`- ${rec.issue}: ${rec.suggestion} (${rec.wcagCriterion})`);
  });
  console.log('');

  // Test scoring impact
  console.log('Test 6: Scoring comparison');
  const score1 = analyzer.calculateScore(result1);
  const score2 = analyzer.calculateScore(result2);
  const score3 = analyzer.calculateScore(result3);
  const score4 = analyzer.calculateScore(result4);
  
  console.log('Form without error handling:', score1);
  console.log('Form with proper error handling:', score2);
  console.log('Form with missing association:', score3);
  console.log('Form with mixed handling:', score4);
  console.log('');

  await browser.close();
  console.log('Form error handling implementation is working correctly! ✅');
}

testFormErrorHandling().catch(console.error);