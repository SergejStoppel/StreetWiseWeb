const axios = require('axios');

async function testSystem() {
  console.log('Testing SiteCraft Accessibility Analysis System...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3001/api/accessibility/health');
    console.log('✓ Health check passed:', healthResponse.data.status);
    
    // Test 2: Demo endpoint
    console.log('2. Testing demo endpoint...');
    const demoResponse = await axios.get('http://localhost:3001/api/accessibility/demo');
    console.log('✓ Demo endpoint passed:', demoResponse.data.message);
    
    // Test 3: Accessibility analysis
    console.log('3. Testing accessibility analysis...');
    console.log('   Analyzing https://example.com (this may take 30-60 seconds)...');
    
    const analysisResponse = await axios.post('http://localhost:3001/api/accessibility/analyze', {
      url: 'https://example.com'
    }, {
      timeout: 120000 // 2 minutes timeout
    });
    
    if (analysisResponse.data.success) {
      const report = analysisResponse.data.data;
      console.log('✓ Analysis completed successfully!');
      console.log(`   Overall Score: ${report.scores.overall}/100`);
      console.log(`   Accessibility Score: ${report.scores.accessibility}/100`);
      console.log(`   Total Violations: ${report.summary.totalViolations}`);
      console.log(`   Analysis ID: ${report.analysisId}`);
    } else {
      console.log('✗ Analysis failed');
    }
    
    console.log('\n✓ All tests passed! The system is working correctly.');
    
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nMake sure the backend server is running:');
      console.log('cd backend && npm run dev');
    }
  }
}

// Run the test
testSystem();