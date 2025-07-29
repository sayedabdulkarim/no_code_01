const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const TaskBasedGeneratorMCP = require("./task-based-generator-mcp");
const CompilationChecker = require("./compilation-checker");
const LLMBuildValidator = require("./llm-build-validator");
require("dotenv").config();

const router = express.Router();

// Store task progress for each project
const projectProgress = new Map();

// POST /update-project-v2 - Task-based project update
router.post("/update-project-v2", async (req, res) => {
  const { projectName, requirements, socketId } = req.body;

  if (!projectName || !requirements) {
    return res.status(400).json({ 
      error: "projectName and requirements are required" 
    });
  }

  const io = req.app.get('io');
  const socket = socketId && io ? io.sockets.sockets.get(socketId) : null;

  const baseDir = path.join(__dirname, "../../client/user-projects");
  const projectPath = path.join(baseDir, projectName);
  const prdPath = path.join(projectPath, "PRD.md");

  try {
    console.log(`Starting update-project-v2 for project: ${projectName}`);
    console.log(`Update requirements: "${requirements}"`);
    
    // Check if PRD file exists
    try {
      await fs.access(prdPath);
    } catch (err) {
      console.error(`PRD file not found at: ${prdPath}`);
      return res.status(404).json({ error: "PRD file not found" });
    }
    
    // Read the PRD
    const prd = await fs.readFile(prdPath, "utf-8");
    console.log(`Read PRD for project ${projectName}, length: ${prd.length}`);
    console.log(`PRD preview: ${prd.substring(0, 200)}...`);
    
    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY not found in environment");
      return res.status(500).json({ error: "Claude API key not configured" });
    }
    
    // Initialize generator with Claude API and MCP support
    const generator = new TaskBasedGeneratorMCP(process.env.ANTHROPIC_API_KEY);
    
    // Notify start
    if (socket) {
      socket.emit('output', '\n\x1b[1;34m> Starting task-based code generation...\x1b[0m\n');
    } else {
      console.log("No socket connection available for real-time updates");
    }

    // Check if this is an update by looking at existing files and requirements
    let isUpdate = false;
    try {
      // Check if src directory exists with actual component files
      const srcPath = path.join(projectPath, 'src');
      const srcExists = await fs.access(srcPath).then(() => true).catch(() => false);
      
      if (srcExists) {
        const srcFiles = await fs.readdir(srcPath, { recursive: true });
        const hasComponentFiles = srcFiles.some(file => 
          typeof file === 'string' && (file.endsWith('.tsx') || file.endsWith('.jsx')) && 
          !file.includes('globals.css')
        );
        
        // It's an update if we have existing component files AND requirements differ from PRD
        isUpdate = hasComponentFiles && requirements.trim() !== prd.trim();
        
        console.log(`Update detection: srcExists=${srcExists}, hasComponentFiles=${hasComponentFiles}, reqDifferentFromPRD=${requirements.trim() !== prd.trim()}, isUpdate=${isUpdate}`);
      }
    } catch (e) {
      console.log("Error checking project state:", e);
    }
    
    // Step 1: Create task list
    if (socket) {
      socket.emit('output', '\x1b[36m> Analyzing PRD and creating task list...\x1b[0m\n');
      if (isUpdate) {
        socket.emit('output', '\x1b[33m> Detected UPDATE operation - will only modify necessary files\x1b[0m\n');
      }
    }
    
    let taskResult;
    if (isUpdate) {
      // Use update-aware task creation that uses MCP to check existing files
      if (socket) {
        socket.emit('output', '\x1b[36m> Analyzing request intent...\x1b[0m\n');
      }
      taskResult = await generator.createUpdateTaskList(prd, requirements, projectName);
    } else {
      // Initial creation - use standard full task list
      taskResult = await generator.createTaskList(prd);
    }
    const tasks = taskResult.tasks;
    
    if (socket) {
      socket.emit('output', `\x1b[32m✓ Created ${tasks.length} tasks\x1b[0m\n`);
      tasks.forEach((task, index) => {
        socket.emit('output', `  ${index + 1}. ${task.name}\n`);
      });
      socket.emit('output', '\n');
    }

    // Store progress
    projectProgress.set(projectName, {
      totalTasks: tasks.length,
      completedTasks: 0,
      currentTask: null,
      status: 'in_progress'
    });

    // Step 2: Execute tasks with progress tracking (now with MCP support)
    const results = await generator.executeTasks(
      tasks, 
      prd, 
      projectPath,
      (progress) => {
        // Update progress
        projectProgress.set(projectName, {
          totalTasks: progress.totalTasks,
          completedTasks: progress.status === 'completed' ? progress.currentTask : progress.currentTask - 1,
          currentTask: progress.taskName,
          status: progress.status === 'failed' ? 'partial' : 'in_progress'
        });

        // Send progress to socket
        if (socket) {
          if (progress.status === 'generating') {
            socket.emit('output', `\x1b[36m> Task ${progress.currentTask}/${progress.totalTasks}: ${progress.taskName}...\x1b[0m\n`);
          } else if (progress.status === 'completed') {
            socket.emit('output', `\x1b[32m✓ Completed: ${progress.taskName}\x1b[0m\n`);
          } else if (progress.status === 'failed') {
            socket.emit('output', `\x1b[31m✗ Failed: ${progress.taskName} - ${progress.error}\x1b[0m\n`);
          }
        }
      },
      projectName  // Pass project name for MCP context
    );

    // Update final progress
    projectProgress.set(projectName, {
      totalTasks: results.summary.total,
      completedTasks: results.summary.successful,
      currentTask: null,
      status: results.summary.failed === 0 ? 'completed' : 'partial'
    });

    // Send summary
    if (socket) {
      socket.emit('output', '\n\x1b[1;34m> Code generation summary:\x1b[0m\n');
      socket.emit('output', `  Total tasks: ${results.summary.total}\n`);
      socket.emit('output', `  \x1b[32mSuccessful: ${results.summary.successful}\x1b[0m\n`);
      if (results.summary.failed > 0) {
        socket.emit('output', `  \x1b[31mFailed: ${results.summary.failed}\x1b[0m\n`);
      }
      socket.emit('output', `  Files generated: ${results.summary.generatedFiles}\n\n`);
    }

    // Step 3: Run compilation check and auto-fix
    if (socket) {
      socket.emit('output', '\x1b[1;34m> Checking for compilation errors...\x1b[0m\n');
    }
    
    const compilationChecker = new CompilationChecker();
    const compilationResult = await compilationChecker.checkAndFix(projectPath, socket);
    
    let llmValidationResult = { success: false };
    
    // Step 4: If compilation still has errors, use LLM to fix them
    if (!compilationResult.success) {
      if (socket) {
        socket.emit('output', '\n\x1b[1;33m> Compilation errors detected. Using AI to analyze and fix...\x1b[0m\n');
      }
      
      const llmValidator = new LLMBuildValidator(process.env.ANTHROPIC_API_KEY);
      llmValidationResult = await llmValidator.validateAndFix(projectPath, prd, socket);
    } else {
      llmValidationResult = { success: true };
    }
    
    let finalMessage = results.summary.failed === 0 
      ? "Project updated successfully with all tasks completed"
      : `Project updated with ${results.summary.successful} of ${results.summary.total} tasks completed`;
      
    if (llmValidationResult.success) {
      finalMessage += " and build verification passed";
    } else {
      finalMessage += " but some build errors could not be resolved";
      if (socket) {
        socket.emit('output', '\n\x1b[31m✗ Some build errors could not be automatically fixed.\x1b[0m\n');
        socket.emit('output', 'Please check the terminal output for manual resolution.\n');
      }
    }

    // Return response
    return res.json({
      message: finalMessage,
      summary: {
        ...results.summary,
        compilationSuccess: compilationResult.success,
        compilationAttempts: compilationResult.attempts,
        compilationErrors: compilationResult.errors?.length || 0,
        llmValidationSuccess: llmValidationResult.success,
        llmValidationAttempts: llmValidationResult.attempts || 0
      },
      details: results.results
    });

  } catch (error) {
    console.error("Error in task-based update:", error);
    
    // Clear progress on error
    projectProgress.delete(projectName);
    
    if (socket) {
      socket.emit('output', `\n\x1b[31m✗ Error: ${error.message}\x1b[0m\n`);
    }
    
    return res.status(500).json({ 
      error: "Failed to update project", 
      details: error.message 
    });
  }
});

// GET /project-progress/:projectName - Get current progress
router.get("/project-progress/:projectName", (req, res) => {
  const { projectName } = req.params;
  
  const progress = projectProgress.get(projectName);
  if (!progress) {
    return res.json({ 
      status: 'not_found',
      message: 'No active code generation for this project' 
    });
  }
  
  return res.json(progress);
});

// POST /retry-failed-tasks - Retry failed tasks
router.post("/retry-failed-tasks", async (req, res) => {
  const { projectName, taskIds, socketId } = req.body;
  
  if (!projectName || !taskIds || !Array.isArray(taskIds)) {
    return res.status(400).json({ 
      error: "projectName and taskIds array are required" 
    });
  }
  
  // Implementation for retrying specific failed tasks
  // This would reuse the task-based generator to retry only failed tasks
  
  return res.json({ 
    message: "Task retry functionality to be implemented" 
  });
});

module.exports = router;