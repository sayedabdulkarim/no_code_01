// Router for PRD endpoints
const express = require("express");
const router = express.Router();
const { PRDService } = require("../services/prd-service");
const { AgentService } = require("../services/agent-service");

const prdService = new PRDService();
const agentService = new AgentService();

// Generate a PRD based on the user's requirement
router.post("/generate-prd", async (req, res) => {
  try {
    const { requirement } = req.body;

    if (!requirement || !requirement.trim()) {
      return res.status(400).json({ error: "Requirement cannot be empty" });
    }

    const prd = await prdService.generatePRD(requirement);
    return res.status(200).json({ prd });
  } catch (error) {
    console.error(`Error in generate-prd: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// Process approved PRD to generate UI
router.post("/approve-prd", async (req, res) => {
  try {
    const { requirement, prd, approved } = req.body;

    if (!approved) {
      return res.status(400).json({ error: "PRD was not approved" });
    }

    // Process the requirement through the agent service
    const result = await agentService.processRequirement(requirement);
    console.debug(`Generated UI result: ${JSON.stringify(result)}`);

    return res.status(200).json(result);
  } catch (error) {
    if (error.name === "LLMServiceError") {
      return res.status(503).json({ error: error.message });
    }

    console.error(`Error in approve-prd: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
