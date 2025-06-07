# Dynamic Application Extraction Guide

## 🚀 Overview

The **Dynamic Application Extraction** feature is specifically designed for data-driven applications like FreightTiger that require:

- **Extended loading times** (10-20+ seconds)
- **Authentication** (form-based or token-based)
- **Filter interactions** to trigger data loading
- **Progressive extraction** as content loads dynamically

## 🎯 Key Features

### ✅ **Extended Wait Times**
- Configurable wait times up to 60+ seconds
- Network idle detection (`networkidle0`)
- Loading indicator monitoring

### ✅ **Authentication Support**
- **Form-based authentication**: Username/password login
- **Token-based authentication**: JWT/API tokens
- **Manual login support**: For complex auth flows

### ✅ **Filter Interactions**
- Automatic clicking of filter elements
- Date pickers, dropdowns, search boxes
- Custom selector support

### ✅ **Progressive Extraction**
- **Multiple extraction phases** as data loads
- **Element deduplication** across phases
- **Comprehensive final results**

### ✅ **Data Loading Detection**
- Wait for specific data indicators
- Loading spinner/indicator monitoring
- Content availability verification

## 📡 API Endpoint

```
POST /api/extract-dynamic
```

## 🔧 Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `webUrl` | string | ✅ Yes | - | Target application URL |
| `waitTime` | number | ❌ No | 25000 | Wait time in milliseconds |
| `extractionStrategy` | string | ❌ No | 'progressive' | 'progressive' or 'single' |
| `authentication` | object | ❌ No | null | Authentication configuration |
| `filterSelectors` | array | ❌ No | [] | CSS selectors for filters |
| `dataIndicators` | array | ❌ No | [] | CSS selectors for data elements |

## 📋 Usage Examples

### 1. **Basic Dynamic Extraction**

```json
{
  "webUrl": "https://your-app.com/dashboard",
  "waitTime": 20000,
  "extractionStrategy": "progressive"
}
```

### 2. **FreightTiger Complete Setup**

```json
{
  "webUrl": "https://www.freighttiger.com/v10/journey/listing",
  "waitTime": 25000,
  "extractionStrategy": "progressive",
  
  "authentication": {
    "type": "form",
    "loginUrl": "https://www.freighttiger.com/login",
    "credentials": {
      "username": "your-username",
      "password": "your-password"
    },
    "selectors": {
      "username": "#username",
      "password": "#password",
      "submit": ".login-button"
    }
  },
  
  "filterSelectors": [
    ".filter-dropdown",
    ".date-picker",
    ".status-filter",
    ".search-input",
    "[data-testid='filter-button']"
  ],
  
  "dataIndicators": [
    ".data-table tbody tr",
    ".shipment-card",
    ".journey-item",
    ".dashboard-widget[data-loaded='true']",
    ".freight-listing .item"
  ]
}
```

### 3. **Token-Based Authentication**

```json
{
  "webUrl": "https://api-app.com/dashboard",
  "waitTime": 15000,
  "authentication": {
    "type": "token",
    "credentials": {
      "token": "your-jwt-token"
    }
  }
}
```

### 4. **E-commerce Site with Filters**

```json
{
  "webUrl": "https://shop.com/products",
  "waitTime": 20000,
  "filterSelectors": [
    ".price-filter",
    ".category-dropdown",
    ".brand-filter",
    ".apply-filters-btn"
  ],
  "dataIndicators": [
    ".product-grid .product-item",
    ".results-count",
    ".pagination"
  ]
}
```

## 📊 Response Format

```json
{
  "success": true,
  "url": "https://your-app.com",
  "strategy": "progressive",
  "extractedElements": 156,
  "summary": {
    "totalComponents": 156,
    "componentTypes": {
      "buttons": 23,
      "text": 45,
      "inputs": 12,
      "links": 18,
      "containers": 31,
      "tables": 8,
      "cards": 19
    },
    "totalColors": 24,
    "totalFonts": 6,
    "extractionPhases": 3
  },
  "loadingPhases": [
    {
      "phase": "initial",
      "timestamp": "2024-01-01T10:00:00.000Z",
      "duration": 1250,
      "elementCount": 45
    },
    {
      "phase": "post-wait",
      "timestamp": "2024-01-01T10:00:15.000Z",
      "duration": 2100,
      "elementCount": 89
    },
    {
      "phase": "final",
      "timestamp": "2024-01-01T10:00:25.000Z",
      "duration": 1800,
      "elementCount": 156
    }
  ],
  "elements": [...], // First 10 elements for preview
  "colorPalette": [...], // First 15 colors
  "typographySystem": {...} // Font information
}
```

## 🎛️ Extraction Strategies

### **Progressive Strategy** (Recommended)
- **3 extraction phases**: Initial → Post-wait → Final
- **Element deduplication** across phases
- **Best for dynamic content** that loads over time
- **Higher accuracy** for data-driven apps

