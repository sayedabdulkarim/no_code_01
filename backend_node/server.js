const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
let pty;
try {
  pty = require("node-pty");
} catch (e) {
  console.warn("node-pty not available - terminal features will be limited");
  pty = null;
}
const os = require("os");
const cors = require("cors");
const axios = require("axios"); // Make sure axios is installed
const { createProxyMiddleware } = require('http-proxy-middleware');
const executeShellCommand = require("./shell-command-executor");
const { commandFixerAgent } = require("./utils/commandFixerAgent");
const apiKeyStorage = require("./services/api-key-storage");
const generateRouter = require("./routes/generate");
const generateV2Router = require("./routes/generate-v2");
const prdRouter = require("./routes/prd");
const projectControlRouter = require("./routes/project-control");
const compilationCheckRouter = require("./routes/compilation-check");

//
const initializeProjectRouterBuilder = require("./services/initialize-project");
const updateProjectRouter = require("./services/update-project");
const updateProjectV2Router = require("./services/update-project-v2");
const listProjectsRouter = require("./services/list-projects");
const fixPageIntegrationRouter = require("./services/fix-page-integration");
const buildValidationRouter = require("./routes/build-validation");
const fileSystemRouter = require("./routes/file-system");
const validateApiKeyRouter = require("./routes/validate-api-key");

require("dotenv").config(); // Load environment variables

const app = express();
// Increase payload size limits first before other middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Update CORS to handle dynamic origins
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // In production, you might want to whitelist specific domains
      const allowedOrigins = process.env.NODE_ENV === 'production' 
        ? [process.env.CLIENT_URL || 'https://your-app.railway.app']
        : ["http://localhost:3000", "http://localhost:3001"];
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all origins for now
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Create the server first so we can access io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const allowedOrigins = process.env.NODE_ENV === 'production' 
        ? [process.env.CLIENT_URL || 'https://your-app.railway.app']
        : ["http://localhost:3000", "http://localhost:3001"];
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all origins for now
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get the global project manager instance (singleton)
const globalProjectManager = require('./services/project-manager');

