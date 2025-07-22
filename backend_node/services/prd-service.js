// PRD Service for generating Product Requirement Documents
const { LLMService } = require("./llm-service");

class PRDService {
  constructor() {
    this.llmService = new LLMService();
  }

  // Generate a PRD based on the user's requirement
  async generatePRD(requirement) {
    const prompt = `
    You are a skilled product manager. Based on this requirement: '${requirement}',
    create a clear, concise, and non-technical Product Requirements Document (PRD).
    
    Structure it as follows:

    1. Overview
    - Brief description of what needs to be built
    - The main goal and purpose

    2. Core Features
    - List the key features and capabilities needed
    - Explain each feature in simple, non-technical terms

    3. User Experience
    - How users will interact with the feature
    - What the user should be able to do

    4. Requirements
    - List specific requirements and constraints
    - Any important behaviors or rules

    Keep it concise and avoid any technical implementation details.
    Do NOT include sections about success metrics, analytics, or out-of-scope items.
    Write in a way that's easy for non-technical stakeholders to understand.
    `;

    return await this.llmService.generateText(prompt);
  }
}

module.exports = { PRDService };
