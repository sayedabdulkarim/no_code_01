const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
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

require("dotenv").config(); // Load environment variables

const app = express();
// Increase payload size limits first before other middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configure CORS for production
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.CLIENT_URL || 'https://your-app.railway.app']
  : ["http://localhost:3000", "http://localhost:3001"];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Create the server first so we can access io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

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

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Store io reference for other routes
app.set("io", io);

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
    });
    
    return;
  }

  // Spawn a shell process (original code)
  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env,
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
    ptyProcess.kill();
  });
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
