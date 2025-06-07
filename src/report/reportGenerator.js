import { promises as fs } from 'fs';
import path from 'path';

/**
 * Report Generator
 * Generates HTML reports for design comparison results
 */
class ReportGenerator {
  constructor(config) {
    this.config = config;
    this.outputDir = config.output?.reportDir || './output/reports';
  }

  /**
   * Generate HTML content only
   * @param {Object} comparisonData - Style comparison results
   * @param {Object} visualData - Visual diff results
   * @param {Object} options - Report options
   * @param {Object} categorizedData - Optional categorized component data
   * @returns {string} HTML content
   */
  async generateHTML(comparisonData, visualData = null, options = {}, categorizedData = null) {
    try {
      return this.generateHTMLContent(comparisonData, visualData, options, categorizedData);
    } catch (error) {
      console.error('Error generating HTML content:', error);
      throw new Error(`Failed to generate HTML: ${error.message}`);
    }
  }

  /**
   * Generate complete HTML report
   * @param {Object} comparisonData - Style comparison results
   * @param {Object} visualData - Visual diff results
   * @param {Object} options - Report options
   * @param {Object} categorizedData - Optional categorized component data
   * @returns {string} Path to generated HTML report
   */
  async generateReport(comparisonData, visualData = null, options = {}, categorizedData = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = options.filename || `comparison-report-${timestamp}.html`;
      const reportPath = path.join(this.outputDir, filename);

      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      // Generate HTML content with categorized data
      const htmlContent = this.generateHTMLContent(comparisonData, visualData, options, categorizedData);

      // Write HTML file
      await fs.writeFile(reportPath, htmlContent);

      console.log(`HTML report generated: ${reportPath}`);
      return reportPath;

    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Generate HTML content for the report with categorized data support
   * @param {Object} comparisonData - Style comparison results
   * @param {Object} visualData - Visual diff results
   * @param {Object} options - Report options
   * @param {Object} categorizedData - Optional categorized component data
   * @returns {string} Complete HTML content
   */
  generateHTMLContent(comparisonData, visualData, options, categorizedData = null) {
    const title = options.title || 'Figma vs Web Comparison Report';
    
    // Determine if we should show categorized view
    const showCategorized = categorizedData && categorizedData.schema;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; line-height: 1.6; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
        .section { background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        
        /* Navigation styles */
        .nav-tabs { display: flex; border-bottom: 1px solid #ddd; margin-bottom: 20px; }
        .nav-tab { padding: 12px 20px; background: #f8f9fa; border: 1px solid #ddd; border-bottom: none; cursor: pointer; margin-right: 2px; border-radius: 8px 8px 0 0; }
        .nav-tab.active { background: white; border-bottom: 1px solid white; margin-bottom: -1px; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        /* Accordion styles */
        .accordion { margin: 20px 0; }
        .accordion-header { background: #f8f9fa; padding: 15px 20px; border: 1px solid #ddd; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px; margin-bottom: 2px; }
        .accordion-header:hover { background: #e9ecef; }
        .accordion-header.active { background: #e7f3ff; border-color: #007bff; }
        .accordion-content { border: 1px solid #ddd; border-top: none; padding: 20px; background: white; display: none; border-radius: 0 0 8px 8px; }
        .accordion-content.active { display: block; }
        .accordion-icon { transition: transform 0.3s ease; }
        .accordion-icon.rotated { transform: rotate(180deg); }
        
        /* Category badges */
        .category-badge { background: #007bff; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px; }
        .category-badge.atoms { background: #28a745; }
        .category-badge.molecules { background: #17a2b8; }
        .category-badge.organisms { background: #6f42c1; }
        .category-badge.layout { background: #fd7e14; }
        .category-badge.design-tokens { background: #dc3545; }
        
        /* Component grid */
        .component-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .component-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: white; }
        .component-card h4 { margin: 0 0 10px 0; color: #333; }
        .component-card .meta { font-size: 12px; color: #666; margin-bottom: 10px; }
        .component-card .properties { font-size: 14px; }
        
        /* Table Styles */
        .comparison-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
        .comparison-table th { background: #f8f9fa; padding: 15px 12px; text-align: left; border: 1px solid #ddd; font-weight: 600; position: sticky; top: 0; z-index: 10; }
        .comparison-table td { padding: 12px; border: 1px solid #ddd; vertical-align: top; }
        .comparison-table tbody tr:nth-child(even) { background: #f9f9f9; }
        .comparison-table tbody tr:hover { background: #f1f3f4; }
        
        /* Status indicators */
        .status-match { background: #d4edda; color: #155724; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; }
        .status-mismatch { background: #f8d7da; color: #721c24; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; }
        .status-missing { background: #fff3cd; color: #856404; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; }
        .status-unfetched { background: #e2f3ff; color: #0066cc; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; }
        
        /* Property categories */
        .prop-color { background: #e3f2fd; border-left: 4px solid #2196f3; }
        .prop-typography { background: #f3e5f5; border-left: 4px solid #9c27b0; }
        .prop-spacing { background: #e8f5e8; border-left: 4px solid #4caf50; }
        .prop-layout { background: #fff3e0; border-left: 4px solid #ff9800; }
        .prop-border { background: #fce4ec; border-left: 4px solid #e91e63; }
        
        /* Color swatches */
        .color-swatch { display: inline-block; width: 20px; height: 20px; border-radius: 3px; border: 1px solid #ccc; vertical-align: middle; margin-right: 8px; }
        .color-value { font-family: 'Courier New', monospace; font-size: 12px; }
        
        /* Typography samples */
        .typography-sample { border: 1px solid #ddd; padding: 6px 10px; border-radius: 4px; display: inline-block; background: white; margin: 2px 0; }
        
        /* Component sections */
        .component-section { margin: 30px 0; }
        .component-title { background: #343a40; color: white; padding: 15px; margin: 0; font-size: 18px; border-radius: 8px 8px 0 0; }
        
        /* Summary cards */
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-card { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .summary-card h3 { margin: 0 0 10px 0; color: #007bff; }
        .summary-card .number { font-size: 2em; font-weight: bold; margin: 10px 0; display: block; }
        .summary-card .label { color: #666; font-size: 14px; }
        
        /* Property type labels */
        .prop-label { font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
        .prop-label.color { color: #2196f3; }
        .prop-label.typography { color: #9c27b0; }
        .prop-label.spacing { color: #4caf50; }
        .prop-label.layout { color: #ff9800; }
        .prop-label.border { color: #e91e63; }
        
        /* Reason text */
        .reason-text { font-style: italic; color: #666; font-size: 13px; margin-top: 4px; }
        
        /* Count indicators */
        .count-indicator { background: #6c757d; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Design Comparison Report</h1>
            <p>Detailed Element-by-Element Analysis</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        ${showCategorized ? this.generateCategorizedNavigation() : ''}
        ${showCategorized ? this.generateCategorizedContent(categorizedData, comparisonData) : ''}
        ${this.generateSummarySection(comparisonData)}
        ${!showCategorized ? this.generateDetailedComparisonTable(comparisonData.comparisons || []) : ''}
        ${this.generateColorAnalysis(comparisonData.comparisons || [])}
        ${this.generateTypographyAnalysis(comparisonData.comparisons || [])}
    </div>
    
    <script>
        // Tab functionality
        function showTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            const targetContent = document.getElementById(tabName + '-content');
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Add active class to selected tab
            const targetTab = document.querySelector('[onclick="showTab(\\''+tabName+'\\')"]');
            if (targetTab) {
                targetTab.classList.add('active');
            }
        }
        
        // Accordion functionality
        function toggleAccordion(element) {
            const content = element.nextElementSibling;
            const icon = element.querySelector('.accordion-icon');
            
            if (content.classList.contains('active')) {
                content.classList.remove('active');
                element.classList.remove('active');
                icon.classList.remove('rotated');
            } else {
                content.classList.add('active');
                element.classList.add('active');
                icon.classList.add('rotated');
            }
        }
        
        // Initialize first tab as active
        document.addEventListener('DOMContentLoaded', function() {
            const firstTab = document.querySelector('.nav-tab');
            if (firstTab) {
                firstTab.click();
            }
        });
    </script>
</body>
</html>`;
  }

  generateSummarySection(comparisonData) {
    const totalComponents = comparisonData.comparisons?.length || 0;
    const totalDeviations = comparisonData.metadata?.summary?.totalDeviations || 0;
    const totalMatches = comparisonData.metadata?.summary?.matches || 0;
    const totalUnfetched = this.countUnfetchedProperties(comparisonData.comparisons || []);
    
    const matchPercentage = totalComponents > 0 ? Math.round(((totalMatches) / (totalMatches + totalDeviations + totalUnfetched)) * 100) : 0;
    
    const severityBreakdown = comparisonData.metadata?.summary?.severity || { high: 0, medium: 0, low: 0 };
    const colorIssues = this.countIssuesByType(comparisonData.comparisons, 'color');
    const typographyIssues = this.countIssuesByType(comparisonData.comparisons, 'typography');
    const spacingIssues = this.countIssuesByType(comparisonData.comparisons, 'spacing');

    return `
    <div class="section">
      <h2>Summary</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Components</h3>
          <span class="number">${totalComponents}</span>
          <span class="label">Elements analyzed</span>
        </div>
        <div class="summary-card">
          <h3>Match Rate</h3>
          <span class="number">${matchPercentage}%</span>
          <span class="label">Design consistency</span>
        </div>
        <div class="summary-card">
          <h3>Total Issues</h3>
          <span class="number">${totalDeviations}</span>
          <span class="label">Deviations found</span>
        </div>
        <div class="summary-card">
          <h3>Unfetched Data</h3>
          <span class="number">${totalUnfetched}</span>
          <span class="label">Properties not available</span>
        </div>
        <div class="summary-card">
          <h3>Critical Issues</h3>
          <span class="number">${severityBreakdown.high}</span>
          <span class="label">High priority fixes</span>
        </div>
        <div class="summary-card">
          <h3>Color Issues</h3>
          <span class="number">${colorIssues}</span>
          <span class="label">Color mismatches</span>
        </div>
      </div>
    </div>`;
  }

  countUnfetchedProperties(comparisons) {
    let count = 0;
    comparisons.forEach(comp => {
      if (comp.unfetched && comp.unfetched.length > 0) {
        count += comp.unfetched.length;
      }
    });
    return count;
  }

  generateDetailedComparisonTable(comparisons) {
    if (!comparisons || comparisons.length === 0) {
      return '<div class="section"><h2>No comparisons available</h2></div>';
    }

    const tableRows = [];
    
    comparisons.forEach(comp => {
      const componentName = comp.componentName || 'Unknown Component';
      
      // Add deviations
      if (comp.deviations && comp.deviations.length > 0) {
        comp.deviations.forEach(dev => {
          tableRows.push(this.createTableRow(
            componentName,
            dev.property,
            this.formatValue(dev.property, dev.figmaValue),
            this.formatValue(dev.property, dev.webValue),
            'MISMATCH',
            dev.message || `${dev.property} values don't match`,
            dev.severity || 'medium'
          ));
        });
      }
      
      // Add matches
      if (comp.matches && comp.matches.length > 0) {
        comp.matches.forEach(match => {
          tableRows.push(this.createTableRow(
            componentName,
            match.property,
            this.formatValue(match.property, match.value),
            this.formatValue(match.property, match.value),
            'MATCH',
            match.message || `${match.property} values match`,
            'low'
          ));
        });
      }
      
      // Add unfetched properties
      if (comp.unfetched && comp.unfetched.length > 0) {
        comp.unfetched.forEach(unfetched => {
          tableRows.push(this.createTableRow(
            componentName,
            unfetched.property,
            unfetched.figmaValue || 'Not available',
            unfetched.webValue || 'Not available',
            'UNFETCHED',
            unfetched.message || `${unfetched.property} data not available`,
            'info'
          ));
        });
      }
      
      // Add missing elements if any
      if (comp.missing && comp.missing.length > 0) {
        comp.missing.forEach(missing => {
          tableRows.push(this.createTableRow(
            componentName,
            missing.property || 'Element',
            missing.figmaValue || 'Present',
            'Not Found',
            'MISSING',
            missing.message || 'Element not found in web implementation',
            'high'
          ));
        });
      }
    });

    return `
    <div class="section">
      <h2>Detailed Comparison Table</h2>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Component/Element</th>
            <th>Property</th>
            <th>Figma Design</th>
            <th>Web Implementation</th>
            <th>Status</th>
            <th>Details/Reason</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows.join('')}
        </tbody>
      </table>
    </div>`;
  }

  createTableRow(component, property, figmaValue, webValue, status, reason, severity = 'medium') {
    const statusClass = status === 'MATCH' ? 'status-match' : 
                       status === 'MISSING' ? 'status-missing' : 
                       status === 'UNFETCHED' ? 'status-unfetched' : 'status-mismatch';
    
    const propertyType = this.getPropertyType(property);
    const rowClass = severity === 'high' ? 'severity-high' : '';

    return `
      <tr class="${rowClass}">
        <td><strong>${component}</strong></td>
        <td>
          <span class="prop-label ${propertyType}">${propertyType}</span><br>
          <strong>${property}</strong>
        </td>
        <td>${figmaValue}</td>
        <td>${webValue}</td>
        <td><span class="${statusClass}">${status}</span></td>
        <td>
          <div>${reason}</div>
          ${status === 'MISMATCH' ? this.generateMismatchDetails(property, figmaValue, webValue) : ''}
        </td>
      </tr>`;
  }

  formatValue(property, value) {
    if (!value) return 'N/A';
    
    // Handle color values
    if (this.isColorProperty(property)) {
      const color = this.normalizeColor(value);
      return `<div><span class="color-swatch" style="background-color: ${color};"></span><span class="color-value">${color}</span></div>`;
    }
    
    // Handle typography values
    if (this.isTypographyProperty(property)) {
      return `<div class="typography-sample" style="${this.getTypographyStyle(property, value)}">${value}</div>`;
    }
    
    // Default formatting
    return `<code>${value}</code>`;
  }

  generateMismatchDetails(property, figmaValue, webValue) {
    if (this.isColorProperty(property)) {
      return `<div class="reason-text">Color difference detected</div>`;
    }
    if (this.isTypographyProperty(property)) {
      return `<div class="reason-text">Typography mismatch</div>`;
    }
    if (this.isSpacingProperty(property)) {
      const diff = this.calculateSpacingDiff(figmaValue, webValue);
      return `<div class="reason-text">Spacing difference: ${diff}</div>`;
    }
    return '';
  }

  generateColorAnalysis(comparisons) {
    const colorIssues = [];
    const colorMatches = [];
    
    comparisons.forEach(comp => {
      [...(comp.deviations || []), ...(comp.matches || [])].forEach(item => {
        if (this.isColorProperty(item.property)) {
          if (comp.deviations?.includes(item)) {
            colorIssues.push({
              component: comp.componentName,
              property: item.property,
              figma: item.figmaValue,
              web: item.webValue,
              message: item.message
            });
          } else {
            colorMatches.push({
              component: comp.componentName,
              property: item.property,
              value: item.value
            });
          }
        }
      });
    });

    if (colorIssues.length === 0 && colorMatches.length === 0) {
      return '';
    }

    return `
    <div class="section">
      <h2>Color Analysis</h2>
      ${colorIssues.length > 0 ? `
        <h3>Color Mismatches (${colorIssues.length})</h3>
        <table class="comparison-table">
          <thead>
            <tr><th>Component</th><th>Property</th><th>Figma Color</th><th>Web Color</th><th>Issue</th></tr>
          </thead>
          <tbody>
            ${colorIssues.map(issue => `
              <tr class="prop-color">
                <td>${issue.component}</td>
                <td>${issue.property}</td>
                <td>${this.formatValue(issue.property, issue.figma)}</td>
                <td>${this.formatValue(issue.property, issue.web)}</td>
                <td>${issue.message}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      
      ${colorMatches.length > 0 ? `
        <h3>Color Matches (${colorMatches.length})</h3>
        <div style="margin: 10px 0;">
          ${colorMatches.map(match => 
            `<span style="margin: 5px; display: inline-block;">${this.formatValue(match.property, match.value)} ${match.property}</span>`
          ).join('')}
        </div>
      ` : ''}
    </div>`;
  }

  generateTypographyAnalysis(comparisons) {
    const typographyIssues = [];
    const typographyMatches = [];
    
    comparisons.forEach(comp => {
      [...(comp.deviations || []), ...(comp.matches || [])].forEach(item => {
        if (this.isTypographyProperty(item.property)) {
          if (comp.deviations?.includes(item)) {
            typographyIssues.push({
              component: comp.componentName,
              property: item.property,
              figma: item.figmaValue,
              web: item.webValue,
              message: item.message
            });
          } else {
            typographyMatches.push({
              component: comp.componentName,
              property: item.property,
              value: item.value
            });
          }
        }
      });
    });

    if (typographyIssues.length === 0 && typographyMatches.length === 0) {
      return '';
    }

    return `
    <div class="section">
      <h2>Typography Analysis</h2>
      ${typographyIssues.length > 0 ? `
        <h3>Typography Issues (${typographyIssues.length})</h3>
        <table class="comparison-table">
          <thead>
            <tr><th>Component</th><th>Property</th><th>Figma Value</th><th>Web Value</th><th>Issue</th></tr>
          </thead>
          <tbody>
            ${typographyIssues.map(issue => `
              <tr class="prop-typography">
                <td>${issue.component}</td>
                <td>${issue.property}</td>
                <td>${this.formatValue(issue.property, issue.figma)}</td>
                <td>${this.formatValue(issue.property, issue.web)}</td>
                <td>${issue.message}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
    </div>`;
  }

  // Helper methods
  getPropertyType(property) {
    if (this.isColorProperty(property)) return 'color';
    if (this.isTypographyProperty(property)) return 'typography';
    if (this.isSpacingProperty(property)) return 'spacing';
    if (this.isBorderProperty(property)) return 'border';
    return 'layout';
  }

  isColorProperty(property) {
    return ['backgroundColor', 'color', 'borderColor', 'fill', 'stroke'].includes(property);
  }

  isTypographyProperty(property) {
    return ['fontSize', 'fontFamily', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign'].includes(property);
  }

  isSpacingProperty(property) {
    return ['padding', 'margin', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 
            'marginTop', 'marginRight', 'marginBottom', 'marginLeft'].includes(property);
  }

  isBorderProperty(property) {
    return ['border', 'borderWidth', 'borderStyle', 'borderRadius'].includes(property);
  }

  normalizeColor(color) {
    if (!color) return '#000000';
    return color.toString();
  }

  getTypographyStyle(property, value) {
    if (property === 'fontSize') return `font-size: ${value};`;
    if (property === 'fontFamily') return `font-family: ${value};`;
    if (property === 'fontWeight') return `font-weight: ${value};`;
    return '';
  }

  calculateSpacingDiff(figmaValue, webValue) {
    const figmaNum = parseFloat(figmaValue);
    const webNum = parseFloat(webValue);
    if (isNaN(figmaNum) || isNaN(webNum)) return 'N/A';
    return `${Math.abs(figmaNum - webNum)}px`;
  }

  countIssuesByType(comparisons, type) {
    if (!comparisons) return 0;
    let count = 0;
    comparisons.forEach(comp => {
      if (comp.deviations) {
        comp.deviations.forEach(dev => {
          if (this.getPropertyType(dev.property) === type) count++;
        });
      }
    });
    return count;
  }

  /**
   * Generate JSON report
   * @param {Object} comparisonData - Style comparison results
   * @param {Object} visualData - Visual diff results
   * @param {Object} options - Report options
   * @returns {string} Path to generated JSON report
   */
  async generateJSONReport(comparisonData, visualData, options = {}) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = options.filename || `comparison-report-${timestamp}.json`;
      const reportPath = path.join(this.outputDir, filename);

      const report = {
        metadata: {
          generatedAt: new Date().toISOString(),
          tool: 'Figma-Web Comparison Tool',
          version: '1.0.0'
        },
        styleComparison: comparisonData,
        visualComparison: visualData,
        summary: this.generateReportSummary(comparisonData, visualData)
      };

      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`JSON report generated: ${reportPath}`);
      return reportPath;

    } catch (error) {
      console.error('Error generating JSON report:', error);
      throw error;
    }
  }

  /**
   * Generate report summary
   */
  generateReportSummary(comparisonData, visualData) {
    const metadata = comparisonData.metadata || {};
    const totalComparisons = comparisonData.comparisons?.length || 0;
    const totalDeviations = metadata.totalDeviations || 0;
    
    return {
      overallScore: totalComparisons > 0 ? 
        Math.round(((totalComparisons - totalDeviations) / totalComparisons) * 100) : 0,
      totalComponents: totalComparisons,
      totalDeviations,
      severityBreakdown: metadata.severity || { high: 0, medium: 0, low: 0 },
      visualSimilarity: visualData?.summary?.avgSimilarity || null,
      recommendations: this.generateRecommendations(comparisonData, visualData)
    };
  }

  /**
   * Generate recommendations based on results
   */
  generateRecommendations(comparisonData, visualData) {
    const recommendations = [];
    const metadata = comparisonData.metadata || {};
    const severity = metadata.severity || {};

    if (severity.high > 0) {
      recommendations.push(`Address ${severity.high} high-severity deviations immediately`);
    }
    if (severity.medium > 5) {
      recommendations.push('Review medium-severity deviations for design consistency');
    }
    if (visualData && visualData.summary?.avgSimilarity < 80) {
      recommendations.push('Significant visual differences detected - review implementation');
    }
    if (metadata.totalDeviations === 0) {
      recommendations.push('Excellent design implementation - maintain consistency');
    }

    return recommendations;
  }

  /**
   * Generate categorized navigation tabs
   */
  generateCategorizedNavigation() {
    return `
    <div class="section">
      <div class="nav-tabs">
        <div class="nav-tab active" onclick="showTab('design-tokens')">
          🎨 Design Tokens <span class="category-badge design-tokens">System</span>
        </div>
        <div class="nav-tab" onclick="showTab('atoms')">
          ⚛️ Atoms <span class="category-badge atoms">Basic</span>
        </div>
        <div class="nav-tab" onclick="showTab('molecules')">
          🧬 Molecules <span class="category-badge molecules">Combined</span>
        </div>
        <div class="nav-tab" onclick="showTab('organisms')">
          🦠 Organisms <span class="category-badge organisms">Complex</span>
        </div>
        <div class="nav-tab" onclick="showTab('layout')">
          📐 Layout <span class="category-badge layout">Structure</span>
        </div>
        <div class="nav-tab" onclick="showTab('comparison')">
          🔍 Detailed Comparison <span class="category-badge">Analysis</span>
        </div>
      </div>
    </div>`;
  }

  /**
   * Generate categorized content sections
   */
  generateCategorizedContent(categorizedData, comparisonData) {
    return `
      ${this.generateDesignTokensTab(categorizedData)}
      ${this.generateAtomsTab(categorizedData)}
      ${this.generateMoleculesTab(categorizedData)}
      ${this.generateOrganismsTab(categorizedData)}
      ${this.generateLayoutTab(categorizedData)}
      ${this.generateComparisonTab(comparisonData)}
    `;
  }

  /**
   * Generate Design Tokens tab content
   */
  generateDesignTokensTab(categorizedData) {
    const tokens = categorizedData.designTokens || {};
    
    return `
    <div id="design-tokens-content" class="tab-content">
      <div class="section">
        <h2>🎨 Design Token Analysis</h2>
        <p>Foundational design elements that maintain consistency across your design system.</p>
        
        <div class="accordion">
          ${this.generateTokenAccordion('Colors', 'colors', tokens.colors, '#2196f3')}
          ${this.generateTokenAccordion('Typography', 'typography', tokens.typography, '#9c27b0')}
          ${this.generateTokenAccordion('Spacing', 'spacing', tokens.spacing, '#4caf50')}
          ${this.generateTokenAccordion('Shadows', 'shadows', tokens.shadows, '#ff9800')}
          ${this.generateTokenAccordion('Border Radius', 'borderRadius', tokens.borderRadius, '#e91e63')}
        </div>
      </div>
    </div>`;
  }

  /**
   * Generate Atoms tab content
   */
  generateAtomsTab(categorizedData) {
    const atoms = categorizedData.schema?.atoms || {};
    
    return `
    <div id="atoms-content" class="tab-content">
      <div class="section">
        <h2>⚛️ Atomic Design Elements</h2>
        <p>Basic building blocks that cannot be broken down further without losing functionality.</p>
        
        <div class="accordion">
          ${this.generateComponentAccordion('Typography', atoms.typography, '📝')}
          ${this.generateComponentAccordion('Buttons', atoms.buttons, '🔘')}
          ${this.generateComponentAccordion('Icons', atoms.icons, '🎯')}
          ${this.generateComponentAccordion('Inputs', atoms.inputs, '📝')}
          ${this.generateComponentAccordion('Badges', atoms.badges, '🏷️')}
          ${this.generateComponentAccordion('Dividers', atoms.dividers, '➖')}
          ${this.generateComponentAccordion('Loaders', atoms.loaders, '⏳')}
        </div>
      </div>
    </div>`;
  }

  /**
   * Generate Molecules tab content
   */
  generateMoleculesTab(categorizedData) {
    const molecules = categorizedData.schema?.molecules || {};
    
    return `
    <div id="molecules-content" class="tab-content">
      <div class="section">
        <h2>🧬 Molecular Components</h2>
        <p>Groups of atoms bonded together to form relatively simple, reusable components.</p>
        
        <div class="accordion">
          ${this.generateComponentAccordion('Cards', molecules.cards, '🃏')}
          ${this.generateComponentAccordion('Navigation', molecules.navigation, '🧭')}
          ${this.generateComponentAccordion('Form Groups', molecules.formGroups, '📋')}
          ${this.generateComponentAccordion('Search Boxes', molecules.searchBoxes, '🔍')}
          ${this.generateComponentAccordion('Tabs', molecules.tabs, '📑')}
          ${this.generateComponentAccordion('Dropdowns', molecules.dropdowns, '📋')}
          ${this.generateComponentAccordion('Modals', molecules.modals, '🖼️')}
          ${this.generateComponentAccordion('Pagination', molecules.pagination, '📄')}
          ${this.generateComponentAccordion('Accordions', molecules.accordions, '📁')}
        </div>
      </div>
    </div>`;
  }

  /**
   * Generate Organisms tab content
   */
  generateOrganismsTab(categorizedData) {
    const organisms = categorizedData.schema?.organisms || {};
    
    return `
    <div id="organisms-content" class="tab-content">
      <div class="section">
        <h2>🦠 Organism Components</h2>
        <p>Complex interface components made up of groups of molecules and atoms.</p>
        
        <div class="accordion">
          ${this.generateComponentAccordion('Headers', organisms.headers, '🔝')}
          ${this.generateComponentAccordion('Footers', organisms.footers, '🔚')}
          ${this.generateComponentAccordion('Sidebars', organisms.sidebars, '⏸️')}
          ${this.generateComponentAccordion('Tables', organisms.tables, '📊')}
          ${this.generateComponentAccordion('Forms', organisms.forms, '📝')}
          ${this.generateComponentAccordion('Galleries', organisms.galleries, '🖼️')}
          ${this.generateComponentAccordion('Dashboards', organisms.dashboards, '📈')}
          ${this.generateComponentAccordion('Articles', organisms.articles, '📰')}
        </div>
      </div>
    </div>`;
  }

  /**
   * Generate Layout tab content
   */
  generateLayoutTab(categorizedData) {
    const layout = categorizedData.schema?.layout || {};
    
    return `
    <div id="layout-content" class="tab-content">
      <div class="section">
        <h2>📐 Layout Systems</h2>
        <p>Structural patterns and layout mechanisms used to organize content.</p>
        
        <div class="accordion">
          ${this.generateComponentAccordion('Flexbox', layout.flexbox, '📐')}
          ${this.generateComponentAccordion('Grid Systems', layout.grids, '⊞')}
          ${this.generateComponentAccordion('Containers', layout.containers, '📦')}
          ${this.generateComponentAccordion('Positioning', layout.positioning, '📍')}
        </div>
      </div>
    </div>`;
  }

  /**
   * Generate Comparison tab content
   */
  generateComparisonTab(comparisonData) {
    return `
    <div id="comparison-content" class="tab-content">
      ${this.generateDetailedComparisonTable(comparisonData.comparisons || [])}
    </div>`;
  }

  /**
   * Extract standardized properties from component for property-level comparison
   */
  extractComponentProperties(component, source) {
    const properties = [];
    
    if (source === 'figma') {
      // Extract Figma component properties with standard naming
      if (component.properties?.color) {
        properties.push({ name: 'color', value: component.properties.color, component: component.name });
      }
      if (component.properties?.backgroundColor) {
        properties.push({ name: 'backgroundColor', value: component.properties.backgroundColor, component: component.name });
      }
      if (component.properties?.typography) {
        const typo = component.properties.typography;
        properties.push({ 
          name: 'typography', 
          value: `${typo.fontFamily} ${typo.fontSize}px ${typo.fontWeight}`, 
          component: component.name 
        });
        if (typo.fontFamily) {
          properties.push({ name: 'fontFamily', value: typo.fontFamily, component: component.name });
        }
        if (typo.fontSize) {
          properties.push({ name: 'fontSize', value: `${typo.fontSize}px`, component: component.name });
        }
      }
      if (component.properties?.spacing) {
        Object.entries(component.properties.spacing).forEach(([prop, value]) => {
          properties.push({ 
            name: 'spacing', 
            value: `${value}px (${prop})`, 
            component: component.name 
          });
        });
      }
      if (component.properties?.borderRadius) {
        properties.push({ 
          name: 'borderRadius', 
          value: `${component.properties.borderRadius}px`, 
          component: component.name 
        });
      }
      if (component.properties?.width) {
        properties.push({ name: 'width', value: `${component.properties.width}px`, component: component.name });
      }
      if (component.properties?.height) {
        properties.push({ name: 'height', value: `${component.properties.height}px`, component: component.name });
      }
      
    } else if (source === 'web') {
      // Extract web component properties with standard naming
      if (component.styles?.color) {
        properties.push({ name: 'color', value: component.styles.color, component: component.selector });
      }
      if (component.styles?.backgroundColor && component.styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        properties.push({ name: 'backgroundColor', value: component.styles.backgroundColor, component: component.selector });
      }
      if (component.styles?.fontFamily && component.styles?.fontSize) {
        properties.push({ 
          name: 'typography', 
          value: `${component.styles.fontFamily} ${component.styles.fontSize} ${component.styles.fontWeight || 'normal'}`, 
          component: component.selector 
        });
        properties.push({ name: 'fontFamily', value: component.styles.fontFamily, component: component.selector });
        properties.push({ name: 'fontSize', value: component.styles.fontSize, component: component.selector });
      }
      
      // Spacing properties
      ['marginTop', 'marginRight', 'marginBottom', 'marginLeft', 
       'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].forEach(prop => {
        if (component.styles?.[prop] && parseFloat(component.styles[prop]) > 0) {
          properties.push({ 
            name: 'spacing', 
            value: `${component.styles[prop]} (${prop})`, 
            component: component.selector 
          });
        }
      });
      
      if (component.styles?.borderRadius && component.styles.borderRadius !== '0px') {
        properties.push({ name: 'borderRadius', value: component.styles.borderRadius, component: component.selector });
      }
      if (component.styles?.width) {
        properties.push({ name: 'width', value: component.styles.width, component: component.selector });
      }
      if (component.styles?.height) {
        properties.push({ name: 'height', value: component.styles.height, component: component.selector });
      }
      if (component.styles?.display) {
        properties.push({ name: 'display', value: component.styles.display, component: component.selector });
      }
      if (component.styles?.position) {
        properties.push({ name: 'position', value: component.styles.position, component: component.selector });
      }
      if (component.styles?.flexDirection) {
        properties.push({ name: 'flexDirection', value: component.styles.flexDirection, component: component.selector });
      }
      if (component.styles?.justifyContent) {
        properties.push({ name: 'justifyContent', value: component.styles.justifyContent, component: component.selector });
      }
      if (component.styles?.alignItems) {
        properties.push({ name: 'alignItems', value: component.styles.alignItems, component: component.selector });
      }
    }
    
    return properties;
  }

  /**
   * Generate accordion section for design tokens
   */
  generateTokenAccordion(title, key, tokens, color) {
    if (!tokens || tokens.length === 0) {
      return `
      <div class="accordion-header" onclick="toggleAccordion(this)">
        <h3>${title} <span class="count-indicator">0</span></h3>
        <span class="accordion-icon">▼</span>
      </div>
      <div class="accordion-content">
        <p>No ${title.toLowerCase()} tokens found.</p>
      </div>`;
    }

    const tokenRows = tokens.slice(0, 20).map(token => {
      // Group tokens by source to compare Figma vs Web
      const figmaSources = token.sources.filter(s => s.source === 'figma');
      const webSources = token.sources.filter(s => s.source === 'web');
      
      const figmaDesign = figmaSources.length > 0 ? 
        `Found (${figmaSources.length} uses)` : 'Not found';
      
      const webImplementation = webSources.length > 0 ? 
        `Found (${webSources.length} uses)` : 'Not found';
      
      let status, statusClass;
      if (figmaSources.length > 0 && webSources.length > 0) {
        status = 'Match';
        statusClass = 'status-match';
      } else if (figmaSources.length > 0 && webSources.length === 0) {
        status = 'Missing in Web';
        statusClass = 'status-missing';
      } else if (figmaSources.length === 0 && webSources.length > 0) {
        status = 'Missing in Figma';
        statusClass = 'status-mismatch';
      }
      
      let details = '';
      if (key === 'colors') {
        details = `Color token used in ${token.sources.map(s => s.type || 'Unknown').join(', ')} contexts`;
      } else if (key === 'typography') {
        const font = token.sources[0];
        details = `Font: ${font?.fontFamily || 'Unknown'}, Size: ${font?.fontSize || 'Unknown'}, Weight: ${font?.fontWeight || 'Unknown'}`;
      } else {
        details = `${title} token used in ${token.sources.map(s => s.property || 'General').join(', ')} properties`;
      }
      
      const propertyName = key === 'colors' ? 
        `Color: ${token.value}` : 
        key === 'typography' ? 
        `Typography: ${token.value.split('-')[0]}...` :
        `${title}: ${token.value}`;
      
      return `
        <tr>
          <td>
            ${key === 'colors' ? 
              `<div style="display: flex; align-items: center;"><span class="color-swatch" style="background-color: ${token.value};"></span><code style="margin-left: 8px;">${token.value}</code></div>` :
              `<code>${token.value}</code>`
            }
          </td>
          <td>${figmaDesign}</td>
          <td>${webImplementation}</td>
          <td><span class="${statusClass}">${status}</span></td>
          <td>${details}</td>
        </tr>`;
    }).join('');

    return `
    <div class="accordion-header" onclick="toggleAccordion(this)">
      <h3>${title} <span class="count-indicator">${tokens.length}</span></h3>
      <span class="accordion-icon">▼</span>
    </div>
    <div class="accordion-content">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Figma Design</th>
            <th>Web Implementation</th>
            <th>Status</th>
            <th>Details/Reason</th>
          </tr>
        </thead>
        <tbody>
          ${tokenRows}
        </tbody>
      </table>
      ${tokens.length > 20 ? `<p><em>Showing top 20 of ${tokens.length} tokens...</em></p>` : ''}
    </div>`;
  }

  /**
   * Generate accordion section for component categories
   */
  generateComponentAccordion(title, categoryData, icon) {
    if (!categoryData) {
      return `
      <div class="accordion-header" onclick="toggleAccordion(this)">
        <h3>${icon} ${title} <span class="count-indicator">0</span></h3>
        <span class="accordion-icon">▼</span>
      </div>
      <div class="accordion-content">
        <p>No ${title.toLowerCase()} found.</p>
      </div>`;
    }

    const figmaCount = categoryData.figmaColumn?.length || 0;
    const webCount = categoryData.webColumn?.length || 0;
    const totalCount = figmaCount + webCount;

    if (totalCount === 0) {
      return `
      <div class="accordion-header" onclick="toggleAccordion(this)">
        <h3>${icon} ${title} <span class="count-indicator">0</span></h3>
        <span class="accordion-icon">▼</span>
      </div>
      <div class="accordion-content">
        <p>No ${title.toLowerCase()} found in either Figma or web implementation.</p>
      </div>`;
    }

    // Generate property-level comparison with specific naming
    const allRows = [];
    const figmaComponents = categoryData.figmaColumn || [];
    const webComponents = categoryData.webColumn || [];
    
    // Create comprehensive property comparison map
    const propertyMap = new Map();
    
    // Extract Figma properties first (these get priority)
    figmaComponents.forEach(comp => {
      const properties = this.extractComponentProperties(comp, 'figma');
      properties.forEach(prop => {
        if (!propertyMap.has(prop.name)) {
          propertyMap.set(prop.name, { figma: [], web: [] });
        }
        propertyMap.get(prop.name).figma.push(prop);
      });
    });
    
    // Extract Web properties and match/add them
    webComponents.forEach(comp => {
      const properties = this.extractComponentProperties(comp, 'web');
      properties.forEach(prop => {
        if (!propertyMap.has(prop.name)) {
          propertyMap.set(prop.name, { figma: [], web: [] });
        }
        propertyMap.get(prop.name).web.push(prop);
      });
    });
    
    // Sort properties: Figma properties first, then web-only properties
    const sortedProperties = Array.from(propertyMap.entries()).sort(([nameA, dataA], [nameB, dataB]) => {
      const aHasFigma = dataA.figma.length > 0;
      const bHasFigma = dataB.figma.length > 0;
      
      if (aHasFigma && !bHasFigma) return -1;
      if (!aHasFigma && bHasFigma) return 1;
      return nameA.localeCompare(nameB);
    });
    
    // Generate table rows
    sortedProperties.forEach(([propertyName, data]) => {
      const figmaValues = data.figma;
      const webValues = data.web;
      
      // Figma Design column
      const figmaDesign = figmaValues.length > 0 ? 
        figmaValues.map(v => v.value).join(', ') : 'Not found';
      
      // Web Implementation column
      const webImplementation = webValues.length > 0 ? 
        webValues.map(v => v.value).join(', ') : 'Not found';
      
      // Status column
      let status, statusClass;
      if (figmaValues.length > 0 && webValues.length > 0) {
        const figmaValue = figmaValues[0].value;
        const webValue = webValues[0].value;
        if (figmaValue === webValue) {
          status = 'Match';
          statusClass = 'status-match';
        } else {
          status = 'Mismatch';
          statusClass = 'status-mismatch';
        }
      } else if (figmaValues.length > 0 && webValues.length === 0) {
        status = 'Missing in Web';
        statusClass = 'status-missing';
      } else if (figmaValues.length === 0 && webValues.length > 0) {
        status = 'Missing in Figma';
        statusClass = 'status-mismatch';
      }
      
      // Details/Reason column
      let details = '';
      if (figmaValues.length > 0 && webValues.length > 0) {
        details = `Expected: ${figmaValues[0].value}, Found: ${webValues[0].value}`;
      } else if (figmaValues.length > 0) {
        details = `Property defined in Figma but not implemented in web`;
      } else {
        details = `Web implementation uses property not defined in Figma design`;
      }
      
      allRows.push(`
        <tr>
          <td><strong>${propertyName}</strong></td>
          <td>${figmaDesign}</td>
          <td>${webImplementation}</td>
          <td><span class="${statusClass}">${status}</span></td>
          <td>${details}</td>
        </tr>
      `);
    });

    return `
    <div class="accordion-header" onclick="toggleAccordion(this)">
      <h3>${icon} ${title} <span class="count-indicator">${totalCount}</span> 
        <small>(${figmaCount} Figma, ${webCount} Web)</small>
      </h3>
      <span class="accordion-icon">▼</span>
    </div>
    <div class="accordion-content">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Figma Design</th>
            <th>Web Implementation</th>
            <th>Status</th>
            <th>Details/Reason</th>
          </tr>
        </thead>
        <tbody>
          ${allRows.join('')}
        </tbody>
      </table>
      ${totalCount > 20 ? `<p><em>Showing all ${totalCount} components...</em></p>` : ''}
    </div>`;
  }
}

export default ReportGenerator; 