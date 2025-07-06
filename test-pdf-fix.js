const axios = require('axios');

async function testPDFGeneration() {
  console.log('Testing PDF generation fix...\n');
  
  const testUrl = 'example.com';
  
  try {
    console.log('1. Running analysis to generate PDF...');
    const analysisResponse = await axios.post('http://localhost:3001/api/accessibility/analyze', {
      url: testUrl,
      reportType: 'overview'
    }, {
      timeout: 120000
    });
    
    if (!analysisResponse.data.success) {
      console.log('✗ FAILED: Analysis failed');
      return;
    }
    
    const analysisId = analysisResponse.data.data.analysisId;
    console.log(`✓ SUCCESS: Analysis completed - ID: ${analysisId}`);
    
    // Wait a moment for background PDF generation
    console.log('2. Waiting for background PDF generation...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('3. Testing PDF download...');
    const pdfResponse = await axios.get(`http://localhost:3001/api/accessibility/pdf/${analysisId}`, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    if (pdfResponse.status === 200 && pdfResponse.data.byteLength > 0) {
      console.log(`✓ SUCCESS: PDF downloaded successfully`);
      console.log(`  - PDF Size: ${(pdfResponse.data.byteLength / 1024).toFixed(2)} KB`);
      console.log(`  - Content Type: ${pdfResponse.headers['content-type']}`);
      
      // Save PDF to file for verification
      const fs = require('fs');
      fs.writeFileSync(`test-report-${analysisId}.pdf`, Buffer.from(pdfResponse.data));
      console.log(`  - PDF saved as: test-report-${analysisId}.pdf`);
      
    } else {
      console.log('✗ FAILED: PDF download failed or empty');
      return;
    }
    
    console.log('\n✓ PDF generation fix successful!');
    console.log('The switchToPage error has been resolved.');
    
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
testPDFGeneration().catch(console.error);