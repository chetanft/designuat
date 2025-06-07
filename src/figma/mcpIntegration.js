/**
 * Enhanced Figma MCP Integration
 * Supports both Official Figma Dev Mode MCP Server and third-party MCP tools
 * Fallback to Figma REST API when MCP is not available
 * NO SIMULATION MODE - Only real data
 */

import mcpBridge from './mcpBridge.js';

class FigmaMCPIntegration {
  constructor(config) {
    this.config = config;
    this.mcpTools = null;
    this.isInitialized = false;
    this.mcpType = null; // 'official', 'third-party', 'api', or null
  }

  /**
   * Initialize MCP tools connection
   * Tries Official Figma MCP Server first, then third-party tools, then Figma API
   * NO FALLBACK TO SIMULATION
   */
  async initialize() {
    try {
      // First, try Official Figma Dev Mode MCP Server (only if enabled in config)
      if (this.config?.mcp?.official?.enabled && await this.checkOfficialFigmaMCP()) {
        console.log('🎨 Official Figma Dev Mode MCP Server detected - using official integration');
        this.mcpType = 'official';
        this.mcpTools = {
          getFigmaData: this.officialGetFigmaData.bind(this),
          downloadFigmaImages: this.officialDownloadFigmaImages.bind(this)
        };
      }
      // Second, try third-party MCP tools (only if enabled in config)
      else if (this.config?.mcp?.thirdParty?.enabled && this.checkMCPToolsAvailability()) {
        console.log('🔧 Third-party MCP Figma tools detected - using third-party integration');
        this.mcpType = 'third-party';
        this.mcpTools = {
          getFigmaData: this.thirdPartyGetFigmaData.bind(this),
          downloadFigmaImages: this.thirdPartyDownloadFigmaImages.bind(this)
        };
      }
      // Third, try Figma REST API
      else if (this.config?.figma?.accessToken) {
        console.log('🔑 Figma access token found - using Figma REST API');
        this.mcpType = 'api';
        this.mcpTools = {
          getFigmaData: this.apiFetchFigmaData.bind(this),
          downloadFigmaImages: this.apiDownloadFigmaImages.bind(this)
        };
      }
      // NO SIMULATION FALLBACK - Require real connection
      else {
        throw new Error(
          '❌ No Figma access method found. Please configure one of the following:\n\n' +
          '1. 🎨 Official Figma Dev Mode MCP Server:\n' +
          '   • Download and start the official Figma MCP server\n' +
          '   • Ensure it\'s running on http://127.0.0.1:3845\n\n' +
          '2. 🔧 Third-party MCP Tools:\n' +
          '   • Install MCP Figma tools in your environment\n' +
          '   • Ensure mcp_Framelink_Figma_MCP_get_figma_data is available\n\n' +
          '3. 🔑 Figma REST API:\n' +
          '   • Get your access token: https://www.figma.com/developers/api#access-tokens\n' +
          '   • Add it to config.json: {"figma": {"accessToken": "YOUR_TOKEN"}}\n\n' +
          '📖 Setup guide: https://www.figma.com/developers/api'
        );
      }

      this.isInitialized = true;
      console.log(`✅ MCP Integration initialized successfully (${this.mcpType} mode)`);
    } catch (error) {
      console.error('❌ Failed to initialize MCP tools:', error);
      throw error;
    }
  }

  /**
   * Check if Official Figma Dev Mode MCP Server is available
   * @returns {boolean} True if official MCP server is running
   */
  async checkOfficialFigmaMCP() {
    try {
      // First, try to read MCP configuration from mcp.json
      let mcpUrl = 'http://127.0.0.1:3845/sse'; // Default fallback
      
      try {
        const fs = await import('fs/promises');
        const mcpConfigContent = await fs.readFile('./mcp.json', 'utf8');
        const mcpConfig = JSON.parse(mcpConfigContent);
        
        if (mcpConfig?.mcp?.servers?.['Figma Dev Mode MCP']?.url) {
          mcpUrl = mcpConfig.mcp.servers['Figma Dev Mode MCP'].url;
          console.log(`🔧 Using MCP URL from mcp.json: ${mcpUrl}`);
        } else {
          console.log(`⚠️ No MCP URL found in mcp.json, using default: ${mcpUrl}`);
        }
      } catch (configError) {
        console.log(`⚠️ Could not read mcp.json, using default URL: ${mcpUrl}`);
      }
      
      // Check if the official Figma MCP server is running at configured URL
      console.log(`🔍 Testing Official Figma MCP Server at: ${mcpUrl}`);
      
      // SSE endpoints don't support HEAD requests, use GET with immediate abort
      const controller = new AbortController();
      const response = await fetch(mcpUrl, { 
        method: 'GET',
        signal: controller.signal
      });
      
      // Immediately abort the request since we just want to check availability
      controller.abort();
      
      console.log(`📡 MCP Server response: ${response.status} ${response.statusText}`);
      return response.ok;
    } catch (error) {
      console.log(`❌ MCP Server connection failed: ${error.message}`);
      // Server not running or not accessible
      return false;
    }
  }

