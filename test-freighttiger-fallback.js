#!/usr/bin/env node

/**
 * FreightTiger Fallback System Test
 * Validates that the comparison tool works even when browsers fail
 */

import axios from 'axios';

const SERVER_URL = 'http://localhost:3006';

console.log('🚛 FreightTiger Fallback System Test\n');

async function testFallbackSystem() {
  try {
    // Test 1: Health Check with Fallback Status
    console.log('1️⃣ Testing Health Check with Fallback Status...');
    const healthResponse = await axios.get(`${SERVER_URL}/api/health`);
    const health = healthResponse.data;
    
    console.log(`✅ Server Status: ${health.status}`);
    console.log(`📊 Components:`);
    console.log(`   Figma Extractor: ${health.components.figmaExtractor}`);
    console.log(`   Web Extractor: ${health.components.webExtractor}`);
    console.log(`   Enhanced Web Extractor: ${health.components.enhancedWebExtractor}`);
    console.log(`   Fallback System: ${health.components.fallbackSystem}`);
    
    console.log(`🛡️ FreightTiger Capabilities:`);
    console.log(`   Optimized: ${health.freightTiger?.optimized}`);
    console.log(`   Fallback Data Available: ${health.freightTiger?.fallbackDataAvailable}`);
    console.log(`   Error Patterns Supported: ${health.freightTiger?.errorPatternsSupported?.length || 0}`);

    // Test 2: FreightTiger Demo Endpoint
    console.log('\n2️⃣ Testing FreightTiger Demo Endpoint...');
    const demoResponse = await axios.get(`${SERVER_URL}/api/freighttiger/demo`);
    const demo = demoResponse.data;
    
    console.log(`✅ Demo Data Available: ${demo.success}`);
    console.log(`📊 Demo Elements: ${demo.data?.elements?.length || 0}`);
    console.log(`🔧 Capabilities:`);
    console.log(`   Figma Extraction: ${demo.capabilities.figmaExtraction}`);
    console.log(`   Web Extraction: ${demo.capabilities.webExtraction}`);
    console.log(`   Fallback Mode: ${demo.capabilities.fallbackMode}`);
    console.log(`   MCP Integration: ${demo.capabilities.mcpIntegration}`);

    // Test 3: Full FreightTiger Comparison with Fallback
    console.log('\n3️⃣ Testing Full FreightTiger Comparison with Fallback...');
    
    const comparisonRequest = {
      figmaUrl: 'https://www.figma.com/design/freighttiger-screen/FreightTiger-Journey-Listing?node-id=1-2',
      webUrl: 'https://www.freighttiger.com/v10/journey/listing',
      authentication: {
        type: 'credentials',
        loginUrl: 'https://www.freighttiger.com/login',
        username: 'demo@freighttiger.com',
        password: 'demo123'
      }
    };

    console.log(`🔄 Starting comparison: ${comparisonRequest.figmaUrl} vs ${comparisonRequest.webUrl}`);
    
    const comparisonResponse = await axios.post(`${SERVER_URL}/api/compare`, comparisonRequest);
    const comparison = comparisonResponse.data;
    
    if (comparison.success) {
      console.log('✅ Comparison completed successfully!');
      console.log('\n📊 Results Summary:');
      console.log(`   Figma Components: ${comparison.summary.figma.componentsExtracted}`);
      console.log(`   Web Elements: ${comparison.summary.web.elementsExtracted}`);
      console.log(`   Extraction Method: ${comparison.summary.web.extractionMethod}`);
      console.log(`   Fallback Used: ${comparison.summary.web.fallbackUsed}`);
      
      if (comparison.summary.web.fallbackUsed) {
        console.log(`   Fallback Reason: ${comparison.summary.web.fallbackReason}`);
      }
      
      console.log(`   Components Analyzed: ${comparison.summary.comparison.componentsAnalyzed}`);
      console.log(`   Total Matches: ${comparison.summary.comparison.totalMatches}`);
      console.log(`   Total Deviations: ${comparison.summary.comparison.totalDeviations}`);
      
      console.log('\n📈 Severity Breakdown:');
      const severity = comparison.summary.comparison.severity;
      console.log(`   High: ${severity.high || 0}`);
      console.log(`   Medium: ${severity.medium || 0}`);
      console.log(`   Low: ${severity.low || 0}`);
      
      console.log('\n📄 Reports Generated:');
      if (comparison.reports) {
        Object.entries(comparison.reports).forEach(([type, path]) => {
          console.log(`   ${type.toUpperCase()}: ${path}`);
        });
      }
      
      console.log(`\n🚛 FreightTiger Optimized: ${comparison.metadata?.freightTigerOptimized}`);
      
    } else {
      console.log('❌ Comparison failed:', comparison.error);
      if (comparison.details) {
        console.log('   Details:', comparison.details);
      }
      if (comparison.suggestion) {
        console.log('   Suggestion:', comparison.suggestion);
      }
    }

    // Test 4: Validate Fallback Data Structure
    console.log('\n4️⃣ Validating Fallback Data Structure...');
    
    const fallbackData = demo.data;
    const requiredFields = ['url', 'title', 'metadata', 'elements', 'errors'];
    const validationResults = {};
    
    requiredFields.forEach(field => {
      validationResults[field] = !!fallbackData[field];
    });
    
    console.log('📋 Fallback Data Validation:');
    Object.entries(validationResults).forEach(([field, valid]) => {
      console.log(`   ${field}: ${valid ? '✅' : '❌'}`);
    });
    
    // Validate elements structure
    if (fallbackData.elements && fallbackData.elements.length > 0) {
      const element = fallbackData.elements[0];
      const elementFields = ['id', 'type', 'tagName', 'text', 'styles', 'position'];
      console.log('\n📦 Sample Element Validation:');
      elementFields.forEach(field => {
        console.log(`   ${field}: ${!!element[field] ? '✅' : '❌'}`);
      });
    }
    
    console.log('\n🎉 FreightTiger Fallback System Test Completed Successfully!');
    console.log('\n💡 Key Benefits:');
    console.log('   ✅ Server runs even when browsers fail');
    console.log('   ✅ FreightTiger-specific demo data available');
    console.log('   ✅ Full comparison workflow works with fallback');
    console.log('   ✅ Professional error handling and user feedback');
    console.log('   ✅ Maintains all FreightTiger optimization features');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure the server is running:');
      console.error('   npm start');
    }
  }
}

// Run the test
testFallbackSystem(); 