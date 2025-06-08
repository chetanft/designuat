/**
 * Direct Figma API Test - Test extraction without MCP
 */

import 'dotenv/config';

async function testFigmaDirectAPI() {
  const API_KEY = process.env.FIGMA_API_KEY;
  const TEST_FILE_ID = 'xfMsPmqaYwrjxl4fog2o7X';
  
  console.log('🧪 Testing Direct Figma API Access...');
  console.log(`📋 API Key available: ${!!API_KEY}`);
  console.log(`📋 API Key length: ${API_KEY ? API_KEY.length : 0}`);
  console.log(`📋 Test File ID: ${TEST_FILE_ID}`);
  
  if (!API_KEY) {
    console.error('❌ No Figma API key found in environment');
    return;
  }
  
  try {
    // Test basic file access
    console.log('\n🔍 Step 1: Testing basic file access...');
    const fileResponse = await fetch(`https://api.figma.com/v1/files/${TEST_FILE_ID}`, {
      headers: {
        'X-Figma-Token': API_KEY
      }
    });
    
    if (!fileResponse.ok) {
      throw new Error(`Figma API error: ${fileResponse.status} - ${fileResponse.statusText}`);
    }
    
    const fileData = await fileResponse.json();
    console.log(`✅ File data received: ${fileData.name}`);
    console.log(`📊 Document nodes: ${fileData.document.children.length}`);
    
    // Test node extraction
    console.log('\n🔍 Step 2: Testing node extraction...');
    const nodes = extractComponents(fileData.document);
    console.log(`📦 Extracted ${nodes.length} components`);
    
    nodes.slice(0, 3).forEach((node, index) => {
      console.log(`   ${index + 1}. ${node.name} (${node.type}) - ${node.id}`);
    });
    
    // Test image export
    console.log('\n🔍 Step 3: Testing image export URLs...');
    const imageIds = nodes.slice(0, 2).map(n => n.id);
    
    if (imageIds.length > 0) {
      const imageResponse = await fetch(
        `https://api.figma.com/v1/images/${TEST_FILE_ID}?ids=${imageIds.join(',')}&format=png&scale=2`,
        {
          headers: {
            'X-Figma-Token': API_KEY
          }
        }
      );
      
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        console.log(`✅ Image URLs generated: ${Object.keys(imageData.images).length}`);
        Object.keys(imageData.images).forEach(id => {
          console.log(`   📸 ${id}: ${imageData.images[id] ? 'URL available' : 'No URL'}`);
        });
      } else {
        console.log(`⚠️ Image export failed: ${imageResponse.status}`);
      }
    }
    
    console.log('\n✅ Direct Figma API test completed successfully!');
    console.log('🎯 This confirms your Figma API access is working');
    
    return {
      success: true,
      fileData: fileData,
      components: nodes,
      apiWorking: true
    };
    
  } catch (error) {
    console.error('❌ Direct Figma API test failed:', error.message);
    return {
      success: false,
      error: error.message,
      apiWorking: false
    };
  }
}

function extractComponents(node, components = []) {
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'FRAME') {
    components.push({
      id: node.id,
      name: node.name,
      type: node.type,
      absoluteBoundingBox: node.absoluteBoundingBox,
      fills: node.fills,
      effects: node.effects
    });
  }
  
  if (node.children) {
    node.children.forEach(child => extractComponents(child, components));
  }
  
  return components;
}

// Run the test
testFigmaDirectAPI().then(result => {
  if (result.success) {
    console.log('\n🎉 SUCCESS: Your Figma API integration is ready!');
    console.log('💡 You can build a proper extraction system without MCP dependencies');
  } else {
    console.log('\n💥 FAILED: Figma API integration needs fixing');
    console.log('🔧 Check your API key and network connection');
  }
}).catch(error => {
  console.error('💥 Test execution failed:', error);
}); 