  /**
   * Get Figma data using Official Figma Dev Mode MCP Server
   * @param {string} fileKey - Figma file key
   * @param {string} nodeId - Figma node ID
   * @param {number} depth - Traversal depth
   * @returns {Object} Figma design data
   */
  async officialGetFigmaData(fileKey, nodeId = null, depth = 5) {
    try {
      console.log(`🎨 Fetching data from Official Figma MCP Server: fileKey=${fileKey}, nodeId=${nodeId}`);
      
      // Read MCP configuration to get the correct server URL
      let mcpBaseUrl = 'http://127.0.0.1:3845';
      
      try {
        const fs = await import('fs/promises');
        const mcpConfigContent = await fs.readFile('./mcp.json', 'utf8');
        const mcpConfig = JSON.parse(mcpConfigContent);
        
        if (mcpConfig?.mcp?.servers?.['Figma Dev Mode MCP']?.url) {
          const fullUrl = mcpConfig.mcp.servers['Figma Dev Mode MCP'].url;
          // Extract base URL (remove /sse endpoint for API calls)
          mcpBaseUrl = fullUrl.replace(/\/sse$/, '');
          console.log(`🔧 Using MCP base URL from mcp.json: ${mcpBaseUrl}`);
        }
      } catch (configError) {
        console.log(`⚠️ Could not read mcp.json, using default URL: ${mcpBaseUrl}`);
      }
      
      // Use the global MCP functions if available (we're in an MCP environment)
      if (typeof global !== 'undefined' && global.mcp_Framelink_Figma_MCP_get_figma_data) {
        console.log(`🔧 Using global MCP function for Figma data extraction`);
        
        const params = { fileKey: fileKey };
        if (nodeId) params.nodeId = nodeId;
        if (depth && depth !== 5) params.depth = depth;
        
        const figmaData = await global.mcp_Framelink_Figma_MCP_get_figma_data(params);
        
        if (!figmaData || !figmaData.document) {
          throw new Error('Invalid response from MCP - no document data received');
        }
        
        console.log(`✅ Successfully fetched Figma data via global MCP function`);
        return figmaData;
      }
      
      // Fallback: Try direct HTTP API calls to MCP server
      console.log(`🌐 Attempting direct MCP server API calls`);
      
      // First, check if we can find the messages endpoint from SSE
      const sseResponse = await this.getMCPMessagesEndpoint(mcpBaseUrl);
      if (!sseResponse.success) {
        throw new Error(`Could not get MCP messages endpoint: ${sseResponse.error}`);
      }
      
      const messagesEndpoint = sseResponse.endpoint;
      console.log(`📡 Using MCP messages endpoint: ${messagesEndpoint}`);
      
      // Prepare MCP request for get_figma_data
      const mcpRequest = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: "mcp_Framelink_Figma_MCP_get_figma_data",
          arguments: {
            fileKey: fileKey,
            ...(nodeId && { nodeId: nodeId }),
            ...(depth && depth !== 5 && { depth: depth })
          }
        }
      };
      
      console.log(`📤 Sending MCP request:`, JSON.stringify(mcpRequest, null, 2));
      
