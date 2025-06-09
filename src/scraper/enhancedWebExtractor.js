import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { ErrorCategorizer } from '../utils/errorCategorizer.js';
import { BrowserManager } from '../utils/browserManager.js';

/**
 * Enhanced Web Extractor
 * Extracts comprehensive component data from web pages to match Figma component detail level
 */
export class EnhancedWebExtractor {
  constructor(config = {}) {
    this.config = {
      headless: "new",
      timeout: 60000,
      viewport: { width: 1200, height: 800 },
      maxComponents: 2000,
      includeInvisible: false,
      componentFilters: {
        minWidth: 10,
        minHeight: 10,
        excludeTags: ['script', 'style', 'meta', 'title', 'head', 'noscript'],
        excludeClasses: ['sr-only', 'visually-hidden', 'hidden']
      },
      ...config
    };

    this.browser = null;
    this.page = null;
  }

  /**
   * Initialize browser with enhanced settings
   */
  async initialize() {
    try {
      // Close existing browser if any
      if (this.browser) {
        try {
          await BrowserManager.closeBrowserSafely(this.browser);
        } catch (error) {
          console.warn('⚠️ Error closing existing browser:', error.message);
        }
        this.browser = null;
        this.page = null;
      }

      console.log('🔍 Checking browser environment...');
      const browserInfo = await BrowserManager.getBrowserInfo();
      console.log(`📊 Current browser processes: ${browserInfo.runningProcesses}`);
      
      if (!browserInfo.isClean) {
        console.log('🧹 Cleaning up orphaned processes...');
        await BrowserManager.cleanupOrphanedProcesses();
      }

      console.log('🚀 Launching Enhanced Web Extractor...');
      this.browser = await BrowserManager.createBrowser({
        headless: this.config.headless === true ? "new" : this.config.headless,
        timeout: 60000,
        viewport: this.config.viewport
      });

      // Wait for browser to be fully ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create new page with enhanced management
      this.page = await BrowserManager.createPage(this.browser, {
        timeout: this.config.timeout,
        viewport: this.config.viewport
      });
      
      // Set user agent to avoid bot detection
      await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Add error handlers
      this.page.on('error', (error) => {
        console.error('❌ Page error:', error);
      });

      this.page.on('pageerror', (error) => {
        console.error('❌ Page script error:', error);
      });

      // Wait for page to be fully ready and test it
      await this.page.goto('about:blank');
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('✅ Enhanced Web Extractor initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Web Extractor:', error);
      
      // Cleanup on failure
      if (this.browser) {
        try {
          await BrowserManager.closeBrowserSafely(this.browser);
        } catch (closeError) {
          console.warn('⚠️ Error during cleanup:', closeError.message);
        }
        this.browser = null;
        this.page = null;
      }
      
      throw error;
    }
  }

