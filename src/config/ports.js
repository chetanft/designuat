/**
 * Centralized Port Configuration
 * Single source of truth for all port settings
 */

const DEFAULT_PORT = 3006;
const VITE_DEV_PORT = 5173;

const PORTS = {
  // Main application port
  APP: process.env.PORT || DEFAULT_PORT,
  
  // Development ports
  VITE_DEV: VITE_DEV_PORT,
  
  // MCP Server port
  MCP_SERVER: process.env.MCP_PORT || 3845,
  
  // Fallback ports for testing
  FALLBACK_PORTS: [3006, 3007, 3008, 3009, 3010]
};

/**
 * Get the main application port
 */
function getAppPort() {
  return PORTS.APP;
}

/**
 * Get all allowed CORS origins based on ports
 */
function getCorsOrigins() {
  return [
    `http://localhost:${PORTS.APP}`,
    `http://127.0.0.1:${PORTS.APP}`,
    `http://localhost:${PORTS.VITE_DEV}`,
    `http://127.0.0.1:${PORTS.VITE_DEV}`,
    // Add fallback ports for development
    ...PORTS.FALLBACK_PORTS.map(port => `http://localhost:${port}`),
    ...PORTS.FALLBACK_PORTS.map(port => `http://127.0.0.1:${port}`)
  ];
}

/**
 * Find an available port starting from the preferred port
 */
async function findAvailablePort(preferredPort = PORTS.APP) {
  const net = await import('net');
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(preferredPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      // Try next port
      resolve(findAvailablePort(preferredPort + 1));
    });
  });
}

export {
  PORTS,
  DEFAULT_PORT,
  getAppPort,
  getCorsOrigins,
  findAvailablePort
}; 