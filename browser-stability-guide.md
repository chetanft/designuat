# Browser Connection Stability Solutions

## Root Causes of Browser Connection Issues

1. **Memory Leaks**: Browser instances not properly cleaned up
2. **Port Conflicts**: Multiple Chrome instances competing for ports
3. **WebSocket Timeouts**: DevTools protocol connections dropping
4. **Resource Exhaustion**: Too many concurrent browser instances
5. **macOS Security**: Sandboxing and permission issues

## Implemented Solutions

### 1. Browser Configuration Improvements
```javascript
// Enhanced browser launch options
await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection'
  ],
  timeout: 60000,
  protocolTimeout: 60000
});
```

### 2. Retry Logic & Recovery
- Navigation retry with exponential backoff
- Page evaluation retry mechanisms
- Automatic browser recovery on failures
- Fresh instance creation for critical operations

### 3. Process Management
- Graceful shutdown handlers
- Resource cleanup on exit
- Chrome process cleanup
- Uncaught exception handling

## Additional Solutions to Try

### 1. External Browser Management
```bash
# Use external Chrome instance
google-chrome --remote-debugging-port=9222 --no-sandbox --disable-gpu --headless
```

### 2. Docker-based Browser
```dockerfile
FROM browserless/chrome:latest
EXPOSE 3000
```

### 3. Browser Pool Implementation
```javascript
class BrowserPool {
  constructor(size = 3) {
    this.pool = [];
    this.size = size;
  }
  
  async getBrowser() {
    if (this.pool.length === 0) {
      return await this.createBrowser();
    }
    return this.pool.pop();
  }
  
  async releaseBrowser(browser) {
    if (this.pool.length < this.size) {
      this.pool.push(browser);
    } else {
      await browser.close();
    }
  }
}
```

### 4. System-Level Solutions

#### macOS Specific:
```bash
# Increase file descriptor limits
ulimit -n 4096

# Clear Chrome user data
rm -rf ~/Library/Application\ Support/Google/Chrome/Default

# Kill all Chrome processes
pkill -f "chrome|chromium"
```

#### Memory Management:
```bash
# Monitor memory usage
ps aux | grep chrome
top -p $(pgrep chrome)

# Clear system cache
sudo purge
```

### 5. Alternative Browser Engines
```javascript
// Use Firefox instead of Chrome
import firefox from 'playwright-firefox';

const browser = await firefox.launch({
  headless: true,
  args: ['--no-sandbox']
});
```

### 6. Serverless Browser Solutions
- **Browserless.io**: Cloud-based browser instances
- **Puppeteer Cluster**: Distributed browser management
- **AWS Lambda + Chrome**: Serverless browser execution

## Debugging Commands

### Check Browser Processes:
```bash
ps aux | grep chrome
lsof -i :9222
netstat -an | grep 9222
```

### Monitor Resource Usage:
```bash
top -p $(pgrep chrome)
vmstat 1
iostat 1
```

### Chrome Debug Info:
```bash
google-chrome --version
google-chrome --remote-debugging-port=9222 --headless &
curl http://localhost:9222/json
```

## Production Recommendations

1. **Use External Browser Service**: Deploy browserless/chrome in Docker
2. **Implement Circuit Breaker**: Fail fast when browser is unstable
3. **Monitor Resource Usage**: Set up alerts for memory/CPU usage
4. **Use Browser Pool**: Maintain 2-3 browser instances
5. **Implement Fallbacks**: Have backup extraction methods
6. **Regular Cleanup**: Restart browser instances every 100 requests

## Emergency Fixes

### Quick Reset:
```bash
# Kill all Chrome processes
pkill -f "chrome|chromium"

# Clear temp files
rm -rf /tmp/.org.chromium.*

# Restart with clean state
node src/enhancedServer.js
```

### System Resource Check:
```bash
# Check available memory
free -h

# Check disk space
df -h

# Check open files
lsof | wc -l
```

## Current Status

✅ **Working**: Authentication selectors and credentials verified
❌ **Issue**: Browser connection stability on macOS
🔧 **Next Steps**: Implement external browser service or browser pool 