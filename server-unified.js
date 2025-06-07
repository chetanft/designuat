import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import our real implementations
import FigmaExtractor from './src/figma/extractor.js';
import FigmaMCPIntegration from './src/figma/mcpIntegration.js';
import MCPDirectFigmaExtractor from './src/figma/mcpDirectExtractor.js';
import { WebExtractor } from './src/scraper/webExtractor.js';
import EnhancedWebExtractor from './src/scraper/enhancedWebExtractor.js';
import ComparisonEngine from './src/compare/comparisonEngine.js';
import ReportGenerator from './src/report/reportGenerator.js';
import FigmaUrlParser from './src/figma/urlParser.js';
import EnhancedVisualComparison from './src/visual/enhancedVisualComparison.js';
import ComponentCategorizer from './src/analyze/componentCategorizer.js';
import CategorizedReportGenerator from './src/report/categorizedReportGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Load configuration
let config = {};
try {
  const configData = await fs.readFile('./config.json', 'utf8');
  config = JSON.parse(configData);
  console.log('✅ Configuration loaded');
} catch (error) {
  console.warn('⚠️ Could not load config.json, using defaults');
  config = {
    thresholds: {
      colorDifference: 10,
      sizeDifference: 5,
      spacingDifference: 3,
      fontSizeDifference: 2
    }
  };
}

app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Initialize extractors and engines
let figmaExtractor = new FigmaExtractor(config);
let mcpDirectExtractor = null;

// Try to initialize MCP Direct Extractor
try {
  mcpDirectExtractor = new MCPDirectFigmaExtractor(config);
  console.log('✅ MCP Direct Figma Extractor initialized');
} catch (error) {
  console.warn('⚠️ MCP Direct Figma Extractor not available:', error.message);
}

const webExtractor = new WebExtractor(config);
const enhancedWebExtractor = new EnhancedWebExtractor(config);
const comparisonEngine = new ComparisonEngine();
const reportGenerator = new ReportGenerator(config);
const componentCategorizer = new ComponentCategorizer();
const categorizedReportGenerator = new CategorizedReportGenerator();

// Helper functions (keeping existing logic)
function getOptimalFigmaExtractor() {
  console.log('📐 Using Figma Extractor (with MCP integration)');
  return figmaExtractor;
}

function getOptimalWebExtractor() {
  console.log('🚀 Using Enhanced Web Extractor');
  return enhancedWebExtractor;
}

async function extractFigmaData(fileId, nodeId = null) {
  const extractor = getOptimalFigmaExtractor();
  
  if (extractor === mcpDirectExtractor) {
    const result = await extractor.extractComponents(fileId, nodeId);
    return {
      fileId: fileId,
      nodeId: nodeId,
      components: result.components,
      metadata: result.metadata,
      extractionMethod: 'MCP Framelink',
      extractedAt: result.metadata.extractedAt
    };
  } else {
    return await extractor.extractDesignData(fileId, nodeId);
  }
}

async function extractWebData(url, authentication = null) {
  const extractor = getOptimalWebExtractor();
  return await extractor.extractWebData(url, authentication);
}

// Initialize components
async function initializeComponents() {
  try {
    await figmaExtractor.initialize();
    await webExtractor.initialize();
    await enhancedWebExtractor.initialize();
    
    if (mcpDirectExtractor) {
      try {
        const testResult = await mcpDirectExtractor.testMCPConnection();
        if (testResult.success) {
          console.log('✅ MCP Framelink connection verified');
        } else {
          console.warn('⚠️ MCP Framelink connection test failed:', testResult.error);
          mcpDirectExtractor = null;
        }
      } catch (error) {
        console.warn('⚠️ MCP Framelink test failed:', error.message);
        mcpDirectExtractor = null;
      }
    }
    
    console.log('✅ All components initialized');
  } catch (error) {
    console.error('❌ Failed to initialize components:', error);
  }
}

// Initialize on startup
initializeComponents();

// Frontend routing with legacy/modern support
app.get('/', (req, res) => {
  const useLegacy = req.query.legacy === 'true';
  const useModern = req.query.modern === 'true';
  
  if (useModern && !useLegacy) {
    // Check if modern build exists
    const modernPath = path.join(__dirname, 'public/modern/index.html');
    if (require('fs').existsSync(modernPath)) {
      res.sendFile(modernPath);
    } else {
      // Fallback to legacy if modern not built yet
      res.sendFile(path.join(__dirname, 'public-legacy/index.html'));
    }
  } else {
    // Serve legacy HTML by default
    res.sendFile(path.join(__dirname, 'public-legacy/index.html'));
  }
});

