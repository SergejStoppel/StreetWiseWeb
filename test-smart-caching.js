// Test script for smart caching functionality
// Run with: node test-smart-caching.js

const axios = require('axios');

const API_URL = 'http://localhost:3005';
const TEST_URL = 'https://example.com';

async function testCaching() {
  console.log('🧪 Testing Smart Caching System\n');

  try {
    // Test 1: First request (should create new analysis)
    console.log('1️⃣ First request - expecting new analysis...');
    const response1 = await axios.post(`${API_URL}/api/accessibility/analyze`, {
      url: TEST_URL,
      reportType: 'overview'
    });
    
    console.log('✅ Response received:', {
      success: response1.data.success,
      analysisId: response1.data.data?.analysisId,
      cached: response1.data.data?._cache?.fromCache || false,
      cacheAge: response1.data.data?._cache?.ageHours || 'N/A'
    });

    // Test 2: Second request (should return cached in production)
    console.log('\n2️⃣ Second request - expecting cached result...');
    const response2 = await axios.post(`${API_URL}/api/accessibility/analyze`, {
      url: TEST_URL,
      reportType: 'overview'
    });
    
    console.log('✅ Response received:', {
      success: response2.data.success,
      analysisId: response2.data.data?.analysisId,
      cached: response2.data.data?._cache?.fromCache || false,
      cacheAge: response2.data.data?._cache?.ageHours || 'N/A'
    });

    // Test 3: Force cache in development
    console.log('\n3️⃣ Third request with useCache=true...');
    const response3 = await axios.post(`${API_URL}/api/accessibility/analyze?useCache=true`, {
      url: TEST_URL,
      reportType: 'overview'
    });
    
    console.log('✅ Response received:', {
      success: response3.data.success,
      analysisId: response3.data.data?.analysisId,
      cached: response3.data.data?._cache?.fromCache || false,
      cacheAge: response3.data.data?._cache?.ageHours || 'N/A'
    });

    // Compare analysis IDs
    const sameAnalysis = response1.data.data?.analysisId === response2.data.data?.analysisId;
    console.log(`\n📊 Cache working: ${sameAnalysis ? 'YES ✅' : 'NO ❌'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testCaching();