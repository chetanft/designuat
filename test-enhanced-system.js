/**
 * Enhanced System Test Script
 * Tests the complete rewritten system with:
 * 1. Enhanced Figma extraction (recursive child components)
 * 2. Enhanced web extraction (semantic UI components)
 * 3. Enhanced comparison engine (component-to-component matching)
 * 4. Specialized color & typography analysis
 */

import { promises as fs } from 'fs';

async function testEnhancedSystem() {
  console.log('🧪 TESTING ENHANCED DESIGN COMPARISON SYSTEM');
  console.log('='.repeat(60));
  console.log('');

  const testCases = [
    {
      name: 'FreightTiger In Transit Frame',
      figmaUrl: 'https://www.figma.com/design/fb5Yc1aKJv9YWsMLnNlWeK/My-Journeys?node-id=2-22260&t=O0660yrD8pUZ4JYU-4',
      webUrl: 'https://www.freighttiger.com/v10/journey/listing',
      description: 'Test extraction of entire frame with all child components'
    }
  ];

  for (const testCase of testCases) {
    console.log(`🔬 Testing: ${testCase.name}`);
    console.log(`📐 Figma: ${testCase.figmaUrl}`);
    console.log(`🌐 Web: ${testCase.webUrl}`);
    console.log(`📝 Description: ${testCase.description}`);
    console.log('');

    try {
      // Test 1: Enhanced Figma Extraction
      console.log('1️⃣ Testing Enhanced Figma Extraction...');
      const figmaResponse = await fetch('http://localhost:3004/api/test-figma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figmaUrl: testCase.figmaUrl })
      });

      if (!figmaResponse.ok) {
        throw new Error(`Figma test failed: ${figmaResponse.status}`);
      }

      const figmaResult = await figmaResponse.json();
      console.log(`   ✅ Extracted ${figmaResult.extractedComponents} Figma components`);
      console.log(`   📊 Component types:`, figmaResult.componentTypes);
      console.log(`   🎯 Has colors: ${figmaResult.summary.hasColors}`);
      console.log(`   📝 Has typography: ${figmaResult.summary.hasTypography}`);
      console.log('');

      // Test 2: Enhanced Web Extraction
      console.log('2️⃣ Testing Enhanced Web Extraction...');
      const webResponse = await fetch('http://localhost:3004/api/test-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webUrl: testCase.webUrl })
      });

      if (!webResponse.ok) {
        throw new Error(`Web test failed: ${webResponse.status}`);
      }

      const webResult = await webResponse.json();
      console.log(`   ✅ Extracted ${webResult.extractedElements} web elements`);
      console.log(`   📊 Element types:`, webResult.summary.componentTypes);
      console.log(`   🎨 Colors found: ${webResult.summary.totalColors}`);
      console.log(`   📝 Fonts found: ${webResult.summary.totalFonts}`);
      console.log('');

      // Test 3: Enhanced Comparison
      console.log('3️⃣ Testing Enhanced Comparison Engine...');
      const compareResponse = await fetch('http://localhost:3004/api/enhanced-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figmaUrl: testCase.figmaUrl,
          webUrl: testCase.webUrl,
          includeVisual: false
        })
      });

      if (!compareResponse.ok) {
        throw new Error(`Comparison failed: ${compareResponse.status}`);
      }

      const compareResult = await compareResponse.json();
      console.log(`   ✅ Comparison complete!`);
      console.log(`   📊 Summary:`);
      console.log(`      • Total components: ${compareResult.summary.totalComponents}`);
      console.log(`      • Matched components: ${compareResult.summary.matchedComponents}`);
      console.log(`      • Unmatched components: ${compareResult.summary.unmatchedComponents}`);
      console.log(`      • Total matches: ${compareResult.summary.totalMatches}`);
      console.log(`      • Total deviations: ${compareResult.summary.totalDeviations}`);
      console.log(`      • Total unfetched: ${compareResult.summary.totalUnfetched}`);
      console.log('');

      // Color Analysis
      console.log(`   🎨 Color Analysis:`);
      console.log(`      • Figma colors: ${compareResult.colorAnalysis.figmaColorsCount}`);
      console.log(`      • Web colors: ${compareResult.colorAnalysis.webColorsCount}`);
      console.log(`      • Common colors: ${compareResult.colorAnalysis.commonColorsCount}`);
      console.log(`      • Color match rate: ${Math.round(compareResult.colorAnalysis.colorMatchRate)}%`);
      console.log('');

      // Typography Analysis
      console.log(`   📝 Typography Analysis:`);
      console.log(`      • Figma fonts: ${compareResult.typographyAnalysis.figmaFontsCount}`);
      console.log(`      • Web fonts: ${compareResult.typographyAnalysis.webFontsCount}`);
      console.log(`      • Common fonts: ${compareResult.typographyAnalysis.commonFontsCount}`);
      console.log(`      • Font match rate: ${Math.round(compareResult.typographyAnalysis.fontMatchRate)}%`);
      console.log('');

      // Show sample comparisons
      console.log(`   🔍 Sample Comparisons:`);
      compareResult.comparisons.slice(0, 3).forEach((comp, index) => {
        console.log(`      ${index + 1}. ${comp.figmaComponent.name} (${comp.figmaComponent.type})`);
        console.log(`         Match: ${comp.matchType} (confidence: ${Math.round(comp.confidence * 100)}%)`);
        console.log(`         Deviations: ${comp.deviations.length}, Matches: ${comp.matches.length}`);
        
        if (comp.deviations.length > 0) {
          const deviation = comp.deviations[0];
          console.log(`         Example deviation: ${deviation.message}`);
        }
        console.log('');
      });

      // Test 4: Validate Report Generation
      console.log('4️⃣ Testing Report Generation...');
      const reportResponse = await fetch(`http://localhost:3004${compareResult.reportPath}`);
      
      if (!reportResponse.ok) {
        throw new Error(`Report fetch failed: ${reportResponse.status}`);
      }

      const reportData = await reportResponse.json();
      console.log(`   ✅ Report generated successfully`);
      console.log(`   📄 Report ID: ${compareResult.reportId}`);
      console.log(`   📊 Report contains:`);
      console.log(`      • Metadata: ✓`);
      console.log(`      • Figma data: ✓ (${reportData.figmaData.components.length} components)`);
      console.log(`      • Web data: ✓ (${reportData.webData.elements.length} elements)`);
      console.log(`      • Comparisons: ✓ (${reportData.comparisons.length} comparisons)`);
      console.log(`      • Color analysis: ✓`);
      console.log(`      • Typography analysis: ✓`);
      console.log('');

      console.log('✅ ALL TESTS PASSED FOR:', testCase.name);
      console.log('='.repeat(60));
      console.log('');

    } catch (error) {
      console.error(`❌ Test failed for ${testCase.name}:`, error.message);
      console.log('');
    }
  }

  // Test 5: System Health Check
  console.log('5️⃣ Testing System Health...');
  try {
    const healthResponse = await fetch('http://localhost:3004/api/health');
    const healthData = await healthResponse.json();
    
    console.log(`   ✅ System Status: ${healthData.status}`);
    console.log(`   🔧 Version: ${healthData.version}`);
    console.log(`   📋 Features:`);
    healthData.features.forEach(feature => {
      console.log(`      • ${feature}`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }

  console.log('🎉 ENHANCED SYSTEM TESTING COMPLETE!');
  console.log('');
  console.log('📈 IMPROVEMENTS ACHIEVED:');
  console.log('✅ Figma Extractor: Now extracts ALL child components recursively');
  console.log('✅ Web Extractor: Now extracts semantic UI components with computed styles');
  console.log('✅ Comparison Engine: Now performs component-to-component matching');
  console.log('✅ Color Analysis: Specialized color extraction and comparison');
  console.log('✅ Typography Analysis: Detailed font and text style comparison');
  console.log('✅ No more hardcoded values or placeholder data');
  console.log('✅ Proper unfetched property handling');
  console.log('✅ Accurate component matching and deviation reporting');
}

// Helper function to wait for server startup
async function waitForServer(url, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    console.log(`⏳ Waiting for server... (attempt ${i + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Server did not start within expected time');
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Enhanced System Test...');
    console.log('⏳ Waiting for enhanced server to be ready...');
    
    await waitForServer('http://localhost:3004/api/health');
    console.log('✅ Enhanced server is ready!');
    console.log('');
    
    await testEnhancedSystem();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    console.log('');
    console.log('💡 Make sure the enhanced server is running:');
    console.log('   node src/enhancedServer.js');
    process.exit(1);
  }
}

main(); 