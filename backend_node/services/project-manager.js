const { spawn } = require('child_process');
const { findAvailablePort } = require('../utils/port-finder');
const path = require('path');

class ProjectManager {
  constructor() {
    // Store running projects with their processes and ports
    this.runningProjects = new Map();
  }

  /**
   * Start a Next.js project
   * @param {string} projectPath - Path to the project
   * @param {Socket} socket - Socket connection for terminal output
   * @returns {Promise<{port: number, url: string}>}
   */
  async startProject(projectPath, socket) {
    const projectName = path.basename(projectPath);
    
    // Check if project is already running
    if (this.runningProjects.has(projectName)) {
      const existing = this.runningProjects.get(projectName);
      return { port: existing.port, url: existing.url };
    }

    try {
      // Find an available port starting from 3002 (to avoid conflicts with main app)
      const port = await findAvailablePort(3002);
      
      if (socket) {
        socket.emit('output', `\n\x1b[1;34m> Starting development server on port ${port}...\x1b[0m\n`);
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
      }

      return { port, url };
    } catch (error) {
      console.error('Error starting project:', error);
      if (socket) {
        socket.emit('output', `\n\x1b[1;31m✗ Failed to start development server: ${error.message}\x1b[0m\n`);
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