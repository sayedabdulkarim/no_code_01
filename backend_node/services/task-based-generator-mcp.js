// Enhanced Task-Based Generator with MCP Support
const { ClaudeServiceProduction } = require('./claude-service-production');
const fs = require("fs/promises");
const path = require("path");

class TaskBasedGeneratorMCP {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.claudeService = new ClaudeServiceProduction();
    this.maxRetries = 3;
  }

  /**
   * Analyze PRD and create a task list
   */
  async createTaskList(prd) {
    const prompt = `
You are an expert Next.js developer. Analyze this PRD and break it down into specific implementation tasks.

PRD:
${prd}

Create a detailed task list for implementing this project. Each task should be:
- Specific and actionable
- Small enough to implement in one step
- Ordered by dependency (foundational tasks first)

Return ONLY a valid JSON object with this structure:
{
  "tasks": [
    {
      "id": "task-1",
      "name": "Create main layout component",
      "description": "Create the main layout with header and navigation",
      "dependencies": [],
      "files": ["src/app/layout.tsx", "src/components/Header.tsx"],
      "priority": 1
    }
  ]
}

Guidelines:
- Start with layout/structure tasks
- Then core features
- Then UI components
- Include a task to update src/app/page.tsx to import and use the main component
- Finally, polish and optimization
- Each task should generate 1-3 related files
- IMPORTANT: The last task MUST update the root page.tsx to actually use the components
- EXCLUDE: Do NOT create tasks for offline support, service workers, or PWA features
- EXCLUDE: Do NOT create tasks specifically for accessibility features (basic accessibility should be built into components)
- EXCLUDE: Do NOT create separate animation tasks - include basic transitions inline with components using Tailwind classes
- EXCLUDE: Do NOT create tasks to modify globals.css - it's already configured by the boilerplate
- EXCLUDE: Never include "src/app/globals.css" in any task's files array
`;

    try {
      const response = await this.claudeService.generateText(prompt);
      return this.parseJSON(response);
    } catch (error) {
      console.error("Error creating task list:", error);
      throw new Error(`Failed to create task list: ${error.message}`);
    }
  }

  /**
   * Detect Tailwind version from project
   */
  async detectTailwindVersion(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      const tailwindVersion = packageJson.devDependencies?.tailwindcss || packageJson.dependencies?.tailwindcss || '';
      const majorVersion = tailwindVersion.match(/\^?(\d+)\./)?.[1];
      
      return {
        version: parseInt(majorVersion) || 4,
        syntax: parseInt(majorVersion) >= 4 ? '@import "tailwindcss";' : '@tailwind base;\n@tailwind components;\n@tailwind utilities;'
      };
    } catch (error) {
      // Default to v4
      return {
        version: 4,
        syntax: '@import "tailwindcss";'
      };
    }
  }

  /**
   * Generate code for a specific task with MCP context
   */
  async generateTaskCode(task, prd, existingFiles = {}, projectName = null, projectPath = null) {
    console.log(`generateTaskCode called: projectName=${projectName}, task=${task.id}`);
    
    // Detect Tailwind version if project path is provided
    let tailwindInfo = { version: 4, syntax: '@import "tailwindcss";' };
    if (projectPath) {
      tailwindInfo = await this.detectTailwindVersion(projectPath);
      console.log(`Detected Tailwind v${tailwindInfo.version}`);
    }
    
    // Use MCP if project name is provided
    if (projectName) {
      console.log(`Using MCP generation for project: ${projectName}`);
      return await this.generateTaskCodeWithMCP(task, prd, existingFiles, projectName, tailwindInfo);
    }
    
    // Fall back to standard generation if no project name
    console.log(`Using standard generation (no project name)`);
    return await this.generateTaskCodeStandard(task, prd, existingFiles, tailwindInfo);
  }

  /**
   * Generate code using MCP tools to read existing project files
   */
  async generateTaskCodeWithMCP(task, prd, existingFiles, projectName, tailwindInfo) {
    console.log(`Generating code for task "${task.name}" with MCP context`);
    
    try {
      // Build a prompt that encourages using MCP tools
      const prompt = `
You are an expert Next.js developer working on project "${projectName}".

TASK: ${task.name}
DESCRIPTION: ${task.description}
FILES TO CREATE/UPDATE: ${task.files.join(", ")}

PROJECT CONTEXT (PRD):
${prd}

IMPORTANT: You have access to read project files. Before generating code:
1. Check the project structure if needed
2. Read any relevant existing files to understand the current implementation
3. Ensure your code integrates perfectly with existing patterns

Generate code that follows the project's existing patterns and integrates seamlessly.

CRITICAL IMPORT RULES:
1. ALWAYS include all necessary import statements at the top of each file
2. Import React hooks when used: import { useState, useEffect } from 'react'
3. Import components with correct paths: import ComponentName from '../components/ComponentName'
4. Use relative paths for local imports
5. DO NOT assume any imports are automatic

For each file, format the output as:
\`\`\`typescript
// File: [filepath]
[code content with all imports]
\`\`\`

TECHNOLOGY CONSTRAINTS:
- Next.js 14 with App Router
- TypeScript
- React hooks only (no external state management)
- Tailwind CSS v${tailwindInfo.version} (use className with utility classes)
- Native fetch (no axios)

CRITICAL: This project uses Tailwind CSS v${tailwindInfo.version}. 
- The globals.css file ALREADY EXISTS with proper Tailwind configuration
- DO NOT generate or modify src/app/globals.css - it already has: ${tailwindInfo.syntax}
- NEVER include globals.css in your file output
- Focus only on component and page files
`;

      // Use Claude with MCP to generate code
      const response = await this.claudeService.generateCodeForProject(prompt, projectName);
      
      // Parse the response to extract files
      const files = this.parseFilesFromResponse(response);
      
      console.log(`MCP task ${task.id} parsed files:`, {
        filesCount: Object.keys(files).length,
        filePaths: Object.keys(files)
      });
      
      return {
        success: true,
        files: files,
        task: task
      };
      
    } catch (error) {
      console.error(`Error generating code with MCP for task ${task.id}:`, error);
      // Fallback to standard generation
      return await this.generateTaskCodeStandard(task, prd, existingFiles);
    }
  }

  /**
   * Standard code generation without MCP
   */
  async generateTaskCodeStandard(task, prd, existingFiles, tailwindInfo) {
    const existingFilesList = Object.keys(existingFiles).join(", ");
    
    const prompt = `
You are an expert Next.js developer. Generate code for this specific task.

TASK: ${task.name}
DESCRIPTION: ${task.description}
FILES TO CREATE/UPDATE: ${task.files.join(", ")}

PROJECT CONTEXT (PRD):
${prd}

EXISTING FILES IN PROJECT:
${existingFilesList || "None yet"}

Generate ONLY the code for the files specified in this task.

CRITICAL: Each file MUST include ALL necessary imports at the top:
- Import React/Next.js features: import { useState } from 'react'
- Import components: import Header from '../components/Header'
- Import types: import { UserType } from '../types/user'
- Use correct relative paths based on file locations

Return ONLY a valid JSON object with this structure:
{
  "files": {
    "src/app/layout.tsx": "// Complete code with imports here",
    "src/components/Header.tsx": "// Complete code with imports here"
  }
}

TECHNOLOGY CONSTRAINTS:
- Next.js 14 with App Router
- TypeScript
- React hooks only
- Tailwind CSS only
- Native fetch only

CRITICAL RULES:
- DO NOT generate or modify src/app/globals.css - it already exists with proper Tailwind configuration
- NEVER include globals.css in your JSON output
- Only generate the component and page files specified in the task
- The project already has Tailwind CSS v${tailwindInfo.version} properly configured
`;

    try {
      const response = await this.claudeService.generateText(prompt);
      const parsed = this.parseJSON(response);
      
      // Log what we got
      console.log(`Standard generation task ${task.id} result:`, {
        hasFiles: !!parsed.files,
        filesCount: parsed.files ? Object.keys(parsed.files).length : 0,
        filePaths: parsed.files ? Object.keys(parsed.files) : []
      });
      
      // Return in the expected format
      return {
        success: true,
        files: parsed.files || {},
        task: task
      };
    } catch (error) {
      console.error(`Error generating code for task ${task.id}:`, error);
      throw new Error(`Failed to generate code for ${task.name}: ${error.message}`);
    }
  }

  /**
   * Parse files from Claude's response
   */
  parseFilesFromResponse(response) {
    const files = {};
    
    console.log('Parsing response, length:', response.length);
    
    // Look for file markers in the response
    const fileRegex = /```(?:typescript|javascript|tsx|jsx|css|json)\s*\n\/\/ File: (.+)\n([\s\S]*?)```/g;
    let match;
    let matchCount = 0;
    
    while ((match = fileRegex.exec(response)) !== null) {
      const [, filePath, content] = match;
      files[filePath.trim()] = content.trim();
      matchCount++;
    }
    
    console.log(`Found ${matchCount} files using regex pattern`);
    
    // If no files found with markers, try to parse as JSON
    if (Object.keys(files).length === 0) {
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.files) {
            return parsed.files;
          }
        }
      } catch (e) {
        // Not JSON, continue
      }
    }
    
    return files;
  }

  /**
   * Analyze file content and add missing imports
   */
  addMissingImports(fileContent, filePath, allGeneratedFiles) {
    // Skip if not a TypeScript/JavaScript file
    if (!filePath.match(/\.(tsx?|jsx?)$/)) {
      return fileContent;
    }

    // Extract component/function usages in JSX
    const componentUsageRegex = /<([A-Z][a-zA-Z0-9]*)\s*[^>]*>/g;
    const usedComponents = new Set();
    let match;
    
    while ((match = componentUsageRegex.exec(fileContent)) !== null) {
      const componentName = match[1];
      // Skip HTML elements
      if (!componentName.match(/^(div|span|main|section|header|footer|nav|aside|article|h[1-6]|p|a|button|input|form|ul|li|ol|img|svg|path)$/)) {
        usedComponents.add(componentName);
      }
    }

    // Check for React hooks usage
    const hookUsageRegex = /\b(use[A-Z][a-zA-Z0-9]*)\(/g;
    const usedHooks = new Set();
    
    while ((match = hookUsageRegex.exec(fileContent)) !== null) {
      const hookName = match[1];
      // Standard React hooks
      if (['useState', 'useEffect', 'useContext', 'useReducer', 'useCallback', 'useMemo', 'useRef'].includes(hookName)) {
        usedHooks.add(hookName);
      }
    }

    // Extract existing imports to avoid duplicates
    const existingImports = new Set();
    const importRegex = /import\s+(?:{[^}]+}|[^;]+)\s+from\s+['"]([^'"]+)['"]/g;
    
    while ((match = importRegex.exec(fileContent)) !== null) {
      const importContent = match[0];
      // Extract imported names
      const namedImportMatch = importContent.match(/import\s+{([^}]+)}/);
      const defaultImportMatch = importContent.match(/import\s+([A-Z][a-zA-Z0-9]*)\s+from/);
      
      if (namedImportMatch) {
        namedImportMatch[1].split(',').forEach(name => {
          existingImports.add(name.trim());
        });
      }
      if (defaultImportMatch) {
        existingImports.add(defaultImportMatch[1]);
      }
    }

    // Build import statements
    const imports = [];
    
    // Add React import if using hooks
    if (usedHooks.size > 0 && !fileContent.includes("import React") && !fileContent.includes("'react'")) {
      const hooksArray = Array.from(usedHooks).filter(hook => !existingImports.has(hook));
      if (hooksArray.length > 0) {
        imports.push(`import { ${hooksArray.join(', ')} } from 'react';`);
      }
    }

    // Add component imports
    for (const component of usedComponents) {
      if (!existingImports.has(component)) {
        // Search for the component in generated files
        const componentPath = this.findComponentPath(component, filePath, allGeneratedFiles);
        if (componentPath) {
          imports.push(`import ${component} from '${componentPath}';`);
        }
      }
    }

    // Add imports at the beginning of the file
    if (imports.length > 0) {
      // If file already has imports, add after them
      const firstImportIndex = fileContent.search(/^import\s/m);
      if (firstImportIndex >= 0) {
        // Find the last import
        const lines = fileContent.split('\n');
        let lastImportIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ')) {
            lastImportIndex = i;
          }
        }
        lines.splice(lastImportIndex + 1, 0, ...imports);
        return lines.join('\n');
      } else {
        // Add at the very beginning
        return imports.join('\n') + '\n\n' + fileContent;
      }
    }

    return fileContent;
  }

  /**
   * Find the relative path to a component
   */
  findComponentPath(componentName, fromPath, allGeneratedFiles) {
    // Common locations to search
    const searchPaths = [
      `src/components/${componentName}.tsx`,
      `src/components/${componentName}.jsx`,
      `src/components/${componentName}/index.tsx`,
      `src/components/${componentName}/index.jsx`,
      `components/${componentName}.tsx`,
      `components/${componentName}.jsx`,
    ];

    for (const searchPath of searchPaths) {
      if (allGeneratedFiles[searchPath]) {
        // Calculate relative path
        const from = path.dirname(fromPath);
        let relativePath = path.relative(from, searchPath).replace(/\\/g, '/');
        
        // Remove file extension
        relativePath = relativePath.replace(/\.(tsx?|jsx?)$/, '');
        
        // Add ./ if needed
        if (!relativePath.startsWith('.') && !relativePath.startsWith('/')) {
          relativePath = './' + relativePath;
        }
        
        return relativePath;
      }
    }

    return null;
  }

  /**
   * Execute tasks sequentially with progress tracking
   */
  async executeTasks(tasks, prd, projectPath, onProgress, projectName = null) {
    const results = [];
    const generatedFiles = {};
    
    // Extract project name from path if not provided
    if (!projectName && projectPath) {
      projectName = path.basename(projectPath);
    }
    
    console.log(`Executing ${tasks.length} tasks for project: ${projectName || 'new project'}`);
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      try {
        // Notify progress
        if (onProgress) {
          onProgress({
            currentTask: i + 1,
            totalTasks: tasks.length,
            taskName: task.name,
            status: 'generating'
          });
        }
        
        // Generate code for the task
        const result = await this.generateTaskCode(task, prd, generatedFiles, projectName, projectPath);
        
        // Debug result
        console.log(`Task ${task.id} generation result:`, {
          success: result.success,
          hasFiles: !!result.files,
          filesType: typeof result.files,
          filesCount: result.files ? Object.keys(result.files).length : 0
        });
        
        // Write files
        let filesWritten = 0;
        const files = result.files || {};
        
        for (const [filePath, content] of Object.entries(files)) {
          const fullPath = path.join(projectPath, filePath);
          
          // Ensure directory exists
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          
          // Add missing imports before writing
          const contentWithImports = this.addMissingImports(content, filePath, generatedFiles);
          
          // Write file
          await fs.writeFile(fullPath, contentWithImports, 'utf8');
          
          // Track generated files
          generatedFiles[filePath] = contentWithImports;
          filesWritten++;
          
          console.log(`Created/Updated: ${filePath}`);
        }
        
        // Record result
        results.push({
          task: task,
          success: true,
          filesWritten: filesWritten
        });
        
        // Notify completion
        if (onProgress) {
          onProgress({
            currentTask: i + 1,
            totalTasks: tasks.length,
            taskName: task.name,
            status: 'completed'
          });
        }
        
      } catch (error) {
        console.error(`Failed to execute task "${task.name}":`, error);
        
        results.push({
          task: task,
          success: false,
          error: error.message
        });
        
        // Notify failure
        if (onProgress) {
          onProgress({
            currentTask: i + 1,
            totalTasks: tasks.length,
            taskName: task.name,
            status: 'failed',
            error: error.message
          });
        }
      }
      
      // Small delay between tasks
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Calculate summary
    const summary = {
      total: tasks.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      generatedFiles: Object.keys(generatedFiles).length
    };
    
    return {
      results,
      summary,
      generatedFiles
    };
  }

  /**
   * Generate code from requirements (main entry point)
   */
  async generateFromRequirements(requirements, projectPath, projectName = null) {
    try {
      // Create task list
      const taskResult = await this.createTaskList(requirements);
      const tasks = taskResult.tasks;
      
      console.log(`Created ${tasks.length} tasks`);
      
      // Execute tasks
      const results = await this.executeTasks(
        tasks, 
        requirements, 
        projectPath,
        null, // No progress callback for now
        projectName
      );
      
      return {
        success: true,
        tasks: tasks,
        results: results.results,
        summary: results.summary,
        generatedFiles: results.generatedFiles
      };
      
    } catch (error) {
      console.error('Error in generateFromRequirements:', error);
      throw error;
    }
  }

  /**
   * Parse JSON from LLM response
   */
  parseJSON(response) {
    try {
      // First try direct parsing
      return JSON.parse(response);
    } catch (error) {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)```/) || 
                       response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          return JSON.parse(jsonStr);
        } catch (parseError) {
          console.error("Failed to parse extracted JSON:", parseError);
          console.error("Response was:", response);
          throw new Error("Invalid JSON response from LLM");
        }
      }
      
      throw new Error("No valid JSON found in response");
    }
  }
}

module.exports = TaskBasedGeneratorMCP;