// Static file serving
app.use('/legacy', express.static('public-legacy'));
app.use('/modern', express.static('public/modern'));
app.use(express.static('public-legacy')); // Default to legacy

// Serve output files
app.use('/reports', express.static(path.join(__dirname, 'output', 'reports')));
app.use('/images', express.static(path.join(__dirname, 'output', 'images')));
app.use('/screenshots', express.static(path.join(__dirname, 'output', 'screenshots')));
app.use('/output', express.static(path.join(__dirname, 'output')));

// Favicon route to prevent 404s
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// API Routes - Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: 'unified-v1.0',
    features: ['legacy-ui', 'modern-ui', 'backward-compatibility']
  });
});

// API Routes - Reports
app.get('/api/reports', async (req, res) => {
  try {
    const reportsPath = path.join(__dirname, 'output', 'reports');
    
    try {
      await fs.mkdir(reportsPath, { recursive: true });
    } catch (e) {}
    
    const files = await fs.readdir(reportsPath);
    const reports = [];
    
    for (const file of files) {
      if (file.endsWith('.html') || file.endsWith('.json')) {
        try {
          const stats = await fs.stat(path.join(reportsPath, file));
          reports.push({
            name: file,
            path: `/output/reports/${file}`,
            type: file.endsWith('.html') ? 'html' : 'json',
            created: stats.mtime
          });
        } catch (e) {}
      }
    }
    
    reports.sort((a, b) => new Date(b.created) - new Date(a.created));
    
    res.json({
      success: true,
      reports: reports,
      count: reports.length
    });
    
  } catch (error) {
    console.error('Error loading reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load reports'
    });
  }
});

// Proxy to existing server for comparison functionality
app.use('/api/compare', (req, res) => {
  // For now, redirect to legacy server
  res.status(503).json({
    error: 'Comparison API temporarily unavailable',
    message: 'Please use the legacy interface for comparisons',
    legacyUrl: '/?legacy=true'
  });
});

// All other existing API endpoints (keeping them unchanged)
// Parse Figma URL endpoint
app.post('/api/parse-figma-url', (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: 'URL is required'
      });
    }

    const parsedData = FigmaUrlParser.parseUrl(url);
    res.json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// Test endpoints
app.post('/api/test/figma', async (req, res) => {
  try {
    const { figmaUrl, figmaFileId, nodeId } = req.body;
    
    let fileId = figmaFileId;
    let parsedNodeId = nodeId;

    if (figmaUrl) {
      const parsedData = FigmaUrlParser.parseUrl(figmaUrl);
      fileId = parsedData.fileId;
      parsedNodeId = parsedData.nodeId || nodeId;
    }

    if (!fileId) {
      return res.status(400).json({
        error: 'Missing Figma file ID or URL'
      });
    }

    const figmaData = await extractFigmaData(fileId, parsedNodeId);
    
    res.json({
      success: true,
      data: figmaData
    });
  } catch (error) {
    console.error('Figma test error:', error);
    res.status(500).json({
      error: 'Figma extraction failed',
      message: error.message
    });
  }
});

app.post('/api/test/web', async (req, res) => {
  try {
    const { webUrl, authentication } = req.body;

    if (!webUrl) {
      return res.status(400).json({
        error: 'Missing web URL'
      });
    }

    const webData = await extractWebData(webUrl, authentication);
    
    res.json({
      success: true,
      data: webData
    });
  } catch (error) {
    console.error('Web test error:', error);
    res.status(500).json({
      error: 'Web extraction failed',
      message: error.message
    });
  }
});

