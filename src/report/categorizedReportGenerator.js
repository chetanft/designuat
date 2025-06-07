/**
 * Categorized Report Generator
 * Generates organized, user-friendly reports from categorized component data
 */

export class CategorizedReportGenerator {
  constructor() {
    this.priorityOrder = {
      // Design System (Most Important)
      designTokens: 1,
      
      // Atomic Design (Primary Navigation)
      atoms: 2,
      molecules: 3,
      organisms: 4,
      
      // Technical Categories (Secondary)
      layout: 5,
      spacing: 6,
      dimensions: 7,
      visual: 8,
      
      // Functional Categories (Tertiary)
      interactive: 9,
      semantic: 10
    };
  }

  /**
   * Generate comprehensive categorized report
   * @param {Object} categorizedData - Output from ComponentCategorizer
   * @param {Object} comparisonResults - Original comparison results
   * @returns {Object} Structured report data
   */
  generateCategorizedReport(categorizedData, comparisonResults) {
    console.log('📊 Generating categorized component report...');

    const report = {
      metadata: {
        reportType: 'categorized-component-analysis',
        generatedAt: new Date().toISOString(),
        totalFigmaComponents: categorizedData.summary.figma.totalComponents,
        totalWebComponents: categorizedData.summary.web.totalComponents,
        categoriesAnalyzed: categorizedData.metadata?.totalCategories || 0,
        approach: categorizedData.metadata?.approach || 'fixed-schema',
        emptyCategories: categorizedData.metadata?.emptyCategories || 0
      },

      // Executive Summary
      summary: this.generateExecutiveSummary(categorizedData),

      // Design System Analysis
      designTokens: this.generateDesignTokensReport(categorizedData.designTokens),

      // Atomic Design Categories
      atomicDesign: this.generateAtomicDesignReport(categorizedData),

      // Technical Analysis
      technicalAnalysis: this.generateTechnicalAnalysis(categorizedData),

      // Gaps and Recommendations
      insights: this.generateInsights(categorizedData, comparisonResults),

      // Detailed Component Inventories
      inventories: this.generateComponentInventories(categorizedData),

      // Navigation structure for UI
      navigation: categorizedData.navigation || this.generateNavigationStructure(categorizedData)
    };

    console.log('✅ Categorized report generated successfully');
    return report;
  }

  /**
   * Generate executive summary with key metrics
   */
  generateExecutiveSummary(categorizedData) {
    const figmaSummary = categorizedData.summary.figma;
    const webSummary = categorizedData.summary.web;

    const designTokenMetrics = {
      colors: categorizedData.designTokens.colors.length,
      typography: categorizedData.designTokens.typography.length,
      spacing: categorizedData.designTokens.spacing.length,
      shadows: categorizedData.designTokens.shadows.length,
      borderRadius: categorizedData.designTokens.borderRadius.length
    };

    const atomicDistribution = {
      figma: {
        atoms: figmaSummary.atoms,
        molecules: figmaSummary.molecules,
        organisms: figmaSummary.organisms
      },
      web: {
        atoms: webSummary.atoms,
        molecules: webSummary.molecules,
        organisms: webSummary.organisms
      }
    };

    const coverage = this.calculateCoverage(categorizedData);

    return {
      designSystemHealth: this.assessDesignSystemHealth(designTokenMetrics),
      componentDistribution: atomicDistribution,
      designTokens: designTokenMetrics,
      coverage,
      recommendations: this.generateHighLevelRecommendations(categorizedData)
    };
  }

