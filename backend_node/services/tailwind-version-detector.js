const fs = require('fs/promises');
const path = require('path');

class TailwindVersionDetector {
  /**
   * Always use stable Tailwind v3 configuration to avoid issues
   */
  async detectAndConfigurePostCSS(projectPath, socket) {
    try {
      if (socket) {
        socket.emit('output', `  ℹ Using Tailwind CSS v3 configuration (stable)\n`);
      }
      
      // Clean up any existing PostCSS config files to avoid conflicts
      const configFiles = ['postcss.config.js', 'postcss.config.mjs', 'postcss.config.ts'];
      for (const file of configFiles) {
        const filePath = path.join(projectPath, file);
        try {
          await fs.unlink(filePath);
          if (socket) {
            socket.emit('output', `  ✓ Removed existing ${file}\n`);
          }
        } catch (err) {
          // File doesn't exist, which is fine
        }
      }
      
      // Always generate v3 PostCSS config for stability (CommonJS format)
      const postcssConfig = `/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
      
      // Write the config
      const configPath = path.join(projectPath, 'postcss.config.js');
      await fs.writeFile(configPath, postcssConfig, 'utf-8');
      
      if (socket) {
        socket.emit('output', `  ✓ Created PostCSS config for Tailwind v3\n`);
      }
      
      // Only require standard packages
      return {
        version: 'v3',
        requiredPackages: ['autoprefixer']
      };
      
    } catch (err) {
      console.error('Error creating PostCSS config:', err);
      return {
        version: 'v3',
        requiredPackages: ['autoprefixer']
      };
    }
  }
}

module.exports = TailwindVersionDetector;