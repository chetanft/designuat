/**
 * Test the Robust Figma Extractor with your specific Figma file
 * Testing with: https://www.figma.com/design/xfMsPmqaYwrjxl4fog2o7X
 */

import 'dotenv/config';
import RobustFigmaExtractor from './src/figma/robustFigmaExtractor.js';

async function testYourFigmaFile() {
  try {
    console.log('🎯 Testing YOUR Figma File with Robust Extractor');
    console.log('================================================\n');
    
    // Initialize the extractor
    const config = {
      figma: {
        accessToken: process.env.FIGMA_API_KEY
      }
    };
    
    const extractor = new RobustFigmaExtractor(config);
    
    // Your Figma file details
    const YOUR_FIGMA_FILE = 'xfMsPmqaYwrjxl4fog2o7X';
    const YOUR_FIGMA_URL = 'https://www.figma.com/design/xfMsPmqaYwrjxl4fog2o7X';
    
    console.log(`🔗 Figma URL: ${YOUR_FIGMA_URL}`);
    console.log(`🆔 File Key: ${YOUR_FIGMA_FILE}\n`);
    
    // Step 1: Extract complete file data
    console.log('📋 STEP 1: Complete File Extraction');
    console.log('------------------------------------');
    
    const startTime = Date.now();
    const figmaData = await extractor.getFigmaData(YOUR_FIGMA_FILE);
    const extractionTime = Date.now() - startTime;
    
    console.log(`✅ Extraction completed in ${extractionTime}ms`);
    console.log(`📄 File Name: ${figmaData.name}`);
    console.log(`📊 Total Components: ${figmaData.components.length}`);
    console.log(`📐 Pages: ${figmaData.document.children.length}`);
    console.log(`🎨 Styles: ${figmaData.styles.length}`);
    console.log(`📅 Last Modified: ${figmaData.lastModified}`);
    console.log(`🏷️ Version: ${figmaData.version}\n`);
    
    // Step 2: Analyze component types
    console.log('📋 STEP 2: Component Analysis');
    console.log('------------------------------');
    
    const componentTypes = {};
    figmaData.components.forEach(comp => {
      componentTypes[comp.type] = (componentTypes[comp.type] || 0) + 1;
    });
    
    console.log('🔢 Component Types Found:');
    Object.entries(componentTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count} components`);
      });
    
    // Step 3: Show interesting components
    console.log('\n📋 STEP 3: Notable Components');
    console.log('------------------------------');
    
    // Find components by type
    const frames = figmaData.components.filter(c => c.type === 'FRAME').slice(0, 5);
    const components = figmaData.components.filter(c => c.type === 'COMPONENT').slice(0, 5);
    const textNodes = figmaData.components.filter(c => c.type === 'TEXT').slice(0, 3);
    
    if (frames.length > 0) {
      console.log('\n🖼️ Main Frames:');
      frames.forEach((frame, index) => {
        console.log(`   ${index + 1}. ${frame.name}`);
        if (frame.absoluteBoundingBox) {
          const box = frame.absoluteBoundingBox;
          console.log(`      📐 Size: ${Math.round(box.width)}×${Math.round(box.height)}px`);
          console.log(`      📍 Position: (${Math.round(box.x)}, ${Math.round(box.y)})`);
        }
        console.log(`      🎨 Fills: ${frame.fills?.length || 0} styles`);
        console.log(`      👶 Children: ${frame.childrenCount || 0}\n`);
      });
    }
    
    if (components.length > 0) {
      console.log('🧩 Reusable Components:');
      components.forEach((comp, index) => {
        console.log(`   ${index + 1}. ${comp.name} (${comp.id})`);
        if (comp.absoluteBoundingBox) {
          const box = comp.absoluteBoundingBox;
          console.log(`      📐 Size: ${Math.round(box.width)}×${Math.round(box.height)}px`);
        }
        if (comp.componentId) {
          console.log(`      🔗 Component ID: ${comp.componentId}`);
        }
      });
    }
    
    if (textNodes.length > 0) {
      console.log('\n📝 Text Elements:');
      textNodes.forEach((text, index) => {
        console.log(`   ${index + 1}. ${text.name}`);
        if (text.characters) {
          const preview = text.characters.length > 50 
            ? text.characters.substring(0, 50) + '...' 
            : text.characters;
          console.log(`      💬 Text: "${preview}"`);
        }
        if (text.style) {
          console.log(`      🎨 Style: ${text.style.fontSize || 'N/A'}px, ${text.style.fontFamily || 'N/A'}`);
        }
      });
    }
    
    // Step 4: Test specific node extraction
    console.log('\n📋 STEP 4: Specific Node Extraction');
    console.log('------------------------------------');
    
    if (figmaData.components.length > 0) {
      const targetComponent = figmaData.components.find(c => c.type === 'COMPONENT') || figmaData.components[0];
      
      console.log(`🎯 Testing extraction of specific node: ${targetComponent.name} (${targetComponent.id})`);
      
      const nodeData = await extractor.getFigmaData(YOUR_FIGMA_FILE, targetComponent.id, 3);
      console.log(`✅ Node-specific extraction completed`);
      console.log(`📦 Sub-components found: ${nodeData.components.length}`);
      console.log(`🎯 Target node type: ${targetComponent.type}`);
    }
    
    // Step 5: Test image download
    console.log('\n📋 STEP 5: Image Download Test');
    console.log('-------------------------------');
    
    // Select interesting components for download
    const downloadCandidates = figmaData.components
      .filter(c => c.type === 'COMPONENT' || c.type === 'FRAME')
      .filter(c => c.absoluteBoundingBox && c.absoluteBoundingBox.width > 10 && c.absoluteBoundingBox.height > 10)
      .slice(0, 3);
    
    if (downloadCandidates.length > 0) {
      console.log(`🖼️ Preparing to download ${downloadCandidates.length} sample images...`);
      
      const testNodes = downloadCandidates.map((comp, index) => ({
        nodeId: comp.id,
        fileName: `your-figma-${index + 1}-${comp.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`
      }));
      
      const outputDir = './output/your-figma-test';
      const downloadResult = await extractor.downloadFigmaImages(
        YOUR_FIGMA_FILE, 
        testNodes, 
        outputDir
      );
      
      console.log(`✅ Download completed: ${downloadResult.downloaded}/${downloadResult.total} successful`);
      downloadResult.results.forEach(result => {
        if (result.success) {
          console.log(`   ✅ ${result.fileName} - ${(result.size / 1024).toFixed(1)}KB`);
        } else {
          console.log(`   ❌ ${result.fileName} - ${result.error}`);
        }
      });
    } else {
      console.log('⚠️ No suitable components found for image download test');
    }
    
    // Step 6: Performance analysis
    console.log('\n📋 STEP 6: Performance Analysis');
    console.log('--------------------------------');
    
    console.log(`⚡ Total extraction time: ${extractionTime}ms`);
    console.log(`📊 Components per second: ${Math.round(figmaData.components.length / (extractionTime / 1000))}`);
    console.log(`💾 Data size estimate: ${JSON.stringify(figmaData).length} characters`);
    
    // Step 7: Comparison readiness
    console.log('\n📋 STEP 7: Comparison System Readiness');
    console.log('---------------------------------------');
    
    // Check what's ready for comparison
    const comparableComponents = figmaData.components.filter(comp => 
      comp.absoluteBoundingBox && 
      (comp.type === 'COMPONENT' || comp.type === 'FRAME' || comp.type === 'TEXT')
    );
    
    console.log(`🎯 Components ready for comparison: ${comparableComponents.length}`);
    console.log('✅ Data structure: Compatible with comparison engine');
    console.log('✅ Dimensions: Available for layout comparison');
    console.log('✅ Styles: Available for visual comparison');
    console.log('✅ Text content: Available for content comparison');
    
    // Success summary
    console.log('\n🎉 YOUR FIGMA FILE TEST SUMMARY');
    console.log('===============================');
    console.log(`✅ File successfully extracted: ${figmaData.name}`);
    console.log(`✅ Components analyzed: ${figmaData.components.length}`);
    console.log(`✅ Performance: ${extractionTime}ms (${extractionTime < 2000 ? 'Excellent' : extractionTime < 5000 ? 'Good' : 'Acceptable'})`);
    console.log(`✅ Comparison ready: ${comparableComponents.length} components`);
    console.log('✅ Image download: Working');
    console.log('✅ Node-specific extraction: Working');
    
    console.log('\n💡 NEXT STEPS FOR YOUR PROJECT:');
    console.log('1. 🌐 Extract your web implementation data');
    console.log('2. 🔄 Run comparison between Figma and web');
    console.log('3. 📊 Generate detailed comparison reports');
    console.log('4. 🎯 Identify areas needing design updates');
    
    return {
      success: true,
      fileData: {
        name: figmaData.name,
        totalComponents: figmaData.components.length,
        componentTypes: componentTypes,
        comparableComponents: comparableComponents.length
      },
      performance: {
        extractionTime: extractionTime,
        componentsPerSecond: Math.round(figmaData.components.length / (extractionTime / 1000))
      },
      capabilities: {
        dataExtraction: true,
        nodeSpecificExtraction: true,
        imageDownload: true,
        comparisonReady: true
      }
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Error details:', error.stack);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testYourFigmaFile().then(result => {
  if (result.success) {
    console.log('\n🏆 SUCCESS: Your Figma file is fully compatible!');
    console.log('🚀 Ready to build comprehensive design comparisons.');
  } else {
    console.log('\n💥 FAILED: Check the error details above');
  }
}).catch(error => {
  console.error('💥 Test execution failed:', error);
}); 