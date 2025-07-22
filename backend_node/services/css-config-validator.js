const fs = require('fs/promises');
const path = require('path');
const TailwindVersionDetector = require('./tailwind-version-detector');

class CSSConfigValidator {
  constructor() {
    this.versionDetector = new TailwindVersionDetector();
  }
  
  /**
   * Validate and fix CSS/PostCSS/Tailwind configuration
   */
  async validateAndFix(projectPath, socket) {
    const fixes = [];
    
    // Check PostCSS config
    const postcssFixed = await this.fixPostCSSConfig(projectPath, socket);
    if (postcssFixed) fixes.push('PostCSS configuration');
    
    // Check Tailwind config
    const tailwindFixed = await this.validateTailwindConfig(projectPath, socket);
    if (tailwindFixed) fixes.push('Tailwind configuration');
    
    // Check globals.css
    const cssFixed = await this.validateGlobalCSS(projectPath, socket);
    if (cssFixed) fixes.push('Global CSS');
    
    // Ensure required dependencies
    const depsFixed = await this.ensureDependencies(projectPath, socket);
    if (depsFixed) fixes.push('Dependencies');
    
    return fixes;
  }
  
  /**
   * Fix PostCSS configuration
   */
  async fixPostCSSConfig(projectPath, socket) {
    if (socket) {
      socket.emit('output', '  ℹ Detecting Tailwind CSS version...\n');
    }
    
    // Use version detector to create appropriate config
    const result = await this.versionDetector.detectAndConfigurePostCSS(projectPath, socket);
    
    // Install required packages if needed
    if (result.requiredPackages?.length > 0) {
      const { spawn } = require('child_process');
      
      for (const pkg of result.requiredPackages) {
        try {
          const packageJsonPath = path.join(projectPath, 'package.json');
          const content = await fs.readFile(packageJsonPath, 'utf-8');
          const packageJson = JSON.parse(content);
          
          const hasPackage = 
            packageJson.dependencies?.[pkg] || 
            packageJson.devDependencies?.[pkg];
          
          if (!hasPackage) {
            if (socket) {
              socket.emit('output', `  ✓ Installing ${pkg}...\n`);
            }
            
            await new Promise((resolve, reject) => {
              const installProcess = spawn('npm', ['install', '--save-dev', pkg], {
                cwd: projectPath,
                shell: true
              });
              
              installProcess.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Failed to install ${pkg}`));
              });
            });
          }
        } catch (err) {
          console.error(`Error installing ${pkg}:`, err);
        }
      }
    }
    
    return true;
  }
  
  /**
   * Validate Tailwind configuration
   */
  async validateTailwindConfig(projectPath, socket) {
    const configPath = path.join(projectPath, 'tailwind.config.js');
    
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      
      // Check if content paths are correct
      if (!content.includes('./src/app/**/*.{js,ts,jsx,tsx,mdx}')) {
        if (socket) {
          socket.emit('output', '  ✓ Updating Tailwind content paths...\n');
        }
        
        // Update with correct paths
        const updatedConfig = content.replace(
          /content:\s*\[[^\]]*\]/s,
          `content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ]`
        );
        
        await fs.writeFile(configPath, updatedConfig, 'utf-8');
        return true;
      }
    } catch (err) {
      // Create default config if missing
      if (socket) {
        socket.emit('output', '  ✓ Creating Tailwind configuration...\n');
      }
      
      const defaultConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;
      
      await fs.writeFile(configPath, defaultConfig, 'utf-8');
      return true;
    }
    
    return false;
  }
  
  /**
   * Validate global CSS file
   */
  async validateGlobalCSS(projectPath, socket) {
    const cssPath = path.join(projectPath, 'src/app/globals.css');
    
    try {
      const content = await fs.readFile(cssPath, 'utf-8');
      
      // Check for Tailwind directives
      const hasBase = content.includes('@tailwind base');
      const hasComponents = content.includes('@tailwind components');
      const hasUtilities = content.includes('@tailwind utilities');
      
      if (!hasBase || !hasComponents || !hasUtilities) {
        if (socket) {
          socket.emit('output', '  ✓ Adding Tailwind directives to globals.css...\n');
        }
        
        // Prepend Tailwind directives
        const directives = `@tailwind base;
@tailwind components;
@tailwind utilities;

`;
        
        const updatedContent = directives + content.replace(/@tailwind\s+(base|components|utilities);?\s*/g, '');
        await fs.writeFile(cssPath, updatedContent, 'utf-8');
        return true;
      }
    } catch (err) {
      // Create file if missing
      if (socket) {
        socket.emit('output', '  ✓ Creating globals.css with Tailwind directives...\n');
      }
      
      const defaultCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
      
      await fs.writeFile(cssPath, defaultCSS, 'utf-8');
      return true;
    }
    
    return false;
  }
  
  /**
   * Ensure required dependencies are installed
   */
  async ensureDependencies(projectPath, socket) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      
      const devDeps = packageJson.devDependencies || {};
      const deps = packageJson.dependencies || {};
      
      // Don't check/install here - let the PostCSS fixer handle version-specific deps
      return false;
      
      const missingDeps = [];
      
      for (const [dep, version] of Object.entries(requiredDeps)) {
        if (!devDeps[dep] && !deps[dep]) {
          missingDeps.push(dep);
        }
      }
      
      if (missingDeps.length > 0) {
        if (socket) {
          socket.emit('output', `  ✓ Installing missing dependencies: ${missingDeps.join(', ')}...\n`);
        }
        
        // Install missing dependencies
        const { spawn } = require('child_process');
        
        return new Promise((resolve) => {
          const installProcess = spawn('npm', ['install', '--save-dev', ...missingDeps], {
            cwd: projectPath,
            shell: true
          });
          
          installProcess.on('close', (code) => {
            resolve(code === 0);
          });
        });
      }
    } catch (err) {
      console.error('Error checking dependencies:', err);
    }
    
    return false;
  }
}

module.exports = CSSConfigValidator;