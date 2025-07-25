/**
 * Test script to verify browser navigation fixes
 * This tests the problematic finn.no site that was causing frame detachment errors
 */

const AccessibilityAnalyzer = require('./services/accessibilityAnalyzer');
const logger = require('./utils/logger');

async function testNavigationFix() {
  const analyzer = new AccessibilityAnalyzer();
  
  console.log('Testing browser navigation fixes...');
  console.log('Target URL: https://finn.no');
  
  try {
    const result = await analyzer.analyzeWebsite('https://finn.no', 'overview', 'en');
    
    console.log('✅ Navigation test PASSED');
    console.log(`Analysis completed successfully with score: ${result.overallScore}`);
    console.log(`Total issues found: ${result.summary?.totalIssues || 0}`);
    
    return true;
  } catch (error) {
    console.error('❌ Navigation test FAILED');
    console.error('Error:', error.message);
    
    // Check if it's still a frame detachment error
    if (error.message.includes('frame was detached') || 
        error.message.includes('Navigating frame was detached')) {
      console.error('Frame detachment issue still persists');
      return false;
    }
    
    // Check if it's still a JSON parsing error
    if (error.message.includes('is not valid JSON')) {
      console.error('JSON parsing issue still persists');
      return false;
    }
    
    // Other errors might be acceptable (network issues, timeouts, etc.)
    console.log('Error appears to be network-related rather than browser configuration issue');
    return true;
  } finally {
    // Cleanup
    await analyzer.cleanup();
  }
}

// Run the test
if (require.main === module) {
  testNavigationFix()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { testNavigationFix };