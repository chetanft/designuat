#!/usr/bin/env node

/**
 * Unified Server Startup Script
 * Ensures the correct server is started with proper port configuration
 */

import { spawn } from 'child_process';
import { getAppPort } from './src/config/ports.js';

const SERVER_OPTIONS = {
  'unified': {
    file: 'server-unified.js',
    description: 'Modern UI server (RECOMMENDED)'
  },
  'main': {
    file: 'server.js', 
    description: 'Main server'
  },
  'enhanced': {
    file: 'src/enhancedServer.js',
    description: 'Enhanced server (experimental)'
  }
};

function showUsage() {
  console.log('\n🚀 Figma-Web Comparison Tool Server Startup\n');
  console.log('Usage: node start-server.js [server-type]\n');
  console.log('Available servers:');
  
  Object.entries(SERVER_OPTIONS).forEach(([key, config]) => {
    console.log(`  ${key.padEnd(10)} - ${config.description}`);
  });
  
  console.log(`\nDefault: unified (recommended)`);
  console.log(`Port: ${getAppPort()}\n`);
}

function startServer(serverType = 'unified') {
  const serverConfig = SERVER_OPTIONS[serverType];
  
  if (!serverConfig) {
    console.error(`❌ Unknown server type: ${serverType}`);
    showUsage();
    process.exit(1);
  }
  
  console.log(`🚀 Starting ${serverConfig.description}...`);
  console.log(`📁 File: ${serverConfig.file}`);
  console.log(`🌐 Port: ${getAppPort()}`);
  console.log(`🔗 URL: http://localhost:${getAppPort()}\n`);
  
  const serverProcess = spawn('node', [serverConfig.file], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  serverProcess.on('error', (error) => {
    console.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Server exited with code ${code}`);
      process.exit(code);
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGTERM');
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const serverType = args[0];

if (args.includes('--help') || args.includes('-h')) {
  showUsage();
  process.exit(0);
}

startServer(serverType); 