  /**
   * Generate design tokens report
   */
  generateDesignTokensReport(designTokens) {
    return {
      colors: {
        total: designTokens.colors.length,
        mostUsed: designTokens.colors.slice(0, 10),
        consistency: this.analyzeColorConsistency(designTokens.colors),
        recommendations: this.generateColorRecommendations(designTokens.colors)
      },
      
      typography: {
        total: designTokens.typography.length,
        fontFamilies: this.extractFontFamilies(designTokens.typography),
        fontSizes: this.extractFontSizes(designTokens.typography),
        scale: this.analyzeTypographicScale(designTokens.typography),
        recommendations: this.generateTypographyRecommendations(designTokens.typography)
      },
      
      spacing: {
        total: designTokens.spacing.length,
        mostUsed: designTokens.spacing.slice(0, 15),
        scale: this.analyzeSpacingScale(designTokens.spacing),
        inconsistencies: this.findSpacingInconsistencies(designTokens.spacing),
        recommendations: this.generateSpacingRecommendations(designTokens.spacing)
      },
      
      shadows: {
        total: designTokens.shadows.length,
        mostUsed: designTokens.shadows.slice(0, 5),
        elevationLevels: this.analyzeShadowElevations(designTokens.shadows)
      },
      
      borderRadius: {
        total: designTokens.borderRadius.length,
        mostUsed: designTokens.borderRadius.slice(0, 8),
        scale: this.analyzeBorderRadiusScale(designTokens.borderRadius)
      }
    };
  }

  /**
   * Generate atomic design report
   */
  generateAtomicDesignReport(categorizedData) {
    const schema = categorizedData.schema || {};
    return {
      atoms: this.generateAtomicLevelReport(schema.atoms || {}, 'Atoms'),
      molecules: this.generateAtomicLevelReport(schema.molecules || {}, 'Molecules'),
      organisms: this.generateAtomicLevelReport(schema.organisms || {}, 'Organisms')
    };
  }

  /**
   * Generate report for a specific atomic design level (Fixed Schema)
   */
  generateAtomicLevelReport(schemaLevel, levelName) {
    const analysis = {};
    
    // Process each subcategory in the fixed schema
    Object.keys(schemaLevel).forEach(subcategory => {
      const categoryData = schemaLevel[subcategory];
      const figmaComponents = categoryData.figmaColumn || [];
      const webComponents = categoryData.webColumn || [];
      
      analysis[subcategory] = {
        label: categoryData.label,
        description: categoryData.description,
        icon: categoryData.icon,
        figmaCount: figmaComponents.length,
        webCount: webComponents.length,
        coverage: webComponents.length > 0 && figmaComponents.length > 0 ? 'implemented' : 
                 figmaComponents.length > 0 ? 'design-only' : 
                 webComponents.length > 0 ? 'implementation-only' : 'empty',
        gap: Math.abs(figmaComponents.length - webComponents.length),
        examples: {
          figma: figmaComponents.slice(0, 5).map(c => ({
            name: c.name,
            type: c.type,
            complexity: c.classification?.complexity
          })),
          web: webComponents.slice(0, 5).map(c => ({
            selector: c.selector,
            tagName: c.tagName,
            type: c.type,
            complexity: c.classification?.complexity
          }))
        },
        isEmpty: figmaComponents.length === 0 && webComponents.length === 0
      };
    });

    const totalFigmaComponents = Object.values(analysis).reduce((sum, cat) => sum + cat.figmaCount, 0);
    const totalWebComponents = Object.values(analysis).reduce((sum, cat) => sum + cat.webCount, 0);
    const emptyCategories = Object.values(analysis).filter(cat => cat.isEmpty).length;

    return {
      overview: {
        totalSubcategories: Object.keys(analysis).length,
        totalFigmaComponents,
        totalWebComponents,
        emptyCategories,
        coverage: totalFigmaComponents > 0 && totalWebComponents > 0 ? 'partial' : 
                 totalFigmaComponents > 0 ? 'design-only' : 'implementation-only'
      },
      subcategories: analysis,
      recommendations: this.generateAtomicLevelRecommendations(levelName, analysis)
    };
  }

  /**
   * Generate technical analysis report
   */
  generateTechnicalAnalysis(categorizedData) {
    const schema = categorizedData.schema || {};
    return {
      layout: this.analyzeTechnicalCategory(schema.layout || {}, 'Layout Systems'),
      designTokens: this.analyzeDesignTokensCategory(categorizedData.designTokens || {}),
      responsive: this.analyzeResponsiveness(categorizedData)
    };
  }

