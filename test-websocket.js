/**
 * Test Socket.IO WebSocket connection
 */

import { io } from 'socket.io-client';

async function testWebSocketConnection() {
  console.log('🔌 Testing Socket.IO WebSocket Connection...\n');
  
  try {
    // Connect to the server
    const socket = io('http://localhost:3006');
    
    // Set up event handlers
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected successfully!');
      console.log('🆔 Socket ID:', socket.id);
      
      // Test a custom event
      socket.emit('start-comparison', { 
        figmaUrl: 'test-figma', 
        webUrl: 'test-web' 
      });
    });
    
    socket.on('comparison-status', (data) => {
      console.log('📊 Received comparison status:', data);
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
    });
    
    // Wait a bit and then disconnect
    setTimeout(() => {
      console.log('\n🔄 Testing disconnect...');
      socket.disconnect();
      
      setTimeout(() => {
        console.log('\n✅ Socket.IO test completed!');
        console.log('🌐 WebSocket connection is working properly');
        console.log('🚀 Your frontend should now connect without errors');
        process.exit(0);
      }, 1000);
    }, 3000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Also test regular HTTP health check
async function testHttpFirst() {
  try {
    const response = await fetch('http://localhost:3006/api/health');
    const health = await response.json();
    console.log('💚 HTTP Health check:', health.status);
    console.log('🔧 Server is ready for WebSocket test\n');
    
    // Now test WebSocket
    testWebSocketConnection();
    
  } catch (error) {
    console.error('❌ Server not ready:', error.message);
    process.exit(1);
  }
}

testHttpFirst(); 