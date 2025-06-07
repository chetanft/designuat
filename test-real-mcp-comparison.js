/**
 * Test Real MCP Comparison
 * Makes actual API calls to test the MCP Framelink integration
 */

import { fetch } from 'node-fetch';

console.log('🧪 Testing Real MCP Comparison...');

async function testRealMCPComparison() {
  try {
    const serverUrl = 'http://localhost:3003';
    
    // Test parameters using your Figma file
    const testData = {
      figmaUrl: "https://www.figma.com/design/fb5Yc1aKJv9YWsMLnNlWeK/My-Journeys?node-id=2-22260&t=ui5WlaF7qGOJTDkL-4",
      webUrl: "https://httpbin.org/html",
      includeVisual: false
    };
    
    console.log('\n🚀 Starting real MCP comparison test...');
    console.log(`📡 Server: ${serverUrl}`);
    console.log(`🎨 Figma: ${testData.figmaUrl}`);
    console.log(`🌐 Web: ${testData.webUrl}`);
    
    console.log('\n📤 Sending comparison request...');
    
    const response = await fetch(`${serverUrl}/api/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('\n✅ Comparison completed successfully!');
    console.log(`📊 Components analyzed: ${result.components?.length || 'N/A'}`);
    console.log(`🔍 Matches found: ${result.summary?.totalMatches || 'N/A'}`);
    console.log(`⚠️ Deviations found: ${result.summary?.totalDeviations || 'N/A'}`);
    console.log(`📈 Extraction method: ${result.figmaData?.extractionMethod || 'Unknown'}`);
    
    // Show some sample components if available
    if (result.figmaData?.components && result.figmaData.components.length > 0) {
      console.log('\n📋 Sample Figma components (first 5):');
      result.figmaData.components.slice(0, 5).forEach((comp, index) => {
        console.log(`   ${index + 1}. ${comp.name} (${comp.type})`);
      });
    }
    
    if (result.webData?.elements && result.webData.elements.length > 0) {
      console.log('\n🌐 Sample web elements (first 5):');
      result.webData.elements.slice(0, 5).forEach((elem, index) => {
        console.log(`   ${index + 1}. ${elem.tagName} - ${elem.text?.substring(0, 50) || 'No text'}...`);
      });
    }
    
    console.log('\n🎯 Test Results Summary:');
    console.log(`   - Figma Extraction: ${result.figmaData ? '✅ Success' : '❌ Failed'}`);
    console.log(`   - Web Extraction: ${result.webData ? '✅ Success' : '❌ Failed'}`);
    console.log(`   - Comparison: ${result.summary ? '✅ Success' : '❌ Failed'}`);
    console.log(`   - Reports Generated: ${result.reports ? '✅ Yes' : '❌ No'}`);
    
    if (result.figmaData?.extractionMethod === 'MCP Framelink') {
      console.log('\n🎉 SUCCESS: MCP Framelink tools are being used!');
    } else {
      console.log('\n📡 INFO: Using fallback extraction method');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Try to get more details about the error
    if (error.message.includes('fetch')) {
      console.log('🔍 Debugging tips:');
      console.log('   - Check if server is running on port 3003');
      console.log('   - Verify no firewall blocking the connection');
      console.log('   - Run: lsof -i :3003 to check server status');
    }
  }
}

// Run the test
testRealMCPComparison(); 