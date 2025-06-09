import { EnhancedWebExtractor } from './src/scraper/enhancedWebExtractor.js';
import { promises as fs } from 'fs';

async function testEnhancedWebExtraction() {
  console.log('🧪 Testing Enhanced Web Extraction Methods...\n');
  
  const extractor = new EnhancedWebExtractor({
    headless: true, // Set to true for production
    timeout: 30000
  });

  try {
    // Test with GitHub - a well-structured website
    const url = 'https://github.com';
    console.log(`🌐 Testing with: ${url}\n`);

    const webData = await extractor.extractComprehensiveWebData(url);

    console.log('📊 EXTRACTION SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Elements: ${webData.summary.totalElements}`);
    console.log(`UI Components: ${webData.summary.totalComponents}`);
    console.log(`Colors Found: ${webData.summary.totalColors}`);
    console.log(`Fonts Found: ${webData.summary.totalFonts}`);
    console.log(`Stylesheets: ${webData.summary.totalStylesheets}\n`);

    // Method 1: CSS Stylesheets Analysis
    console.log('📋 METHOD 1: CSS STYLESHEETS');
    console.log('-'.repeat(30));
    webData.methods.stylesheets.forEach((sheet, index) => {
      console.log(`Stylesheet ${index + 1}:`);
      console.log(`  Source: ${sheet.href || 'inline'}`);
      console.log(`  Rules: ${sheet.rules.length}`);
      console.log(`  Media: ${sheet.media || 'all'}`);
      
      // Show first few rules as examples
      sheet.rules.slice(0, 3).forEach(rule => {
        console.log(`    ${rule.selector}: ${Object.keys(rule.styles).length} properties`);
      });
      console.log('');
    });

    // Method 2: Semantic UI Components
    console.log('🎯 METHOD 2: SEMANTIC UI COMPONENTS');
    console.log('-'.repeat(35));
    const componentTypes = {};
    webData.methods.uiComponents.forEach(comp => {
      componentTypes[comp.type] = (componentTypes[comp.type] || 0) + 1;
    });
    
    Object.entries(componentTypes).forEach(([type, count]) => {
      console.log(`${type}: ${count} components`);
    });
    console.log('');

    // Show examples of each component type
    Object.keys(componentTypes).forEach(type => {
      const examples = webData.methods.uiComponents
        .filter(comp => comp.type === type)
        .slice(0, 2);
      
      console.log(`${type.toUpperCase()} Examples:`);
      examples.forEach((comp, index) => {
        console.log(`  ${index + 1}. ${comp.tagName}${comp.id ? '#' + comp.id : ''}${comp.className ? '.' + comp.className.split(' ')[0] : ''}`);
        console.log(`     Text: "${comp.text?.substring(0, 50) || 'N/A'}"`);
        console.log(`     Colors: ${comp.styles.color} / ${comp.styles.backgroundColor}`);
        console.log(`     Font: ${comp.styles.fontSize} ${comp.styles.fontFamily?.split(',')[0]}`);
      });
      console.log('');
    });

    // Method 3: DOM Hierarchy (show structure)
    console.log('🌳 METHOD 3: DOM HIERARCHY');
    console.log('-'.repeat(25));
    const depthCounts = {};
    webData.methods.domHierarchy.forEach(el => {
      depthCounts[el.depth] = (depthCounts[el.depth] || 0) + 1;
    });
    
    Object.entries(depthCounts).forEach(([depth, count]) => {
      console.log(`Depth ${depth}: ${count} elements`);
    });
    console.log('');

    // Method 4: CSS Variables
    console.log('🎨 METHOD 4: CSS CUSTOM PROPERTIES');
    console.log('-'.repeat(35));
    const cssVars = Object.entries(webData.methods.cssVariables);
    if (cssVars.length > 0) {
      cssVars.slice(0, 10).forEach(([prop, value]) => {
        console.log(`${prop}: ${value}`);
      });
      if (cssVars.length > 10) {
        console.log(`... and ${cssVars.length - 10} more`);
      }
    } else {
      console.log('No CSS custom properties found');
    }
    console.log('');

    // Method 5: Color Palette
    console.log('🎨 METHOD 5: COLOR PALETTE');
    console.log('-'.repeat(25));
    webData.methods.colorPalette.slice(0, 15).forEach((color, index) => {
      console.log(`${index + 1}. ${color.hex} (${color.original})`);
    });
    if (webData.methods.colorPalette.length > 15) {
      console.log(`... and ${webData.methods.colorPalette.length - 15} more colors`);
    }
    console.log('');

    // Method 6: Typography System
    console.log('📝 METHOD 6: TYPOGRAPHY SYSTEM');
    console.log('-'.repeat(30));
    console.log('Font Families:');
    webData.methods.typographySystem.fonts.slice(0, 5).forEach((font, index) => {
      console.log(`  ${index + 1}. ${font.split(',')[0]}`);
    });
    
    console.log('\nFont Sizes:');
    const uniqueSizes = [...new Set(webData.methods.typographySystem.fontSizes)]
      .sort((a, b) => parseFloat(a) - parseFloat(b));
    uniqueSizes.slice(0, 10).forEach((size, index) => {
      console.log(`  ${index + 1}. ${size}`);
    });
    
    console.log('\nText Style Examples:');
    webData.methods.typographySystem.textStyles.slice(0, 5).forEach((style, index) => {
      console.log(`  ${index + 1}. ${style.tagName}: "${style.text}"`);
      console.log(`     ${style.fontSize} ${style.fontWeight} ${style.fontFamily?.split(',')[0]}`);
      console.log(`     Color: ${style.color}`);
    });

    // Save detailed results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = `./output/enhanced-web-extraction-${timestamp}.json`;
    await fs.mkdir('./output', { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(webData, null, 2));
    
    console.log(`\n💾 Detailed results saved to: ${outputPath}`);
    console.log('\n✅ Enhanced web extraction test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await extractor.close();
  }
}

// Run the test
testEnhancedWebExtraction(); 