// Project preview proxy middleware
app.use('/project-preview/:projectName', (req, res, next) => {
  const { projectName } = req.params;
  const project = globalProjectManager.getProjectInfo(projectName);
  
  console.log(`Project preview request: ${req.method} ${req.path} for project: ${projectName}`);
  
  if (!project) {
    // Show error page for non-existent projects
    if (req.path === `/project-preview/${projectName}` || req.path === `/project-preview/${projectName}/`) {
      return res.status(404).send(`
        <html>
          <head><title>Project Not Running</title></head>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>Project "${projectName}" is not running</h1>
            <p>Please start the project from the Synth AI interface first.</p>
            <a href="/">Go to Homepage</a>
          </body>
        </html>
      `);
    }
    return res.status(404).json({ error: 'Project not found or not running' });
  }
  
  console.log(`Project ${projectName} is running on port ${project.port}`);
  
  // Create proxy middleware for this specific project
  const proxy = createProxyMiddleware({
    target: `http://localhost:${project.port}`,
    changeOrigin: true,
    ws: true,
    logLevel: 'debug',
    
    // Rewrite the path to remove the project preview prefix
    pathRewrite: (path, req) => {
      const newPath = path.replace(`/project-preview/${projectName}`, '') || '/';
      console.log(`Rewriting path: ${path} -> ${newPath}`);
      return newPath;
    },
    
    // Handle HTML responses to inject base tag for proper asset loading
    selfHandleResponse: true,
    onProxyRes: (proxyRes, req, res) => {
      const contentType = proxyRes.headers['content-type'];
      console.log(`Proxy response: ${req.path}, content-type: ${contentType}, status: ${proxyRes.statusCode}`);
      
      // For HTML responses, we need to inject a base tag and rewrite URLs
      if (contentType && contentType.includes('text/html')) {
        let body = '';
        let chunks = [];
        
        proxyRes.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        proxyRes.on('end', () => {
          body = Buffer.concat(chunks).toString();
          console.log(`HTML response length: ${body.length}`);
          
          // More comprehensive URL rewriting for Next.js
          let modifiedBody = body;
          
          // First, inject a script to set the base URL for all relative URLs
          const baseScript = `
            <script>
              // Set base URL for all fetch requests
              (function() {
                const originalFetch = window.fetch;
                window.fetch = function(url, options) {
                  if (typeof url === 'string' && url.startsWith('/')) {
                    url = '/project-preview/${projectName}' + url;
                  }
                  return originalFetch.call(this, url, options);
                };
              })();
            </script>
          `;
          
          // Inject base tag and our custom script
          modifiedBody = modifiedBody.replace('<head>', `<head>${baseScript}<base href="/project-preview/${projectName}/">`);
          
          // Rewrite all absolute paths in the HTML
          modifiedBody = modifiedBody
            // Next.js specific paths
            .replace(/href="\/_next\//g, `href="/project-preview/${projectName}/_next/`)
            .replace(/src="\/_next\//g, `src="/project-preview/${projectName}/_next/`)
            // API routes
            .replace(/"\/api\//g, `"/project-preview/${projectName}/api/`)
            // Static assets
            .replace(/href="\/static\//g, `href="/project-preview/${projectName}/static/`)
            .replace(/src="\/static\//g, `src="/project-preview/${projectName}/static/`)
            // Manifest and other root files
            .replace(/href="\/manifest/g, `href="/project-preview/${projectName}/manifest`)
            .replace(/href="\/favicon/g, `href="/project-preview/${projectName}/favicon`)
            // Next.js data
            .replace(/"assetPrefix":""/g, `"assetPrefix":"/project-preview/${projectName}"`)
            .replace(/"basePath":""/g, `"basePath":"/project-preview/${projectName}"`);
          
          // Also handle __NEXT_DATA__ script tag
          modifiedBody = modifiedBody.replace(
            /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/,
            (match, jsonStr) => {
              try {
                const data = JSON.parse(jsonStr);
                data.assetPrefix = `/project-preview/${projectName}`;
                data.basePath = `/project-preview/${projectName}`;
                return `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>`;
              } catch (e) {
                console.error('Failed to parse __NEXT_DATA__:', e);
                return match;
              }
            }
          );
          
          // Check if modifications were made
          if (body !== modifiedBody) {
            console.log('HTML was modified for project preview');
          }
          
          // Copy headers except content-length
          Object.keys(proxyRes.headers).forEach(key => {
            if (key.toLowerCase() !== 'content-length' && 
                key.toLowerCase() !== 'transfer-encoding' &&
                key.toLowerCase() !== 'content-encoding') {
              res.setHeader(key, proxyRes.headers[key]);
            }
          });
          
          res.statusCode = proxyRes.statusCode || 200;
          res.setHeader('content-type', 'text/html; charset=utf-8');
          res.setHeader('content-length', Buffer.byteLength(modifiedBody));
          // Add CORS headers for iframe
          res.setHeader('X-Frame-Options', 'ALLOWALL');
          res.setHeader('Content-Security-Policy', "frame-ancestors *;");
          res.end(modifiedBody);
        });
        
        proxyRes.on('error', (err) => {
          console.error('Error reading proxy response:', err);
          res.status(502).json({ error: 'Bad Gateway' });
        });
      } else {
        // For non-HTML responses, just pipe through
        res.statusCode = proxyRes.statusCode || 200;
        Object.keys(proxyRes.headers).forEach(key => {
          res.setHeader(key, proxyRes.headers[key]);
        });
        proxyRes.pipe(res);
      }
    },
    
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(502).json({ error: 'Bad Gateway', details: err.message });
    }
  });
  
  // Use the proxy
  proxy(req, res, next);
});

// Make the project manager available to routes
app.set('projectManager', globalProjectManager);

// Include routers
app.use(generateRouter);
app.use("/api", generateV2Router);
app.use(prdRouter);
app.use(projectControlRouter);
app.use(compilationCheckRouter);
// Pass io to initialize project router
const initializeProjectRouter = initializeProjectRouterBuilder(io);
app.use("/api", initializeProjectRouter);
app.use("/api", updateProjectRouter);
app.use("/api", updateProjectV2Router);
app.use("/api", listProjectsRouter);
app.use("/api", fixPageIntegrationRouter);
app.use("/api", buildValidationRouter);
app.use(fileSystemRouter);
app.use("/api", validateApiKeyRouter);

// Store io reference for other routes
app.set("io", io);

// Set io instance in project manager for broadcasting
globalProjectManager.setIo(io);

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Proxy endpoint for OpenRouter API
app.post("/api/proxy/openrouter", async (req, res) => {
  try {
    const { prompt, apiKey, model } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: model || "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Proxy error:", error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || "Unknown error",
    });
  }
});

// New endpoint to execute commands and provide fix suggestions
app.post("/api/fix-command", async (req, res) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ error: "Command is required" });
    }

    console.log(`Executing command: ${command}`);

    // Execute the command using shell-command-executor
    const result = await executeShellCommand(command);

    console.log({ result }, " heelloooo");

    // If command failed (non-zero exit code), call commandFixerAgent for suggestions
    if (!result.success) {
      console.log(
        `Command failed with exit code ${result.exitCode}. Getting suggestions...`
      );
      try {
        const suggestions = await commandFixerAgent(
          command,
          result.exitCode,
          result.stderr
        );

        return res.json({
          ...result,
          suggestions,
        });
      } catch (fixerError) {
        console.error("Error getting command suggestions:", fixerError);
        return res.json({
          ...result,
          suggestions: [],
          fixerError: fixerError.message,
        });
      }
    }

    // Command succeeded, return result without suggestions
    res.json(result);
  } catch (error) {
    console.error("Command execution error:", error);
    res.status(500).json({
      error: error.message,
      success: false,
    });
  }
});

// Determine shell based on operating system
const shell = os.platform() === "win32" ? "powershell.exe" : "zsh";

io.on("connection", (socket) => {
  console.log("Client connected");

  // Check if pty is available
  if (!pty) {
    socket.emit("output", "Terminal emulation not available in this environment.\r\n");
    socket.emit("output", "Command execution features are limited.\r\n");
    
    // Still handle API key storage
    socket.on("store-api-key", (data) => {
      try {
        const { apiKey } = data;
        if (apiKey) {
          apiKeyStorage.setApiKey(socket.id, apiKey);
          socket.emit("api-key-stored", { success: true });
          console.log(`API key stored for client: ${socket.id}`);
        } else {
          socket.emit("api-key-stored", { success: false, error: "No API key provided" });
        }
      } catch (error) {
        console.error("Error storing API key:", error);
        socket.emit("api-key-stored", { success: false, error: error.message });
      }
    });
    
    // Still handle events but don't execute
    socket.on("input", (data) => {
      // Echo back input for visual feedback
      socket.emit("output", `[Limited Mode] Command received but not executed: ${data}\r\n`);
    });
    
    socket.on("resize", (size) => {
      // No-op
    });
    
    socket.on("disconnect", () => {
      console.log("Client disconnected");
      apiKeyStorage.removeApiKey(socket.id);
    });
    
    return;
  }

  // Spawn a shell process (original code)
  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      LANG: process.env.LANG || 'en_US.UTF-8',
      LC_ALL: process.env.LC_ALL || 'en_US.UTF-8'
    },
  });

  // Handle API key storage from client
  socket.on("store-api-key", (data) => {
    try {
      const { apiKey } = data;
      if (apiKey) {
        apiKeyStorage.setApiKey(socket.id, apiKey);
        socket.emit("api-key-stored", { success: true });
        console.log(`API key stored for client: ${socket.id}`);
      } else {
        socket.emit("api-key-stored", { success: false, error: "No API key provided" });
      }
    } catch (error) {
      console.error("Error storing API key:", error);
      socket.emit("api-key-stored", { success: false, error: error.message });
    }
  });

  // Handle terminal input from client
  socket.on("input", (data) => {
    ptyProcess.write(data);
  });

  // Send terminal output to client
  ptyProcess.onData((data) => {
    socket.emit("output", data);
  });

  // Handle resize events
  socket.on("resize", (size) => {
    ptyProcess.resize(size.cols, size.rows);
  });

  // Clean up on disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    // Remove API key from storage
    apiKeyStorage.removeApiKey(socket.id);
    ptyProcess.kill();
  });
});

// Add this at the end of all routes - fallback route for React app
app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "Something went wrong on the server",
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
