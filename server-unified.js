import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';

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
import ComparisonAnalyzer from './src/ai/ComparisonAnalyzer.js';
import { ReportCompressor } from './src/utils/reportCompressor.js';
import { ErrorCategorizer } from './src/utils/errorCategorizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
import { getAppPort, getCorsOrigins } from './src/config/ports.js';
const port = getAppPort();

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

// Set proper MIME types for JavaScript modules
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (req.path.endsWith('.mjs')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (req.path.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  }
  next();
});

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

const webExtractor = new WebExtractor(config.puppeteer || {});
const enhancedWebExtractor = new EnhancedWebExtractor(config.puppeteer || {});
const comparisonEngine = new ComparisonEngine();
const reportGenerator = new ReportGenerator(config);
const componentCategorizer = new ComponentCategorizer();
const categorizedReportGenerator = new CategorizedReportGenerator();
const comparisonAnalyzer = new ComparisonAnalyzer();



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
  
  // Ensure the extractor is properly initialized with retries
  let initializationAttempts = 0;
  const maxAttempts = 3;
  
  while (initializationAttempts < maxAttempts) {
    try {
      // Check if browser and page are ready
      if (!extractor.browser || extractor.browser.process()?.killed || !extractor.page || extractor.page.isClosed()) {
        console.log(`🔄 Web extractor not ready (attempt ${initializationAttempts + 1}/${maxAttempts}), reinitializing...`);
        await extractor.initialize();
        
        // Wait a bit to ensure initialization is complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Test if the extractor is actually ready
      if (extractor.page && !extractor.page.isClosed()) {
        console.log('✅ Web extractor is ready for extraction');
        break;
      }
      
    } catch (error) {
      initializationAttempts++;
      console.warn(`⚠️ Web extractor initialization attempt ${initializationAttempts} failed:`, error.message);
      
      if (initializationAttempts >= maxAttempts) {
        throw new Error(`Failed to initialize web extractor after ${maxAttempts} attempts: ${error.message}`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    initializationAttempts++;
  }
  
  if (initializationAttempts >= maxAttempts) {
    console.warn(`📊 Progress: web-extraction - 0% - Web extraction failed, using fallback data structure`);
    return {
      url: url,
      components: [],
      metadata: {
        timestamp: new Date().toISOString(),
        extractionMethod: 'fallback',
        error: 'Web extractor failed to initialize after multiple attempts',
        note: 'Web extraction failed due to browser connectivity issues. Figma comparison can still proceed.'
      },
      styles: [],
      performance: {
        totalTime: 0,
        componentCount: 0
      }
    };
  }
  
  // Now attempt extraction
  try {
    return await extractor.extractWebData(url, authentication);
  } catch (error) {
    console.warn(`Web extraction failed during execution:`, error.message);
    return {
      url: url,
      components: [],
      metadata: {
        timestamp: new Date().toISOString(),
        extractionMethod: 'fallback',
        error: error.message,
        note: 'Web extraction failed during execution. Figma comparison can still proceed.'
      },
      styles: [],
      performance: {
        totalTime: 0,
        componentCount: 0
      }
    };
  }
}

// Initialize components
async function initializeComponents() {
  try {
    console.log('🔧 Initializing components...');
    
    // Set global references
    global.figmaExtractor = figmaExtractor;
    global.webExtractor = webExtractor;
    global.enhancedWebExtractor = enhancedWebExtractor;
    global.comparisonEngine = comparisonEngine;
    global.reportGenerator = reportGenerator;
    
    // Initialize Figma extractor
    console.log('🎨 Initializing Figma extractor...');
    await figmaExtractor.initialize();
    console.log('✅ Figma extractor initialized');
    
    // Enhanced Web Extractor initialization with fallback
    console.log('🌐 Initializing basic web extractor...');
    try {
      await global.webExtractor.initialize();
      console.log('✅ Basic web extractor initialized');
    } catch (error) {
      console.log(`⚠️ Basic web extractor failed to initialize, server will continue without it: ${error.message}`);
      global.webExtractor = null;
    }

    // Enhanced Web Extractor with comprehensive fallback
    console.log('🚀 Initializing enhanced web extractor...');
    let enhancedInitialized = false;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await global.enhancedWebExtractor.initialize();
        console.log('✅ Enhanced web extractor initialized successfully');
        enhancedInitialized = true;
        break;
      } catch (error) {
        console.log(`⚠️ Enhanced web extractor initialization attempt ${attempt} failed: ${error.message}`);
        if (attempt < 3) {
          console.log('🔄 Retrying enhanced web extractor initialization...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!enhancedInitialized) {
      console.log('⚠️ Enhanced web extractor failed to initialize after 3 attempts, server will continue without it');
      global.enhancedWebExtractor = null;
    }

    

    console.log('🏗️ Server components initialized (some may be in fallback mode)');
    
    // Test MCP Direct Extractor if available
    if (mcpDirectExtractor) {
      try {
        console.log('🧪 Testing MCP Framelink connection...');
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
    
    // Wait a bit more to ensure everything is stable
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    componentsInitialized = true;
    console.log('✅ All components initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize components:', error);
    componentsInitialized = false;
    throw error;
  }
}

// Initialize components before starting server
let componentsInitialized = false;

// Frontend routing - modern UI only
app.get('/', async (req, res) => {
  // Always serve modern UI
  const modernPath = path.join(__dirname, 'public/modern/index.html');
  try {
    await fs.access(modernPath);
    res.sendFile(modernPath);
  } catch (error) {
    res.status(500).json({
      error: 'Modern UI not built',
      message: 'Please run "cd frontend && npm run build" to build the frontend'
    });
  }
});

// SPA routing for modern UI - specific routes (MUST be before catch-all)
app.get('/new-comparison', (req, res) => {
  const indexPath = path.resolve(__dirname, 'public/modern/index.html');
  console.log(`📱 Serving modern UI for ${req.path} from ${indexPath}`);
  res.sendFile(indexPath);
});

app.get('/settings', (req, res) => {
  const indexPath = path.resolve(__dirname, 'public/modern/index.html');
  console.log(`📱 Serving modern UI for ${req.path} from ${indexPath}`);
  res.sendFile(indexPath);
});

// Handle /reports route - serve modern UI for HTML requests, continue for API requests
app.get('/reports', (req, res, next) => {
  // If it's a request for the reports page (not the API), serve the modern UI
  if (req.headers.accept?.includes('text/html')) {
    const indexPath = path.resolve(__dirname, 'public/modern/index.html');
    console.log(`📱 Serving modern UI for ${req.path} from ${indexPath}`);
    res.sendFile(indexPath);
  } else {
    next();
  }
});

// Static file serving - modern UI only
app.use('/modern/assets', express.static(path.join(__dirname, 'public/modern/assets')));
app.use('/assets', express.static(path.join(__dirname, 'public/modern/assets')));
app.get('/vite.svg', (req, res) => {
  // Return a 204 No Content for missing favicon to prevent errors
  res.status(204).end();
});

// SPA routing for modern UI - catch all modern routes (AFTER static files)
app.get('/modern/*', (req, res, next) => {
  // Skip assets and other static files
  if (req.path.startsWith('/modern/assets/') || 
      req.path.includes('.js') || 
      req.path.includes('.css') || 
      req.path.includes('.svg') || 
      req.path.includes('.png') || 
      req.path.includes('.jpg') || 
      req.path.includes('.ico')) {
    return next();
  }
  
  const indexPath = path.resolve(__dirname, 'public/modern/index.html');
  console.log(`📱 Serving modern UI for ${req.path} from ${indexPath}`);
  res.sendFile(indexPath);
});

// Handle modern UI routes (SPA routing) - catch-all for other routes (AFTER static files)
app.get('*', (req, res, next) => {
  // If it's an API route, continue to next handler
  if (req.path.startsWith('/api/') || req.path.startsWith('/output/') || req.path.startsWith('/reports/') || req.path.startsWith('/images/') || req.path.startsWith('/screenshots/')) {
    return next();
  }
  
  // If it's a file request (has extension), continue to next handler
  if (req.path.includes('.')) {
    return next();
  }
  
  // Serve modern UI for all other routes
  const modernPath = path.join(__dirname, 'public/modern/index.html');
  res.sendFile(modernPath);
});

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
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    components: {
      figmaExtractor: global.figmaExtractor ? 'initialized' : 'failed',
      webExtractor: global.webExtractor ? 'initialized' : 'fallback_mode',
      enhancedWebExtractor: global.enhancedWebExtractor ? 'initialized' : 'fallback_mode',
      comparisonEngine: 'initialized',
      reportGenerator: 'initialized',
      fallbackSystem: global.fallbackEnabled ? 'active' : 'inactive'
    },
    capabilities: {
      figmaExtraction: !!global.figmaExtractor,
      webExtraction: !!(global.webExtractor || global.enhancedWebExtractor),
      freightTigerFallback: global.fallbackEnabled,
      mcpIntegration: !!global.mcpFramelink
    },
    mcp: {
      type: global.mcpFramelink ? 'framelink' : 'none',
      officialFigmaAvailable: !!global.figmaExtractor,
      thirdPartyAvailable: !!global.mcpFramelink
    },
    freightTiger: {
      optimized: true,
      errorPatternsSupported: [
        'target_site_module_error',
        'target_site_javascript_error',
        'browser_infrastructure',
        'navigation_timeout'
      ]
    }
  };

  res.json(health);
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

// Middleware to ensure components are initialized
const ensureComponentsInitialized = (req, res, next) => {
  if (!componentsInitialized) {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Components are still initializing. Please try again in a few seconds.',
      retry: true
    });
  }
  next();
};

// Main comparison endpoint
app.post('/api/compare', async (req, res) => {
  try {
    const { figmaUrl, webUrl, authentication } = req.body;
    
    console.log(`🔄 Starting comparison: ${figmaUrl} vs ${webUrl}`);
    
    // Extract Figma data
    let figmaData;
    try {
      figmaData = await extractFigmaData(figmaUrl);
      console.log(`✅ Figma extraction: ${figmaData.components?.length || 0} components`);
    } catch (error) {
      console.error('❌ Figma extraction failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Figma extraction failed',
        details: error.message,
        suggestions: [
          'Check if the Figma file URL is correct',
          'Verify you have access to the Figma file',
          'Ensure Figma API tokens are configured properly',
          'Try again with a different Figma file'
        ]
      });
    }

    // Extract web data
    let webData;
    try {
      const extractor = global.enhancedWebExtractor || global.webExtractor;
      if (!extractor) {
        throw new Error('No web extractor available - browser initialization failed');
      }
      webData = await extractor.extractData(webUrl, authentication);
      console.log(`✅ Web extraction: ${webData.elements?.length || 0} elements`);
    } catch (error) {
      console.error('❌ Web extraction failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Web extraction failed',
        details: error.message,
        suggestions: [
          'Check if the website URL is accessible',
          'Verify the website is not blocking automated access',
          'Ensure browser dependencies are installed properly',
          'Try restarting the server to reinitialize browsers'
        ]
      });
    }

    // Perform comparison
    console.log('🔍 Performing comparison...');
    const comparisonEngine = global.comparisonEngine;
    if (!comparisonEngine) {
      throw new Error('Comparison engine not initialized');
    }
    const comparison = await comparisonEngine.compareDesigns(figmaData, webData);
    
    // Generate reports  
    console.log('📊 Generating reports...');
    const reportGenerator = global.reportGenerator;
    if (!reportGenerator) {
      throw new Error('Report generator not initialized');
    }
    const htmlReport = await reportGenerator.generateReport(comparison, null, { 
      filename: `comparison-${Date.now()}.html`,
      title: 'Figma vs Web Comparison Report'
    });
    const jsonReport = await reportGenerator.generateJSONReport(comparison, null, {
      filename: `comparison-${Date.now()}.json`
    });
    
    const reports = {
      html: htmlReport,
      json: jsonReport,
      message: 'Reports generated successfully'
    };
    
    // Response
    const response = {
      success: true,
      summary: {
        figma: {
          fileId: figmaData.fileId,
          fileName: figmaData.fileName,
          componentsExtracted: figmaData.components?.length || 0,
          extractionMethod: figmaData.metadata?.method || 'unknown'
        },
        web: {
          url: webData.url,
          elementsExtracted: webData.elements?.length || 0,
          authenticationUsed: authentication?.type || 'none',
          extractionMethod: webData.metadata?.method || 'unknown'
        },
        comparison: {
          componentsAnalyzed: comparison.matches?.length || 0,
          totalDeviations: comparison.deviations?.length || 0,
          totalMatches: comparison.matches?.length || 0,
          severity: comparison.severitySummary || { high: 0, medium: 0, low: 0 }
        }
      },
      reports: reports,
      metadata: {
        timestamp: new Date().toISOString(),
        toolVersion: '1.0.0'
      }
    };

    console.log('✅ Comparison completed successfully');
    res.json(response);
    
  } catch (error) {
    console.error('❌ Comparison failed:', error);
    res.status(500).json({
      success: false,
      error: 'Comparison failed',
      details: error.message
    });
  }
});



// AI Analysis endpoint
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { comparisonData, options = {} } = req.body;
    
    if (!comparisonData) {
      return res.status(400).json({
        error: 'Missing comparison data',
        message: 'Comparison data is required for AI analysis'
      });
    }

    const analysis = await comparisonAnalyzer.analyzeComparison(comparisonData);
    
    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    res.status(500).json({
      error: 'AI analysis failed',
      message: error.message
    });
  }
});

