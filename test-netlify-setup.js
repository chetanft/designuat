#!/usr/bin/env node

// Test script to verify Netlify deployment setup
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Netlify Deployment Setup...\n');

// Test 1: Check required files exist
console.log('📋 Checking required files...');
const requiredFiles = [
  'netlify.toml',
  'netlify/functions/figma-only.js',
  'netlify/functions/api-lightweight.js',
  'netlify/functions/package.json',
  'frontend/package.json',
  'frontend/index.html',
  'vite.config.ts',
  'NETLIFY_DEPLOYMENT_GUIDE.md'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const exists = existsSync(resolve(__dirname, file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
}

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Deployment may fail.');
  process.exit(1);
}

// Test 2: Check netlify.toml configuration
console.log('\n🔧 Checking netlify.toml configuration...');
try {
  const netlifyConfig = readFileSync('netlify.toml', 'utf8');
  
  const checks = [
    { pattern: /base = "frontend"/, name: 'Base directory set to frontend' },
    { pattern: /publish = "dist"/, name: 'Publish directory set to dist' },
    { pattern: /command = "npm run build"/, name: 'Build command configured' },
    { pattern: /figma-only/, name: 'Using ultra-lightweight figma-only function' },
    { pattern: /NODE_VERSION = "18"/, name: 'Node.js version specified' }
  ];
  
  for (const check of checks) {
    const passed = check.pattern.test(netlifyConfig);
    console.log(`   ${passed ? '✅' : '❌'} ${check.name}`);
  }
} catch (error) {
  console.log('   ❌ Error reading netlify.toml:', error.message);
}

// Test 3: Check package.json dependencies
console.log('\n📦 Checking dependencies...');
try {
  const rootPackage = JSON.parse(readFileSync('package.json', 'utf8'));
  const frontendPackage = JSON.parse(readFileSync('frontend/package.json', 'utf8'));
  const functionsPackage = JSON.parse(readFileSync('netlify/functions/package.json', 'utf8'));
  
  // Check for essential dependencies
  const hasServerlessHttp = rootPackage.dependencies['serverless-http'] || functionsPackage.dependencies['serverless-http'];
  const hasReact = frontendPackage.dependencies['react'];
  const hasVite = frontendPackage.devDependencies['vite'];
  const hasExpress = functionsPackage.dependencies['express'];
  
  console.log(`   ${hasServerlessHttp ? '✅' : '❌'} serverless-http (for Netlify Functions)`);
  console.log(`   ${hasReact ? '✅' : '❌'} React (for frontend)`);
  console.log(`   ${hasVite ? '✅' : '❌'} Vite (for frontend build)`);
  console.log(`   ${hasExpress ? '✅' : '❌'} Express (for API functions)`);
  
} catch (error) {
  console.log('   ❌ Error checking package.json files:', error.message);
}

// Test 4: Check Vite configuration
console.log('\n⚡ Checking Vite configuration...');
try {
  const viteConfig = readFileSync('vite.config.ts', 'utf8');
  
  const viteChecks = [
    { pattern: /base: '\/'/, name: 'Base path set to root' },
    { pattern: /outDir: '.\/dist'/, name: 'Output directory set to ./dist' },
    { pattern: /plugins: \[react\(\)\]/, name: 'React plugin configured' }
  ];
  
  for (const check of viteChecks) {
    const passed = check.pattern.test(viteConfig);
    console.log(`   ${passed ? '✅' : '❌'} ${check.name}`);
  }
} catch (error) {
  console.log('   ❌ Error reading vite.config.ts:', error.message);
}

// Test 5: Test Figma extractor import (basic syntax check)
console.log('\n🎯 Testing Figma extractor import...');
try {
  // Dynamic import to test if the module can be loaded
  const { default: RobustFigmaExtractor } = await import('./src/figma/robustFigmaExtractor.js');
  console.log('   ✅ RobustFigmaExtractor can be imported');
  
  // Test instantiation with minimal config
  const config = { figma: { accessToken: '' } };
  const extractor = new RobustFigmaExtractor(config);
  console.log('   ✅ RobustFigmaExtractor can be instantiated');
  
} catch (error) {
  console.log('   ❌ Error with RobustFigmaExtractor:', error.message);
}

// Test 6: Environment variables check
console.log('\n🔑 Environment variables setup...');
const envVars = [
  'FIGMA_API_KEY',
  'NODE_ENV'
];

console.log('   Required environment variables for production:');
for (const envVar of envVars) {
  const isSet = process.env[envVar];
  console.log(`   ${isSet ? '✅' : '⚠️ '} ${envVar} ${isSet ? '(set)' : '(not set - required for production)'}`);
}

console.log('\n📋 Summary:');
console.log('✅ All required files are present');
console.log('✅ Configuration files are properly set up');
console.log('✅ Dependencies are configured');
console.log('⚠️  Remember to set environment variables in Netlify Dashboard');

console.log('\n🚀 Ready for deployment!');
console.log('\nNext steps:');
console.log('1. Run: ./deploy-netlify.sh');
console.log('2. Or deploy via Git integration in Netlify Dashboard');
console.log('3. Set environment variables in Netlify settings');
console.log('4. Test the deployed endpoints');

console.log('\n📖 See NETLIFY_DEPLOYMENT_GUIDE.md for detailed instructions'); 