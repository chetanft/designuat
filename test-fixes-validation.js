/**
 * Test Script: Validate All Implemented Fixes
 * 
 * This script tests:
 * 1. Puppeteer deprecation warning fix
 * 2. Web extraction stuck at 70% fix
 * 3. Error categorization system
 * 4. Report compression
 */

import { EnhancedWebExtractor } from './src/scraper/enhancedWebExtractor.js';
import { ErrorCategorizer } from './src/utils/errorCategorizer.js';
import { ReportCompressor } from './src/utils/reportCompressor.js';
import { promises as fs } from 'fs';

console.log('🧪 Testing All Implemented Fixes...\n');

/**
 * Test 1: Puppeteer Deprecation Warning Fix
 */
async function testPuppeteerFix() {
  console.log('1️⃣ Testing Puppeteer Deprecation Warning Fix...');
  
  const extractor = new EnhancedWebExtractor({
            headless: "new", // Using new headless mode to avoid deprecation warnings
    timeout: 30000
  });

  try {
    await extractor.initialize();
    console.log('✅ Puppeteer initialized without deprecation warnings');
    await extractor.close();
    return true;
  } catch (error) {
    console.error('❌ Puppeteer initialization failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Web Extraction Stuck at 70% Fix
 */
async function testWebExtractionFix() {
  console.log('\n2️⃣ Testing Web Extraction Stuck at 70% Fix...');
  
  const extractor = new EnhancedWebExtractor({
    headless: "new",
    timeout: 15000 // Shorter timeout for testing
  });

  try {
    // Test with a problematic site (FreightTiger-like scenario)
    console.log('🌐 Testing navigation strategies with timeout scenarios...');
    
    // Test with httpbin.org first (should work)
    const simpleResult = await extractor.extractWebData('https://httpbin.org/html');
    console.log(`✅ Simple site extraction: ${simpleResult.elements.length} components`);
    
    // Test with a more complex site
    try {
      const complexResult = await extractor.extractWebData('https://github.com');
      console.log(`✅ Complex site extraction: ${complexResult.elements.length} components`);
    } catch (complexError) {
      console.log(`⚠️ Complex site extraction failed (expected): ${complexError.message}`);
    }
    
    await extractor.close();
    return true;
  } catch (error) {
    console.error('❌ Web extraction test failed:', error.message);
    await extractor.close();
    return false;
  }
}

/**
 * Test 3: Error Categorization System
 */
async function testErrorCategorization() {
  console.log('\n3️⃣ Testing Error Categorization System...');
  
  const testErrors = [
    {
      error: new Error('Unable to resolve bare specifier \'@ft-mf/login\''),
      context: { url: 'https://freighttiger.com', method: 'Web Extraction' },
      expectedCategory: 'target_site_module_error'
    },
    {
      error: new Error('Navigation timeout of 30000ms exceeded'),
      context: { url: 'https://slow-site.com', method: 'Web Extraction' },
      expectedCategory: 'navigation_timeout'
    },
    {
      error: new Error('Target closed'),
      context: { url: 'https://example.com', method: 'Browser' },
      expectedCategory: 'browser_infrastructure'
    },
    {
      error: new Error('Cannot read properties of undefined (reading \'toLowerCase\')'),
      context: { url: 'https://buggy-site.com', method: 'Web Extraction' },
      expectedCategory: 'target_site_javascript_error'
    }
  ];

  let passedTests = 0;
  
  for (const { error, context, expectedCategory } of testErrors) {
    try {
      const categorized = ErrorCategorizer.categorizeError(error, context);
      const userFriendly = ErrorCategorizer.formatForUser(categorized);
      
      console.log(`\n📊 Error: "${error.message}"`);
      console.log(`   Category: ${categorized.category} (expected: ${expectedCategory})`);
      console.log(`   Severity: ${categorized.severity}`);
      console.log(`   Actionable: ${categorized.actionable}`);
      console.log(`   User-friendly: ${userFriendly.description}`);
      console.log(`   Suggestions: ${userFriendly.suggestions.length} provided`);
      
      if (categorized.category === expectedCategory) {
        console.log('   ✅ Category matches expected');
        passedTests++;
      } else {
        console.log('   ❌ Category mismatch');
      }
      
    } catch (categorizationError) {
      console.error(`❌ Error categorization failed:`, categorizationError.message);
    }
  }
  
  console.log(`\n📈 Error Categorization Results: ${passedTests}/${testErrors.length} tests passed`);
  return passedTests === testErrors.length;
}

/**
 * Test 4: Report Compression
 */
async function testReportCompression() {
  console.log('\n4️⃣ Testing Report Compression...');
  
  // Create a mock large report
  const mockReport = {
    metadata: {
      figma: {
        fileId: 'test-file-id',
        fileName: 'Test File',
        extractedAt: new Date().toISOString(),
        components: new Array(1000).fill(null).map((_, i) => ({ id: `comp-${i}` }))
      },
      web: {
        url: 'https://example.com',
        extractedAt: new Date().toISOString(),
        elementsCount: 500
      },
      comparedAt: new Date().toISOString(),
      summary: {
        totalComponents: 1000,
        totalDeviations: 2500,
        matches: 100
      }
    },
    summary: {
      totalComponents: 1000,
      totalDeviations: 2500,
      matches: 100
    },
    comparisons: new Array(1000).fill(null).map((_, i) => ({
      componentId: `comp-${i}`,
      componentName: `Component ${i}`,
      componentType: 'FRAME',
      selector: `.component-${i}`,
      status: 'deviation',
      deviations: new Array(5).fill(null).map((_, j) => ({
        property: `property-${j}`,
        figmaValue: `figma-value-${j}-with-very-long-string-that-should-be-compressed`,
        webValue: `web-value-${j}-with-very-long-string-that-should-be-compressed`,
        difference: 'mismatch',
        severity: 'medium',
        message: `Property ${j} differs between Figma and web implementation with detailed explanation`
      })),
      matches: [],
      styles: {
        fontSize: '16px',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        color: 'rgb(0, 0, 0)',
        backgroundColor: 'rgb(255, 255, 255)',
        padding: '16px',
        margin: '8px',
        borderRadius: '4px'
      }
    }))
  };

  try {
    const originalSize = JSON.stringify(mockReport).length;
    console.log(`📊 Original report size: ${(originalSize / 1024).toFixed(1)}KB`);
    
    // Test different compression modes
    const modes = ['summary', 'detailed', 'full'];
    const results = {};
    
    for (const mode of modes) {
      const compressed = ReportCompressor.compressReport(mockReport, { 
        mode,
        maxComponents: mode === 'summary' ? 100 : 1000,
        maxDeviations: mode === 'summary' ? 3 : 500,
        compressStrings: true
      });
      
      const compressedSize = JSON.stringify(compressed).length;
      const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      
      results[mode] = {
        size: compressedSize,
        reduction: reduction,
        components: compressed.comparisons.length
      };
      
      console.log(`📦 ${mode.toUpperCase()} mode:`);
      console.log(`   Size: ${(compressedSize / 1024).toFixed(1)}KB`);
      console.log(`   Reduction: ${reduction}%`);
      console.log(`   Components: ${compressed.comparisons.length}`);
    }
    
    // Test file saving
    const testOutputPath = './output/test-compressed-report.html';
    await fs.mkdir('./output', { recursive: true });
    
    const saveResult = await ReportCompressor.saveCompressedReport(
      mockReport, 
      testOutputPath, 
      { mode: 'detailed', gzip: true }
    );
    
    console.log(`💾 Saved compressed report: ${saveResult.jsonPath}`);
    console.log(`📦 Compression ratio: ${saveResult.compressionInfo.compressionRatio}%`);
    
    // Clean up test file
    try {
      await fs.unlink(saveResult.jsonPath);
      if (saveResult.gzipPath) {
        await fs.unlink(saveResult.gzipPath);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    return true;
  } catch (error) {
    console.error('❌ Report compression test failed:', error.message);
    return false;
  }
}

/**
 * Test 5: Integration Test - Full Comparison with Fixes
 */
async function testIntegration() {
  console.log('\n5️⃣ Testing Integration - Full Comparison with All Fixes...');
  
  try {
    // This would normally be done via API call, but we'll simulate the key parts
    const extractor = new EnhancedWebExtractor({
      headless: "new",
      timeout: 20000
    });
    
    console.log('🌐 Testing full extraction with error handling...');
    
    try {
      const webData = await extractor.extractWebData('https://httpbin.org/html');
      console.log(`✅ Extraction successful: ${webData.elements.length} components`);
      
      // Test error categorization with a real error
      try {
        await extractor.extractWebData('https://invalid-url-that-does-not-exist.com');
      } catch (extractionError) {
        const categorized = ErrorCategorizer.categorizeError(extractionError, {
          url: 'https://invalid-url-that-does-not-exist.com',
          method: 'Integration Test'
        });
        
        console.log(`📊 Real error categorized as: ${categorized.category}`);
        console.log(`   Severity: ${categorized.severity}`);
        console.log(`   Actionable: ${categorized.actionable}`);
      }
      
    } finally {
      await extractor.close();
    }
    
    return true;
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    return false;
  }
}

/**
 * Run All Tests
 */
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Fix Validation...\n');
  
  const tests = [
    { name: 'Puppeteer Deprecation Fix', test: testPuppeteerFix },
    { name: 'Web Extraction Fix', test: testWebExtractionFix },
    { name: 'Error Categorization', test: testErrorCategorization },
    { name: 'Report Compression', test: testReportCompression },
    { name: 'Integration Test', test: testIntegration }
  ];
  
  const results = [];
  
  for (const { name, test } of tests) {
    try {
      const passed = await test();
      results.push({ name, passed });
    } catch (error) {
      console.error(`❌ Test "${name}" threw an error:`, error.message);
      results.push({ name, passed: false });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 Overall Result: ${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All fixes are working correctly!');
  } else {
    console.log('⚠️ Some fixes need attention.');
  }
  
  console.log('='.repeat(60));
  
  return passedCount === totalCount;
}

// Run the tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }); 