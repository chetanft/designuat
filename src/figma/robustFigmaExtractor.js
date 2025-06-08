/**
 * Robust Figma Extractor - MCP-like functionality using direct Figma API
 * This provides the same capabilities as MCP tools but works directly in Node.js
 */

import { promises as fs } from 'fs';
import path from 'path';

class RobustFigmaExtractor {
  constructor(config) {
    this.config = config;
    this.apiKey = config?.figma?.accessToken || process.env.FIGMA_API_KEY;
    this.baseUrl = 'https://api.figma.com/v1';
    
    if (!this.apiKey) {
      throw new Error('Figma API key is required. Set FIGMA_API_KEY environment variable or provide in config.');
    }
    
    console.log('🎨 Robust Figma Extractor initialized');
    console.log(`🔑 API Key: ${this.apiKey.substring(0, 10)}...`);
  }

  /**
   * Extract complete Figma design data (equivalent to mcp_Framelink_Figma_MCP_get_figma_data)
   * @param {string} fileKey - Figma file key
   * @param {string} nodeId - Optional specific node ID
   * @param {number} depth - Traversal depth (default: 5)
   * @returns {Object} Complete Figma design data
   */
  async getFigmaData(fileKey, nodeId = null, depth = 5) {
    try {
      console.log(`🎯 Extracting Figma data: ${fileKey}${nodeId ? ` (node: ${nodeId})` : ''}`);
      
      // Get the complete file data
      const fileData = await this.fetchFigmaFile(fileKey);
      
      if (!fileData) {
        throw new Error('Failed to fetch Figma file data');
      }
      
      // Process and structure the data similar to MCP output
      const processedData = this.processFigmaData(fileData, nodeId, depth);
      
      console.log(`✅ Successfully extracted Figma data: ${processedData.name}`);
      console.log(`📊 Components found: ${processedData.components?.length || 0}`);
      console.log(`📊 Pages found: ${processedData.document?.children?.length || 0}`);
      
      return processedData;
      
    } catch (error) {
      console.error('❌ Error extracting Figma data:', error.message);
      throw new Error(`Figma extraction failed: ${error.message}`);
    }
  }

