/**
 * Test Component Categorization System
 * Validates the categorization of 1,652 Figma components and web components
 */

import fs from 'fs/promises';
import path from 'path';
import FigmaExtractor from './src/figma/extractor.js';
import { getOptimalWebExtractor } from './src/scraper/webExtractor.js';
import ComponentCategorizer from './src/analyze/componentCategorizer.js';
import CategorizedReportGenerator from './src/report/categorizedReportGenerator.js';

// Load configuration
const configPath = path.join(process.cwd(), 'config.json');
const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

async function testCategorization() {
  console.log('🧪 Testing Component Categorization System');
  console.log('=' .repeat(50));

  try {
    // Initialize components
    const figmaExtractor = new FigmaExtractor(config);
    const webExtractor = await getOptimalWebExtractor();
    const categorizer = new ComponentCategorizer();
    const reportGenerator = new CategorizedReportGenerator();

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

    console.log('\n🗂️ Categorizing Components...');
    const categorizedData = categorizer.categorizeComponents(figmaData, webData);
    
    console.log('\n📊 Fixed Schema Categorization Results:');
    console.log(`   🎨 Design Tokens:`);
    console.log(`      Colors: ${categorizedData.designTokens.colors.length}`);
    console.log(`      Typography: ${categorizedData.designTokens.typography.length}`);
    console.log(`      Spacing: ${categorizedData.designTokens.spacing.length}`);
    console.log(`      Shadows: ${categorizedData.designTokens.shadows.length}`);
    console.log(`      Border Radius: ${categorizedData.designTokens.borderRadius.length}`);

    console.log(`\n   ⚛️ Atomic Design Distribution:`);
    console.log(`      Figma Atoms: ${categorizedData.summary.figma.atoms}`);
    console.log(`      Figma Molecules: ${categorizedData.summary.figma.molecules}`);
    console.log(`      Figma Organisms: ${categorizedData.summary.figma.organisms}`);
    console.log(`      Web Atoms: ${categorizedData.summary.web.atoms}`);
    console.log(`      Web Molecules: ${categorizedData.summary.web.molecules}`);
    console.log(`      Web Organisms: ${categorizedData.summary.web.organisms}`);

    console.log(`\n   📋 Schema Metadata:`);
    console.log(`      Approach: ${categorizedData.metadata.approach}`);
    console.log(`      Total Categories: ${categorizedData.metadata.totalCategories}`);
    console.log(`      Empty Categories: ${categorizedData.metadata.emptyCategories}`);

    console.log('\n📈 Generating Categorized Report...');
    const categorizedReport = reportGenerator.generateCategorizedReport(categorizedData, {});
    
    console.log('\n📋 Report Structure:');
    console.log(`   Navigation Sections: ${categorizedReport.navigation.primary.length}`);
    console.log(`   Summary Generated: ${!!categorizedReport.summary}`);
    console.log(`   Design Token Analysis: ${!!categorizedReport.designTokens}`);
    console.log(`   Atomic Design Analysis: ${!!categorizedReport.atomicDesign}`);
    console.log(`   Technical Analysis: ${!!categorizedReport.technicalAnalysis}`);
    console.log(`   Insights Generated: ${!!categorizedReport.insights}`);

    // Save detailed results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(process.cwd(), 'output', 'tests');
    await fs.mkdir(outputDir, { recursive: true });

    const categorizedPath = path.join(outputDir, `categorization-test-${timestamp}.json`);
    const reportPath = path.join(outputDir, `categorized-report-test-${timestamp}.json`);

    await Promise.all([
      fs.writeFile(categorizedPath, JSON.stringify(categorizedData, null, 2)),
      fs.writeFile(reportPath, JSON.stringify(categorizedReport, null, 2))
    ]);

    console.log(`\n💾 Results saved:`);
    console.log(`   📄 Categorized Data: ${categorizedPath}`);
    console.log(`   📊 Categorized Report: ${reportPath}`);

    // Display sample categorizations
    console.log('\n🔍 Sample Categorizations:');
    
    // Sample design tokens
    if (categorizedData.designTokens.colors.length > 0) {
      console.log('\n   🎨 Top Colors:');
      categorizedData.designTokens.colors.slice(0, 5).forEach((color, index) => {
        console.log(`      ${index + 1}. ${color.value} (used ${color.usage} times)`);
      });
    }

    // Sample atoms from fixed schema
    const figmaAtoms = categorizedData.schema.atoms;
    if (figmaAtoms && Object.keys(figmaAtoms).length > 0) {
      console.log('\n   ⚛️ Figma Atoms by Fixed Category:');
      Object.entries(figmaAtoms).forEach(([category, categoryData]) => {
        const figmaCount = categoryData.figmaColumn?.length || 0;
        if (figmaCount > 0) {
          console.log(`      ${category}: ${figmaCount} components (${categoryData.label})`);
          categoryData.figmaColumn.slice(0, 3).forEach(comp => {
            console.log(`         - ${comp.name} (${comp.type})`);
          });
        } else {
          console.log(`      ${category}: 0 components (${categoryData.label}) - EMPTY`);
        }
      });
    }

    // Sample web components from fixed schema
    const webAtoms = categorizedData.schema.atoms;
    if (webAtoms && Object.keys(webAtoms).length > 0) {
      console.log('\n   🌐 Web Atoms by Fixed Category:');
      Object.entries(webAtoms).forEach(([category, categoryData]) => {
        const webCount = categoryData.webColumn?.length || 0;
        if (webCount > 0) {
          console.log(`      ${category}: ${webCount} components (${categoryData.label})`);
          categoryData.webColumn.slice(0, 3).forEach(comp => {
            console.log(`         - ${comp.selector} (${comp.tagName})`);
          });
        } else {
          console.log(`      ${category}: 0 components (${categoryData.label}) - EMPTY`);
        }
      });
    }

    // Navigation structure for UI
    console.log('\n🧭 Navigation Structure for UI:');
    categorizedReport.navigation.primary.forEach(nav => {
      console.log(`   📂 ${nav.icon} ${nav.label}`);
      if (nav.subcategories) {
        nav.subcategories.forEach(sub => {
          console.log(`      └─ ${sub.label} (${sub.count || 0})`);
        });
      }
    });

    console.log('\n✅ Categorization test completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Total Figma Components: ${categorizedData.summary.figma.totalComponents}`);
    console.log(`   Total Web Components: ${categorizedData.summary.web.totalComponents}`);
    console.log(`   Design Tokens Extracted: ${Object.values(categorizedData.designTokens).reduce((sum, tokens) => sum + tokens.length, 0)}`);
    console.log(`   Fixed Categories: ${categorizedData.metadata.totalCategories}`);
    console.log(`   Empty Categories: ${categorizedData.metadata.emptyCategories}`);

    return {
      success: true,
      categorizedData,
      categorizedReport,
      files: {
        categorizedPath,
        reportPath
      }
    };

  } catch (error) {
    console.error('❌ Categorization test failed:', error);
    throw error;
  }
}

// Run the test
testCategorization()
  .then(result => {
    console.log('\n🎉 Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }); 