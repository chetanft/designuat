// Using Node.js built-in fetch

async function testNewComparison() {
  try {
    console.log('🧪 Testing new comparison with updated JSON storage...');
    
    const response = await fetch('http://localhost:3006/api/compare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        figmaUrl: 'https://www.figma.com/design/fb5Yc1aKJv9YWsMLnNlWeK/My-Journeys?node-id=2-22260&t=ZcXjcdLe03T6PdXM-4',
        webUrl: 'https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Dev-Mode-MCP-Server'
      })
    });
    
    const result = await response.json();
    console.log('✅ Comparison started:', result);
    
    if (result.success) {
      console.log(`📊 Comparison ID: ${result.comparisonId}`);
      console.log(`🔍 Poll URL: ${result.pollUrl}`);
      
      // Wait for completion
      console.log('⏳ Waiting for completion...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
      
      // Check if figmaData API works
      console.log('🎨 Testing Figma data API...');
      const figmaDataResponse = await fetch(`http://localhost:3006/api/comparison/${result.comparisonId}/figma-data`);
      const figmaData = await figmaDataResponse.json();
      console.log('📊 Figma data result:', figmaData);
      
      // Check if webData API works
      console.log('🌐 Testing Web data API...');
      const webDataResponse = await fetch(`http://localhost:3006/api/comparison/${result.comparisonId}/web-data`);
      const webData = await webDataResponse.json();
      console.log('📊 Web data result:', webData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNewComparison(); 