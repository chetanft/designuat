/**
 * Test Categorized HTML Report Generation
 * Tests if the categorization system generates proper HTML with accordion sections
 */

import fs from 'fs/promises';
import path from 'path';
import FigmaExtractor from './src/figma/extractor.js';
import { getOptimalWebExtractor } from './src/scraper/webExtractor.js';
import ComponentCategorizer from './src/analyze/componentCategorizer.js';
import ReportGenerator from './src/report/reportGenerator.js';
import ComparisonEngine from './src/compare/comparisonEngine.js';

// Load configuration
const configPath = path.join(process.cwd(), 'config.json');
const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

async function testCategorizedHTML() {
  console.log('🧪 Testing Categorized HTML Report Generation');
  console.log('=' .repeat(50));

  try {
    // Initialize components
    const figmaExtractor = new FigmaExtractor(config);
    const webExtractor = await getOptimalWebExtractor();
    const categorizer = new ComponentCategorizer();
    const reportGenerator = new ReportGenerator(config);
    const comparisonEngine = new ComparisonEngine();

    await figmaExtractor.initialize();
    await webExtractor.initialize();

    console.log('✅ Components initialized');

    // Test data (FreightTiger example)
    const testData = {
      figmaFile: 'xfMsPmqaYwrjxl4fog2o7X',
      nodeId: '1516-36',
      webUrl: 'https://www.freighttiger.com/v10/journey/listing'
    };

    console.log('\n🎨 Extracting Figma Components...');
    const figmaData = await figmaExtractor.extractDesignData(testData.figmaFile, testData.nodeId);
    console.log(`   📊 Components extracted: ${figmaData.components.length}`);

    console.log('\n🌐 Extracting Web Components...');
    const webData = await webExtractor.extractWebData(testData.webUrl);
    console.log(`   📊 Elements extracted: ${webData.elements?.length || 0}`);

    console.log('\n🔍 Performing comparison...');
    const comparisonResults = await comparisonEngine.compareDesigns(figmaData, webData);
    console.log(`   ✅ Comparison complete: ${comparisonResults.summary?.matches || 0} matches found`);

    console.log('\n🗂️ Categorizing Components...');
    const categorizedData = categorizer.categorizeComponents(figmaData, webData);
    console.log(`   ✅ Categorization complete`);
    console.log(`   📊 Design tokens extracted:`);
    console.log(`      Colors: ${categorizedData.designTokens.colors.length}`);
    console.log(`      Typography: ${categorizedData.designTokens.typography.length}`);
    console.log(`      Spacing: ${categorizedData.designTokens.spacing.length}`);
    console.log(`      Shadows: ${categorizedData.designTokens.shadows.length}`);
    console.log(`      Border Radius: ${categorizedData.designTokens.borderRadius.length}`);

    console.log('\n📝 Generating HTML Report with Categories...');
    const htmlContent = await reportGenerator.generateHTML(
      comparisonResults,
      null, // no visual data
      { title: 'Test Categorized Comparison Report' },
      categorizedData // Pass categorized data
    );

    // Save test report
    const outputDir = path.join(process.cwd(), 'output', 'reports');
    await fs.mkdir(outputDir, { recursive: true });
    
    const testReportPath = path.join(outputDir, 'test-categorized-report.html');
    await fs.writeFile(testReportPath, htmlContent);

    console.log(`✅ Test categorized HTML report generated: ${testReportPath}`);
    console.log(`📏 Report size: ${Math.round(htmlContent.length / 1024)} KB`);

    // Validate report content
    const hasNavigation = htmlContent.includes('nav-tab');
    const hasAccordions = htmlContent.includes('accordion-header');
    const hasDesignTokens = htmlContent.includes('🎨 Design Tokens');
    const hasAtoms = htmlContent.includes('⚛️ Atoms');
    const hasMolecules = htmlContent.includes('🧬 Molecules');
    const hasOrganisms = htmlContent.includes('🦠 Organisms');
    const hasJavaScript = htmlContent.includes('toggleAccordion');

    console.log('\n🔍 Report Validation:');
    console.log(`   Navigation tabs: ${hasNavigation ? '✅' : '❌'}`);
    console.log(`   Accordion headers: ${hasAccordions ? '✅' : '❌'}`);
    console.log(`   Design Tokens section: ${hasDesignTokens ? '✅' : '❌'}`);
    console.log(`   Atoms section: ${hasAtoms ? '✅' : '❌'}`);
    console.log(`   Molecules section: ${hasMolecules ? '✅' : '❌'}`);
    console.log(`   Organisms section: ${hasOrganisms ? '✅' : '❌'}`);
    console.log(`   JavaScript functionality: ${hasJavaScript ? '✅' : '❌'}`);

    const isValid = hasNavigation && hasAccordions && hasDesignTokens && hasAtoms && hasMolecules && hasOrganisms && hasJavaScript;
    
    console.log(`\n${isValid ? '🎉 SUCCESS!' : '❌ FAILED!'} Categorized HTML report ${isValid ? 'contains all expected elements' : 'is missing some elements'}`);
    
    if (isValid) {
      console.log(`\n📝 Open the report in your browser: file://${testReportPath}`);
    }

    return isValid;

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testCategorizedHTML()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  }); 