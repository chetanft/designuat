# Port Configuration Guide

## 🚨 Why You Were Getting Port Issues

Your codebase had **6 different server files** with **different default ports**:

| Server File | Old Port | New Port | Status |
|-------------|----------|----------|---------|
| `server-unified.js` | 3006 | 3006 ✅ | **RECOMMENDED** |
| `server.js` | 3006 | 3006 ✅ | Main server |
| `server-legacy.js` | 3001 ❌ | 3006 ✅ | Legacy only |
| `src/enhancedServer.js` | 3004 ❌ | 3006 ✅ | Experimental |
| `index.js` | 3000 ❌ | 3000 | Old entry point |
| Frontend expectation | 3006 | 3006 ✅ | Fixed |

## 🔧 Solution: Centralized Port Configuration

### New Port Management System

1. **Single Source of Truth**: `src/config/ports.js`
2. **Unified Startup Script**: `start-server.js`
3. **Consistent Configuration**: All servers now use port 3006

### How to Start the Server (NEW WAY)

```bash
# Recommended: Start unified server (supports both modern + legacy UI)
npm start
# or
npm run start:unified

# Other options:
npm run start:main      # Main server only
npm run start:legacy    # Legacy UI only  
npm run start:enhanced  # Experimental features

# See all options:
npm run server:help
```

### Environment Variables

You can override the port using environment variables:

```bash
# Use custom port
PORT=3007 npm start

# Use custom MCP server port
MCP_PORT=3846 npm start
```

### Port Configuration Details

**Default Ports:**
- **Application**: 3006 (configurable via `PORT` env var)
- **Vite Dev Server**: 5173 (for frontend development)
- **MCP Server**: 3845 (configurable via `MCP_PORT` env var)

**Fallback Ports**: 3006, 3007, 3008, 3009, 3010

## 🌐 CORS Configuration

The system automatically configures CORS for all relevant ports:
- `http://localhost:3006` (main app)
- `http://localhost:5173` (Vite dev)
- All fallback ports for development

## 🚀 Quick Start (No More Port Issues!)

1. **Stop any running servers:**
   ```bash
   pkill -f "node.*server"
   ```

2. **Start the unified server:**
   ```bash
   npm start
   ```

3. **Access your application:**
   - **Modern UI**: http://localhost:3006/?modern=true
   - **Legacy UI**: http://localhost:3006/?legacy=true
   - **API Health**: http://localhost:3006/api/health

## 🔍 Troubleshooting

### If Port 3006 is Busy

The system will automatically find the next available port and display it:

```bash
🚀 Starting Unified server with modern + legacy UI support (RECOMMENDED)...
📁 File: server-unified.js
🌐 Port: 3007  # <- Note: Using 3007 instead of 3006
🔗 URL: http://localhost:3007
```

### Check What's Running on a Port

```bash
# Check what's using port 3006
lsof -i :3006

# Kill process on port 3006
kill -9 $(lsof -t -i:3006)
```

### Frontend Not Connecting

If the frontend can't connect to the backend:

1. Check the server is running on the expected port
2. Verify the frontend environment configuration in `frontend/src/utils/environment.ts`
3. Check browser console for CORS errors

## 📁 Files Modified

### Core Configuration
- ✅ `src/config/ports.js` - **NEW**: Centralized port configuration
- ✅ `start-server.js` - **NEW**: Unified startup script

### Server Files Updated
- ✅ `server-unified.js` - Uses centralized port config
- ✅ `server.js` - Uses centralized port config  
- ✅ `server-legacy.js` - Uses centralized port config
- ✅ `src/enhancedServer.js` - Uses centralized port config
- ✅ `src/config/environment.js` - Updated default port

### Frontend Files Updated
- ✅ `public/index.html` - Updated default port to 3006
- ✅ `public-legacy/index.html` - Updated default port to 3006
- ✅ `frontend/src/utils/environment.ts` - Already configured for 3006

### Package Scripts Updated
- ✅ `package.json` - New npm scripts for different server types

## 🎯 Best Practices

1. **Always use `npm start`** instead of directly running server files
2. **Use environment variables** for custom ports in production
3. **Check the startup logs** to see which port is actually being used
4. **Use the unified server** (`server-unified.js`) for development - it supports both UIs

## 🔮 Future Improvements

- [ ] Add port conflict detection and automatic resolution
- [ ] Add health check endpoints for all servers
- [ ] Add Docker configuration with proper port mapping
- [ ] Add production deployment guides with port configuration 