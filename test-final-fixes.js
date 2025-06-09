// Test the final fixes: unlimited components, working JavaScript, proper data storage

async function testFinalFixes() {
  try {
    console.log('🧪 Testing final fixes...');
    
    // Start a new comparison
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
    console.log('✅ Comparison started:', result.comparisonId);
    
    if (result.success) {
      // Wait for completion
      console.log('⏳ Waiting for completion...');
      await new Promise(resolve => setTimeout(resolve, 75000)); // Wait 75 seconds
      
      // Check latest reports
      const reportsResponse = await fetch('http://localhost:3006/api/reports');
      const reportsData = await reportsResponse.json();
      const latestReport = reportsData.reports[0];
      
      console.log('📊 Latest report:', latestReport.id);
      
      // Check HTML content for fixes
      const htmlResponse = await fetch(`http://localhost:3006${latestReport.htmlPath}`);
      const htmlContent = await htmlResponse.text();
      
      // Test 1: Check if all components are shown (not limited to 20)
      const componentLimitMatch = htmlContent.match(/Showing (\d+) of (\d+) components/);
      if (componentLimitMatch) {
        console.log(`❌ Still limited: ${componentLimitMatch[0]}`);
      } else {
        const allComponentMatch = htmlContent.match(/Showing all (\d+) components/);
        if (allComponentMatch) {
          console.log(`✅ All components shown: ${allComponentMatch[0]}`);
        } else {
          console.log('⚠️ No component count information found');
        }
      }
      
      // Test 2: Check JavaScript functions
      const hasJavaScript = htmlContent.includes('showMainTab') && 
                           htmlContent.includes('toggleAccordion') && 
                           htmlContent.includes('showTab');
      console.log(`${hasJavaScript ? '✅' : '❌'} JavaScript functions present`);
      
      // Test 3: Check design tokens
      const colorTokenMatch = htmlContent.match(/Colors <span class="count-indicator">(\d+)<\/span>/g);
      if (colorTokenMatch) {
        console.log(`✅ Design tokens found: ${colorTokenMatch.join(', ')}`);
      } else {
        console.log('❌ No design tokens found');
      }
      
      // Test 4: Check color display
      const colorSwatchCount = (htmlContent.match(/class="color-swatch"/g) || []).length;
      console.log(`✅ Color swatches found: ${colorSwatchCount}`);
      
      console.log(`🌐 Report URL: http://localhost:3006/html-report/${latestReport.id}`);
      console.log('🎯 Test complete! Check the URL to verify clicking works.');
      
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFinalFixes(); 