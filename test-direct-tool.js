// Test direct tool call
import mcpBridge from './src/figma/mcpBridge.js';

async function testDirectTool() {
  console.log('🧪 Testing direct MCP tool call...');
  
  try {
    const result = await mcpBridge.getFigmaData({
      fileKey: 'fb5Yc1aKJv9YWsMLnNlWeK'
    });
    
    console.log('✅ Success:', result);
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Full error:', error);
  }
}

testDirectTool(); 