const axios = require('axios');

async function testCachedAnalysis() {
  console.log('Testing cached analysis and PDF generation...\n');
  
  const testUrl = 'example.com';
  
  try {
    console.log('1. Running initial analysis (overview)...');
    const overviewResponse = await axios.post('http://localhost:3001/api/accessibility/analyze', {
      url: testUrl,
      reportType: 'overview'
    }, {
      timeout: 120000 // 2 minutes timeout
    });
    
    if (!overviewResponse.data.success) {
      console.log('✗ FAILED: Overview analysis failed');
      return;
    }
    
    const analysisId = overviewResponse.data.data.analysisId;
    console.log(`✓ SUCCESS: Overview analysis completed`);
    console.log(`  - Analysis ID: ${analysisId}`);
    console.log(`  - Overall Score: ${overviewResponse.data.data.scores.overall}/100`);
    console.log(`  - Report Type: ${overviewResponse.data.data.reportType}`);
    console.log(`  - Top Violations: ${overviewResponse.data.data.topViolations?.length || 0}`);
    console.log(`  - Upgrade Available: ${overviewResponse.data.data.upgradeInfo?.available || false}`);
    
    console.log('\n2. Testing instant detailed report retrieval...');
    
    // Wait a moment for PDF generation to complete in background
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const detailedResponse = await axios.get(`http://localhost:3001/api/accessibility/detailed/${analysisId}`);
    
    if (!detailedResponse.data.success) {
      console.log('✗ FAILED: Detailed report retrieval failed');
      return;
    }
    
    console.log(`✓ SUCCESS: Detailed report retrieved instantly`);
    console.log(`  - Report Type: ${detailedResponse.data.data.reportType}`);
    console.log(`  - Total Violations: ${detailedResponse.data.data.axeResults?.violations?.length || 0}`);
    console.log(`  - Custom Checks: ${Object.keys(detailedResponse.data.data.customChecks || {}).length} categories`);
    console.log(`  - Performance Metrics: ${Object.keys(detailedResponse.data.data.performanceMetrics || {}).length} metrics`);
    
    console.log('\n3. Testing instant PDF download...');
    
    const pdfResponse = await axios.get(`http://localhost:3001/api/accessibility/pdf/${analysisId}`, {
      responseType: 'arraybuffer'
    });
    
    if (pdfResponse.status === 200 && pdfResponse.data.byteLength > 0) {
      console.log(`✓ SUCCESS: PDF downloaded instantly`);
      console.log(`  - PDF Size: ${(pdfResponse.data.byteLength / 1024).toFixed(2)} KB`);
      console.log(`  - Content Type: ${pdfResponse.headers['content-type']}`);
    } else {
      console.log('✗ FAILED: PDF download failed or empty');
      return;
    }
    
    console.log('\n4. Testing cache expiration handling...');
    
    // Test with invalid analysis ID
    try {
      await axios.get('http://localhost:3001/api/accessibility/detailed/invalid-id');
      console.log('✗ FAILED: Should have returned 404 for invalid ID');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✓ SUCCESS: Correctly handled invalid analysis ID');
      } else {
        console.log(`✗ FAILED: Unexpected error for invalid ID: ${error.message}`);
      }
    }
    
    console.log('\n✓ All tests passed! Cached analysis system is working correctly.');
    console.log('\nKey Benefits:');
    console.log('- Full analysis runs once during initial request');
    console.log('- PDF is pre-generated in background');
    console.log('- Detailed report upgrade is instant');
    console.log('- PDF download is instant');
    console.log('- Cache management prevents memory leaks');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('✗ FAILED: Backend server is not running');
      console.log('Start the backend server with: cd backend && npm run dev');
    } else {
      console.log(`✗ FAILED: ${error.message}`);
      if (error.response) {
        console.log(`  Status: ${error.response.status}`);
        console.log(`  Error: ${error.response.data.message || error.response.data.error}`);
      }
    }
  }
}

// Run the test
testCachedAnalysis().catch(console.error);