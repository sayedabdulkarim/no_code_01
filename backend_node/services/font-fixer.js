const fs = require('fs/promises');
const path = require('path');

class FontFixer {
  /**
   * Fix font-related issues in Next.js projects
   */
  async fixFontIssues(projectPath, socket) {
    const layoutPath = path.join(projectPath, 'src/app/layout.tsx');
    
    try {
      let content = await fs.readFile(layoutPath, 'utf-8');
      let modified = false;
      
      // Check if using Geist fonts
      if (content.includes('Geist') && content.includes('next/font/google')) {
        if (socket) {
          socket.emit('output', '  ✓ Removing Geist font references...\n');
        }
        
        // Remove font imports
        content = content.replace(/import\s*{\s*Geist[^}]*}\s*from\s*["']next\/font\/google["'];?\s*\n?/g, '');
        
        // Remove font variable declarations
        content = content.replace(/const\s+geist\w+\s*=\s*Geist[^;]+;\s*\n?/g, '');
        
        // Remove font class applications
        content = content.replace(/\${geistSans\.variable}\s*/g, '');
        content = content.replace(/\${geistMono\.variable}\s*/g, '');
        content = content.replace(/className=\{`\s*`\}/g, '');
        content = content.replace(/className=\{`([^`]*)`\}/g, (match, classes) => {
          const cleaned = classes.trim();
          return cleaned ? `className="${cleaned}"` : '';
        });
        
        modified = true;
      }
      
      // Also check for Inter font (another common issue)
      if (content.includes('Inter') && content.includes('next/font/google')) {
        content = content.replace(/import\s*{\s*Inter[^}]*}\s*from\s*["']next\/font\/google["'];?\s*\n?/g, '');
        content = content.replace(/const\s+inter\s*=\s*Inter[^;]+;\s*\n?/g, '');
        content = content.replace(/\${inter\.variable}\s*/g, '');
        modified = true;
      }
      
      // Clean up empty className attributes
      content = content.replace(/className=""\s*/g, '');
      content = content.replace(/className=\{\s*\}\s*/g, '');
      
      if (modified) {
        await fs.writeFile(layoutPath, content, 'utf-8');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error fixing fonts:', err);
      return false;
    }
  }
  
  /**
   * Create a simple layout without fonts
   */
  async createSimpleLayout(projectPath, socket) {
    const layoutPath = path.join(projectPath, 'src/app/layout.tsx');
    
    const simpleLayout = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
`;
    
    try {
      await fs.writeFile(layoutPath, simpleLayout, 'utf-8');
      if (socket) {
        socket.emit('output', '  ✓ Created simple layout without font dependencies\n');
      }
      return true;
    } catch (err) {
      console.error('Error creating simple layout:', err);
      return false;
    }
  }
}

module.exports = FontFixer;