  /**
   * Analyze a technical category
   */
  /**
   * Analyze technical category using fixed schema
   */
  analyzeTechnicalCategory(schemaCategory, categoryName) {
    const analysis = {};
    
    Object.keys(schemaCategory).forEach(subcategory => {
      const categoryData = schemaCategory[subcategory];
      const figmaComponents = categoryData.figmaColumn || [];
      const webComponents = categoryData.webColumn || [];
      
      analysis[subcategory] = {
        label: categoryData.label,
        description: categoryData.description,
        figmaCount: figmaComponents.length,
        webCount: webComponents.length,
        coverage: webComponents.length > 0 && figmaComponents.length > 0 ? 'implemented' : 
                 figmaComponents.length > 0 ? 'design-only' : 
                 webComponents.length > 0 ? 'implementation-only' : 'empty'
      };
    });
    
    return {
      name: categoryName,
      subcategories: analysis,
      maturity: this.assessCategoryMaturity(analysis),
      recommendations: this.generateTechnicalRecommendations(categoryName, analysis)
    };
  }

  /**
   * Analyze design tokens category
   */
  analyzeDesignTokensCategory(designTokens) {
    return {
      colors: {
        total: designTokens.colors?.length || 0,
        figmaTokens: designTokens.colors?.filter(t => t.sources.some(s => s.source === 'figma')).length || 0,
        webTokens: designTokens.colors?.filter(t => t.sources.some(s => s.source === 'web')).length || 0
      },
      typography: {
        total: designTokens.typography?.length || 0,
        figmaTokens: designTokens.typography?.filter(t => t.sources.some(s => s.source === 'figma')).length || 0,
        webTokens: designTokens.typography?.filter(t => t.sources.some(s => s.source === 'web')).length || 0
      },
      spacing: {
        total: designTokens.spacing?.length || 0,
        figmaTokens: designTokens.spacing?.filter(t => t.sources.some(s => s.source === 'figma')).length || 0,
        webTokens: designTokens.spacing?.filter(t => t.sources.some(s => s.source === 'web')).length || 0
      }
    };
  }

  /**
   * Generate insights and recommendations
   */
  generateInsights(categorizedData, comparisonResults) {
    return {
      designSystemGaps: this.identifyDesignSystemGaps(categorizedData),
      implementationGaps: this.identifyImplementationGaps(categorizedData),
      consistencyIssues: this.identifyConsistencyIssues(categorizedData),
      quickWins: this.identifyQuickWins(categorizedData),
      strategicRecommendations: this.generateStrategicRecommendations(categorizedData),
      actionPlan: this.generateActionPlan(categorizedData)
    };
  }

  /**
   * Generate component inventories for detailed exploration
   */
  generateComponentInventories(categorizedData) {
    return {
      figma: this.generateInventoryFromSchema(categorizedData.schema, 'figma'),
      web: this.generateInventoryFromSchema(categorizedData.schema, 'web'),
      crossReference: this.generateCrossReference(categorizedData)
    };
  }

  /**
   * Generate inventory for a platform using fixed schema
   */
  generateInventoryFromSchema(schema, platform) {
    const inventory = {};
    
    Object.keys(schema).forEach(categoryKey => {
      const category = schema[categoryKey];
      
      Object.keys(category).forEach(subcategoryKey => {
        const subcategory = category[subcategoryKey];
        const components = platform === 'figma' ? subcategory.figmaColumn : subcategory.webColumn;
        
        if (components && components.length > 0) {
          const categoryPath = `${categoryKey}.${subcategoryKey}`;
          inventory[categoryPath] = {
            count: components.length,
            label: subcategory.label,
            description: subcategory.description,
            components: components.map(component => ({
              id: component.id,
              name: component.name || component.selector,
              type: component.type,
              complexity: component.classification?.complexity,
              properties: this.extractKeyProperties(component, platform)
            }))
          };
        }
      });
    });

    return inventory;
  }

