const { spawn } = require('child_process');
const { findAvailablePort } = require('../utils/port-finder');
const path = require('path');
const fs = require('fs').promises;

class ProjectManager {
  constructor() {
    // Store running projects with their processes and ports
    this.runningProjects = new Map();
  }

  /**
   * Start a Next.js project
   * @param {string} projectPath - Path to the project
   * @param {string} projectName - Name of the project (optional)
   * @param {Socket} socket - Socket connection for terminal output
   * @returns {Promise<{port: number, url: string, projectName: string}>}
   */
  async startProject(projectPath, projectName, socket) {
    // If projectName is actually a socket (backward compatibility)
    if (typeof projectName === 'object' && projectName !== null && !socket) {
      socket = projectName;
      projectName = null;
    }
    
    // If no projectName provided, derive from path
    if (!projectName) {
      projectName = path.basename(projectPath);
    }
    
    // Check if project is already running
    if (this.runningProjects.has(projectName)) {
      const existing = this.runningProjects.get(projectName);
      return { port: existing.port, url: existing.url };
    }

    try {
      // Clean up .next directory to prevent build artifact conflicts
      const nextDir = path.join(projectPath, '.next');
      const nodeModulesCacheDir = path.join(projectPath, 'node_modules', '.cache');
      
      try {
        await fs.rm(nextDir, { recursive: true, force: true });
        if (socket) {
          socket.emit('output', `\n\x1b[36m> Cleaned build artifacts\x1b[0m\n`);
        }
      } catch (cleanupError) {
        // Directory might not exist, that's ok
        console.log('No .next directory to clean');
      }
      
      // Also clean node_modules cache
      try {
        await fs.rm(nodeModulesCacheDir, { recursive: true, force: true });
        if (socket) {
          socket.emit('output', `\x1b[36m> Cleaned module cache\x1b[0m\n`);
        }
      } catch (cleanupError) {
        // Cache might not exist, that's ok
        console.log('No node_modules cache to clean');
      }

      // Find an available port starting from 3002 (to avoid conflicts with main app)
      const port = await findAvailablePort(3002);
      
      if (socket) {
        socket.emit('output', `\n\x1b[1;34m> Starting development server on port ${port}...\x1b[0m\n`);
        // Emit status event for project starting
        socket.emit('project:status', {
          projectName,
          stage: 'server_starting',
          message: 'Starting development server...'
        });
      }

      // Start the Next.js development server
      const childProcess = spawn('npm', ['run', 'dev'], {
        cwd: projectPath,
        env: {
          ...process.env,
          PORT: port.toString(),
          // Force the port for Next.js
          NODE_OPTIONS: `--inspect=false`
        },
        shell: true
      });

      // Handle stdout
      childProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (socket) {
          // Format Next.js output
          let formattedOutput = output;
          if (output.includes('Ready in') || output.includes('started server')) {
            formattedOutput = `\x1b[1;32m${output}\x1b[0m`;
          } else if (output.includes('Compiling') || output.includes('Building')) {
            formattedOutput = `\x1b[1;36m${output}\x1b[0m`;
          } else if (output.includes('Warning')) {
            formattedOutput = `\x1b[1;33m${output}\x1b[0m`;
          }
          socket.emit('output', formattedOutput);
        }
        console.log(`[${projectName}]:`, output);
      });

      // Handle stderr
      childProcess.stderr.on('data', (data) => {
        const output = data.toString();
        if (socket) {
          socket.emit('output', `\x1b[1;31m${output}\x1b[0m`);
        }
        console.error(`[${projectName} ERROR]:`, output);
      });

      // Handle process exit
      childProcess.on('close', (code) => {
        console.log(`[${projectName}] Process exited with code ${code}`);
        this.runningProjects.delete(projectName);
        if (socket) {
          socket.emit('output', `\n\x1b[1;33m> Development server stopped (exit code: ${code})\x1b[0m\n`);
          // Emit status event for server stopped
          socket.emit('project:status', {
            projectName,
            stage: 'server_stopped',
            message: 'Development server stopped',
            exitCode: code
          });
        }
      });

      // Store the project info
      const url = `http://localhost:${port}`;
      this.runningProjects.set(projectName, {
        process: childProcess,
        port,
        url,
        projectPath,
        startTime: new Date()
      });

      // Wait a bit for the server to start
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (socket) {
        socket.emit('output', `\n\x1b[1;32m✓ Development server started successfully!\x1b[0m\n`);
        socket.emit('output', `\x1b[1;36m> Access your project at: ${url}\x1b[0m\n\n`);
        // Emit status event for server ready
        socket.emit('project:status', {
          projectName,
          stage: 'server_ready',
          message: 'Development server ready!',
          url,
          port
        });
      }

      return { port, url, projectName };
    } catch (error) {
      console.error('Error starting project:', error);
      if (socket) {
        socket.emit('output', `\n\x1b[1;31m✗ Failed to start development server: ${error.message}\x1b[0m\n`);
        // Emit status event for server error
        socket.emit('project:status', {
          projectName,
          stage: 'server_error',
          message: 'Failed to start development server',
          error: error.message
        });
      }
      throw error;
    }
  }

  /**
   * Stop a running project
   * @param {string} projectName - Name of the project to stop
   */
  stopProject(projectName) {
    const project = this.runningProjects.get(projectName);
    if (project) {
      console.log(`Stopping project: ${projectName}`);
      project.process.kill('SIGTERM');
      this.runningProjects.delete(projectName);
      return true;
    }
    return false;
  }

  /**
   * Get information about a running project
   * @param {string} projectName - Name of the project
   */
  getProjectInfo(projectName) {
    return this.runningProjects.get(projectName);
  }

  /**
   * Get all running projects
   */
  getAllRunningProjects() {
    const projects = [];
    for (const [name, info] of this.runningProjects) {
      projects.push({
        name,
        port: info.port,
        url: info.url,
        projectPath: info.projectPath,
        startTime: info.startTime
      });
    }
    return projects;
  }

  /**
   * Check if a project is running
   * @param {string} projectName - Name of the project
   */
  isProjectRunning(projectName) {
    return this.runningProjects.has(projectName);
  }

  /**
   * Stop all running projects (cleanup)
   */
  stopAllProjects() {
    console.log('Stopping all running projects...');
    for (const [name, project] of this.runningProjects) {
      console.log(`Stopping ${name}...`);
      project.process.kill('SIGTERM');
    }
    this.runningProjects.clear();
  }
}

// Create a singleton instance
const projectManager = new ProjectManager();

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down, stopping all projects...');
  projectManager.stopAllProjects();
  process.exit(0);
});

process.on('SIGTERM', () => {
  projectManager.stopAllProjects();
  process.exit(0);
});

module.exports = projectManager;