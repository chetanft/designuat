/**
 * Placeholder Constants
 * Centralizes all placeholder values, example data, and default content
 * Replaces hardcoded placeholder strings throughout the application
 */

export const PLACEHOLDER_URLS = {
  // Figma URLs
  figma: {
    design: 'https://www.figma.com/design/YOUR_FILE_ID/Design-Name?node-id=1:2',
    fileIdExample: 'fb5Yc1aKJv9YWsMLnNlWeK',
    nodeIdExample: '2:22260',
    tokenExample: 'figd_xxxxxxxxxxxx'
  },

  // Web URLs
  web: {
    example: 'https://your-website.com',
    login: 'https://your-website.com/login',
    dashboard: 'https://your-website.com/dashboard',
    component: 'https://your-website.com/component'
  },

  // API URLs
  api: {
    figmaBase: 'https://api.figma.com/v1',
    mcpServer: 'http://localhost:3845',
    mcpEndpoint: '/sse'
  }
};

export const PLACEHOLDER_CREDENTIALS = {
  username: 'your-username',
  email: 'user@example.com',
  password: 'your-password',
  domain: 'example.com'
};

export const PLACEHOLDER_SELECTORS = {
  username: '#username',
  password: '#password',
  submit: 'button[type="submit"]',
  loginForm: 'form#login',
  successIndicator: '.dashboard, .profile-menu'
};

export const PLACEHOLDER_DATA = {
  // Session cookies example
  sessionCookies: [
    {
      name: 'session_id',
      value: 'abc123',
      domain: '.example.com'
    }
  ],

  // Headers example
  headers: {
    'Authorization': 'Bearer your-token',
    'X-API-Key': 'your-key'
  },

  // Test file IDs
  testFileIds: {
    figma: 'ABC123',
    nodeId: '1:2'
  }
};

export const PLACEHOLDER_TEXT = {
  // Form placeholders
  figmaUrl: 'https://www.figma.com/design/ABC123/Design-Name?node-id=1:2',
  webUrl: 'https://example.com',
  loginUrl: 'https://example.com/login',
  
  // Input field placeholders
  username: 'your-username',
  password: 'your-password',
  email: 'user@example.com',
  token: 'figd_xxxxxxxxxxxx',
  
  // Selector placeholders
  usernameSelector: '#username',
  passwordSelector: '#password',
  submitSelector: 'button[type="submit"]',
  
  // JSON placeholders
  cookiesJson: '[{"name": "session_id", "value": "abc123", "domain": ".example.com"}]',
  headersJson: '{"Authorization": "Bearer your-token", "X-API-Key": "your-key"}'
};

export const EXAMPLE_CONFIGURATIONS = {
  // Basic comparison example
  basicComparison: {
    figmaUrl: PLACEHOLDER_URLS.figma.design,
    webUrl: PLACEHOLDER_URLS.web.example
  },

  // Authenticated comparison example
  authenticatedComparison: {
    figmaUrl: PLACEHOLDER_URLS.figma.design,
    webUrl: PLACEHOLDER_URLS.web.dashboard,
    authentication: {
      loginUrl: PLACEHOLDER_URLS.web.login,
      username: PLACEHOLDER_CREDENTIALS.email,
      password: PLACEHOLDER_CREDENTIALS.password,
      usernameSelector: PLACEHOLDER_SELECTORS.username,
      passwordSelector: PLACEHOLDER_SELECTORS.password,
      submitSelector: PLACEHOLDER_SELECTORS.submit
    }
  },

  // MCP server configuration example
  mcpServerConfig: {
    url: PLACEHOLDER_URLS.api.mcpServer,
    endpoint: PLACEHOLDER_URLS.api.mcpEndpoint,
    enabled: true
  }
};

export const ERROR_MESSAGES = {
  missingFigmaToken: 'Please enter your Figma access token',
  invalidUrl: 'Please enter a valid URL',
  missingCredentials: 'All authentication fields are required',
  connectionFailed: 'Connection test failed',
  tokenInvalid: 'Token should start with "figd_"'
};

export const SUCCESS_MESSAGES = {
  connectionSuccess: 'Connection test successful',
  configurationSaved: 'Configuration saved successfully',
  comparisonComplete: 'Comparison completed successfully'
};

// Helper function to get placeholder based on context
export function getPlaceholder(type, subtype = null) {
  if (subtype) {
    return PLACEHOLDER_TEXT[type]?.[subtype] || PLACEHOLDER_TEXT[type] || '';
  }
  return PLACEHOLDER_TEXT[type] || '';
}

// Helper function to get example configuration
export function getExampleConfig(type) {
  return EXAMPLE_CONFIGURATIONS[type] || null;
}

export default {
  PLACEHOLDER_URLS,
  PLACEHOLDER_CREDENTIALS,
  PLACEHOLDER_SELECTORS,
  PLACEHOLDER_DATA,
  PLACEHOLDER_TEXT,
  EXAMPLE_CONFIGURATIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  getPlaceholder,
  getExampleConfig
}; 