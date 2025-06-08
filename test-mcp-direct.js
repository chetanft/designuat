// Test script to directly interact with MCP Framelink server
async function testMCPServer() {
  try {
    console.log('🧪 Testing MCP Framelink server directly...');
    
    // Get session ID with timeout
    console.log('1. Getting session ID...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const sseResponse = await fetch('http://localhost:3845/sse', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const sseText = await sseResponse.text();
    console.log('SSE Response (first 200 chars):', sseText.substring(0, 200));
    
    const sessionMatch = sseText.match(/sessionId=([a-f0-9-]+)/);
    if (!sessionMatch) {
      throw new Error('Could not get session ID');
    }
    
    const sessionId = sessionMatch[1];
    console.log('✅ Got session ID:', sessionId);
    
    // Test list_tools first
    console.log('\n2. Testing list_tools...');
    const listToolsRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list"
    };
    
    const listResponse = await fetch(`http://localhost:3845/messages?sessionId=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(listToolsRequest)
    });
    
    console.log('List tools response status:', listResponse.status);
    const listResult = await listResponse.text();
    console.log('List tools response:', listResult);
    
    if (listResponse.ok) {
      try {
        const parsedList = JSON.parse(listResult);
        console.log('Available tools:', JSON.stringify(parsedList, null, 2));
      } catch (e) {
        console.log('Could not parse list response as JSON');
      }
    }
    
    // Test get_figma_data if list_tools worked
    if (listResponse.ok) {
      console.log('\n3. Testing get_figma_data...');
      const getFigmaRequest = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "get_figma_data",
          arguments: {
            fileKey: "fb5Yc1aKJv9YWsMLnNlWeK"
          }
        }
      };
      
      const figmaResponse = await fetch(`http://localhost:3845/messages?sessionId=${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(getFigmaRequest)
      });
      
      console.log('Figma response status:', figmaResponse.status);
      const figmaResult = await figmaResponse.text();
      console.log('Figma response:', figmaResult.substring(0, 500) + '...');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMCPServer(); 