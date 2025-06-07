/**
 * Test MCP Framelink Tools
 * Direct test of mcp_Framelink_Figma_MCP_get_figma_data and mcp_Framelink_Figma_MCP_download_figma_images
 */

console.log('🧪 Testing MCP Framelink Tools...');

async function testMCPFramelinkTools() {
  try {
    // Test parameters (using your example)
    const testFileKey = "xfMsPmqaYwrjxl4fog2o7X";
    const testNodeId = "1516-36";

    console.log('\n🔍 Testing mcp_Framelink_Figma_MCP_get_figma_data...');
    console.log(`📝 Parameters: fileKey=${testFileKey}, nodeId=${testNodeId}`);

    // Test 1: Get Figma data
    const figmaData = await mcp_Framelink_Figma_MCP_get_figma_data({
      fileKey: testFileKey,
      nodeId: testNodeId
    });

    console.log('✅ Successfully called mcp_Framelink_Figma_MCP_get_figma_data');
    console.log('📊 Response summary:');
    console.log(`   - File name: ${figmaData.name || 'Unknown'}`);
    console.log(`   - Document children: ${figmaData.document?.children?.length || 0}`);
    console.log(`   - Has document: ${!!figmaData.document}`);
    
    if (figmaData.document?.children) {
      console.log('📋 Top-level children:');
      figmaData.document.children.forEach((child, index) => {
        console.log(`   ${index + 1}. ${child.name} (${child.type})`);
      });
    }

    console.log('\n🖼️ Testing mcp_Framelink_Figma_MCP_download_figma_images...');
    
    // Test 2: Download images
    const downloadResult = await mcp_Framelink_Figma_MCP_download_figma_images({
      fileKey: testFileKey,
      nodes: [{"nodeId": testNodeId, "fileName": "test-component.svg"}],
      localPath: "./output/images/test-mcp"
    });

    console.log('✅ Successfully called mcp_Framelink_Figma_MCP_download_figma_images');
    console.log('📁 Download result:', downloadResult);

    console.log('\n🎉 All MCP Framelink tests passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ mcp_Framelink_Figma_MCP_get_figma_data: Working');
    console.log('   ✅ mcp_Framelink_Figma_MCP_download_figma_images: Working');
    console.log('\n🔧 Integration ready for use in comparison tool!');

  } catch (error) {
    console.error('❌ MCP Framelink test failed:', error);
    console.log('\n🔍 Error details:');
    console.log(`   Type: ${error.name || 'Unknown'}`);
    console.log(`   Message: ${error.message}`);
    
    if (error.message.includes('not defined') || error.message.includes('not a function')) {
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Ensure you\'re running this in an MCP environment');
      console.log('   2. Verify MCP Framelink tools are properly installed');
      console.log('   3. Check that mcp_Framelink_Figma_MCP tools are available');
    }
    
    process.exit(1);
  }
}

// Run the test
testMCPFramelinkTools(); 