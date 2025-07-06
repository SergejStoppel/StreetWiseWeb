const axios = require('axios');

async function testUrlHandling() {
  console.log('Testing URL handling with and without protocols...\n');
  
  const testUrls = [
    'example.com',
    'https://example.com',
    'http://example.com',
    'www.example.com',
    'github.com',
    'stackoverflow.com'
  ];
  
  for (const testUrl of testUrls) {
    try {
      console.log(`Testing URL: "${testUrl}"`);
      
      const response = await axios.post('http://localhost:3001/api/accessibility/analyze', {
        url: testUrl,
        reportType: 'overview'
      }, {
        timeout: 60000 // 1 minute timeout for quick test
      });
      
      if (response.data.success) {
        const report = response.data.data;
        console.log(`✓ SUCCESS: Analysis completed for "${testUrl}"`);
        console.log(`  - Processed URL: ${report.url}`);
        console.log(`  - Overall Score: ${report.scores.overall}/100`);
        console.log(`  - Total Violations: ${report.summary.totalViolations}`);
      } else {
        console.log(`✗ FAILED: Analysis failed for "${testUrl}"`);
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('✗ FAILED: Backend server is not running');
        console.log('Start the backend server with: cd backend && npm run dev');
        break;
      } else if (error.response) {
        console.log(`✗ FAILED: ${testUrl} - ${error.response.data.message || error.response.data.error}`);
      } else {
        console.log(`✗ FAILED: ${testUrl} - ${error.message}`);
      }
    }
    
    console.log(''); // Add spacing between tests
  }
  
  console.log('URL handling test completed!');
}

// Run the test
testUrlHandling().catch(console.error);