// Smart Suggestions endpoint
app.post('/api/ai/suggestions', async (req, res) => {
  try {
    const { comparisonData, userHistory = [], preferences = {} } = req.body;
    
    // Generate contextual suggestions based on comparison data and user history
    const suggestions = await comparisonAnalyzer.generateSmartSuggestions({
      comparisonData,
      userHistory,
      preferences
    });
    
    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Smart Suggestions error:', error);
    res.status(500).json({
      error: 'Failed to generate suggestions',
      message: error.message
    });
  }
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

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.on('join-comparison', (comparisonId) => {
    socket.join(`comparison-${comparisonId}`);
    console.log(`📊 Client ${socket.id} joined comparison ${comparisonId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Add socket.io instance to app for use in routes
app.set('io', io);

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

// Start server on dedicated port 3006
const startServer = async () => {
  try {
    // Initialize components first
    await initializeComponents();
    
    // Use fixed port 3006 - no fallback
    server.listen(3006, () => {
      console.log(`🌐 Figma-Web Comparison Tool running at http://localhost:3006`);
      console.log(`🚀 Modern UI: http://localhost:3006`);
      console.log(`🔧 Dedicated port: 3006`);
    });
    
    // Add graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      try {
        // Close server
        server.close(() => {
          console.log('✅ HTTP server closed');
        });
        
        // Cleanup extractors
        console.log('🧹 Cleaning up extractors...');
        
        if (webExtractor && typeof webExtractor.close === 'function') {
          await webExtractor.close();
          console.log('✅ Web extractor closed');
        }
        
        if (enhancedWebExtractor && typeof enhancedWebExtractor.close === 'function') {
          await enhancedWebExtractor.close();
          console.log('✅ Enhanced web extractor closed');
        }
        
        if (enhancedWebExtractor && typeof enhancedWebExtractor.forceCleanup === 'function') {
          await enhancedWebExtractor.forceCleanup();
          console.log('✅ Enhanced web extractor force cleanup completed');
        }
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
        
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };
    
    // Handle different shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();