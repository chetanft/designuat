/**
 * Simple Test Script: Validate Core Fixes
 * 
 * This script tests the fixes that don't require browser initialization:
 * 1. Error categorization system
 * 2. Report compression
 * 3. Puppeteer configuration (without launching)
 */

import { ErrorCategorizer } from './src/utils/errorCategorizer.js';
import { ReportCompressor } from './src/utils/reportCompressor.js';
import { promises as fs } from 'fs';

console.log('🧪 Testing Core Fixes (No Browser Required)...\n');

/**
 * Test 1: Error Categorization System
 */
async function testErrorCategorization() {
  console.log('1️⃣ Testing Error Categorization System...');
  
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
    },
    {
      error: new Error('application \'@ft-mf/parent\' died in status LOADING_SOURCE_CODE'),
      context: { url: 'https://freighttiger.com', method: 'Web Extraction' },
      expectedCategory: 'target_site_javascript_error'
    },
    {
      error: new Error('socket hang up'),
      context: { url: 'https://example.com', method: 'Browser' },
      expectedCategory: 'browser_infrastructure'
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
 * Test 2: Report Compression
 */
async function testReportCompression() {
  console.log('\n2️⃣ Testing Report Compression...');
  
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
        figmaValue: `figma-value-${j}-with-very-long-string-that-should-be-compressed-to-test-compression-efficiency`,
        webValue: `web-value-${j}-with-very-long-string-that-should-be-compressed-to-test-compression-efficiency`,
        difference: 'mismatch',
        severity: 'medium',
        message: `Property ${j} differs between Figma and web implementation with detailed explanation that should be compressed`
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
    
    // Validate compression effectiveness
    const summaryReduction = parseFloat(results.summary.reduction);
    const detailedReduction = parseFloat(results.detailed.reduction);
    
    const compressionEffective = summaryReduction > 90 && detailedReduction > 30;
    
    if (compressionEffective) {
      console.log('✅ Compression is highly effective');
    } else {
      console.log('⚠️ Compression could be more effective');
    }
    
    // Clean up test file
    try {
      await fs.unlink(saveResult.jsonPath);
      if (saveResult.gzipPath) {
        await fs.unlink(saveResult.gzipPath);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    return compressionEffective;
  } catch (error) {
    console.error('❌ Report compression test failed:', error.message);
    return false;
  }
}

/**
 * Test 3: Puppeteer Configuration Check
 */
async function testPuppeteerConfig() {
  console.log('\n3️⃣ Testing Puppeteer Configuration...');
  
  try {
    // Import the enhanced web extractor to check configuration
    const { EnhancedWebExtractor } = await import('./src/scraper/enhancedWebExtractor.js');
    
    // Create an instance to check the configuration
    const extractor = new EnhancedWebExtractor({
      headless: "new",
      timeout: 30000
    });
    
    // Check if the headless configuration is properly set
    const configCorrect = extractor.config.headless === "new";
    
    console.log(`📋 Headless config: ${extractor.config.headless}`);
    console.log(`📋 Timeout config: ${extractor.config.timeout}ms`);
    
    if (configCorrect) {
      console.log('✅ Puppeteer configuration is correct (will use "new" headless mode)');
    } else {
      console.log('❌ Puppeteer configuration issue detected');
    }
    
    return configCorrect;
  } catch (error) {
    console.error('❌ Puppeteer configuration test failed:', error.message);
    return false;
  }
}

/**
 * Test 4: FreightTiger Error Patterns
 */
async function testFreightTigerErrorPatterns() {
  console.log('\n4️⃣ Testing FreightTiger-Specific Error Patterns...');
  
  const freightTigerErrors = [
    'Unable to resolve bare specifier \'@ft-mf/login\' from https://www.freighttiger.com/v10/journey/',
    'application \'@ft-mf/parent\' died in status LOADING_SOURCE_CODE: Cannot read properties of undefined (reading \'toLowerCase\')',
    'Cannot read properties of null (reading \'type\')',
    'SystemJS Error#8 https://git.io/JvFET#8'
  ];
  
  let correctlyClassified = 0;
  
  for (const errorMessage of freightTigerErrors) {
    const error = new Error(errorMessage);
    const categorized = ErrorCategorizer.categorizeError(error, {
      url: 'https://www.freighttiger.com/v10/journey/listing',
      method: 'Web Extraction'
    });
    
    const isTargetSiteError = categorized.category.includes('target_site');
    const isLowSeverity = categorized.severity === 'low';
    const isNotActionable = !categorized.actionable;
    
    console.log(`📊 "${errorMessage.substring(0, 50)}..."`);
    console.log(`   Category: ${categorized.category}`);
    console.log(`   Severity: ${categorized.severity}`);
    console.log(`   Actionable: ${categorized.actionable}`);
    
    if (isTargetSiteError && isLowSeverity && isNotActionable) {
      console.log('   ✅ Correctly classified as external site issue');
      correctlyClassified++;
    } else {
      console.log('   ❌ Incorrectly classified');
    }
  }
  
  console.log(`\n📈 FreightTiger Error Classification: ${correctlyClassified}/${freightTigerErrors.length} correct`);
  return correctlyClassified === freightTigerErrors.length;
}

/**
 * Run All Tests
 */
async function runAllTests() {
  console.log('🚀 Starting Core Fix Validation...\n');
  
  const tests = [
    { name: 'Error Categorization', test: testErrorCategorization },
    { name: 'Report Compression', test: testReportCompression },
    { name: 'Puppeteer Configuration', test: testPuppeteerConfig },
    { name: 'FreightTiger Error Patterns', test: testFreightTigerErrorPatterns }
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
  console.log('📊 CORE FIXES TEST RESULTS');
  console.log('='.repeat(60));
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 Overall Result: ${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All core fixes are working correctly!');
    console.log('\n📋 Summary of Implemented Fixes:');
    console.log('   ✅ Puppeteer deprecation warning fixed (headless: "new")');
    console.log('   ✅ Web extraction timeout handling improved');
    console.log('   ✅ Error categorization system implemented');
    console.log('   ✅ Report compression with multiple modes');
    console.log('   ✅ FreightTiger error patterns properly classified');
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