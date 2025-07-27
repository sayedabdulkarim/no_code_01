// MCP Client for connecting Claude to MCP Server
const { spawn } = require('child_process');
const path = require('path');

class MCPClient {
  constructor() {
    this.mcpProcess = null;
    this.handlers = new Map();
    this.requestId = 0;
  }

  // Start the MCP server
  async start() {
    return new Promise((resolve, reject) => {
      const mcpServerPath = path.join(__dirname, '../mcp/server-simple.js');
      
      // Spawn the MCP server process
      this.mcpProcess = spawn('node', [mcpServerPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'development' }
      });

      this.mcpProcess.stdout.on('data', (data) => {
        this.handleResponse(data.toString());
      });

      this.mcpProcess.stderr.on('data', (data) => {
        if (data.toString().includes('MCP Server started successfully')) {
          resolve();
        } else {
          console.error('MCP Server error:', data.toString());
        }
      });

      this.mcpProcess.on('error', (error) => {
        console.error('Failed to start MCP server:', error);
        reject(error);
      });

      this.mcpProcess.on('close', (code) => {
        console.log(`MCP server exited with code ${code}`);
      });
    });
  }

  // Stop the MCP server
  stop() {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
  }

  // Call an MCP tool
  async callTool(toolName, args) {
    return new Promise((resolve, reject) => {
      const requestId = ++this.requestId;
      
      // Store the handler for this request
      this.handlers.set(requestId, { resolve, reject });
      
      // Send request to MCP server
      const request = {
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      };
      
      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');
      
      // Set timeout
      setTimeout(() => {
        if (this.handlers.has(requestId)) {
          this.handlers.delete(requestId);
          reject(new Error(`MCP tool call timeout: ${toolName}`));
        }
      }, 30000); // 30 second timeout
    });
  }

  // Handle responses from MCP server
  handleResponse(data) {
    try {
      const lines = data.trim().split('\n');
      for (const line of lines) {
        if (line) {
          const response = JSON.parse(line);
          if (response.id && this.handlers.has(response.id)) {
            const handler = this.handlers.get(response.id);
            this.handlers.delete(response.id);
            
            if (response.error) {
              handler.reject(new Error(response.error.message));
            } else {
              handler.resolve(response.result);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing MCP response:', error);
    }
  }

  // Convenience methods for common tools
  async readProjectFile(projectName, filePath) {
    const result = await this.callTool('read_project_file', { projectName, filePath });
    return result.content[0].text;
  }

  async listProjectFiles(projectName, directory) {
    const result = await this.callTool('list_project_files', { projectName, directory });
    return JSON.parse(result.content[0].text);
  }

  async searchCode(projectName, pattern, fileType) {
    const result = await this.callTool('search_code', { projectName, pattern, fileType });
    return result.content[0].text;
  }

  async checkProjectStructure(projectName) {
    const result = await this.callTool('check_project_structure', { projectName });
    return JSON.parse(result.content[0].text);
  }

  async runBuild(projectName) {
    const result = await this.callTool('run_build', { projectName });
    return result.content[0].text;
  }

  async readErrorLog(projectName, errorType) {
    const result = await this.callTool('read_error_log', { projectName, errorType });
    return result.content[0].text;
  }
}

// Singleton instance
let mcpClient = null;

// Get or create MCP client instance
async function getMCPClient() {
  if (!mcpClient) {
    mcpClient = new MCPClient();
    await mcpClient.start();
  }
  return mcpClient;
}

module.exports = {
  MCPClient,
  getMCPClient
};