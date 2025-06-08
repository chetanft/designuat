/**
 * Test Dynamic Application Extraction
 * 
 * This test demonstrates how to extract data from dynamic applications
 * like FreightTiger that require:
 * - Extended loading times (10-20+ seconds)
 * - Authentication
 * - Filter interactions to load data
 * - Progressive extraction as data loads
 */

import fetch from 'node-fetch';
import { PLACEHOLDER_CREDENTIALS, PLACEHOLDER_URLS } from './src/constants/placeholders.js';

const API_BASE = process.env.TEST_SERVER_URL || 'http://localhost:3004';

/**
 * Test 1: FreightTiger Dynamic Extraction
 * This is the main test for FreightTiger with all dynamic features
 */
async function testFreightTigerExtraction() {
  console.log('🚛 Testing FreightTiger Dynamic Extraction...\n');

  const requestBody = {
    webUrl: 'https://www.freighttiger.com/v10/journey/listing',
    waitTime: 25000, // 25 seconds for full loading
    extractionStrategy: 'progressive', // Multiple extraction phases
    
    // Authentication (if needed - currently disabled in config)
    authentication: {
      type: 'form',
      loginUrl: 'https://www.freighttiger.com/login',
      credentials: {
        username: 'your-username',
        password: 'your-password'
      },
      selectors: {
        username: '#username',
        password: '#password',
        submit: '.login-button'
      }
    },
    
    // Filters to interact with to load data
    filterSelectors: [
      '.filter-dropdown',
      '.date-picker',
      '.status-filter',
      '.search-input',
      '[data-testid="filter-button"]'
    ],
    
    // Elements that indicate data has loaded
    dataIndicators: [
      '.data-table tbody tr',
      '.shipment-card',
      '.journey-item',
      '.dashboard-widget[data-loaded="true"]',
      '.freight-listing .item'
    ]
  };

  try {
    console.log('📤 Sending dynamic extraction request...');
    console.log(`🎯 Target: ${requestBody.webUrl}`);
    console.log(`⏱️ Wait time: ${requestBody.waitTime}ms`);
    console.log(`🎛️ Filters: ${requestBody.filterSelectors.length}`);
    console.log(`📊 Data indicators: ${requestBody.dataIndicators.length}\n`);

    const response = await fetch(`${API_BASE}/api/extract-dynamic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Dynamic extraction successful!\n');
      
      console.log('📊 Extraction Summary:');
      console.log(`   • Strategy: ${result.strategy}`);
      console.log(`   • Total Elements: ${result.extractedElements}`);
      console.log(`   • Loading Phases: ${result.loadingPhases.length}`);
      console.log(`   • Colors Found: ${result.colorPalette.length}`);
      console.log(`   • Fonts Found: ${result.typographySystem.fonts.length}\n`);

      console.log('🔍 Component Types:');
      Object.entries(result.summary.componentTypes).forEach(([type, count]) => {
        console.log(`   • ${type}: ${count}`);
      });

      console.log('\n📈 Loading Phases:');
      result.loadingPhases.forEach((phase, index) => {
        console.log(`   Phase ${index + 1} (${phase.phase}): ${phase.elementCount} elements in ${phase.duration}ms`);
      });

      console.log('\n🎨 Sample Colors:');
      result.colorPalette.slice(0, 5).forEach(color => {
        console.log(`   • ${color.hex} (${color.original})`);
      });

      console.log('\n📝 Sample Fonts:');
      result.typographySystem.fonts.slice(0, 3).forEach(font => {
        console.log(`   • ${font}`);
      });

      console.log('\n🧩 Sample Elements:');
      result.elements.slice(0, 3).forEach(element => {
        console.log(`   • ${element.type}: ${element.tagName} - "${element.text?.substring(0, 50) || 'No text'}"`);
      });

      return result;
    } else {
      console.error('❌ Dynamic extraction failed:', result.error);
      console.error('Details:', result.message);
      return null;
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

/**
 * Test 2: Simple Dynamic Extraction (without authentication)
 * Test on a simpler dynamic site to verify the system works
 */
async function testSimpleDynamicExtraction() {
  console.log('\n🌐 Testing Simple Dynamic Extraction...\n');

  const requestBody = {
    webUrl: 'https://github.com/trending',
    waitTime: 15000, // 15 seconds
    extractionStrategy: 'single', // Single comprehensive extraction
    
    // No authentication needed
    authentication: null,
    
    // Simple filters
    filterSelectors: [
      '.select-menu-button', // Language filter
      '.btn-link' // Time period filter
    ],
    
    // Data indicators
    dataIndicators: [
      '.Box-row', // Repository items
      '.repo-list-item'
    ]
  };

  try {
    console.log('📤 Sending simple dynamic extraction request...');
    console.log(`🎯 Target: ${requestBody.webUrl}\n`);

    const response = await fetch(`${API_BASE}/api/extract-dynamic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Simple dynamic extraction successful!\n');
      
      console.log('📊 Extraction Summary:');
      console.log(`   • Total Elements: ${result.extractedElements}`);
      console.log(`   • Colors Found: ${result.colorPalette.length}`);
      console.log(`   • Component Types: ${Object.keys(result.summary.componentTypes).length}\n`);

      console.log('🔍 Top Component Types:');
      const sortedTypes = Object.entries(result.summary.componentTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      sortedTypes.forEach(([type, count]) => {
        console.log(`   • ${type}: ${count}`);
      });

      return result;
    } else {
      console.error('❌ Simple dynamic extraction failed:', result.error);
      return null;
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

/**
 * Test 3: Progressive vs Single Extraction Comparison
 */
async function testExtractionStrategies() {
  console.log('\n⚖️ Testing Extraction Strategies Comparison...\n');

  const baseRequest = {
    webUrl: 'https://httpbin.org/html',
    waitTime: 10000,
    filterSelectors: [],
    dataIndicators: []
  };

  try {
    // Test Progressive Strategy
    console.log('📈 Testing Progressive Strategy...');
    const progressiveResponse = await fetch(`${API_BASE}/api/extract-dynamic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...baseRequest,
        extractionStrategy: 'progressive'
      })
    });
    const progressiveResult = await progressiveResponse.json();

    // Test Single Strategy
    console.log('📸 Testing Single Strategy...');
    const singleResponse = await fetch(`${API_BASE}/api/extract-dynamic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...baseRequest,
        extractionStrategy: 'single'
      })
    });
    const singleResult = await singleResponse.json();

    // Compare Results
    console.log('\n📊 Strategy Comparison:');
    console.log(`Progressive: ${progressiveResult.extractedElements} elements, ${progressiveResult.loadingPhases?.length || 0} phases`);
    console.log(`Single: ${singleResult.extractedElements} elements, ${singleResult.loadingPhases?.length || 0} phases`);

    return { progressive: progressiveResult, single: singleResult };

  } catch (error) {
    console.error('❌ Strategy comparison failed:', error.message);
    return null;
  }
}

/**
 * Test 4: Health Check
 */
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...\n');

  try {
    const response = await fetch(`${API_BASE}/api/health`);
    const health = await response.json();

    console.log('✅ Server Health Check:');
    console.log(`   • Status: ${health.status}`);
    console.log(`   • Version: ${health.version}`);
    console.log(`   • Features: ${health.features.length}`);
    
    console.log('\n🔧 Available Features:');
    health.features.forEach(feature => {
      console.log(`   • ${feature}`);
    });

    return health;

  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return null;
  }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log('🚀 Starting Dynamic Extraction Tests\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Health Check
    await testHealthCheck();
    
    console.log('\n' + '=' .repeat(60));
    
    // Test 2: Simple Dynamic Extraction
    await testSimpleDynamicExtraction();
    
    console.log('\n' + '=' .repeat(60));
    
    // Test 3: Strategy Comparison
    await testExtractionStrategies();
    
    console.log('\n' + '=' .repeat(60));
    
    // Test 4: FreightTiger (Main Test)
    await testFreightTigerExtraction();
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

/**
 * Usage Examples
 */
function printUsageExamples() {
  console.log('\n📖 Usage Examples:\n');
  
  console.log('1. Basic Dynamic Extraction:');
  console.log(`
POST /api/extract-dynamic
{
  "webUrl": "https://your-app.com",
  "waitTime": 20000,
  "extractionStrategy": "progressive"
}
  `);

  console.log('2. With Authentication:');
  console.log(`
POST /api/extract-dynamic
{
  "webUrl": "https://your-app.com/dashboard",
  "waitTime": 25000,
  "authentication": {
    "type": "form",
    "loginUrl": "https://your-app.com/login",
    "credentials": {
          "username": PLACEHOLDER_CREDENTIALS.email,
    "password": process.env.TEST_PASSWORD || "secure-test-password"
    },
    "selectors": {
      "username": "#email",
      "password": "#password",
      "submit": ".login-btn"
    }
  }
}
  `);

  console.log('3. With Filter Interactions:');
  console.log(`
POST /api/extract-dynamic
{
  "webUrl": "https://your-app.com/data",
  "waitTime": 30000,
  "filterSelectors": [
    ".date-filter",
    ".category-dropdown",
    ".apply-filters-btn"
  ],
  "dataIndicators": [
    ".data-table tbody tr",
    ".results-count",
    ".loading-complete"
  ]
}
  `);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(() => {
    printUsageExamples();
    process.exit(0);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export {
  testFreightTigerExtraction,
  testSimpleDynamicExtraction,
  testExtractionStrategies,
  testHealthCheck,
  runAllTests
}; 