/**
 * Placeholder Constants for React Frontend
 * TypeScript version of placeholder values and example data
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
} as const;

export const PLACEHOLDER_CREDENTIALS = {
  username: 'your-username',
  email: 'user@example.com',
  password: 'your-password',
  domain: 'example.com'
} as const;

export const PLACEHOLDER_SELECTORS = {
  username: '#username',
  password: '#password',
  submit: 'button[type="submit"]',
  loginForm: 'form#login',
  successIndicator: '.dashboard, .profile-menu'
} as const;

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
} as const;

export const ERROR_MESSAGES = {
  missingFigmaToken: 'Please enter your Figma access token',
  invalidUrl: 'Please enter a valid URL',
  missingCredentials: 'All authentication fields are required',
  connectionFailed: 'Connection test failed',
  tokenInvalid: 'Token should start with "figd_"'
} as const;

export const SUCCESS_MESSAGES = {
  connectionSuccess: 'Connection test successful',
  configurationSaved: 'Configuration saved successfully',
  comparisonComplete: 'Comparison completed successfully'
} as const;

// Type definitions
export type PlaceholderKey = keyof typeof PLACEHOLDER_TEXT;
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
export type SuccessMessageKey = keyof typeof SUCCESS_MESSAGES;

// Helper function to get placeholder based on context
export function getPlaceholder(type: PlaceholderKey): string {
  return PLACEHOLDER_TEXT[type] || '';
}

// Helper function to get error message
export function getErrorMessage(type: ErrorMessageKey): string {
  return ERROR_MESSAGES[type] || '';
}

// Helper function to get success message
export function getSuccessMessage(type: SuccessMessageKey): string {
  return SUCCESS_MESSAGES[type] || '';
} 