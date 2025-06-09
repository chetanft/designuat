import { promises as fs } from 'fs';

/**
 * Real Comparison Engine
 * Compares extracted Figma design data with live web implementation data
 */
class ComparisonEngine {
  constructor(config) {
    this.config = config || {};
    this.thresholds = {
      colorDifference: config?.thresholds?.colorDifference || 10,
      sizeDifference: config?.thresholds?.sizeDifference || 5,
      spacingDifference: config?.thresholds?.spacingDifference || 3,
      fontSizeDifference: config?.thresholds?.fontSizeDifference || 2,
      ...config?.thresholds
    };
  }

  /**
   * Compare Figma design data with web implementation data
   * @param {Object} figmaData - Extracted Figma design data
   * @param {Object} webData - Extracted web implementation data
   * @returns {Object} Comparison results with deviations and matches
   */
  async compareDesigns(figmaData, webData) {
    try {
      console.log('🔍 Starting design comparison...');
      
      const comparisons = [];
      const summary = {
        totalComponents: 0,
        totalDeviations: 0,
        totalUnfetched: 0,
        severity: { high: 0, medium: 0, low: 0 },
        matches: 0
      };

      // Compare each Figma component with web elements
      for (const figmaComponent of figmaData.components) {
        const comparison = await this.compareComponent(figmaComponent, webData.elements);
        if (comparison) {
          comparisons.push(comparison);
          summary.totalComponents++;
          summary.totalDeviations += comparison.deviations.length;
          summary.matches += comparison.matches.length;
          
          // Count unfetched properties
          if (comparison.unfetched) {
            summary.totalUnfetched += comparison.unfetched.length;
          }
          
          // Count severity levels
          comparison.deviations.forEach(dev => {
            summary.severity[dev.severity]++;
          });
        }
      }

      console.log(`✅ Comparison complete: ${summary.totalComponents} components, ${summary.totalDeviations} deviations, ${summary.totalUnfetched} unfetched`);

      return {
        metadata: {
          figma: {
            fileId: figmaData.fileId,
            fileName: figmaData.fileName,
            extractedAt: figmaData.extractedAt
          },
          web: {
            url: webData.url,
            extractedAt: webData.extractedAt,
            elementsCount: webData.elements.length
          },
          comparedAt: new Date().toISOString(),
          summary
        },
        comparisons,
        summary
      };

    } catch (error) {
      console.error('❌ Error in design comparison:', error);
      throw error;
    }
  }