  /**
   * Extract comprehensive web component data
   * @param {string} url - Target URL
   * @param {Object} authentication - Authentication config
   * @returns {Object} Enhanced component data
   */
  async extractWebData(url, authentication = null) {
    try {
      console.log(`🌐 Enhanced extraction from: ${url}`);
      
      // Ensure browser is initialized and ready
      if (!this.browser || this.browser.process()?.killed) {
        console.log('🔄 Browser not ready, initializing...');
        await this.initialize();
      }

      // Ensure page is ready and not closed
      if (!this.page || this.page.isClosed()) {
        console.log('🔄 Page not ready, creating new page...');
        this.page = await this.browser.newPage();
        await this.page.setViewport(this.config.viewport);
        await this.page.setDefaultTimeout(this.config.timeout);
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      }

      // Double-check page readiness
      if (!this.page) {
        throw new Error('Page initialization failed - page is null');
      }

      // Handle authentication if provided
      if (authentication) {
        await this.handleAuthentication(authentication, url);
      }

      // Navigate to target URL with retries and fallback strategies
      let navigationSuccess = false;
      let lastError = null;
      
      const navigationStrategies = [
        { waitUntil: ['domcontentloaded', 'networkidle0'], timeout: this.config.timeout },
        { waitUntil: 'domcontentloaded', timeout: this.config.timeout },
        { waitUntil: 'load', timeout: Math.min(this.config.timeout, 30000) },
        { waitUntil: 'domcontentloaded', timeout: 15000 } // Final fallback with shorter timeout
      ];
      
      for (let attempt = 1; attempt <= navigationStrategies.length; attempt++) {
        try {
          const strategy = navigationStrategies[attempt - 1];
          console.log(`🔄 Navigation attempt ${attempt}/${navigationStrategies.length} to: ${url}`);
          console.log(`   Strategy: waitUntil=${JSON.stringify(strategy.waitUntil)}, timeout=${strategy.timeout}ms`);
          
          await this.page.goto(url, strategy);
          
          navigationSuccess = true;
          console.log(`✅ Successfully navigated to: ${url}`);
          break;
        } catch (error) {
          lastError = error;
          console.warn(`⚠️ Navigation attempt ${attempt} failed:`, error.message);
          
          if (attempt < navigationStrategies.length) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Recreate page if needed
            if (this.page.isClosed()) {
              this.page = await this.browser.newPage();
              await this.page.setViewport(this.config.viewport);
              await this.page.setDefaultTimeout(this.config.timeout);
            }
          }
        }
      }

      if (!navigationSuccess) {
        throw new Error(`Failed to navigate to ${url} after ${navigationStrategies.length} attempts. Last error: ${lastError?.message}`);
      }

      // Wait for page to be fully rendered, but with timeout fallback
      try {
        await Promise.race([
          this.page.waitForTimeout(3000),
          this.page.waitForSelector('body', { timeout: 5000 })
        ]);
      } catch (waitError) {
        console.warn('⚠️ Page wait timeout, proceeding with extraction:', waitError.message);
      }

      // Extract comprehensive component data
      const components = await this.extractComponents();
      
      // Analyze component hierarchy and relationships
      const hierarchyData = await this.analyzeComponentHierarchy();
      
      // Extract semantic patterns and UI elements
      const semanticComponents = await this.extractSemanticComponents();

      const extractedData = {
        url,
        extractedAt: new Date().toISOString(),
        authentication: authentication ? 'enabled' : 'none',
        extractionMethod: 'Enhanced Web Extractor',
        metadata: {
          totalComponents: components.length,
          semanticComponents: semanticComponents.length,
          hierarchyDepth: hierarchyData.maxDepth,
          pageTitle: await this.page.title(),
          viewport: this.config.viewport
        },
        // For compatibility with comparison engine
        elements: components,
        // Additional enhanced data
        components,
        semanticComponents,
        hierarchyData
      };

      console.log(`✅ Enhanced extraction complete: ${components.length} components, ${semanticComponents.length} semantic elements`);
      return extractedData;

    } catch (error) {
      console.error('❌ Enhanced web extraction failed:', error);
      
      // Categorize the error for better user understanding
      const categorizedError = ErrorCategorizer.categorizeError(error, { url, method: 'Enhanced Web Extractor' });
      const userFriendlyError = ErrorCategorizer.formatForUser(categorizedError);
      
      console.log('\n📊 Error Analysis:');
      console.log(`${userFriendlyError.title}`);
      console.log(`Description: ${userFriendlyError.description}`);
      console.log(`Severity: ${userFriendlyError.severity}`);
      console.log(`Actionable: ${userFriendlyError.actionable}`);
      console.log(`Category: ${userFriendlyError.category}`);
      
      if (userFriendlyError.suggestions.length > 0) {
        console.log('\n💡 Suggestions:');
        userFriendlyError.suggestions.forEach((suggestion, index) => {
          console.log(`  ${index + 1}. ${suggestion}`);
        });
      }
      
      // Try to recover by reinitializing for actionable errors
      if (categorizedError.actionable && 
          (error.message.includes('main frame') || error.message.includes('Target closed') || error.message.includes('Session closed'))) {
        console.log('🔄 Attempting to recover by reinitializing...');
        try {
          await this.initialize();
          console.log('✅ Recovery successful, but extraction failed');
        } catch (recoveryError) {
          console.error('❌ Recovery failed:', recoveryError);
        }
      }
      
      // Attach categorized error info to the original error
      error.categorized = categorizedError;
      error.userFriendly = userFriendlyError;
      
      throw error;
    }
  }

  /**
   * Extract all meaningful components from the page
   */
  async extractComponents() {
    return await this.page.evaluate((config) => {
      const components = [];
      const processedElements = new Set();

      function isElementVisible(element) {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0' &&
          rect.width >= config.componentFilters.minWidth &&
          rect.height >= config.componentFilters.minHeight
        );
      }

      function isElementMeaningful(element) {
        const tagName = element.tagName.toLowerCase();
        
        // Exclude unwanted tags
        if (config.componentFilters.excludeTags.includes(tagName)) {
          return false;
        }

        // Exclude hidden classes
        const classList = Array.from(element.classList);
        if (classList.some(cls => config.componentFilters.excludeClasses.includes(cls))) {
          return false;
        }

        // Include elements with meaningful content or semantic value
        return (
          element.textContent?.trim().length > 0 ||
          element.children.length > 0 ||
          ['img', 'button', 'input', 'select', 'textarea', 'a', 'form'].includes(tagName) ||
          element.style.backgroundImage ||
          window.getComputedStyle(element).backgroundImage !== 'none'
        );
      }

      function getElementSelector(element) {
        // Generate comprehensive selector
        if (element.id) {
          return `#${element.id}`;
        }

        const classNames = Array.from(element.classList).slice(0, 3);
        if (classNames.length > 0) {
          return `${element.tagName.toLowerCase()}.${classNames.join('.')}`;
        }

        // Generate path-based selector as fallback
        const path = [];
        let current = element;
        while (current && current.tagName) {
          let selector = current.tagName.toLowerCase();
          if (current.id) {
            selector += `#${current.id}`;
            path.unshift(selector);
            break;
          }
          if (current.className) {
            const classes = Array.from(current.classList).slice(0, 2);
            if (classes.length > 0) {
              selector += `.${classes.join('.')}`;
            }
          }
          path.unshift(selector);
          current = current.parentElement;
          if (path.length > 5) break; // Limit depth
        }
        return path.join(' > ');
      }

      function extractDetailedStyles(element) {
        const computed = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return {
          // Typography
          typography: {
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            fontStyle: computed.fontStyle,
            lineHeight: computed.lineHeight,
            letterSpacing: computed.letterSpacing,
            textAlign: computed.textAlign,
            textDecoration: computed.textDecoration,
            textTransform: computed.textTransform,
            color: computed.color,
            whiteSpace: computed.whiteSpace,
            wordSpacing: computed.wordSpacing
          },

          // Layout & Positioning
          layout: {
            display: computed.display,
            position: computed.position,
            top: computed.top,
            right: computed.right,
            bottom: computed.bottom,
            left: computed.left,
            zIndex: computed.zIndex,
            float: computed.float,
            clear: computed.clear,
            overflow: computed.overflow,
            overflowX: computed.overflowX,
            overflowY: computed.overflowY,
            visibility: computed.visibility
          },

          // Dimensions
          dimensions: {
            width: computed.width,
            height: computed.height,
            minWidth: computed.minWidth,
            maxWidth: computed.maxWidth,
            minHeight: computed.minHeight,
            maxHeight: computed.maxHeight,
            boxSizing: computed.boxSizing
          },

          // Spacing
          spacing: {
            margin: computed.margin,
            marginTop: computed.marginTop,
            marginRight: computed.marginRight,
            marginBottom: computed.marginBottom,
            marginLeft: computed.marginLeft,
            padding: computed.padding,
            paddingTop: computed.paddingTop,
            paddingRight: computed.paddingRight,
            paddingBottom: computed.paddingBottom,
            paddingLeft: computed.paddingLeft
          },

          // Background & Colors
          background: {
            backgroundColor: computed.backgroundColor,
            backgroundImage: computed.backgroundImage,
            backgroundSize: computed.backgroundSize,
            backgroundPosition: computed.backgroundPosition,
            backgroundRepeat: computed.backgroundRepeat,
            backgroundAttachment: computed.backgroundAttachment,
            backgroundClip: computed.backgroundClip,
            backgroundOrigin: computed.backgroundOrigin
          },

          // Border & Outline
          border: {
            border: computed.border,
            borderWidth: computed.borderWidth,
            borderStyle: computed.borderStyle,
            borderColor: computed.borderColor,
            borderRadius: computed.borderRadius,
            borderTopLeftRadius: computed.borderTopLeftRadius,
            borderTopRightRadius: computed.borderTopRightRadius,
            borderBottomLeftRadius: computed.borderBottomLeftRadius,
            borderBottomRightRadius: computed.borderBottomRightRadius,
            outline: computed.outline,
            outlineWidth: computed.outlineWidth,
            outlineStyle: computed.outlineStyle,
            outlineColor: computed.outlineColor
          },

          // Effects & Transforms
          effects: {
            opacity: computed.opacity,
            boxShadow: computed.boxShadow,
            textShadow: computed.textShadow,
            filter: computed.filter,
            transform: computed.transform,
            transformOrigin: computed.transformOrigin,
            transition: computed.transition,
            animation: computed.animation
          },

          // Flexbox
          flexbox: {
            flexDirection: computed.flexDirection,
            flexWrap: computed.flexWrap,
            justifyContent: computed.justifyContent,
            alignItems: computed.alignItems,
            alignContent: computed.alignContent,
            flex: computed.flex,
            flexGrow: computed.flexGrow,
            flexShrink: computed.flexShrink,
            flexBasis: computed.flexBasis,
            alignSelf: computed.alignSelf,
            gap: computed.gap,
            rowGap: computed.rowGap,
            columnGap: computed.columnGap
          },

          // Grid
          grid: {
            gridTemplateColumns: computed.gridTemplateColumns,
            gridTemplateRows: computed.gridTemplateRows,
            gridTemplateAreas: computed.gridTemplateAreas,
            gridArea: computed.gridArea,
            gridColumn: computed.gridColumn,
            gridRow: computed.gridRow,
            gridGap: computed.gridGap,
            gridRowGap: computed.gridRowGap,
            gridColumnGap: computed.gridColumnGap,
            justifyItems: computed.justifyItems,
            alignItems: computed.alignItems,
            placeSelf: computed.placeSelf,
            justifySelf: computed.justifySelf
          },

          // Interaction
          interaction: {
            cursor: computed.cursor,
            pointerEvents: computed.pointerEvents,
            userSelect: computed.userSelect,
            resize: computed.resize
          }
        };
      }

      function getComponentType(element) {
        const tagName = element.tagName.toLowerCase();
        const className = (element.className && typeof element.className === 'string') 
          ? element.className.toLowerCase() 
          : '';
        const role = element.getAttribute('role');

        // Semantic HTML elements
        if (['button', 'input', 'select', 'textarea', 'form'].includes(tagName)) {
          return 'form-control';
        }
        if (['nav', 'aside', 'section', 'article', 'header', 'footer', 'main'].includes(tagName)) {
          return 'semantic-section';
        }
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          return 'heading';
        }
        if (tagName === 'img') {
          return 'image';
        }
        if (tagName === 'a') {
          return 'link';
        }

        // Role-based detection
        if (role) {
          return `role-${role}`;
        }

        // Class-based detection
        if (className.includes('btn') || className.includes('button')) {
          return 'button';
        }
        if (className.includes('card') || className.includes('panel')) {
          return 'card';
        }
        if (className.includes('modal') || className.includes('dialog')) {
          return 'modal';
        }
        if (className.includes('nav') || className.includes('menu')) {
          return 'navigation';
        }
        if (className.includes('form')) {
          return 'form';
        }
        if (className.includes('table') || tagName === 'table') {
          return 'table';
        }
        if (className.includes('list') || ['ul', 'ol', 'dl'].includes(tagName)) {
          return 'list';
        }

        return 'generic';
      }

      // Find all meaningful elements
      const allElements = document.querySelectorAll('*');
      
      for (let i = 0; i < allElements.length && components.length < config.maxComponents; i++) {
        const element = allElements[i];
        
        if (processedElements.has(element) || 
            !isElementMeaningful(element) || 
            (!config.includeInvisible && !isElementVisible(element))) {
          continue;
        }

        const rect = element.getBoundingClientRect();
        const styles = extractDetailedStyles(element);
        const componentType = getComponentType(element);

        // Extract flat styles for compatibility with comparison engine
        const flatStyles = {
          // Typography from nested structure
          fontFamily: styles.typography.fontFamily,
          fontSize: styles.typography.fontSize,
          fontWeight: styles.typography.fontWeight,
          fontStyle: styles.typography.fontStyle,
          lineHeight: styles.typography.lineHeight,
          letterSpacing: styles.typography.letterSpacing,
          textAlign: styles.typography.textAlign,
          textDecoration: styles.typography.textDecoration,
          textTransform: styles.typography.textTransform,
          color: styles.typography.color,
          
          // Background from nested structure
          backgroundColor: styles.background.backgroundColor,
          backgroundImage: styles.background.backgroundImage,
          
          // Spacing from nested structure
          margin: styles.spacing.margin,
          marginTop: styles.spacing.marginTop,
          marginRight: styles.spacing.marginRight,
          marginBottom: styles.spacing.marginBottom,
          marginLeft: styles.spacing.marginLeft,
          padding: styles.spacing.padding,
          paddingTop: styles.spacing.paddingTop,
          paddingRight: styles.spacing.paddingRight,
          paddingBottom: styles.spacing.paddingBottom,
          paddingLeft: styles.spacing.paddingLeft,
          
          // Border from nested structure
          border: styles.border.border,
          borderWidth: styles.border.borderWidth,
          borderStyle: styles.border.borderStyle,
          borderColor: styles.border.borderColor,
          borderRadius: styles.border.borderRadius,
          
          // Layout from nested structure
          display: styles.layout.display,
          position: styles.layout.position,
          width: styles.dimensions.width,
          height: styles.dimensions.height,
          
          // Effects from nested structure
          opacity: styles.effects.opacity,
          boxShadow: styles.effects.boxShadow,
          textShadow: styles.effects.textShadow,
          transform: styles.effects.transform
        };

        const component = {
          id: `web-${i}`,
          selector: getElementSelector(element),
          tagName: element.tagName.toLowerCase(),
          type: componentType,
          text: element.textContent?.trim().substring(0, 200) || '',
          attributes: {
            id: element.id || null,
            className: element.className || null,
            role: element.getAttribute('role') || null,
            ariaLabel: element.getAttribute('aria-label') || null,
            title: element.getAttribute('title') || null,
            alt: element.getAttribute('alt') || null,
            href: element.getAttribute('href') || null,
            src: element.getAttribute('src') || null
          },
          // For comparison engine compatibility
          boundingRect: {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            right: Math.round(rect.right),
            bottom: Math.round(rect.bottom)
          },
          // Dimensions property expected by comparison engine
          dimensions: {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            x: Math.round(rect.left),
            y: Math.round(rect.top)
          },
          // Flat styles for compatibility
          styles: flatStyles,
          // Enhanced data structure  
          position: {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            right: Math.round(rect.right),
            bottom: Math.round(rect.bottom)
          },
          detailedStyles: styles,
          childCount: element.children.length,
          depth: 0, // Will be calculated in hierarchy analysis
          parentSelector: element.parentElement ? getElementSelector(element.parentElement) : null
        };

        components.push(component);
        processedElements.add(element);
      }

      return components;
    }, this.config);
  }

  /**
   * Extract semantic UI components (buttons, forms, navigation, etc.)
   */
  async extractSemanticComponents() {
    return await this.page.evaluate(() => {
      const semanticComponents = [];

      // Find form components
      const forms = document.querySelectorAll('form');
      forms.forEach((form, index) => {
        const inputs = form.querySelectorAll('input, select, textarea, button');
        semanticComponents.push({
          type: 'form',
          id: `form-${index}`,
          selector: form.id ? `#${form.id}` : `form:nth-of-type(${index + 1})`,
          action: form.action,
          method: form.method,
          inputCount: inputs.length,
          inputs: Array.from(inputs).map(input => ({
            type: input.type,
            name: input.name,
            placeholder: input.placeholder,
            required: input.required
          }))
        });
      });

      // Find navigation components
      const navs = document.querySelectorAll('nav, [role="navigation"], .nav, .navbar, .menu');
      navs.forEach((nav, index) => {
        const links = nav.querySelectorAll('a');
        semanticComponents.push({
          type: 'navigation',
          id: `nav-${index}`,
          selector: nav.id ? `#${nav.id}` : `nav:nth-of-type(${index + 1})`,
          linkCount: links.length,
          links: Array.from(links).map(link => ({
            text: link.textContent?.trim(),
            href: link.href,
            external: link.hostname !== window.location.hostname
          }))
        });
      });

      // Find button components
      const buttons = document.querySelectorAll('button, .btn, [role="button"], input[type="button"], input[type="submit"]');
      buttons.forEach((button, index) => {
        semanticComponents.push({
          type: 'button',
          id: `button-${index}`,
          selector: button.id ? `#${button.id}` : `button:nth-of-type(${index + 1})`,
          text: button.textContent?.trim() || button.value,
          buttonType: button.type,
          disabled: button.disabled
        });
      });

      // Find image components
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        semanticComponents.push({
          type: 'image',
          id: `image-${index}`,
          selector: img.id ? `#${img.id}` : `img:nth-of-type(${index + 1})`,
          src: img.src,
          alt: img.alt,
          width: img.naturalWidth,
          height: img.naturalHeight,
          loading: img.loading
        });
      });

      // Find table components
      const tables = document.querySelectorAll('table');
      tables.forEach((table, index) => {
        const rows = table.querySelectorAll('tr');
        const headers = table.querySelectorAll('th');
        semanticComponents.push({
          type: 'table',
          id: `table-${index}`,
          selector: table.id ? `#${table.id}` : `table:nth-of-type(${index + 1})`,
          rowCount: rows.length,
          columnCount: headers.length,
          hasCaption: !!table.querySelector('caption'),
          caption: table.querySelector('caption')?.textContent?.trim()
        });
      });

      return semanticComponents;
    });
  }

  /**
   * Analyze component hierarchy and relationships
   */
  async analyzeComponentHierarchy() {
    return await this.page.evaluate(() => {
      const hierarchy = {
        maxDepth: 0,
        containers: [],
        relationships: []
      };

      function calculateDepth(element, currentDepth = 0) {
        hierarchy.maxDepth = Math.max(hierarchy.maxDepth, currentDepth);
        
        if (element.children.length > 0) {
          Array.from(element.children).forEach(child => {
            calculateDepth(child, currentDepth + 1);
          });
        }
      }

      // Calculate maximum depth
      calculateDepth(document.body);

      // Find container elements
      const containers = document.querySelectorAll('div, section, article, aside, header, footer, main, nav');
      containers.forEach((container, index) => {
        const childElements = container.children.length;
        if (childElements > 2) { // Only consider meaningful containers
          hierarchy.containers.push({
            id: `container-${index}`,
            selector: container.id ? `#${container.id}` : container.tagName.toLowerCase(),
            childCount: childElements,
            depth: 0, // Would need to calculate based on DOM position
            type: container.tagName.toLowerCase()
          });
        }
      });

      return hierarchy;
    });
  }

  /**
   * Handle authentication similar to the original WebExtractor
   */
  async handleAuthentication(authentication, targetUrl) {
    if (!authentication || !authentication.type) {
      return;
    }

    console.log(`🔐 Handling ${authentication.type} authentication...`);

    // Ensure page is ready before authentication
    if (!this.page) {
      throw new Error('Page not initialized for authentication');
    }

    try {
      switch (authentication.type) {
        case 'cookies':
          if (authentication.cookies) {
            console.log(`🔐 Setting ${authentication.cookies.length} cookies`);
            await this.page.setCookie(...authentication.cookies);
          }
          break;
        
        case 'headers':
          if (authentication.headers) {
            console.log(`🔐 Setting HTTP headers`);
            await this.page.setExtraHTTPHeaders(authentication.headers);
          }
          break;
        
        case 'credentials':
          // Navigate to login page and fill credentials
          if (authentication.loginUrl) {
            console.log(`🔐 Navigating to login URL: ${authentication.loginUrl}`);
            
            // Ensure page is ready for navigation
            await new Promise(resolve => setTimeout(resolve, 100));
            
            await this.page.goto(authentication.loginUrl, { 
              waitUntil: 'networkidle2',
              timeout: this.config.timeout 
            });
            
            // Wait for page to be ready
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (authentication.usernameSelector && authentication.username) {
              console.log(`🔐 Filling username field: ${authentication.usernameSelector}`);
              await this.page.waitForSelector(authentication.usernameSelector, { timeout: 5000 });
              await this.page.type(authentication.usernameSelector, authentication.username);
            }
            
            if (authentication.passwordSelector && authentication.password) {
              console.log(`🔐 Filling password field: ${authentication.passwordSelector}`);
              await this.page.waitForSelector(authentication.passwordSelector, { timeout: 5000 });
              await this.page.type(authentication.passwordSelector, authentication.password);
            }
            
            if (authentication.submitSelector) {
              console.log(`🔐 Clicking submit button: ${authentication.submitSelector}`);
              await this.page.waitForSelector(authentication.submitSelector, { timeout: 5000 });
              await Promise.all([
                this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: this.config.timeout }),
                this.page.click(authentication.submitSelector)
              ]);
            }
          } else {
            console.log(`🔐 No login URL provided for credentials authentication`);
          }
          break;
          
        default:
          console.log(`🔐 Unknown authentication type: ${authentication.type}`);
          break;
      }
      
      console.log(`✅ Authentication completed successfully`);
    } catch (error) {
      console.error(`❌ Authentication failed: ${error.message}`);
      console.error(`❌ Authentication stack:`, error.stack);
      throw error;
    }
  }

  /**
   * Close the browser and cleanup resources
   */
  async close() {
    try {
      console.log('🔄 Closing Enhanced Web Extractor...');
      
      if (this.browser) {
        await BrowserManager.closeBrowserSafely(this.browser);
        console.log('✅ Browser closed safely');
      }
      
      this.page = null;
      this.browser = null;
      
      console.log('✅ Enhanced Web Extractor closed successfully');
    } catch (error) {
      console.error('❌ Error closing Enhanced Web Extractor:', error);
      // Force cleanup even if there are errors
      await BrowserManager.cleanupOrphanedProcesses();
      this.page = null;
      this.browser = null;
    }
  }

  /**
   * Force cleanup of browser resources
   */
  async forceCleanup() {
    try {
      console.log('🧹 Force cleaning up Enhanced Web Extractor resources...');
      
      if (this.browser) {
        try {
          // Try to get browser process and kill it if needed
          const process = this.browser.process();
          if (process && !process.killed) {
            process.kill('SIGKILL');
            console.log('🔫 Browser process killed');
          }
        } catch (processError) {
          console.warn('⚠️ Error killing browser process:', processError.message);
        }
      }
      
      this.page = null;
      this.browser = null;
      
      console.log('✅ Force cleanup completed');
    } catch (error) {
      console.error('❌ Error during force cleanup:', error);
      this.page = null;
      this.browser = null;
    }
  }

  /**
   * Check if the extractor is ready for use
   */
  isReady() {
    return this.browser && 
           !this.browser.process()?.killed && 
           this.page && 
           !this.page.isClosed();
  }

  /**
   * Get status information about the extractor
   */
  getStatus() {
    return {
      browserReady: this.browser && !this.browser.process()?.killed,
      pageReady: this.page && !this.page.isClosed(),
      fullyReady: this.isReady()
    };
  }

  /**
   * Extract comprehensive web data using multiple extraction methods
   * @param {string} url - Target URL
   * @param {Object} authentication - Authentication config
   * @returns {Object} Comprehensive web data with multiple analysis methods
   */
  async extractComprehensiveWebData(url, authentication = null) {
    try {
      console.log(`🌐 Comprehensive extraction from: ${url}`);
      
      // Ensure browser is initialized and ready
      if (!this.browser || this.browser.process()?.killed) {
        console.log('🔄 Browser not ready, initializing...');
        await this.initialize();
      }

      // Ensure page is ready and not closed
      if (!this.page || this.page.isClosed()) {
        console.log('🔄 Page not ready, creating new page...');
        this.page = await this.browser.newPage();
        await this.page.setViewport(this.config.viewport);
        await this.page.setDefaultTimeout(this.config.timeout);
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      }

      // Handle authentication if provided
      if (authentication) {
        await this.handleAuthentication(authentication, url);
      }

      // Navigate to target URL with retries
      let navigationSuccess = false;
      let lastError = null;
      
      const navigationStrategies = [
        { waitUntil: ['domcontentloaded', 'networkidle0'], timeout: this.config.timeout },
        { waitUntil: 'domcontentloaded', timeout: this.config.timeout },
        { waitUntil: 'load', timeout: Math.min(this.config.timeout, 30000) },
        { waitUntil: 'domcontentloaded', timeout: 15000 }
      ];
      
      for (let attempt = 1; attempt <= navigationStrategies.length; attempt++) {
        try {
          const strategy = navigationStrategies[attempt - 1];
          console.log(`🔄 Navigation attempt ${attempt}/${navigationStrategies.length} to: ${url}`);
          
          await this.page.goto(url, strategy);
          
          navigationSuccess = true;
          console.log(`✅ Successfully navigated to: ${url}`);
          break;
        } catch (error) {
          lastError = error;
          console.warn(`⚠️ Navigation attempt ${attempt} failed:`, error.message);
          
          if (attempt < navigationStrategies.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (this.page.isClosed()) {
              this.page = await this.browser.newPage();
              await this.page.setViewport(this.config.viewport);
              await this.page.setDefaultTimeout(this.config.timeout);
            }
          }
        }
      }

      if (!navigationSuccess) {
        throw new Error(`Failed to navigate to ${url} after ${navigationStrategies.length} attempts. Last error: ${lastError?.message}`);
      }

             // Wait for page to be fully rendered
       try {
         await Promise.race([
           new Promise(resolve => setTimeout(resolve, 3000)),
           this.page.waitForSelector('body', { timeout: 5000 })
         ]);
       } catch (waitError) {
         console.warn('⚠️ Page wait timeout, proceeding with extraction:', waitError.message);
       }

      console.log('🔍 Starting comprehensive extraction...');

      // Method 1: Extract CSS Stylesheets
      console.log('📋 Method 1: Analyzing CSS stylesheets...');
      const stylesheets = await this.extractCSSStylesheets();

      // Method 2: Extract UI Components
      console.log('🎯 Method 2: Extracting UI components...');
      const uiComponents = await this.extractUIComponents();

      // Method 3: Extract DOM Hierarchy
      console.log('🌳 Method 3: Analyzing DOM hierarchy...');
      const domHierarchy = await this.extractDOMHierarchy();

      // Method 4: Extract CSS Variables
      console.log('🎨 Method 4: Extracting CSS custom properties...');
      const cssVariables = await this.extractCSSVariables();

      // Method 5: Extract Color Palette
      console.log('🎨 Method 5: Building color palette...');
      const colorPalette = await this.extractColorPalette();

      // Method 6: Extract Typography System
      console.log('📝 Method 6: Analyzing typography system...');
      const typographySystem = await this.extractTypographySystem();

      // Build comprehensive results
      const comprehensiveData = {
        url,
        extractedAt: new Date().toISOString(),
        authentication: authentication ? 'enabled' : 'none',
        extractionMethod: 'Comprehensive Web Analysis',
        
        summary: {
          totalElements: domHierarchy.length,
          totalComponents: uiComponents.length,
          totalColors: colorPalette.length,
          totalFonts: typographySystem.fonts.length,
          totalStylesheets: stylesheets.length
        },

        methods: {
          stylesheets,
          uiComponents,
          domHierarchy,
          cssVariables,
          colorPalette,
          typographySystem
        },

        metadata: {
          pageTitle: await this.page.title(),
          viewport: this.config.viewport,
          userAgent: await this.page.evaluate(() => navigator.userAgent)
        }
      };

      console.log(`✅ Comprehensive extraction complete!`);
      console.log(`   📊 ${uiComponents.length} UI components`);
      console.log(`   🎨 ${colorPalette.length} colors`);
      console.log(`   📝 ${typographySystem.fonts.length} fonts`);
      console.log(`   📋 ${stylesheets.length} stylesheets`);

      return comprehensiveData;

    } catch (error) {
      console.error('❌ Comprehensive web extraction failed:', error);
      throw error;
    }
  }

  /**
   * Extract CSS stylesheets and their rules
   */
  async extractCSSStylesheets() {
    return await this.page.evaluate(() => {
      const stylesheets = [];
      
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i];
        const sheetData = {
          href: sheet.href,
          media: sheet.media ? Array.from(sheet.media).join(', ') : 'all',
          rules: []
        };

        try {
          const rules = sheet.cssRules || sheet.rules;
          for (let j = 0; j < Math.min(rules.length, 100); j++) { // Limit to prevent timeout
            const rule = rules[j];
            if (rule.type === CSSRule.STYLE_RULE) {
              const styles = {};
              for (let k = 0; k < rule.style.length; k++) {
                const prop = rule.style[k];
                styles[prop] = rule.style.getPropertyValue(prop);
              }
              
              sheetData.rules.push({
                selector: rule.selectorText,
                styles
              });
            }
          }
        } catch (e) {
          // CORS or other restrictions
          sheetData.error = 'Unable to access stylesheet rules (CORS)';
        }

        stylesheets.push(sheetData);
      }

      return stylesheets;
    });
  }

  /**
   * Extract UI components with semantic meaning
   */
  async extractUIComponents() {
    return await this.page.evaluate((config) => {
      const components = [];
      const uiSelectors = [
        'button', 'input', 'select', 'textarea', 'a', 'form',
        '[role="button"]', '[role="link"]', '[role="textbox"]',
        '.btn', '.button', '.link', '.input', '.form-control',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div',
        '.card', '.modal', '.dropdown', '.navbar', '.sidebar'
      ];

      uiSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((element, index) => {
            if (index >= 50) return; // Limit per selector

            const rect = element.getBoundingClientRect();
            const computed = window.getComputedStyle(element);

            // Skip invisible elements
            if (rect.width === 0 || rect.height === 0 || computed.display === 'none') {
              return;
            }

            const component = {
              type: getComponentType(element),
              tagName: element.tagName.toLowerCase(),
              id: element.id || null,
              className: element.className || null,
              text: element.textContent ? element.textContent.trim().substring(0, 100) : null,
              selector: selector,
              styles: {
                color: computed.color,
                backgroundColor: computed.backgroundColor,
                fontSize: computed.fontSize,
                fontFamily: computed.fontFamily,
                fontWeight: computed.fontWeight,
                padding: computed.padding,
                margin: computed.margin,
                border: computed.border,
                borderRadius: computed.borderRadius,
                boxShadow: computed.boxShadow,
                display: computed.display,
                position: computed.position
              },
              dimensions: {
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                x: Math.round(rect.left),
                y: Math.round(rect.top)
              }
            };

            components.push(component);
          });
        } catch (e) {
          // Skip problematic selectors
        }
      });

      function getComponentType(element) {
        const tag = element.tagName.toLowerCase();
        const role = element.getAttribute('role');
        const type = element.getAttribute('type');
        const className = element.className || '';

        // Role-based detection
        if (role) {
          return role.toUpperCase();
        }

        // Tag-based detection
        if (['button', 'input', 'select', 'textarea'].includes(tag)) {
          return tag.toUpperCase();
        }

        if (tag === 'a') return 'LINK';
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return 'HEADING';
        if (tag === 'p') return 'TEXT';
        if (tag === 'img') return 'IMAGE';
        if (tag === 'form') return 'FORM';

        // Class-based detection
        const classStr = typeof className === 'string' ? className : String(className || '');
        if (classStr.includes('btn') || classStr.includes('button')) return 'BUTTON';
        if (classStr.includes('card')) return 'CARD';
        if (classStr.includes('modal')) return 'MODAL';
        if (classStr.includes('nav')) return 'NAVIGATION';

        return 'ELEMENT';
      }

      return components;
    }, this.config);
  }

  /**
   * Extract DOM hierarchy with depth information
   */
  async extractDOMHierarchy() {
    return await this.page.evaluate(() => {
      const hierarchy = [];

      function walkDOM(element, depth = 0, parent = null) {
        if (depth > 10) return; // Prevent infinite recursion

        const rect = element.getBoundingClientRect();
        const computed = window.getComputedStyle(element);

        hierarchy.push({
          tagName: element.tagName.toLowerCase(),
          id: element.id || null,
          className: element.className || null,
          depth,
          parent: parent ? parent.tagName.toLowerCase() : null,
          children: element.children.length,
          text: element.textContent ? element.textContent.trim().substring(0, 50) : null,
          visible: rect.width > 0 && rect.height > 0 && computed.display !== 'none',
          dimensions: {
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          }
        });

        // Recursively process children
        for (const child of element.children) {
          walkDOM(child, depth + 1, element);
        }
      }

      // Start from body
      if (document.body) {
        walkDOM(document.body);
      }

      return hierarchy;
    });
  }

  /**
   * Extract CSS custom properties (variables)
   */
  async extractCSSVariables() {
    return await this.page.evaluate(() => {
      const variables = {};
      const rootStyles = getComputedStyle(document.documentElement);

      // Extract CSS custom properties from root
      for (let i = 0; i < rootStyles.length; i++) {
        const prop = rootStyles[i];
        if (prop.startsWith('--')) {
          variables[prop] = rootStyles.getPropertyValue(prop).trim();
        }
      }

      return variables;
    });
  }

  /**
   * Extract color palette from the page
   */
  async extractColorPalette() {
    return await this.page.evaluate(() => {
      const colors = new Set();
      const colorRegex = /#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g;

      // Extract colors from computed styles
      const allElements = document.querySelectorAll('*');
      for (let i = 0; i < Math.min(allElements.length, 500); i++) {
        const element = allElements[i];
        const computed = window.getComputedStyle(element);
        
        [computed.color, computed.backgroundColor, computed.borderColor].forEach(color => {
          if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
            colors.add(color);
          }
        });
      }

      // Convert to hex when possible and return as array
      return Array.from(colors).map(color => {
        let hex = color;
        if (color.startsWith('rgb')) {
          const matches = color.match(/\d+/g);
          if (matches && matches.length >= 3) {
            const [r, g, b] = matches.map(Number);
            hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
          }
        }
        return {
          original: color,
          hex: hex
        };
      });
    });
  }

  /**
   * Extract typography system information
   */
  async extractTypographySystem() {
    return await this.page.evaluate(() => {
      const fonts = new Set();
      const fontSizes = new Set();
      const textStyles = [];

      // Text-containing elements
      const textSelectors = ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'button', 'label', 'li'];
      
      textSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        for (let i = 0; i < Math.min(elements.length, 20); i++) {
          const element = elements[i];
          const computed = window.getComputedStyle(element);
          const text = element.textContent ? element.textContent.trim() : '';
          
          if (text.length > 0) {
            fonts.add(computed.fontFamily);
            fontSizes.add(computed.fontSize);
            
            if (textStyles.length < 30) {
              textStyles.push({
                tagName: element.tagName.toLowerCase(),
                text: text.substring(0, 50),
                fontFamily: computed.fontFamily,
                fontSize: computed.fontSize,
                fontWeight: computed.fontWeight,
                color: computed.color,
                lineHeight: computed.lineHeight
              });
            }
          }
        }
      });

      return {
        fonts: Array.from(fonts),
        fontSizes: Array.from(fontSizes),
        textStyles
      };
    });
  }
}

export default EnhancedWebExtractor; 