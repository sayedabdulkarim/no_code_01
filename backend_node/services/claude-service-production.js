// Production Claude Service with Real MCP Integration
const Anthropic = require('@anthropic-ai/sdk');
const { getMCPClient } = require('./mcp-client');
require("dotenv").config();

class ClaudeServiceError extends Error {
  constructor(message) {
    super(message);
    this.name = "ClaudeServiceError";
  }
}

class ClaudeServiceProduction {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    if (!this.apiKey) {
      throw new ClaudeServiceError(
        "ANTHROPIC_API_KEY environment variable not set"
      );
    }

    // Initialize Anthropic client
    this.anthropic = new Anthropic({
      apiKey: this.apiKey,
    });

    // MCP client will be initialized when needed
    this.mcpClient = null;
  }

  // Initialize MCP client if not already done
  async ensureMCPClient() {
    if (!this.mcpClient) {
      console.log('\n🔌 [Claude Service] Initializing MCP client...');
      this.mcpClient = await getMCPClient();
      console.log('✅ [Claude Service] MCP client initialized');
    }
    return this.mcpClient;
  }

  // Generate code with MCP context for project updates
  async generateCodeForProject(requirements, projectName) {
    try {
      console.log('\n🎯 [Claude Service] Starting MCP-enhanced code generation');
      console.log(`📁 [Claude Service] Project: ${projectName}`);
      
      // Ensure MCP client is ready
      const mcp = await this.ensureMCPClient();
      
      console.log('🔍 [Claude Service] Analyzing project structure...');
      
      // First, analyze the project structure
      const projectStructure = await mcp.checkProjectStructure(projectName);
      console.log('📊 [Claude Service] Project analysis complete:', {
        framework: projectStructure.framework,
        hasTypeScript: projectStructure.hasTsConfig,
        hasTailwind: projectStructure.hasTailwind,
        componentsCount: projectStructure.components.length
      });
      
      // Build system prompt with project context
      const systemPrompt = `You are an expert ${projectStructure.framework} developer. 
      
      Project details:
      - Framework: ${projectStructure.framework}
      - TypeScript: ${projectStructure.hasTsConfig ? 'Yes' : 'No'}
      - Tailwind CSS: ${projectStructure.hasTailwind ? 'Yes' : 'No'}
      - Components: ${projectStructure.components.join(', ')}
      
      You have access to MCP tools to read project files. Before generating code:
      1. Use read_project_file to understand existing patterns
      2. Use search_code to find related code
      3. Generate code that matches the project's style
      
      CRITICAL RULES:
      - NEVER modify or generate src/app/globals.css - it already has proper Tailwind configuration
      - ALWAYS include all necessary imports at the top of each file
      - Import React hooks when used: import { useState, useEffect } from 'react'
      - Import components with correct paths based on actual file locations
      - Use the MCP tools to find exact component locations before importing
      
      IMPORTANT: Always read relevant files before generating code to ensure compatibility.`;

      // Create conversation with Claude
      const message = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Project: ${projectName}
Requirements: ${requirements}

Please analyze the existing code and generate new code that integrates seamlessly.`
          }
        ],
        tools: [
          {
            name: "read_project_file",
            description: "Read a specific file from the project",
            input_schema: {
              type: "object",
              properties: {
                filePath: { type: "string", description: "Path within project (e.g., src/app/page.tsx)" }
              },
              required: ["filePath"]
            }
          },
          {
            name: "search_code",
            description: "Search for code patterns in the project",
            input_schema: {
              type: "object",
              properties: {
                pattern: { type: "string" },
                fileType: { type: "string", description: "File extension (optional)" }
              },
              required: ["pattern"]
            }
          }
        ],
        tool_choice: { type: "auto" }
      });

      // Process initial response
      let allMessages = [
        {
          role: "user",
          content: `Project: ${projectName}
Requirements: ${requirements}

Please analyze the existing code and generate new code that integrates seamlessly.`
        }
      ];
      
      let currentResponse = message;
      let finalResponse = '';
      let toolCallsHandled = false;

      // Handle tool calls in a loop until no more tool calls
      do {
        toolCallsHandled = false;
        let assistantContent = [];
        let toolResults = [];

        for (const content of currentResponse.content) {
          if (content.type === 'text') {
            finalResponse += content.text;
            assistantContent.push(content);
          } else if (content.type === 'tool_use') {
            toolCallsHandled = true;
            assistantContent.push(content);
            
            console.log(`\n🔨 [Claude] Requesting tool: ${content.name}`);
            console.log(`📋 [Claude] Tool arguments:`, JSON.stringify(content.input, null, 2));
            
            try {
              let toolResult;
              let resultContent = '';
              
              switch (content.name) {
                case 'read_project_file':
                  try {
                    resultContent = await mcp.readProjectFile(projectName, content.input.filePath);
                    console.log(`Successfully read file: ${content.input.filePath}`);
                  } catch (error) {
                    resultContent = `Error reading file: ${error.message}`;
                    console.error(`Failed to read file: ${content.input.filePath}`, error);
                  }
                  break;
                  
                case 'search_code':
                  try {
                    resultContent = await mcp.searchCode(
                      projectName, 
                      content.input.pattern, 
                      content.input.fileType
                    );
                    console.log(`Search completed for pattern: ${content.input.pattern}`);
                  } catch (error) {
                    resultContent = `Error searching: ${error.message}`;
                    console.error(`Failed to search for: ${content.input.pattern}`, error);
                  }
                  break;
                  
                default:
                  resultContent = `Unknown tool: ${content.name}`;
              }
              
              toolResults.push({
                type: "tool_result",
                tool_use_id: content.id,
                content: resultContent
              });
              
            } catch (error) {
              console.error(`Error calling MCP tool ${content.name}:`, error);
              toolResults.push({
                type: "tool_result",
                tool_use_id: content.id,
                content: `Error: ${error.message}`,
                is_error: true
              });
            }
          }
        }

        // If we handled tool calls, send results back to Claude
        if (toolCallsHandled && toolResults.length > 0) {
          allMessages.push({ role: "assistant", content: assistantContent });
          allMessages.push({ role: "user", content: toolResults });
          
          // Get Claude's response after processing tool results
          currentResponse = await this.anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4000,
            temperature: 0.7,
            system: systemPrompt,
            messages: allMessages,
            tools: [
              {
                name: "read_project_file",
                description: "Read a specific file from the project",
                input_schema: {
                  type: "object",
                  properties: {
                    filePath: { type: "string", description: "Path within project (e.g., src/app/page.tsx)" }
                  },
                  required: ["filePath"]
                }
              },
              {
                name: "search_code",
                description: "Search for code patterns in the project",
                input_schema: {
                  type: "object",
                  properties: {
                    pattern: { type: "string" },
                    fileType: { type: "string", description: "File extension (optional)" }
                  },
                  required: ["pattern"]
                }
              }
            ],
            tool_choice: { type: "auto" }
          });
        }
      } while (toolCallsHandled);

      return finalResponse;
      
    } catch (error) {
      throw new ClaudeServiceError(`Error generating code with MCP: ${error.message}`);
    }
  }

  // Fix build errors with MCP context
  async fixBuildError(errorMessage, projectName) {
    try {
      const mcp = await this.ensureMCPClient();
      
      console.log(`Fixing build error for project: ${projectName}`);
      
      // Extract file paths from error message
      const filePathMatch = errorMessage.match(/([^\s]+\.(tsx?|jsx?|css|js))/g);
      const relevantFiles = filePathMatch ? [...new Set(filePathMatch)] : [];
      
      const systemPrompt = `You are an expert debugger. Fix the build error by analyzing the actual code.
      
      You have access to read project files. Always:
      1. Read the files mentioned in the error
      2. Understand the full context
      3. Provide precise fixes with exact line numbers
      4. Ensure the fix doesn't break other code`;

      const message = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for precise fixes
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Project: ${projectName}
Build Error:
${errorMessage}

Relevant files detected: ${relevantFiles.join(', ')}

Please read these files and provide a precise fix.`
          }
        ],
        tools: [
          {
            name: "read_project_file",
            description: "Read a file to understand the error context",
            input_schema: {
              type: "object",
              properties: {
                filePath: { type: "string" }
              },
              required: ["filePath"]
            }
          }
        ]
      });

      // Process response with tool calls
      let fix = '';
      
      for (const content of message.content) {
        if (content.type === 'text') {
          fix += content.text;
        } else if (content.type === 'tool_use' && content.name === 'read_project_file') {
          const fileContent = await mcp.readProjectFile(projectName, content.input.filePath);
          
          // Continue conversation with file content
          const followUp = await this.anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 2000,
            messages: [
              ...message.messages,
              { role: "assistant", content: message.content },
              {
                role: "user",
                content: [{
                  type: "tool_result",
                  tool_use_id: content.id,
                  content: fileContent
                }]
              }
            ]
          });
          
          for (const followUpContent of followUp.content) {
            if (followUpContent.type === 'text') {
              fix += '\n' + followUpContent.text;
            }
          }
        }
      }

      return fix;
      
    } catch (error) {
      throw new ClaudeServiceError(`Error fixing build error: ${error.message}`);
    }
  }

  // Original generateText method for backward compatibility
  async generateText(prompt) {
    try {
      const message = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      if (!message.content || !message.content[0] || !message.content[0].text) {
        throw new ClaudeServiceError("Invalid response format from Claude API");
      }

      return message.content[0].text;
    } catch (error) {
      throw new ClaudeServiceError(`Error generating text: ${error.message}`);
    }
  }

  // Extract code blocks (keeping for compatibility)
  _extractCodeBlocks(text) {
    if (typeof text !== "string") {
      throw new Error("Generated code must be a string");
    }

    function extractBlock(pattern) {
      const regex = new RegExp(pattern, "is");
      const matches = text.match(regex);
      return matches ? matches[1].trim() : null;
    }

    const html = extractBlock(/```html\s*([\s\S]*?)\s*```/);
    const css = extractBlock(/```css\s*([\s\S]*?)\s*```/);
    const javascript = extractBlock(/```javascript\s*([\s\S]*?)\s*```/);

    if (!html && !css && !javascript) {
      throw new Error("No code blocks found in generated text");
    }

    return {
      html: html || "",
      css: css || "",
      javascript: javascript || "",
    };
  }

  // Generate method for backward compatibility
  async generate(prompt) {
    const response = await this.generateText(prompt);
    return this._extractCodeBlocks(response);
  }
}

// Export for use in services
module.exports = { 
  ClaudeServiceProduction,
  ClaudeServiceError,
  // Also export as standard names for compatibility
  ClaudeService: ClaudeServiceProduction,
  LLMService: ClaudeServiceProduction,
  LLMServiceError: ClaudeServiceError
};