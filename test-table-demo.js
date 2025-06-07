import { ComponentCategorizer } from './src/analyze/componentCategorizer.js';
import ReportGenerator from './src/report/reportGenerator.js';
import EnhancedWebExtractor from './src/scraper/enhancedWebExtractor.js';

async function testTableDemo() {
  console.log('🧪 Testing Table Format in Accordions');
  console.log('===================================');
  
  try {
    // Initialize components
    const config = { thresholds: { colorDifference: 10 } };
    const componentCategorizer = new ComponentCategorizer();
    const reportGenerator = new ReportGenerator(config);
    const webExtractor = new EnhancedWebExtractor(config);
    
    await webExtractor.initialize();
    
    // Use a simple, reliable URL
    console.log('🌐 Extracting web data from example.com...');
    const webData = await webExtractor.extractWebData('https://example.com');
    
    console.log(`✅ Web extraction complete: ${webData.elements?.length || 0} elements`);
    
    // Create mock Figma data for demonstration
    const figmaData = {
      components: [],
      fileId: 'demo',
      fileName: 'Table Demo'
    };
    
    // Categorize components
    console.log('🗂️ Categorizing components...');
    const categorizedData = componentCategorizer.categorizeComponents(figmaData, webData);
    
    // Generate HTML report with categorized data
    console.log('📝 Generating HTML report with table format...');
    const comparisonResults = { comparisons: [], metadata: {} };
    
    const htmlContent = await reportGenerator.generateHTML(
      comparisonResults, 
      null,
      { title: 'Table Format Demo Report' },
      categorizedData
    );
    
    // Save report
    const fs = await import('fs/promises');
    await fs.writeFile('./output/reports/table-demo-report.html', htmlContent);
    
    console.log('✅ Table demo report generated: ./output/reports/table-demo-report.html');
    console.log('📏 Report size:', Math.round(htmlContent.length / 1024), 'KB');
    
    // Show structure
    console.log('\n🔍 Report Structure:');
    console.log('   📊 Design Tokens: Tables with token values, usage counts, and sources');
    console.log('   ⚛️ Atoms: Tables comparing Figma vs Web components');
    console.log('   🧬 Molecules: Tables showing component features and properties');
    console.log('   🦠 Organisms: Tables with detailed component analysis');
    console.log('   📐 Layout: Tables organizing layout components');
    
    console.log('\n📝 Open the report: file://' + process.cwd() + '/output/reports/table-demo-report.html');
    
  } catch (error) {
    console.error('❌ Table demo failed:', error);
  }
}

testTableDemo(); 