  /**
   * Download Figma images (equivalent to mcp_Framelink_Figma_MCP_download_figma_images)
   * @param {string} fileKey - Figma file key
   * @param {Array} nodes - Array of {nodeId, fileName, imageRef?}
   * @param {string} localPath - Local directory path
   * @param {Object} options - Export options
   * @returns {Object} Download results
   */
  async downloadFigmaImages(fileKey, nodes, localPath, options = {}) {
    try {
      console.log(`📥 Downloading ${nodes.length} images from Figma...`);
      
      // Ensure directory exists
      await fs.mkdir(localPath, { recursive: true });
      
      const {
        format = 'png',
        scale = 2,
        svgOptions = {
          includeId: false,
          outlineText: true,
          simplifyStroke: true
        }
      } = options;
      
      const results = [];
      
      // Process in batches to avoid rate limiting
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < nodes.length; i += batchSize) {
        batches.push(nodes.slice(i, i + batchSize));
      }
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} images)`);
        
        try {
          const batchResults = await this.downloadImageBatch(fileKey, batch, localPath, {
            format,
            scale,
            svgOptions
          });
          
          results.push(...batchResults);
          
          // Rate limiting delay
          if (batchIndex < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (batchError) {
          console.warn(`⚠️ Batch ${batchIndex + 1} partially failed:`, batchError.message);
          
          // Try individual downloads for this batch
          for (const node of batch) {
            try {
              const individualResult = await this.downloadSingleImage(fileKey, node, localPath, {
                format,
                scale,
                svgOptions
              });
              results.push(individualResult);
            } catch (individualError) {
              results.push({
                nodeId: node.nodeId,
                fileName: node.fileName,
                success: false,
                error: individualError.message
              });
            }
          }
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Downloaded ${successCount}/${nodes.length} images successfully`);
      
      return {
        success: successCount > 0,
        downloaded: successCount,
        total: nodes.length,
        results: results
      };
      
    } catch (error) {
      console.error('❌ Error downloading Figma images:', error.message);
      throw new Error(`Image download failed: ${error.message}`);
    }
  }

  /**
   * Fetch complete Figma file data
   * @param {string} fileKey - Figma file key
   * @returns {Object} Raw Figma file data
   */
  async fetchFigmaFile(fileKey) {
    try {
      const response = await fetch(`${this.baseUrl}/files/${fileKey}`, {
        headers: {
          'X-Figma-Token': this.apiKey
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Figma API error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('❌ Error fetching Figma file:', error.message);
      throw error;
    }
  }

  /**
   * Process raw Figma data into structured format similar to MCP output
   * @param {Object} fileData - Raw Figma file data
   * @param {string} nodeId - Optional specific node ID
   * @param {number} depth - Traversal depth
   * @returns {Object} Processed Figma data
   */
  processFigmaData(fileData, nodeId = null, depth = 5) {
    const components = [];
    const styles = [];
    
    // Extract components recursively
    if (nodeId) {
      // Find specific node
      const targetNode = this.findNodeById(fileData.document, nodeId);
      if (targetNode) {
        this.extractComponents(targetNode, components, 0, depth);
      }
    } else {
      // Extract all components
      this.extractComponents(fileData.document, components, 0, depth);
    }
    
    // Extract styles
    this.extractStyles(fileData, styles);
    
    // Build metadata
    const metadata = {
      name: fileData.name,
      lastModified: fileData.lastModified,
      version: fileData.version,
      extractedAt: new Date().toISOString(),
      extractionMethod: 'robust-figma-extractor',
      nodeId: nodeId,
      depth: depth,
      componentsCount: components.length,
      stylesCount: styles.length
    };
    
    return {
      // Original data for compatibility
      ...fileData,
      
      // Override with our processed data
      components: components, // Ensure this is always an array
      styles: styles, // Ensure this is always an array
      metadata: metadata
    };
  }

  /**
   * Extract components from Figma node tree
   * @param {Object} node - Figma node
   * @param {Array} components - Components array to populate
   * @param {number} currentDepth - Current traversal depth
   * @param {number} maxDepth - Maximum traversal depth
   */
  extractComponents(node, components, currentDepth = 0, maxDepth = 5) {
    if (currentDepth > maxDepth) return;
    
    // Extract component data based on node type
    if (this.isExtractableNode(node)) {
      const component = this.transformNodeToComponent(node);
      components.push(component);
    }
    
    // Recursively process children
    if (node.children && currentDepth < maxDepth) {
      node.children.forEach(child => {
        this.extractComponents(child, components, currentDepth + 1, maxDepth);
      });
    }
  }

  /**
   * Check if node should be extracted as a component
   * @param {Object} node - Figma node
   * @returns {boolean} Should extract
   */
  isExtractableNode(node) {
    const extractableTypes = [
      'COMPONENT',
      'INSTANCE', 
      'FRAME',
      'GROUP',
      'TEXT',
      'RECTANGLE',
      'ELLIPSE',
      'VECTOR',
      'STAR',
      'POLYGON',
      'BOOLEAN_OPERATION',
      'LINE'
    ];
    
    return extractableTypes.includes(node.type);
  }

  /**
   * Transform Figma node to component format
   * @param {Object} node - Figma node
   * @returns {Object} Component data
   */
  transformNodeToComponent(node) {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      visible: node.visible !== false,
      
      // Layout properties
      absoluteBoundingBox: node.absoluteBoundingBox,
      size: node.size,
      relativeTransform: node.relativeTransform,
      constraints: node.constraints,
      
      // Style properties
      fills: node.fills || [],
      strokes: node.strokes || [],
      strokeWeight: node.strokeWeight,
      strokeAlign: node.strokeAlign,
      cornerRadius: node.cornerRadius,
      effects: node.effects || [],
      blendMode: node.blendMode,
      opacity: node.opacity,
      
      // Text properties (if text node)
      characters: node.characters,
      style: node.style,
      characterStyleOverrides: node.characterStyleOverrides,
      styleOverrideTable: node.styleOverrideTable,
      
      // Component/Instance properties
      componentId: node.componentId,
      componentProperties: node.componentProperties,
      
      // Layout properties
      layoutMode: node.layoutMode,
      itemSpacing: node.itemSpacing,
      paddingLeft: node.paddingLeft,
      paddingRight: node.paddingRight,
      paddingTop: node.paddingTop,
      paddingBottom: node.paddingBottom,
      
      // Children count
      childrenCount: node.children ? node.children.length : 0,
      
      // Additional metadata
      exportSettings: node.exportSettings,
      isMask: node.isMask,
      overflowDirection: node.overflowDirection,
      
      // Original node reference for advanced use cases
      _originalNode: node
    };
  }

  /**
   * Extract styles from Figma file
   * @param {Object} fileData - Figma file data
   * @param {Array} styles - Styles array to populate
   */
  extractStyles(fileData, styles) {
    // Extract text styles
    if (fileData.styles) {
      Object.entries(fileData.styles).forEach(([styleId, style]) => {
        styles.push({
          id: styleId,
          type: 'STYLE',
          ...style
        });
      });
    }
  }

  /**
   * Find node by ID in the document tree
   * @param {Object} node - Root node to search from
   * @param {string} targetId - Target node ID
   * @returns {Object|null} Found node or null
   */
  findNodeById(node, targetId) {
    if (node.id === targetId) {
      return node;
    }
    
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeById(child, targetId);
        if (found) return found;
      }
    }
    
    return null;
  }

  /**
   * Download a batch of images
   * @param {string} fileKey - Figma file key
   * @param {Array} nodes - Batch of nodes to download
   * @param {string} localPath - Local directory path
   * @param {Object} options - Export options
   * @returns {Array} Batch results
   */
  async downloadImageBatch(fileKey, nodes, localPath, options) {
    const { format, scale, svgOptions } = options;
    const nodeIds = nodes.map(n => n.nodeId);
    
    // Build export URL
    let exportUrl = `${this.baseUrl}/images/${fileKey}?ids=${nodeIds.join(',')}`;
    exportUrl += `&format=${format}`;
    
    if (format === 'png') {
      exportUrl += `&scale=${scale}`;
    } else if (format === 'svg') {
      if (svgOptions.includeId) exportUrl += '&svg_include_id=true';
      if (svgOptions.outlineText) exportUrl += '&svg_outline_text=true';
      if (svgOptions.simplifyStroke) exportUrl += '&svg_simplify_stroke=true';
    }
    
    // Get image URLs
    const response = await fetch(exportUrl, {
      headers: {
        'X-Figma-Token': this.apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Image export failed: ${response.status} ${response.statusText}`);
    }
    
    const imageData = await response.json();
    
    if (!imageData.images) {
      throw new Error('No image URLs received from Figma API');
    }
    
    // Download each image
    const results = [];
    
    for (const node of nodes) {
      try {
        const imageUrl = imageData.images[node.nodeId];
        
        if (!imageUrl) {
          throw new Error(`No image URL for node ${node.nodeId}`);
        }
        
        const result = await this.downloadImageFromUrl(imageUrl, node.fileName, localPath);
        results.push({
          nodeId: node.nodeId,
          fileName: node.fileName,
          localPath: result.localPath,
          success: true,
          size: result.size
        });
        
      } catch (error) {
        results.push({
          nodeId: node.nodeId,
          fileName: node.fileName,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Download single image from URL
   * @param {string} imageUrl - Image URL
   * @param {string} fileName - Local file name
   * @param {string} localPath - Local directory path
   * @returns {Object} Download result
   */
  async downloadImageFromUrl(imageUrl, fileName, localPath) {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    const filePath = path.join(localPath, fileName);
    
    await fs.writeFile(filePath, Buffer.from(imageBuffer));
    
    return {
      localPath: filePath,
      size: imageBuffer.byteLength
    };
  }

  /**
   * Download single image (fallback method)
   * @param {string} fileKey - Figma file key
   * @param {Object} node - Node to download
   * @param {string} localPath - Local directory path
   * @param {Object} options - Export options
   * @returns {Object} Download result
   */
  async downloadSingleImage(fileKey, node, localPath, options) {
    const batch = await this.downloadImageBatch(fileKey, [node], localPath, options);
    return batch[0];
  }

  /**
   * Test the extractor functionality
   * @param {string} fileKey - Test file key
   * @returns {Object} Test results
   */
  async test(fileKey = 'xfMsPmqaYwrjxl4fog2o7X') {
    try {
      console.log('🧪 Testing Robust Figma Extractor...');
      
      // Test data extraction
      const data = await this.getFigmaData(fileKey);
      
      // Test image download (first 2 components)
      const testNodes = data.components.slice(0, 2).map((comp, index) => ({
        nodeId: comp.id,
        fileName: `test-${index + 1}-${comp.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`
      }));
      
      if (testNodes.length > 0) {
        const testOutputDir = './output/test-figma-extraction';
        const downloadResult = await this.downloadFigmaImages(fileKey, testNodes, testOutputDir);
        
        return {
          success: true,
          dataExtraction: {
            componentsFound: data.components.length,
            fileName: data.name
          },
          imageDownload: downloadResult
        };
      }
      
      return {
        success: true,
        dataExtraction: {
          componentsFound: data.components.length,
          fileName: data.name
        },
        imageDownload: { message: 'No components to test image download' }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default RobustFigmaExtractor; 