  /**
   * Generate inventory for a platform (legacy method)
   */
  generateInventory(platformData, platform) {
    const inventory = {};
    
    const processCategory = (categoryData, categoryPath = '') => {
      Object.keys(categoryData).forEach(key => {
        const currentPath = categoryPath ? `${categoryPath}.${key}` : key;
        
        if (Array.isArray(categoryData[key])) {
          if (categoryData[key].length > 0) {
            inventory[currentPath] = {
              count: categoryData[key].length,
              components: categoryData[key].map(component => ({
                id: component.id,
                name: component.name || component.selector,
                type: component.type,
                complexity: component.classification?.complexity,
                category: component.category,
                properties: this.extractKeyProperties(component, platform)
              }))
            };
          }
        } else if (typeof categoryData[key] === 'object') {
          processCategory(categoryData[key], currentPath);
        }
      });
    };

    processCategory(platformData);
    return inventory;
  }

  /**
   * Generate navigation structure for UI
   */
  generateNavigationStructure(categorizedData) {
    const navigation = {
      primary: [
        {
          id: 'summary',
          label: 'Executive Summary',
          icon: '📊',
          description: 'High-level metrics and health assessment'
        },
        {
          id: 'design-tokens',
          label: 'Design Tokens',
          icon: '🎨',
          description: 'Colors, typography, spacing, and other design primitives',
          subcategories: [
            { id: 'colors', label: 'Colors', count: categorizedData.designTokens.colors.length },
            { id: 'typography', label: 'Typography', count: categorizedData.designTokens.typography.length },
            { id: 'spacing', label: 'Spacing', count: categorizedData.designTokens.spacing.length },
            { id: 'shadows', label: 'Shadows', count: categorizedData.designTokens.shadows.length },
            { id: 'border-radius', label: 'Border Radius', count: categorizedData.designTokens.borderRadius.length }
          ]
        },
        {
          id: 'atomic-design',
          label: 'Atomic Design',
          icon: '⚛️',
          description: 'Components organized by atomic design methodology',
          subcategories: [
            { id: 'atoms', label: 'Atoms', count: categorizedData.summary.figma.atoms + categorizedData.summary.web.atoms },
            { id: 'molecules', label: 'Molecules', count: categorizedData.summary.figma.molecules + categorizedData.summary.web.molecules },
            { id: 'organisms', label: 'Organisms', count: categorizedData.summary.figma.organisms + categorizedData.summary.web.organisms }
          ]
        }
      ],
      
      secondary: [
        {
          id: 'technical',
          label: 'Technical Analysis',
          icon: '⚙️',
          subcategories: [
            { id: 'layout', label: 'Layout Systems' },
            { id: 'spacing', label: 'Spacing Patterns' },
            { id: 'visual', label: 'Visual Effects' },
            { id: 'interactions', label: 'Interactions' }
          ]
        },
        {
          id: 'insights',
          label: 'Insights & Gaps',
          icon: '💡',
          subcategories: [
            { id: 'design-gaps', label: 'Design System Gaps' },
            { id: 'implementation-gaps', label: 'Implementation Gaps' },
            { id: 'quick-wins', label: 'Quick Wins' },
            { id: 'action-plan', label: 'Action Plan' }
          ]
        }
      ],
      
      utility: [
        {
          id: 'inventories',
          label: 'Component Inventories',
          icon: '📋',
          description: 'Detailed component lists and cross-references'
        },
        {
          id: 'export',
          label: 'Export Data',
          icon: '💾',
          description: 'Download categorized data in various formats'
        }
      ]
    };

    return navigation;
  }

  // Helper Methods

  calculateCoverage(categorizedData) {
    const figmaTotal = categorizedData.summary.figma.totalComponents;
    const webTotal = categorizedData.summary.web.totalComponents;
    
    return {
      implementationCoverage: figmaTotal > 0 ? Math.round((webTotal / figmaTotal) * 100) : 0,
      designCoverage: webTotal > 0 ? Math.round((figmaTotal / webTotal) * 100) : 0,
      totalComponents: figmaTotal + webTotal
    };
  }