### **Single Strategy**
- **1 comprehensive extraction** after all waits
- **Faster execution** for simpler apps
- **Good for static content** with long load times

## 🔍 Component Detection

The system detects **25+ component types**:

| Category | Components |
|----------|------------|
| **Interactive** | buttons, inputs, dropdowns, checkboxes, radios |
| **Navigation** | links, navigation, breadcrumbs, pagination |
| **Content** | text, headers, images, videos |
| **Layout** | containers, cards, tables, lists |
| **UI Elements** | badges, tabs, modals, alerts, progress bars |

## ⚙️ Advanced Configuration

### **Loading Indicators**
The system automatically detects and waits for these to disappear:
```css
[class*="loading"]
[class*="spinner"] 
[class*="loader"]
.loading, .spinner, .loader
[data-loading="true"]
[aria-busy="true"]
```

### **Filter Interaction Flow**
1. **Wait for filter** to be available (10s timeout)
2. **Click/interact** with filter element
3. **Wait 3 seconds** for potential data loading
4. **Continue to next filter**

### **Data Indicator Detection**
- **20 second timeout** per indicator
- **Visible element requirement**
- **Continues on timeout** (non-blocking)

## 🚛 FreightTiger Specific Setup

### **Common FreightTiger Selectors**

**Filters:**
```css
.filter-dropdown
.date-picker
.status-filter
.search-input
.filter-button
[data-testid="filter-button"]
```

**Data Indicators:**
```css
.data-table tbody tr
.shipment-card
.journey-item
.freight-listing .item
.dashboard-widget[data-loaded="true"]
.results-container .result-item
```

**Authentication:**
```css
#username, #email          /* Username field */
#password                  /* Password field */
.login-button, .btn-login  /* Submit button */
```

## 🧪 Testing

### **Health Check**
```bash
curl http://localhost:3004/api/health
```

### **Simple Test**
```bash
curl -X POST http://localhost:3004/api/extract-dynamic \
  -H "Content-Type: application/json" \
  -d '{"webUrl": "https://httpbin.org/html", "waitTime": 5000}'
```

### **FreightTiger Test**
```bash
curl -X POST http://localhost:3004/api/extract-dynamic \
  -H "Content-Type: application/json" \
  -d '{
    "webUrl": "https://www.freighttiger.com/v10/journey/listing",
    "waitTime": 25000,
    "extractionStrategy": "progressive",
    "filterSelectors": [".filter-dropdown", ".date-picker"],
    "dataIndicators": [".data-table tbody tr", ".shipment-card"]
  }'
```

## 📈 Performance Optimization

### **Wait Time Guidelines**
- **Simple apps**: 10-15 seconds
- **Complex dashboards**: 20-25 seconds
- **Heavy data apps**: 30+ seconds

### **Filter Strategy**
- **Start with essential filters** (date, status)
- **Add specific filters** gradually
- **Test filter order** for optimal loading

### **Memory Management**
- **Progressive strategy** handles large datasets better
- **Element deduplication** prevents memory bloat
- **Automatic cleanup** after extraction

## 🔧 Troubleshooting

### **Common Issues**

**1. No elements extracted**
- ✅ Increase `waitTime`
- ✅ Check `dataIndicators`
- ✅ Verify authentication

**2. Authentication fails**
- ✅ Check selector accuracy
- ✅ Verify credentials
- ✅ Test login flow manually

**3. Filters not working**
- ✅ Verify CSS selectors
- ✅ Check element visibility
- ✅ Test interaction timing

**4. Timeout errors**
- ✅ Increase timeouts
- ✅ Check network connectivity
- ✅ Verify page accessibility

## 🎯 Best Practices

### **✅ Do's**
- **Use progressive strategy** for dynamic apps
- **Set appropriate wait times** (25s+ for FreightTiger)
- **Test selectors** in browser dev tools first
- **Start with essential filters** only
- **Monitor extraction phases** for optimization

### **❌ Don'ts**
- **Don't use excessive wait times** (>60s)
- **Don't add too many filters** at once
- **Don't rely on fragile selectors** (auto-generated classes)
- **Don't skip authentication** for protected content
- **Don't ignore error responses**

## 🚀 Integration with Figma Comparison

After dynamic extraction, use the enhanced comparison endpoint:

```json
{
  "figmaUrl": "https://figma.com/file/your-design",
  "webUrl": "https://your-app.com",
  "dynamicExtraction": {
    "waitTime": 25000,
    "extractionStrategy": "progressive",
    "filterSelectors": ["..."],
    "dataIndicators": ["..."]
  }
}
```

## 📞 Support

For issues or questions:
1. **Check server logs** for detailed error messages
2. **Test with simple URLs** first (httpbin.org/html)
3. **Verify selectors** in browser dev tools
4. **Use health endpoint** to verify server status

---

**🎉 The Dynamic Application Extraction feature makes it possible to extract real data from complex applications like FreightTiger, enabling accurate design-to-implementation comparisons for modern web applications!** 