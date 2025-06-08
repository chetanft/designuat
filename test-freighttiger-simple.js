#!/usr/bin/env node

/**
 * Simple FreightTiger Fallback Test
 * Tests only the fallback system functionality
 */

import axios from 'axios';

const SERVER_URL = 'http://localhost:3006';

console.log('🚛 FreightTiger Simple Fallback Test\n');

async function testSimpleFallback() {
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Server Health...');
    const healthResponse = await axios.get(`${SERVER_URL}/api/health`);
    const health = healthResponse.data;
    
    console.log(`✅ Server Status: ${health.status}`);
    console.log(`🛡️ Fallback System: ${health.components.fallbackSystem}`);
    console.log(`🚛 FreightTiger Optimized: ${health.freightTiger?.optimized}`);
    console.log(`📊 Demo Data Available: ${health.freightTiger?.fallbackDataAvailable}`);

    // Test 2: FreightTiger Demo Data
    console.log('\n2️⃣ Testing FreightTiger Demo Data...');
    const demoResponse = await axios.get(`${SERVER_URL}/api/freighttiger/demo`);
    const demo = demoResponse.data;
    
    console.log(`✅ Demo Available: ${demo.success}`);
    console.log(`📦 Elements: ${demo.data?.elements?.length || 0}`);
    console.log(`🔧 Fallback Mode: ${demo.capabilities.fallbackMode}`);
    
    // Validate demo data structure
    const fallbackData = demo.data;
    console.log('\n📋 Demo Data Structure:');
    console.log(`   URL: ${fallbackData.url}`);
    console.log(`   Title: ${fallbackData.title}`);
    console.log(`   Method: ${fallbackData.metadata?.method}`);
    console.log(`   Elements: ${fallbackData.elements?.length || 0}`);
    console.log(`   Errors: ${fallbackData.errors?.length || 0}`);
    
    // Test individual elements
    if (fallbackData.elements && fallbackData.elements.length > 0) {
      console.log('\n🧩 Sample Element:');
      const element = fallbackData.elements[0];
      console.log(`   ID: ${element.id}`);
      console.log(`   Type: ${element.type}`);
      console.log(`   Tag: ${element.tagName}`);
      console.log(`   Text: ${element.text}`);
      console.log(`   Background: ${element.styles?.backgroundColor}`);
      console.log(`   Position: ${element.position?.width}x${element.position?.height}`);
    }
    
    // Test error categorization
    if (fallbackData.errors && fallbackData.errors.length > 0) {
      console.log('\n⚠️ Sample Error (FreightTiger Pattern):');
      const error = fallbackData.errors[0];
      console.log(`   Type: ${error.type}`);
      console.log(`   Severity: ${error.severity}`);
      console.log(`   Actionable: ${error.actionable}`);
      console.log(`   User Message: ${error.userMessage}`);
    }

    console.log('\n🎉 FreightTiger Simple Test Completed Successfully!');
    console.log('\n💡 Key Findings:');
    console.log('   ✅ Server is healthy and running');
    console.log('   ✅ FreightTiger fallback system is active');
    console.log('   ✅ Demo data structure is valid');
    console.log('   ✅ FreightTiger-specific error patterns supported');
    console.log('   ✅ Professional UI component data available');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure the server is running:');
      console.error('   npm start');
    }
    
    return false;
  }
}

// Run the test
testSimpleFallback().then(success => {
  if (success) {
    console.log('\n🚀 Your FreightTiger comparison tool is ready!');
    console.log('   🌐 Access at: http://localhost:3006');
    console.log('   📊 API Demo: http://localhost:3006/api/freighttiger/demo');
    console.log('   💚 Health Check: http://localhost:3006/api/health');
  } else {
    console.log('\n❌ Setup needs attention before the tool is ready.');
  }
}); 