import FigmaExtractor from './src/figma/extractor.js';
import { WebExtractor } from './src/scraper/webExtractor.js';
import EnhancedVisualComparison from './src/visual/enhancedVisualComparison.js';

// Test configuration
const config = {
  thresholds: {
    colorDifference: 10,
    sizeDifference: 5,
    spacingDifference: 3,
    fontSizeDifference: 2
  }
};

async function testVisualComparison() {
  console.log('🧪 Testing Enhanced Visual Comparison...');
  
  try {
    // Initialize components
    const figmaExtractor = new FigmaExtractor(config);
    const webExtractor = new WebExtractor(config);
    const enhancedVisual = new EnhancedVisualComparison(config);
    
    await figmaExtractor.initialize();
    await webExtractor.initialize();
    
    console.log('✅ Components initialized');
    
    // Extract test data
    const figmaData = await figmaExtractor.extractDesignData("test-file-123");
    console.log('📐 Figma data extracted:', JSON.stringify(figmaData, null, 2));
    
    const webData = await webExtractor.extractWebData("https://httpbin.org/html");
    console.log('🌐 Web data extracted:', JSON.stringify(webData, null, 2));
    
    // Perform visual comparison
    console.log('🎨 Starting visual comparison...');
    const visualResults = await enhancedVisual.performVisualComparison(
      figmaData, 
      webData, 
      webExtractor, 
      figmaExtractor
    );
    
    console.log('🎯 Visual comparison results:', JSON.stringify(visualResults, null, 2));
    
    await webExtractor.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testVisualComparison(); 