  /**
   * Compare a single Figma component with web elements
   * @param {Object} figmaComponent - Figma component data
   * @param {Array} webElements - Array of web element data
   * @returns {Object} Component comparison result
   */
  async compareComponent(figmaComponent, webElements) {
    // Find the best matching web element
    const matchedElement = this.findBestMatch(figmaComponent, webElements);
    
    if (!matchedElement) {
      return {
        componentId: figmaComponent.id,
        componentName: figmaComponent.name,
        componentType: figmaComponent.type,
        selector: null,
        status: 'no_match',
        deviations: [{
          property: 'existence',
          figmaValue: 'exists',
          webValue: 'not found',
          difference: 'missing',
          severity: 'high',
          message: 'Component not found in web implementation'
        }],
        matches: []
      };
    }

    // Compare properties
    const deviations = [];
    const matches = [];
    const unfetched = [];

    // Compare typography
    if (figmaComponent.properties?.typography && matchedElement.styles) {
      const typographyComparison = this.compareTypography(
        figmaComponent.properties.typography,
        matchedElement.styles
      );
      deviations.push(...typographyComparison.deviations);
      matches.push(...typographyComparison.matches);
    } else if (!figmaComponent.properties?.typography) {
      unfetched.push({
        property: 'typography',
        status: 'unfetched',
        message: 'Typography data not available in Figma design'
      });
    }

    // Compare colors - only if both exist
    if (figmaComponent.properties?.backgroundColor && matchedElement.styles?.backgroundColor) {
      const colorComparison = this.compareColors(
        figmaComponent.properties.backgroundColor,
        matchedElement.styles.backgroundColor,
        'backgroundColor'
      );
      if (colorComparison.deviation) {
        deviations.push(colorComparison.deviation);
      } else {
        matches.push(colorComparison.match);
      }
    } else if (!figmaComponent.properties?.backgroundColor && matchedElement.styles?.backgroundColor) {
      unfetched.push({
        property: 'backgroundColor',
        status: 'unfetched',
        figmaValue: 'not specified',
        webValue: matchedElement.styles.backgroundColor,
        message: 'Background color not specified in Figma design'
      });
    } else if (figmaComponent.properties?.backgroundColor && !matchedElement.styles?.backgroundColor) {
      unfetched.push({
        property: 'backgroundColor',
        status: 'unfetched',
        figmaValue: figmaComponent.properties.backgroundColor,
        webValue: 'not found',
        message: 'Background color not found in web implementation'
      });
    }

    if (figmaComponent.properties?.color && matchedElement.styles?.color) {
      const colorComparison = this.compareColors(
        figmaComponent.properties.color,
        matchedElement.styles.color,
        'color'
      );
      if (colorComparison.deviation) {
        deviations.push(colorComparison.deviation);
      } else {
        matches.push(colorComparison.match);
      }
    } else if (!figmaComponent.properties?.color && matchedElement.styles?.color) {
      unfetched.push({
        property: 'color',
        status: 'unfetched',
        figmaValue: 'not specified',
        webValue: matchedElement.styles.color,
        message: 'Text color not specified in Figma design'
      });
    } else if (figmaComponent.properties?.color && !matchedElement.styles?.color) {
      unfetched.push({
        property: 'color',
        status: 'unfetched',
        figmaValue: figmaComponent.properties.color,
        webValue: 'not found',
        message: 'Text color not found in web implementation'
      });
    }

    // Compare spacing - only if both exist
    if (figmaComponent.properties?.spacing && matchedElement.styles) {
      const spacingComparison = this.compareSpacing(
        figmaComponent.properties.spacing,
        matchedElement.styles
      );
      deviations.push(...spacingComparison.deviations);
      matches.push(...spacingComparison.matches);
    } else if (!figmaComponent.properties?.spacing) {
      unfetched.push({
        property: 'spacing',
        status: 'unfetched',
        message: 'Spacing data not available in Figma design'
      });
    }

    // Compare borders - only if both exist
    if (figmaComponent.properties?.borderRadius && matchedElement.styles?.borderRadius) {
      const borderComparison = this.compareBorders(
        { borderRadius: figmaComponent.properties.borderRadius },
        { borderRadius: matchedElement.styles.borderRadius }
      );
      deviations.push(...borderComparison.deviations);
      matches.push(...borderComparison.matches);
    } else if (!figmaComponent.properties?.borderRadius && matchedElement.styles?.borderRadius) {
      unfetched.push({
        property: 'borderRadius',
        status: 'unfetched',
        figmaValue: 'not specified',
        webValue: matchedElement.styles.borderRadius,
        message: 'Border radius not specified in Figma design'
      });
    }

    // Compare dimensions - only if both exist
    if (figmaComponent.properties?.dimensions && matchedElement.boundingRect) {
      const dimensionComparison = this.compareDimensions(
        figmaComponent.properties.dimensions,
        matchedElement.boundingRect
      );
      deviations.push(...dimensionComparison.deviations);
      matches.push(...dimensionComparison.matches);
    } else if (!figmaComponent.properties?.dimensions) {
      unfetched.push({
        property: 'dimensions',
        status: 'unfetched',
        message: 'Dimension data not available in Figma design'
      });
    }

    // Determine overall status
    let status = 'matches';
    if (deviations.length > 0) {
      status = 'has_deviations';
    } else if (unfetched.length > 0 && matches.length === 0) {
      status = 'unfetched';
    } else if (unfetched.length > 0) {
      status = 'partial_data';
    }

    const result = {
      componentId: figmaComponent.id,
      componentName: figmaComponent.name,
      componentType: figmaComponent.type,
      selector: matchedElement.selector,
      status,
      deviations,
      matches,
      matchScore: matchedElement.matchScore
    };

    // Add unfetched properties if any
    if (unfetched.length > 0) {
      result.unfetched = unfetched;
    }

    return result;
  }

