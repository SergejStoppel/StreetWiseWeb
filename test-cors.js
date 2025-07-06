const axios = require('axios');

async function testCORS() {
  console.log('Testing CORS configuration...\n');
  
  try {
    // Test health endpoint
    console.log('Testing health endpoint...');
    const response = await axios.get('http://localhost:3001/api/accessibility/health', {
      headers: {
        'Origin': 'http://localhost:3002'
      }
    });
    
    console.log('✓ Health endpoint working');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('✗ CORS test failed:', error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
}

testCORS();