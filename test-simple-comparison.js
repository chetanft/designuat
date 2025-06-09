/**
 * Test the simplified server comparison endpoint
 * No more port issues, no more API errors!
 */

async function testSimpleComparison() {
  console.log('🧪 Testing Simplified Server Comparison...\n');
  
  const testData = {
    figmaUrl: 'https://www.figma.com/design/your-figma-test/Test-Components',
    webUrl: 'https://github.com',
    authentication: null
  };
  
  try {
    console.log('🔍 Sending comparison request...');
    
    const response = await fetch('http://localhost:3006/api/compare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Response error:', errorData);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Comparison successful!');
    console.log('📊 Summary:', result.summary);
    console.log('📋 Reports:', result.reports ? 'Generated' : 'None');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test health endpoint first
async function testHealth() {
  try {
    const response = await fetch('http://localhost:3006/api/health');
    const health = await response.json();
    console.log('💚 Health check:', health.status);
    console.log('🔧 Components:', health.components);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing Simplified Design UAT Server...\n');
  
  const healthOk = await testHealth();
  
  if (healthOk) {
    console.log('\n' + '='.repeat(50));
    await testSimpleComparison();
  }
  
  console.log('\n✅ Test completed!');
}

runTests(); 