  /**
   * Find the best matching web element for a Figma component
   * @param {Object} figmaComponent - Figma component
   * @param {Array} webElements - Web elements
   * @returns {Object} Best matching web element
   */
  findBestMatch(figmaComponent, webElements) {
    let bestMatch = null;
    let bestScore = 0;

    for (const webElement of webElements) {
      const score = this.calculateMatchScore(figmaComponent, webElement);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { ...webElement, matchScore: score };
      }
    }

    // Only return matches above a minimum threshold
    return bestScore > 0.3 ? bestMatch : null;
  }

  /**
   * Calculate match score between Figma component and web element
   * @param {Object} figmaComponent - Figma component
   * @param {Object} webElement - Web element
   * @returns {number} Match score (0-1)
   */
  calculateMatchScore(figmaComponent, webElement) {
    let score = 0;
    let factors = 0;

    // Name similarity
    if (figmaComponent.name && webElement.text) {
      const nameSimilarity = this.calculateStringSimilarity(
        figmaComponent.name.toLowerCase(),
        webElement.text.toLowerCase()
      );
      score += nameSimilarity * 0.3;
      factors += 0.3;
    }

    // Type similarity
    const typeSimilarity = this.getTypeSimilarity(figmaComponent.type, webElement.tagName);
    score += typeSimilarity * 0.2;
    factors += 0.2;

    // Dimension similarity - check both possible locations for dimensions
    const figmaDimensions = figmaComponent.dimensions || figmaComponent.properties?.dimensions;
    const webDimensions = webElement.dimensions || webElement.boundingRect;
    
    if (figmaDimensions && webDimensions) {
      const dimensionSimilarity = this.calculateDimensionSimilarity(
        figmaDimensions,
        webDimensions
      );
      score += dimensionSimilarity * 0.3;
      factors += 0.3;
    }

    // Color similarity - check both possible locations for backgroundColor
    const figmaColor = figmaComponent.backgroundColor || figmaComponent.properties?.backgroundColor;
    
    if (figmaColor && webElement.styles?.backgroundColor) {
      const colorSimilarity = this.calculateColorSimilarity(
        figmaColor,
        webElement.styles.backgroundColor
      );
      score += colorSimilarity * 0.2;
      factors += 0.2;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Compare typography properties
   * @param {Object} figmaTypography - Figma typography data
   * @param {Object} webStyles - Web element styles
   * @returns {Object} Typography comparison result
   */
  compareTypography(figmaTypography, webStyles) {
    const deviations = [];
    const matches = [];

    // Font family
    if (figmaTypography.fontFamily && webStyles.fontFamily) {
      if (this.normalizeFontFamily(figmaTypography.fontFamily) !== 
          this.normalizeFontFamily(webStyles.fontFamily)) {
        deviations.push({
          property: 'fontFamily',
          figmaValue: figmaTypography.fontFamily,
          webValue: webStyles.fontFamily,
          difference: 'different',
          severity: 'medium',
          message: 'Font family differs between design and implementation'
        });
      } else {
        matches.push({
          property: 'fontFamily',
          value: figmaTypography.fontFamily,
          message: 'Font family matches'
        });
      }
    }

    // Font size
    if (figmaTypography.fontSize && webStyles.fontSize) {
      const figmaSize = parseFloat(figmaTypography.fontSize);
      const webSize = parseFloat(webStyles.fontSize);
      const difference = Math.abs(figmaSize - webSize);
      
      if (difference > this.thresholds.fontSizeDifference) {
        deviations.push({
          property: 'fontSize',
          figmaValue: `${figmaSize}px`,
          webValue: `${webSize}px`,
          difference: `${difference}px`,
          severity: this.getSeverity('fontSize', difference),
          message: `Font size differs by ${difference}px`
        });
      } else {
        matches.push({
          property: 'fontSize',
          value: `${figmaSize}px`,
          message: 'Font size matches within tolerance'
        });
      }
    }

    // Font weight
    if (figmaTypography.fontWeight && webStyles.fontWeight) {
      const figmaWeight = this.normalizeFontWeight(figmaTypography.fontWeight);
      const webWeight = this.normalizeFontWeight(webStyles.fontWeight);
      
      if (figmaWeight !== webWeight) {
        deviations.push({
          property: 'fontWeight',
          figmaValue: figmaTypography.fontWeight,
          webValue: webStyles.fontWeight,
          difference: 'different',
          severity: 'low',
          message: 'Font weight differs between design and implementation'
        });
      } else {
        matches.push({
          property: 'fontWeight',
          value: figmaTypography.fontWeight,
          message: 'Font weight matches'
        });
      }
    }

    return { deviations, matches };
  }

  /**
   * Compare color properties
   * @param {string} figmaColor - Figma color (hex)
   * @param {string} webColor - Web color (various formats)
   * @param {string} property - Property name
   * @returns {Object} Color comparison result
   */
  compareColors(figmaColor, webColor, property) {
    const figmaRgb = this.hexToRgb(figmaColor);
    const webRgb = this.parseWebColor(webColor);
    
    if (!figmaRgb || !webRgb) {
      return {
        deviation: {
          property,
          figmaValue: figmaColor,
          webValue: webColor,
          difference: 'unable to compare',
          severity: 'low',
          message: 'Color format could not be compared'
        }
      };
    }

    const difference = this.calculateColorDifference(figmaRgb, webRgb);
    
    if (difference > this.thresholds.colorDifference) {
      return {
        deviation: {
          property,
          figmaValue: figmaColor,
          webValue: webColor,
          difference: `${Math.round(difference)} units`,
          severity: this.getSeverity('color', difference),
          message: `${property} differs by ${Math.round(difference)} color units`
        }
      };
    } else {
      return {
        match: {
          property,
          value: figmaColor,
          message: `${property} matches within tolerance`
        }
      };
    }
  }

  /**
   * Compare spacing properties
   * @param {Object} figmaSpacing - Figma spacing data
   * @param {Object} webStyles - Web element styles
   * @returns {Object} Spacing comparison result
   */
  compareSpacing(figmaSpacing, webStyles) {
    const deviations = [];
    const matches = [];

    const spacingProps = [
      { figma: 'paddingTop', web: 'paddingTop' },
      { figma: 'paddingRight', web: 'paddingRight' },
      { figma: 'paddingBottom', web: 'paddingBottom' },
      { figma: 'paddingLeft', web: 'paddingLeft' }
    ];

    for (const prop of spacingProps) {
      if (figmaSpacing[prop.figma] !== undefined && webStyles[prop.web] !== undefined) {
        const figmaValue = parseFloat(figmaSpacing[prop.figma]);
        const webValue = parseFloat(webStyles[prop.web]);
        const difference = Math.abs(figmaValue - webValue);

        if (difference > this.thresholds.spacingDifference) {
          deviations.push({
            property: prop.figma,
            figmaValue: `${figmaValue}px`,
            webValue: `${webValue}px`,
            difference: `${difference}px`,
            severity: this.getSeverity('spacing', difference),
            message: `${prop.figma} differs by ${difference}px`
          });
        } else {
          matches.push({
            property: prop.figma,
            value: `${figmaValue}px`,
            message: `${prop.figma} matches within tolerance`
          });
        }
      }
    }

    return { deviations, matches };
  }

  /**
   * Compare border properties
   * @param {Object} figmaBorders - Figma border data
   * @param {Object} webBorders - Web border data
   * @returns {Object} Border comparison result
   */
  compareBorders(figmaBorders, webBorders) {
    const deviations = [];
    const matches = [];

    // Border radius
    if (figmaBorders.borderRadius !== undefined && webBorders.borderRadius !== undefined) {
      const figmaValue = parseFloat(figmaBorders.borderRadius);
      const webValue = parseFloat(webBorders.borderRadius);
      const difference = Math.abs(figmaValue - webValue);

      if (difference > this.thresholds.sizeDifference) {
        deviations.push({
          property: 'borderRadius',
          figmaValue: `${figmaValue}px`,
          webValue: `${webValue}px`,
          difference: `${difference}px`,
          severity: this.getSeverity('size', difference),
          message: `Border radius differs by ${difference}px`
        });
      } else {
        matches.push({
          property: 'borderRadius',
          value: `${figmaValue}px`,
          message: 'Border radius matches within tolerance'
        });
      }
    }

    return { deviations, matches };
  }

  /**
   * Compare dimension properties
   * @param {Object} figmaDimensions - Figma dimensions
   * @param {Object} webDimensions - Web element dimensions
   * @returns {Object} Dimension comparison result
   */
  compareDimensions(figmaDimensions, webDimensions) {
    const deviations = [];
    const matches = [];

    // Width
    if (figmaDimensions.width !== undefined && webDimensions.width !== undefined) {
      const difference = Math.abs(figmaDimensions.width - webDimensions.width);
      if (difference > this.thresholds.sizeDifference) {
        deviations.push({
          property: 'width',
          figmaValue: `${figmaDimensions.width}px`,
          webValue: `${webDimensions.width}px`,
          difference: `${difference}px`,
          severity: this.getSeverity('size', difference),
          message: `Width differs by ${difference}px`
        });
      } else {
        matches.push({
          property: 'width',
          value: `${figmaDimensions.width}px`,
          message: 'Width matches within tolerance'
        });
      }
    }

    // Height
    if (figmaDimensions.height !== undefined && webDimensions.height !== undefined) {
      const difference = Math.abs(figmaDimensions.height - webDimensions.height);
      if (difference > this.thresholds.sizeDifference) {
        deviations.push({
          property: 'height',
          figmaValue: `${figmaDimensions.height}px`,
          webValue: `${webDimensions.height}px`,
          difference: `${difference}px`,
          severity: this.getSeverity('size', difference),
          message: `Height differs by ${difference}px`
        });
      } else {
        matches.push({
          property: 'height',
          value: `${figmaDimensions.height}px`,
          message: 'Height matches within tolerance'
        });
      }
    }

    return { deviations, matches };
  }

  // Helper methods for calculations and normalization

  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  getTypeSimilarity(figmaType, webTagName) {
    const typeMap = {
      'TEXT': ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label'],
      'FRAME': ['div', 'section', 'article', 'main'],
      'RECTANGLE': ['div', 'span'],
      'INSTANCE': ['div', 'section']
    };

    const webTag = webTagName.toLowerCase();
    const expectedTags = typeMap[figmaType] || [];
    
    return expectedTags.includes(webTag) ? 1 : 0.3;
  }

  calculateDimensionSimilarity(figmaDim, webDim) {
    const widthDiff = Math.abs(figmaDim.width - webDim.width) / Math.max(figmaDim.width, webDim.width);
    const heightDiff = Math.abs(figmaDim.height - webDim.height) / Math.max(figmaDim.height, webDim.height);
    
    return 1 - (widthDiff + heightDiff) / 2;
  }

  calculateColorSimilarity(color1, color2) {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.parseWebColor(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const difference = this.calculateColorDifference(rgb1, rgb2);
    return Math.max(0, 1 - difference / 255);
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  parseWebColor(color) {
    // Handle rgb(), rgba(), hex, and named colors
    if (color.startsWith('#')) {
      return this.hexToRgb(color);
    } else if (color.startsWith('rgb')) {
      const matches = color.match(/\d+/g);
      if (matches && matches.length >= 3) {
        return {
          r: parseInt(matches[0]),
          g: parseInt(matches[1]),
          b: parseInt(matches[2])
        };
      }
    }
    return null;
  }

  calculateColorDifference(rgb1, rgb2) {
    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  }

  normalizeFontFamily(fontFamily) {
    return fontFamily.toLowerCase().replace(/['"]/g, '').split(',')[0].trim();
  }

  normalizeFontWeight(fontWeight) {
    const weightMap = {
      'thin': '100',
      'extralight': '200',
      'light': '300',
      'normal': '400',
      'medium': '500',
      'semibold': '600',
      'bold': '700',
      'extrabold': '800',
      'black': '900'
    };
    
    const normalized = fontWeight.toString().toLowerCase();
    return weightMap[normalized] || normalized;
  }

  getSeverity(propertyType, difference) {
    const severityThresholds = {
      color: { high: 50, medium: 20 },
      fontSize: { high: 6, medium: 3 },
      spacing: { high: 10, medium: 5 },
      size: { high: 20, medium: 10 }
    };

    const thresholds = severityThresholds[propertyType] || { high: 20, medium: 10 };
    
    if (difference >= thresholds.high) return 'high';
    if (difference >= thresholds.medium) return 'medium';
    return 'low';
  }

  async saveReport(report, outputPath) {
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
    console.log(`Comparison report saved to: ${outputPath}`);
    return report;
  }
}

export default ComparisonEngine; 