  assessDesignSystemHealth(designTokenMetrics) {
    const scores = {
      colors: this.scoreTokenHealth(designTokenMetrics.colors, 15, 50),
      typography: this.scoreTokenHealth(designTokenMetrics.typography, 8, 25),
      spacing: this.scoreTokenHealth(designTokenMetrics.spacing, 10, 30),
      shadows: this.scoreTokenHealth(designTokenMetrics.shadows, 3, 8),
      borderRadius: this.scoreTokenHealth(designTokenMetrics.borderRadius, 4, 12)
    };

    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    
    return {
      overall: overallScore,
      scores,
      level: overallScore >= 80 ? 'excellent' : overallScore >= 60 ? 'good' : overallScore >= 40 ? 'fair' : 'needs-improvement'
    };
  }

  scoreTokenHealth(count, optimal, excessive) {
    if (count === 0) return 0;
    if (count <= optimal) return 100;
    if (count <= excessive) return Math.max(60, 100 - ((count - optimal) / (excessive - optimal)) * 40);
    return Math.max(20, 60 - ((count - excessive) * 2));
  }

  extractKeyProperties(component, platform) {
    if (platform === 'figma') {
      return {
        type: component.type,
        hasColors: !!(component.properties?.color || component.properties?.backgroundColor),
        hasSpacing: !!component.properties?.spacing,
        hasLayout: !!component.properties?.layout,
        dimensions: component.properties?.dimensions
      };
    } else {
      return {
        tagName: component.tagName,
        hasColors: !!(component.styles?.color || component.styles?.backgroundColor),
        hasSpacing: !!(component.detailedStyles?.spacing),
        hasLayout: component.detailedStyles?.layout?.display !== 'static',
        interactive: ['button', 'a', 'input'].includes(component.tagName)
      };
    }
  }

  mergeSubcategories(figmaCategory, webCategory) {
    const merged = {};
    
    // Add Figma subcategories
    if (figmaCategory) {
      Object.keys(figmaCategory).forEach(key => {
        merged[key] = { figma: figmaCategory[key] || [], web: [] };
      });
    }
    
    // Add Web subcategories
    if (webCategory) {
      Object.keys(webCategory).forEach(key => {
        if (!merged[key]) {
          merged[key] = { figma: [], web: [] };
        }
        merged[key].web = webCategory[key] || [];
      });
    }
    
    return merged;
  }

  // Analysis Methods (Placeholder implementations)
  analyzeColorConsistency(colors) {
    return { score: 75, issues: [], suggestions: [] };
  }

  generateColorRecommendations(colors) {
    return ['Establish primary, secondary, and accent color scales', 'Reduce color token count if excessive'];
  }

  extractFontFamilies(typography) {
    const families = new Set();
    typography.forEach(token => {
      token.sources.forEach(source => {
        if (source.fontFamily) families.add(source.fontFamily);
      });
    });
    return Array.from(families);
  }

  extractFontSizes(typography) {
    const sizes = new Set();
    typography.forEach(token => {
      token.sources.forEach(source => {
        if (source.fontSize) sizes.add(source.fontSize);
      });
    });
    return Array.from(sizes).sort((a, b) => parseFloat(a) - parseFloat(b));
  }

  // Additional helper methods would be implemented here...
  analyzeTypographicScale() { return { ratio: 1.2, consistency: 'good' }; }
  generateTypographyRecommendations() { return ['Establish consistent type scale']; }
  analyzeSpacingScale() { return { base: 8, ratio: 1.5 }; }
  findSpacingInconsistencies() { return []; }
  generateSpacingRecommendations() { return ['Use 8px base grid system']; }
  analyzeShadowElevations() { return []; }
  analyzeBorderRadiusScale() { return { base: 4, variants: [4, 8, 12, 16] }; }
  generateAtomicLevelRecommendations() { return []; }
  assessCategoryMaturity() { return 'developing'; }
  generateTechnicalRecommendations() { return []; }
  analyzeResponsiveness() { return { score: 60, recommendations: [] }; }
  identifyDesignSystemGaps() { return []; }
  identifyImplementationGaps() { return []; }
  identifyConsistencyIssues() { return []; }
  identifyQuickWins() { return []; }
  generateStrategicRecommendations() { return []; }
  generateActionPlan() { return []; }
  generateCrossReference() { return {}; }
  generateHighLevelRecommendations() { return []; }
}

export default CategorizedReportGenerator; 