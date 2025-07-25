# Deploy to Railway Guide

## Prerequisites
1. GitHub account with your code pushed to `deploy_project` branch
2. Railway account (sign up at railway.app)
3. OpenRouter API key for AI functionality

## Step-by-Step Deployment

### 1. Prepare Your Branch
```bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin deploy_project
```

### 2. Create Railway Project
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub
5. Select your repository
6. **Important**: Choose `deploy_project` branch from the dropdown

### 3. Configure Environment Variables
In Railway dashboard, go to your service → Variables tab and add:

```
OPENROUTER_API_KEY=your_actual_api_key_here
NODE_ENV=production
PORT=5001
CLIENT_URL=https://your-app-name.railway.app
```

### 4. Configure Build Settings
Railway should auto-detect the configuration, but verify:
- Build Command: `npm run build`
- Start Command: `npm start`

### 5. Deploy
1. Railway will automatically start deployment
2. Watch the logs for any errors
3. Once deployed, click on the generated URL

## Important Notes

### File Storage
- Generated projects are stored temporarily
- For production, consider adding persistent storage

### Limitations
- Terminal emulation (node-pty) may have limited functionality
- Free tier has usage limits

### Troubleshooting

**Build Fails:**
- Check if all dependencies are in package.json
- Verify Node version compatibility

**API Connection Issues:**
- Ensure CLIENT_URL env variable matches your Railway URL
- Check CORS settings

**Terminal Not Working:**
- This is expected on some platforms
- Consider alternative solutions for production

## Local Development
```bash
# Install dependencies
npm run install:all

# Run development server
npm run dev
```

## Updating Deployment
Simply push to `deploy_project` branch:
```bash
git push origin deploy_project
```
Railway will auto-deploy changes.