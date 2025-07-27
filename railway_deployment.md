# Railway Deployment Guide

This document outlines all the changes needed to deploy the no-code framework to Railway based on the differences between the `adding_mcp_server_with_context7_dimension_fix` and `deploy_project` branches.

## Required Changes Before Deployment

### 1. Express Version Downgrade

**File**: `backend_node/package.json`

Change Express version from 5.1.0 to 4.21.2:
```json
"express": "^4.21.2"
```

**Reason**: Express 5.x has breaking changes with path-to-regexp that cause routing issues in production.

### 2. Make node-pty Optional

**File**: `backend_node/package.json`

Move `node-pty` to optionalDependencies:
```json
"optionalDependencies": {
  "node-pty": "^1.0.0"
}
```

**Reason**: node-pty requires native bindings that don't work in Railway's container environment.

### 3. Server Configuration Updates

**File**: `backend_node/server.js`

Add the following changes:

#### a. Dynamic CORS Configuration
```javascript
// Update CORS to handle dynamic origins
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, you might want to whitelist specific domains
    callback(null, true);
  },
  credentials: true
}));
```

#### b. Static File Serving for Production
```javascript
// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}
```

#### c. Fallback Route for React App
```javascript
// Add this at the end of all routes
app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
});
```

### 4. Environment Variables

Create `.env.example` file in the root directory:
```bash
# Server Configuration
PORT=5001
NODE_ENV=development

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# OpenRouter API Key
OPENROUTER_API_KEY=your_api_key_here

# Deployment Environment
DEPLOYMENT_ENV=local
# For Railway deployment, set to: DEPLOYMENT_ENV=cloud

# Cloud Storage Path (for Railway)
# CLOUD_STORAGE_PATH=/tmp/projects
```

### 5. File System Routes Update

**File**: `backend_node/routes/file-system.js`

Change the wildcard route pattern from:
```javascript
router.get('/api/files/:projectName/*', ...)
```

To middleware approach:
```javascript
router.use('/api/files/:projectName', (req, res, next) => {
  req.filePath = req.path.slice(1); // Remove leading slash
  next();
});

router.get('/api/files/:projectName*', async (req, res) => {
  const { projectName } = req.params;
  const requestedPath = req.filePath || '';
  // ... rest of the logic
});
```

### 6. Build Script for Production

**File**: `package.json` (root directory)

Add build scripts:
```json
{
  "scripts": {
    "build": "cd client && npm run build",
    "start": "node backend_node/server.js",
    "dev": "concurrently \"cd backend_node && npm run dev\" \"cd client && npm start\""
  }
}
```

### 7. Railway-Specific Configuration

Create `railway.json` in the root directory:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd client && npm install && npm run build && cd ../backend_node && npm install"
  },
  "deploy": {
    "startCommand": "cd backend_node && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 8. Update .gitignore

Add the following to `.gitignore`:
```
# Production builds
client/build/

# Environment files
.env
.env.local
.env.production

# Temporary project storage (for Railway)
/tmp/projects/
```

## Deployment Steps

1. Make all the above changes to your current branch
2. Test locally with `NODE_ENV=production`
3. Commit and push to your repository
4. In Railway:
   - Set environment variables:
     - `NODE_ENV=production`
     - `DEPLOYMENT_ENV=cloud`
     - `OPENROUTER_API_KEY=your_key`
     - `PORT=$PORT` (Railway provides this)
   - Deploy from your GitHub repository

## Important Notes

- The deployment adapter (`backend_node/utils/deployment-adapter.js`) should already handle the differences between local and cloud environments
- File storage in Railway uses `/tmp` which is ephemeral - consider using external storage for persistence
- Monitor logs in Railway for any runtime errors related to native dependencies

## Testing Deployment Readiness

Before deploying, run:
```bash
# Install dependencies
cd backend_node && npm install --production
cd ../client && npm install && npm run build

# Test production mode locally
NODE_ENV=production DEPLOYMENT_ENV=cloud node backend_node/server.js
```

This should start the server without errors and serve the React app on the root route.