// Settings endpoints (keeping existing functionality)
app.post('/api/settings/test-connection', async (req, res) => {
  try {
    const { method, accessToken, serverUrl, endpoint, environment } = req.body;
    
    if (!method) {
      return res.status(400).json({
        success: false,
        error: 'Connection method is required'
      });
    }

    let testResult = {};

    if (method === 'api') {
      if (!accessToken) {
        return res.status(400).json({
          success: false,
          error: 'Access token is required for Figma API'
        });
      }

      try {
        let response = await fetch('https://api.figma.com/v1/me', {
          headers: {
            'X-Figma-Token': accessToken
          }
        });

        if (response.ok) {
          const userData = await response.json();
          testResult = {
            success: true,
            message: `Connected to Figma API successfully as ${userData.email}`,
            details: `Account: ${userData.handle || userData.email}`,
            connectionType: 'figma-api'
          };
        } else {
          testResult = {
            success: false,
            error: `Figma API returned ${response.status} ${response.statusText}`,
            message: 'Please check your access token and try again.'
          };
        }
      } catch (error) {
        testResult = {
          success: false,
          error: `Cannot connect to Figma API: ${error.message}`,
          message: 'Please check your internet connection and access token.'
        };
      }

    } else if (method === 'mcp-server') {
      const testUrl = `${serverUrl || 'http://localhost:3845'}${endpoint || '/sse'}`;
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );

        const controller = new AbortController();
        const response = await Promise.race([
          fetch(testUrl, { method: 'GET', signal: controller.signal }),
          timeoutPromise
        ]);
        
        controller.abort();
        
        if (response.ok) {
          testResult = {
            success: true,
            message: `MCP server is accessible at ${testUrl}`,
            details: `Status: ${response.status} ${response.statusText}`,
            connectionType: 'mcp-server'
          };
        } else {
          testResult = {
            success: false,
            error: `MCP server returned ${response.status} ${response.statusText}`,
            message: `Please check that the Figma Desktop App MCP server is enabled and running.`
          };
        }
      } catch (error) {
        testResult = {
          success: false,
          error: `Cannot connect to MCP server: ${error.message}`,
          message: `Please ensure the Figma Desktop App is running with MCP server enabled.`
        };
      }

    } else if (method === 'mcp-tools') {
      const mcpAvailable = FigmaMCPIntegration.checkThirdPartyMCPAvailability();
      
      if (mcpAvailable) {
        testResult = {
          success: true,
          message: 'MCP Figma tools are available in your environment',
          details: 'Tools detected and ready to use',
          connectionType: 'mcp-tools'
        };
      } else {
        testResult = {
          success: false,
          error: 'MCP Figma tools are not available in this environment'
        };
      }

    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid connection method'
      });
    }

    res.json(testResult);

  } catch (error) {
    console.error('Settings test error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during connection test'
    });
  }
});

app.post('/api/settings/save', async (req, res) => {
  try {
    const { method, accessToken, serverUrl, endpoint, environment } = req.body;
    
    if (!method) {
      return res.status(400).json({
        success: false,
        error: 'Connection method is required'
      });
    }

    if (method === 'api') {
      if (!accessToken) {
        return res.status(400).json({
          success: false,
          error: 'Access token is required for Figma API'
        });
      }
      
      config.figma.accessToken = accessToken;
      
    } else if (method === 'mcp-server') {
      config.mcp = config.mcp || {};
      config.mcp.official = {
        serverUrl: serverUrl || 'http://localhost:3845',
        endpoint: endpoint || '/sse',
        enabled: true
      };
      
    } else if (method === 'mcp-tools') {
      config.mcp = config.mcp || {};
      config.mcp.thirdParty = {
        environment: environment || 'auto',
        enabled: true
      };
    }

    const fs = await import('fs/promises');
    await fs.writeFile('./config.json', JSON.stringify(config, null, 2));

    if (method === 'mcp-server') {
      try {
        const mcpConfig = {
          "chat.mcp.discovery.enabled": true,
          "mcp": {
            "servers": {
              "Figma Dev Mode MCP": {
                "type": endpoint?.startsWith('/sse') ? "sse" : "http",
                "url": `${serverUrl}${endpoint || '/sse'}`
              }
            }
          },
          "chat.agent.enabled": true
        };
        
        await fs.writeFile('./mcp.json', JSON.stringify(mcpConfig, null, 2));
        console.log('✅ MCP configuration file updated');
      } catch (mcpError) {
        console.warn('⚠️ Failed to update MCP configuration file:', mcpError.message);
      }
    }

    try {
      await figmaExtractor.reinitialize(config);
      
      console.log(`✅ Settings saved and applied: ${method} connection`);
      
      res.json({
        success: true,
        message: 'Settings saved successfully',
        connectionType: method
      });
      
    } catch (initError) {
      console.error('Failed to reinitialize with new settings:', initError);
      res.status(500).json({
        success: false,
        error: `Settings saved but failed to initialize: ${initError.message}`
      });
    }

  } catch (error) {
    console.error('Settings save error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save settings'
    });
  }
});

// Function to find available port
async function findAvailablePort(startPort) {
  const net = await import('net');
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// Start server with port detection
const startServer = async () => {
  try {
    const availablePort = await findAvailablePort(port);
    app.listen(availablePort, () => {
      console.log(`🌐 Unified Figma-Web Comparison Tool running at http://localhost:${availablePort}`);
      console.log(`📊 Legacy UI: http://localhost:${availablePort}/?legacy=true`);
      console.log(`🚀 Modern UI: http://localhost:${availablePort}/?modern=true`);
      console.log(`🔧 Using unified server with backward compatibility`);
      if (availablePort !== port) {
        console.log(`⚠️ Note: Requested port ${port} was busy, using port ${availablePort} instead`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 