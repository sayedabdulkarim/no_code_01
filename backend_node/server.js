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

// Simple proxy implementation for project preview - handles all paths including assets
app.use('/project-preview/:projectName*', async (req, res, next) => {
  const { projectName } = req.params;
  const project = globalProjectManager.getProjectInfo(projectName);
  
  // Extract the full path after project name, including any sub-paths
  const fullPath = req.params[0] || '/';
  const pathAfterProject = fullPath.startsWith('/') ? fullPath : `/${fullPath}`;
  
  console.log(`Project preview: ${req.method} ${pathAfterProject} for ${projectName}`);
  
  if (!project) {
    if (pathAfterProject === '/' || pathAfterProject === '') {
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
  
  console.log(`Proxying to http://localhost:${project.port}${pathAfterProject}`);
  
  try {
    // Use axios for simpler proxy handling
    const response = await axios({
      method: req.method,
      url: `http://localhost:${project.port}${pathAfterProject}`,
      headers: {
        ...req.headers,
        host: `localhost:${project.port}`,
        // Remove problematic headers
        'accept-encoding': undefined,
        'content-length': undefined,
        'transfer-encoding': undefined
      },
      data: req.body,
      params: req.query,
      timeout: 25000, // 25 second timeout
      responseType: 'arraybuffer', // Get raw data
      validateStatus: () => true, // Don't throw on any status
      maxRedirects: 5
    });
    
    // Get content type
    const contentType = response.headers['content-type'] || '';
    
    // Handle HTML responses
    if (contentType.includes('text/html')) {
      let html = response.data.toString('utf-8');
      
      // Simple but effective URL rewriting
      const baseTag = `<base href="/project-preview/${projectName}/">`;
      const scriptTag = `
        <script>
          // Intercept fetch for dynamic requests
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
      
      // Add base tag and script
      html = html.replace('<head>', `<head>${baseTag}${scriptTag}`);
      
      // Handle __NEXT_DATA__ script tag
      html = html.replace(
        /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s,
        (match, jsonStr) => {
          try {
            const data = JSON.parse(jsonStr);
            // Update Next.js configuration
            data.assetPrefix = `/project-preview/${projectName}`;
            data.basePath = `/project-preview/${projectName}`;
            if (data.page) {
              data.page = data.page.replace(/^\//, '');
            }
            return `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>`;
          } catch (e) {
            console.error('Failed to parse __NEXT_DATA__:', e);
            return match;
          }
        }
      );
      
      // More comprehensive URL rewriting for all Next.js assets
      html = html
        // Next.js JavaScript and CSS files (including those with additional attributes)
        .replace(/href=["']\/_next\//g, `href="/project-preview/${projectName}/_next/`)
        .replace(/src=["']\/_next\//g, `src="/project-preview/${projectName}/_next/`)
        // Handle link preload/prefetch
        .replace(/href=["'](\/_next\/[^"']+)["']/g, `href="/project-preview/${projectName}$1"`)
        // API routes
        .replace(/"\/api\//g, `"/project-preview/${projectName}/api/`)
        // Static files
        .replace(/"\/static\//g, `"/project-preview/${projectName}/static/`)
        // CSS imports in style tags
        .replace(/url\(\/_next\//g, `url(/project-preview/${projectName}/_next/`)
        // Next.js runtime configuration
        .replace(/"assetPrefix":""/g, `"assetPrefix":"/project-preview/${projectName}"`)
        .replace(/"basePath":""/g, `"basePath":"/project-preview/${projectName}"`)
        // Webpack public path
        .replace(/__webpack_public_path__\s*=\s*["']\/["']/g, `__webpack_public_path__ = "/project-preview/${projectName}/"`)
        // Next.js page data
        .replace(/\/_next\/data\//g, `/project-preview/${projectName}/_next/data/`);
      
      // Set response headers
      res.status(response.status);
      Object.keys(response.headers).forEach(key => {
        if (!['content-length', 'transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
          res.setHeader(key, response.headers[key]);
        }
      });
      
      // Add iframe headers
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Content-Length', Buffer.byteLength(html));
      res.send(html);
    } else {
      // For non-HTML, stream the response with correct headers
      res.status(response.status);
      
      // Copy all headers except the ones we want to control
      Object.keys(response.headers).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (!['content-length', 'transfer-encoding', 'content-encoding'].includes(lowerKey)) {
          res.setHeader(key, response.headers[key]);
        }
      });
      
      // Ensure correct content-type for common file types
      if (pathAfterProject.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (pathAfterProject.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (pathAfterProject.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      
      // Set content length
      res.setHeader('Content-Length', response.data.length);
      
      res.send(response.data);
    }
  } catch (error) {
    console.error(`Proxy error for ${pathAfterProject}:`, error.message);
    console.error(`Full error:`, error);
    
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ 
        error: 'Service Unavailable', 
        message: 'Project server is not responding. It may still be starting up.',
        path: pathAfterProject
      });
    } else if (error.code === 'ETIMEDOUT') {
      res.status(504).json({ 
        error: 'Gateway Timeout', 
        message: 'Request to project server timed out',
        path: pathAfterProject
      });
    } else if (error.response && error.response.status === 404) {
      // Handle 404s from Next.js server
      res.status(404).json({ 
        error: 'Not Found', 
        message: `Resource not found: ${pathAfterProject}`,
        path: pathAfterProject
      });
    } else {
      res.status(502).json({ 
        error: 'Bad Gateway', 
        message: error.message,
        path: pathAfterProject,
        details: error.response ? `Server responded with ${error.response.status}` : 'Unknown error'
      });
    }
  }
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
