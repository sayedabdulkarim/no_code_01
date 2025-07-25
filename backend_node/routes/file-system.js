const express = require("express");
const path = require("path");
const fs = require("fs").promises;

const router = express.Router();

// Get file tree for a project
router.get("/api/project-files/:projectName", async (req, res) => {
  try {
    const { projectName } = req.params;
    const projectPath = path.join(__dirname, "..", "..", "client", "user-projects", projectName);
    
    // Check if project exists
    try {
      await fs.access(projectPath);
    } catch {
      return res.status(404).json({ error: "Project not found" });
    }
    
    // Recursively read directory structure
    async function readDirectory(dirPath, relativePath = "") {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      const result = [];
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        // Use forward slashes for consistent paths across platforms
        const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
        
        if (item.isDirectory()) {
          const children = await readDirectory(itemPath, itemRelativePath);
          result.push({
            name: item.name,
            path: itemRelativePath.replace(/\\/g, '/'),
            type: "directory",
            children
          });
        } else {
          result.push({
            name: item.name,
            path: itemRelativePath.replace(/\\/g, '/'),
            type: "file"
          });
        }
      }
      
      return result.sort((a, b) => {
        // Directories first, then files
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "directory" ? -1 : 1;
      });
    }
    
    const fileTree = await readDirectory(projectPath);
    res.json({ projectName, files: fileTree });
    
  } catch (error) {
    console.error("Error reading project files:", error);
    res.status(500).json({ error: "Failed to read project files" });
  }
});

// Use a middleware approach to handle all file operations
// This avoids complex route patterns that cause issues with path-to-regexp
router.use("/api/project-file", async (req, res, next) => {
  // Skip if path doesn't start with /
  if (!req.path || !req.path.startsWith('/')) {
    return next();
  }
  
  try {
    // Extract project name and file path from URL
    const urlPath = req.path.substring(1); // Remove leading /
    const firstSlashIndex = urlPath.indexOf('/');
    
    if (firstSlashIndex === -1) {
      return res.status(400).json({ error: "Invalid file path" });
    }
    
    const projectName = urlPath.substring(0, firstSlashIndex);
    const filePath = urlPath.substring(firstSlashIndex + 1);
    
    if (!projectName || !filePath) {
      return res.status(400).json({ error: "Invalid request" });
    }
    
    const fullPath = path.join(__dirname, "..", "..", "client", "user-projects", projectName, filePath);
    const projectPath = path.join(__dirname, "..", "..", "client", "user-projects", projectName);
    
    // Security check
    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(path.resolve(projectPath))) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Handle different HTTP methods
    if (req.method === 'GET') {
      // Read file
      try {
        const content = await fs.readFile(fullPath, "utf-8");
        res.json({ content, path: filePath });
      } catch (error) {
        if (error.code === "ENOENT") {
          return res.status(404).json({ error: "File not found" });
        }
        throw error;
      }
    } else if (req.method === 'PUT') {
      // Save file
      const { content } = req.body;
      
      if (content === undefined) {
        return res.status(400).json({ error: "Content is required" });
      }
      
      // Ensure directory exists
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(fullPath, content, "utf-8");
      res.json({ message: "File saved successfully", path: filePath });
    } else if (req.method === 'POST') {
      // Create new file
      const { content = "" } = req.body;
      
      // Check if file already exists
      try {
        await fs.access(fullPath);
        return res.status(409).json({ error: "File already exists" });
      } catch {
        // File doesn't exist, continue
      }
      
      // Ensure directory exists
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(fullPath, content, "utf-8");
      res.json({ message: "File created successfully", path: filePath });
    } else if (req.method === 'DELETE') {
      // Delete file
      try {
        await fs.unlink(fullPath);
        res.json({ message: "File deleted successfully", path: filePath });
      } catch (error) {
        if (error.code === "ENOENT") {
          return res.status(404).json({ error: "File not found" });
        }
        throw error;
      }
    } else {
      // Method not supported
      return res.status(405).json({ error: "Method not allowed" });
    }
    
  } catch (error) {
    console.error("Error in file operation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;