      // Send request to MCP server
      const response = await fetch(messagesEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mcpRequest)
      });
      
      if (!response.ok) {
        throw new Error(`MCP server returned ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`📥 MCP response:`, JSON.stringify(result, null, 2));
      
      if (result.error) {
        throw new Error(`MCP error: ${result.error.message || result.error}`);
      }
      
      if (!result.result || !result.result.content) {
        throw new Error('Invalid MCP response - no content received');
      }
      
      // Parse the result content (it might be JSON string)
      let figmaData;
      if (typeof result.result.content === 'string') {
        try {
          figmaData = JSON.parse(result.result.content);
        } catch (parseError) {
          figmaData = result.result.content;
        }
      } else {
        figmaData = result.result.content;
      }
      
      if (!figmaData || !figmaData.document) {
        throw new Error('Invalid Figma data received - no document found');
      }
      
      console.log(`✅ Successfully fetched Figma data via MCP server API`);
      return figmaData;
      
    } catch (error) {
      console.error('❌ Error fetching data from Official Figma MCP Server:', error);
      throw new Error(`Official Figma MCP error: ${error.message}`);
    }
  }

  /**
   * Get MCP messages endpoint from SSE stream
   * @param {string} mcpBaseUrl - Base MCP server URL
   * @returns {Object} Response with endpoint or error
   */
  async getMCPMessagesEndpoint(mcpBaseUrl) {
    try {
      const sseUrl = `${mcpBaseUrl}/sse`;
      console.log(`🔍 Getting messages endpoint from SSE: ${sseUrl}`);
      
      // Simple approach: Use curl to get the first SSE message
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);
      
      try {
        // Use curl to read the first few lines of SSE stream
        const { stdout } = await execPromise(`curl -s -m 5 "${sseUrl}" | head -n 10`);
        
        console.log(`📡 SSE stream data:`, stdout);
        
        // Parse the SSE data to find the endpoint
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line.includes('/messages')) {
            const endpointPath = line.substring(6).trim();
            const fullEndpoint = `${mcpBaseUrl}${endpointPath}`;
            
            console.log(`✅ Found MCP messages endpoint: ${fullEndpoint}`);
            return {
              success: true,
              endpoint: fullEndpoint
            };
          }
        }
        
        throw new Error('No messages endpoint found in SSE stream');
        
      } catch (curlError) {
        console.log(`⚠️ Curl approach failed, trying direct fetch...`);
        
        // Fallback: Try a simple GET request to see if there's a direct endpoint
        const possibleEndpoints = [
          `${mcpBaseUrl}/messages`,
          `${mcpBaseUrl}/api/messages`,
          `${mcpBaseUrl}/mcp/messages`
        ];
        
        for (const endpoint of possibleEndpoints) {
          try {
            console.log(`🔍 Trying endpoint: ${endpoint}`);
            const testResponse = await fetch(endpoint, { 
              method: 'HEAD',
              timeout: 2000 
            });
            
            if (testResponse.ok) {
              console.log(`✅ Found working endpoint: ${endpoint}`);
              return {
                success: true,
                endpoint: endpoint
              };
            }
          } catch (testError) {
            // Continue trying other endpoints
          }
        }
        
        throw new Error('Could not find any working MCP endpoint');
      }
      
    } catch (error) {
      console.error(`❌ Error getting MCP messages endpoint:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download images using Official Figma Dev Mode MCP Server
   * @param {string} fileKey - Figma file key
   * @param {Array} nodes - Array of nodes to download
   * @param {string} localPath - Local path to save images
   * @returns {Object} Download results
   */
  async officialDownloadFigmaImages(fileKey, nodes, localPath) {
    try {
      console.log(`🖼️ Downloading ${nodes.length} images from Official Figma MCP Server...`);
      
      // Read MCP configuration to get the correct server URL
      let mcpBaseUrl = 'http://127.0.0.1:3845';
      
      try {
        const fs = await import('fs/promises');
        const mcpConfigContent = await fs.readFile('./mcp.json', 'utf8');
        const mcpConfig = JSON.parse(mcpConfigContent);
        
        if (mcpConfig?.mcp?.servers?.['Figma Dev Mode MCP']?.url) {
          const fullUrl = mcpConfig.mcp.servers['Figma Dev Mode MCP'].url;
          mcpBaseUrl = fullUrl.replace(/\/sse$/, '');
        }
      } catch (configError) {
        console.log(`⚠️ Could not read mcp.json, using default URL: ${mcpBaseUrl}`);
      }
      
      // Use the global MCP functions if available
      if (typeof global !== 'undefined' && global.mcp_Framelink_Figma_MCP_download_figma_images) {
        console.log(`🔧 Using global MCP function for image download`);
        
        const params = {
          fileKey: fileKey,
          nodes: nodes,
          localPath: localPath
        };
        
        const downloadResult = await global.mcp_Framelink_Figma_MCP_download_figma_images(params);
        console.log(`✅ Successfully downloaded images via global MCP function`);
        return downloadResult;
      }
      
      // Fallback: Try direct HTTP API calls to MCP server
      console.log(`🌐 Attempting direct MCP server API calls for image download`);
      
      const sseResponse = await this.getMCPMessagesEndpoint(mcpBaseUrl);
      if (!sseResponse.success) {
        throw new Error(`Could not get MCP messages endpoint: ${sseResponse.error}`);
      }
      
      const messagesEndpoint = sseResponse.endpoint;
      
      // Prepare MCP request for download_figma_images
      const mcpRequest = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: "mcp_Framelink_Figma_MCP_download_figma_images",
          arguments: {
            fileKey: fileKey,
            nodes: nodes,
            localPath: localPath
          }
        }
      };
      
      console.log(`📤 Sending MCP image download request:`, JSON.stringify(mcpRequest, null, 2));
      
      // Send request to MCP server
      const response = await fetch(messagesEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mcpRequest)
      });
      
      if (!response.ok) {
        throw new Error(`MCP server returned ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`📥 MCP image download response:`, JSON.stringify(result, null, 2));
      
      if (result.error) {
        throw new Error(`MCP error: ${result.error.message || result.error}`);
      }
      
      if (!result.result) {
        throw new Error('Invalid MCP response - no result received');
      }
      
      console.log(`✅ Successfully downloaded images via MCP server API`);
      return result.result;
      
    } catch (error) {
      console.error('❌ Error downloading images from Official Figma MCP Server:', error);
      throw new Error(`Official Figma MCP download error: ${error.message}`);
    }
  }

  /**
   * Check if MCP tools are available in this environment
   */
  checkMCPToolsAvailability() {
    // Check if the MCP Framelink tools are available
    try {
      return typeof mcp_Framelink_Figma_MCP_get_figma_data === 'function' &&
             typeof mcp_Framelink_Figma_MCP_download_figma_images === 'function';
    } catch (error) {
      console.log('🔍 MCP Framelink tools not available:', error.message);
      return false;
    }
  }

  /**
   * Get Figma data using third-party MCP tools
   */
  async thirdPartyGetFigmaData(fileKey, nodeId = null, depth = 5) {
    try {
      console.log(`🔧 Fetching data from MCP Framelink tools: fileKey=${fileKey}, nodeId=${nodeId}, depth=${depth}`);
      
      const params = { fileKey: fileKey };
      if (nodeId) params.nodeId = nodeId;
      if (depth && depth !== 5) params.depth = depth;

      console.log(`📤 Calling mcp_Framelink_Figma_MCP_get_figma_data with params:`, params);

      // Use the MCP Framelink tools directly
      const figmaData = await mcp_Framelink_Figma_MCP_get_figma_data(params);
      
      if (!figmaData || !figmaData.document) {
        throw new Error('Invalid response from MCP Framelink tools - no document data received');
      }
      
      console.log(`✅ Successfully fetched data from MCP Framelink tools: ${figmaData.name || 'Unknown file'}`);
      console.log(`📊 Document has ${figmaData.document?.children?.length || 0} top-level children`);
      
      return figmaData;
    } catch (error) {
      console.error('❌ Error fetching data from MCP Framelink tools:', error);
      throw new Error(`MCP Framelink error: ${error.message}`);
    }
  }

  /**
   * Download images using third-party MCP tools
   */
  async thirdPartyDownloadFigmaImages(fileKey, nodes, localPath) {
    try {
      console.log(`🖼️ Downloading ${nodes.length} images from MCP Framelink tools...`);
      
      const params = {
        fileKey: fileKey,
        nodes: nodes,
        localPath: localPath
      };

      console.log(`📤 Calling mcp_Framelink_Figma_MCP_download_figma_images with params:`, params);

      const result = await mcp_Framelink_Figma_MCP_download_figma_images(params);
      
      if (!result || !result.success) {
        throw new Error('Failed to download images via MCP Framelink tools');
      }
      
      console.log(`✅ Downloaded ${result.downloaded || nodes.length} images from MCP Framelink tools`);
      return result;
    } catch (error) {
      console.error('❌ Error downloading images from MCP Framelink tools:', error);
      throw new Error(`MCP Framelink download error: ${error.message}`);
    }
  }

  /**
   * Get Figma data using Figma REST API
   * @param {string} fileKey - Figma file key
   * @param {string} nodeId - Figma node ID
   * @param {number} depth - Traversal depth
   * @returns {Object} Figma design data
   */
  async apiFetchFigmaData(fileKey, nodeId = null, depth = 5) {
    try {
      console.log(`🔑 Fetching data from Figma REST API: fileKey=${fileKey}, nodeId=${nodeId}`);
      
      const accessToken = this.config.figma.accessToken;
      if (!accessToken) {
        throw new Error('Figma access token not configured');
      }

      // Build API URL
      let url = `https://api.figma.com/v1/files/${fileKey}`;
      if (nodeId) {
        url += `?ids=${nodeId}&depth=${depth}`;
      } else {
        url += `?depth=${depth}`;
      }

      const response = await fetch(url, {
        headers: {
          'X-Figma-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Invalid Figma access token. Get a new one from:\n' +
            'https://www.figma.com/developers/api#access-tokens'
          );
        } else if (response.status === 404) {
          throw new Error(
            `Figma file not found: ${fileKey}\n` +
            'Please check the file ID and ensure you have access to this file.'
          );
        } else {
          throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      if (!data || !data.document) {
        throw new Error('Invalid response from Figma API - no document data received');
      }

      console.log('✅ Successfully fetched data from Figma REST API');
      return data;
    } catch (error) {
      console.error('❌ Error fetching data from Figma REST API:', error);
      throw new Error(`Figma API error: ${error.message}`);
    }
  }

  /**
   * Download images using Figma REST API
   * @param {string} fileKey - Figma file key
   * @param {Array} nodes - Array of nodes to download
   * @param {string} localPath - Local path to save images
   * @returns {Object} Download results
   */
  async apiDownloadFigmaImages(fileKey, nodes, localPath) {
    try {
      console.log(`🖼️ Downloading ${nodes.length} images from Figma REST API...`);
      
      const accessToken = this.config.figma.accessToken;
      if (!accessToken) {
        throw new Error('Figma access token not configured');
      }

      // Import fs for saving images
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Ensure directory exists
      await fs.mkdir(localPath, { recursive: true });

      const results = [];
      
      // Batch nodes into smaller groups to avoid timeout
      const batchSize = 5; // Maximum 5 images per request
      const batches = [];
      for (let i = 0; i < nodes.length; i += batchSize) {
        batches.push(nodes.slice(i, i + batchSize));
      }
      
      console.log(`🔍 Processing ${nodes.length} images in ${batches.length} batches of ${batchSize}`);
      
      let allImageData = { images: {} };
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const nodeIds = batch.map(n => n.nodeId).join(',');
        console.log(`🔍 Batch ${batchIndex + 1}/${batches.length}: Requesting ${batch.length} images for nodes: ${nodeIds}`);
        
        const response = await fetch(
          `https://api.figma.com/v1/images/${fileKey}?ids=${nodeIds}&format=png&scale=2`,
          {
            headers: {
              'X-Figma-Token': accessToken,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { status: response.status, err: errorText };
          }
          
          console.log(`❌ Figma API error response for batch ${batchIndex + 1}:`, JSON.stringify(errorData, null, 2));
          
          // Continue with other batches if one fails
          console.warn(`⚠️ Batch ${batchIndex + 1} failed, continuing with remaining batches...`);
          continue;
        }
        
        const batchImageData = await response.json();
        
        if (batchImageData.images) {
          Object.assign(allImageData.images, batchImageData.images);
          console.log(`✅ Batch ${batchIndex + 1} successful: ${Object.keys(batchImageData.images).length} images`);
        }
        
        // Add delay between batches to avoid rate limiting
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const imageData = allImageData;
      console.log(`📦 Figma API response: Downloaded ${Object.keys(imageData.images).length} image URLs`);
      
      if (!imageData.images) {
        throw new Error('No image URLs received from Figma API');
      }

      // Download each image
      for (const node of nodes) {
        try {
          const imageUrl = imageData.images[node.nodeId];
          if (!imageUrl) {
            throw new Error(`No image URL for node ${node.nodeId}`);
          }

          const imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            throw new Error(`Failed to download image: ${imageResponse.status}`);
          }

          const imageBuffer = await imageResponse.arrayBuffer();
          const filePath = path.join(localPath, node.fileName);
          
          await fs.writeFile(filePath, Buffer.from(imageBuffer));
          
          results.push({
            nodeId: node.nodeId,
            fileName: node.fileName,
            localPath: filePath,
            success: true,
            source: 'figma-api'
          });
          
          console.log(`📄 Downloaded image: ${filePath}`);
        } catch (error) {
          console.error(`Failed to download image for ${node.nodeId}:`, error);
          results.push({
            nodeId: node.nodeId,
            fileName: node.fileName,
            success: false,
            error: error.message,
            source: 'figma-api'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Downloaded ${successCount}/${nodes.length} images from Figma REST API`);
      
      return {
        success: successCount > 0,
        downloaded: successCount,
        results: results
      };
    } catch (error) {
      console.error('❌ Error downloading images from Figma REST API:', error);
      throw new Error(`Figma API download error: ${error.message}`);
    }
  }

  /**
   * Get Figma data using MCP tools (unified interface) with fallback options
   */
  async getFigmaData(fileKey, nodeId = null, depth = 5) {
    if (!fileKey) {
      throw new Error('Figma file key is required');
    }

    // Try multiple approaches in order of preference
    const methods = [
      { 
        name: 'official MCP server', 
        available: this.mcpType === 'official',
        handler: () => this.officialGetFigmaData(fileKey, nodeId, depth)
      },
      { 
        name: 'third-party MCP tools', 
        available: this.mcpType === 'third-party',
        handler: () => this.thirdPartyGetFigmaData(fileKey, nodeId, depth)
      },
      { 
        name: 'Figma REST API', 
        available: this.mcpType === 'api' || (this.config?.figma?.accessToken),
        handler: () => this.apiFetchFigmaData(fileKey, nodeId, depth)
      }
    ];

    let lastError = null;

    for (const method of methods) {
      if (!method.available) {
        console.log(`⏭️ Skipping ${method.name} (not available)`);
        continue;
      }

      try {
        console.log(`🔄 Trying ${method.name} for Figma data...`);
        const result = await method.handler();
        console.log(`✅ Successfully got Figma data using ${method.name}`);
        return result;
      } catch (error) {
        console.log(`❌ ${method.name} failed: ${error.message}`);
        lastError = error;
        
        // Continue to next method
        console.log(`🔄 Trying next method...`);
        continue;
      }
    }

    // All methods failed
    throw new Error(`Failed to fetch Figma data using all available methods. Last error: ${lastError?.message}`);
  }

  /**
   * Download images using MCP tools (unified interface)
   */
  async downloadFigmaImages(fileKey, nodes, localPath) {
    if (!this.mcpTools) {
      throw new Error(
        'MCP tools not initialized. Please ensure Figma MCP server is running or MCP tools are available.'
      );
    }

    try {
      return await this.mcpTools.downloadFigmaImages(fileKey, nodes, localPath);
    } catch (error) {
      console.error('Error downloading Figma images via MCP:', error);
      throw new Error(`Failed to download Figma images: ${error.message}`);
    }
  }

  /**
   * Get the current MCP integration type
   * @returns {string} 'official', 'third-party', 'api', or null
   */
  getMCPType() {
    return this.mcpType;
  }

  /**
   * Check if Official Figma MCP Server is available
   */
  static async checkOfficialMCPAvailability() {
    try {
      const response = await fetch('http://127.0.0.1:3845/sse', { 
        method: 'HEAD',
        timeout: 2000 
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if MCP Framelink tools are available
   */
  static checkThirdPartyMCPAvailability() {
    try {
      return typeof mcp_Framelink_Figma_MCP_get_figma_data === 'function' &&
             typeof mcp_Framelink_Figma_MCP_download_figma_images === 'function';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if Figma API access is configured
   */
  static checkFigmaAPIAvailability(config) {
    return config?.figma?.accessToken && config.figma.accessToken.length > 0;
  }

  /**
   * Create appropriate Figma integration based on environment
   */
  static createIntegration(config) {
    return new FigmaMCPIntegration(config);
  }
}

export default FigmaMCPIntegration; 