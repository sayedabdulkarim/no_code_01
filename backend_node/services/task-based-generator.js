const axios = require("axios");
const fs = require("fs/promises");
const path = require("path");

class TaskBasedGenerator {
  constructor(apiKey) {
    this.apiKey = apiKey;
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
`;

    try {
      const response = await this.callLLM(prompt);
      return this.parseJSON(response);
    } catch (error) {
      console.error("Error creating task list:", error);
      throw new Error(`Failed to create task list: ${error.message}`);
    }
  }

  /**
   * Generate code for a specific task
   */
  async generateTaskCode(task, prd, existingFiles = {}) {
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
- Use Next.js 14 with App Router
- Use TypeScript
- Use Tailwind CSS for styling (use standard utility classes)
- Follow best practices
- DO NOT modify postcss.config.mjs or package.json
- Make the code production-ready
- IMPORTANT: ALWAYS add 'use client' directive at the very top of any file that uses React hooks (useState, useEffect, etc.), event handlers (onClick, onChange), or browser APIs
- IMPORTANT: The 'use client' directive must be the FIRST line of the file, before any imports
- IMPORTANT: Custom hooks files should have 'use client' directive if they use React hooks
- IMPORTANT: Components with interactive elements (buttons, forms, inputs) need 'use client' directive
- EXCLUDE: Do NOT generate service workers, PWA configs, or offline support code
- EXCLUDE: Do NOT generate separate accessibility feature files (include basic accessibility inline with semantic HTML and ARIA attributes)
- ANIMATIONS: Use ONLY CSS animations or Tailwind CSS animation classes (e.g., transition-all, animate-pulse, hover:scale-105)
- ANIMATIONS: Do NOT use external animation libraries like framer-motion, react-spring, or similar
- ANIMATIONS: Prefer CSS @keyframes for complex animations, defined in the same file or a separate CSS file
- FONTS: Do NOT import or use custom fonts from next/font/google (like Geist, Inter, etc.)
- FONTS: Keep layout.tsx simple without font imports to avoid build issues

Return ONLY a valid JSON object with this structure:
{
  "files": [
    {
      "path": "src/app/layout.tsx",
      "content": "full file content here",
      "action": "create"
    }
  ],
  "description": "Brief description of what was implemented"
}
`;

    try {
      const response = await this.callLLM(prompt, 8000); // Higher token limit for code
      return this.parseJSON(response);
    } catch (error) {
      console.error(`Error generating code for task ${task.id}:`, error);
      throw new Error(`Failed to generate code for ${task.name}: ${error.message}`);
    }
  }

  /**
   * Execute tasks sequentially with progress tracking
   */
  async executeTasks(tasks, prd, projectPath, onProgress) {
    const results = [];
    const generatedFiles = {};
    
    // Filter out offline support and accessibility-specific tasks
    const filteredTasks = tasks.filter(task => {
      const taskNameLower = task.name.toLowerCase();
      const taskDescLower = (task.description || '').toLowerCase();
      
      // Skip offline/PWA related tasks
      if (taskNameLower.includes('offline') || 
          taskNameLower.includes('service worker') || 
          taskNameLower.includes('pwa') ||
          taskDescLower.includes('offline') ||
          taskDescLower.includes('service worker') ||
          taskDescLower.includes('pwa')) {
        console.log(`Skipping offline/PWA task: ${task.name}`);
        return false;
      }
      
      // Skip accessibility-specific tasks (but keep general UI tasks that include basic accessibility)
      if ((taskNameLower.includes('accessibility') && !taskNameLower.includes('component')) ||
          (taskDescLower.includes('accessibility') && taskDescLower.includes('features'))) {
        console.log(`Skipping accessibility-specific task: ${task.name}`);
        return false;
      }
      
      // Skip animation-specific tasks
      if (taskNameLower.includes('animation') || 
          taskNameLower.includes('transition') ||
          taskDescLower.includes('animation') ||
          taskDescLower.includes('transition')) {
        console.log(`Skipping animation task: ${task.name}`);
        return false;
      }
      
      return true;
    });
    
    // Sort tasks by priority
    const sortedTasks = [...filteredTasks].sort((a, b) => (a.priority || 0) - (b.priority || 0));

    for (let i = 0; i < sortedTasks.length; i++) {
      const task = sortedTasks[i];
      
      try {
        // Notify progress
        if (onProgress) {
          onProgress({
            currentTask: i + 1,
            totalTasks: sortedTasks.length,
            taskName: task.name,
            status: 'generating'
          });
        }

        // Generate code for this task
        const result = await this.generateTaskCode(task, prd, generatedFiles);
        
        // Write files to disk
        for (const file of result.files) {
          const filePath = path.join(projectPath, file.path);
          
          // Create directory if needed
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          
          // Write file
          await fs.writeFile(filePath, file.content, 'utf-8');
          
          // Track generated files
          generatedFiles[file.path] = file.content;
        }

        results.push({
          taskId: task.id,
          taskName: task.name,
          success: true,
          files: result.files.map(f => f.path),
          description: result.description
        });

        // Notify completion
        if (onProgress) {
          onProgress({
            currentTask: i + 1,
            totalTasks: sortedTasks.length,
            taskName: task.name,
            status: 'completed'
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Task ${task.id} failed:`, error);
        
        results.push({
          taskId: task.id,
          taskName: task.name,
          success: false,
          error: error.message
        });

        // Notify error but continue with other tasks
        if (onProgress) {
          onProgress({
            currentTask: i + 1,
            totalTasks: sortedTasks.length,
            taskName: task.name,
            status: 'failed',
            error: error.message
          });
        }
      }
    }

    return {
      results,
      summary: {
        total: sortedTasks.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        generatedFiles: Object.keys(generatedFiles).length
      }
    };
  }

  /**
   * Call LLM with retry logic
   */
  async callLLM(prompt, maxTokens = 4000) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "anthropic/claude-3.5-sonnet",
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            max_tokens: maxTokens,
            temperature: 0.7
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json"
            },
            timeout: 60000
          }
        );

        const content = response.data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("Empty response from LLM");
        }

        return content;
      } catch (error) {
        console.error(`LLM call attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  /**
   * Parse JSON with error handling
   */
  parseJSON(content) {
    try {
      // Try direct parsing first
      return JSON.parse(content);
    } catch (error) {
      // Try removing markdown formatting
      const cleaned = content.replace(/```(json)?/g, "").trim();
      
      // Find JSON object in the content
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }
      
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        // Try to fix common JSON issues
        const fixed = jsonMatch[0]
          .replace(/\\/g, "\\\\")
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r")
          .replace(/\t/g, "\\t");
          
        return JSON.parse(fixed);
      }
    }
  }
}

module.exports = TaskBasedGenerator;