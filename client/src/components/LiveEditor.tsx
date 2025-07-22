import {
  SandpackCodeEditor,
  SandpackFileExplorer,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import { sandpackDark } from "@codesandbox/sandpack-themes";
import styled from "@emotion/styled";
import React from "react";

// Define a proper index signature for our file types
type FileRecord = Record<string, string>;

interface LiveEditorProps {
  files: Record<string, string>;
  activeFile?: string;
  onFileChange?: (filePath: string) => void;
  isFullScreen?: boolean;
  onToggleFullscreen?: () => void;
}

// Use plain JavaScript files instead of TypeScript to avoid esbuild-wasm issues
const defaultFiles: FileRecord = {
  "/src/App.jsx": `import React from 'react'

export default function App() {
  return <div>Todo App</div>
}`,
  "/src/main.jsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`,
  "/index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Todo App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
  "/package.json": JSON.stringify(
    {
      name: "todo-app",
      private: true,
      version: "0.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview"
      },
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
      },
      devDependencies: {
        "@vitejs/plugin-react": "^3.1.0",
        "vite": "^4.0.0"
      }
    },
    null,
    2
  ),
  "/vite.config.js": `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()]
})`
};

export const LiveEditor: React.FC<LiveEditorProps> = ({
  files,
  activeFile,
  onFileChange,
  isFullScreen,
  onToggleFullscreen,
}) => {
  // Process input files to handle TypeScript to JavaScript conversion
  const processedFiles = React.useMemo(() => {
    // Start with default files
    const processedFiles: FileRecord = { ...defaultFiles };

    // Process input files, converting .tsx to .jsx and ensuring no duplicates
    Object.entries(files).forEach(([path, content]) => {
      if (!content?.trim()) return;

      // Convert TypeScript paths to JavaScript
      const normalizedPath = path
        .startsWith("/") ? path : `/${path}`; // Ensure leading slash

      // Skip files that would create duplicates
      if (
        normalizedPath.endsWith(".tsx") &&
        processedFiles[normalizedPath.replace(".tsx", ".jsx")]
      ) {
        return;
      }

      // Only process files in /src/ directory
      if (normalizedPath.startsWith("/src/") && content.trim()) {
        // Convert .tsx files to .jsx
        const jsPath = normalizedPath.replace(/\.tsx$/, ".jsx");
        processedFiles[jsPath] = content;
      }
    });

    return processedFiles;
  }, [files]);

  return (
    <Container isFullScreen={isFullScreen}>
      <SandpackProvider
        theme={sandpackDark}
        template="vite-react"  // Use vite-react instead of vite-react-ts
        files={processedFiles}
        customSetup={{
          dependencies: {
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
          },
          entry: "/src/main.jsx"  // Point to JSX file, not TSX
        }}
        options={{
          activeFile: activeFile
            ? `/${activeFile.replace(/^\/+/, "").replace(/\.tsx$/, ".jsx")}`
            : "/src/App.jsx",
          visibleFiles: [
            "/src/App.jsx",
            "/src/main.jsx",
            "/index.html",
            "/vite.config.js"
          ],
          recompileMode: "immediate",
          recompileDelay: 500
        }}
      >
        <EditorContainer>
          <ToolbarWrapper>
            <SandpackFileExplorer />
            <FullScreenButton onClick={onToggleFullscreen}>
              {isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            </FullScreenButton>
          </ToolbarWrapper>

          <SandpackLayout>
            <EditorWrapper>
              <SandpackCodeEditor
                showTabs
                showLineNumbers
                showInlineErrors
                wrapContent
                closableTabs
              />
            </EditorWrapper>
            <PreviewWrapper>
              <SandpackPreview
                showNavigator
                showRefreshButton
                showOpenInCodeSandbox={false}
              />
            </PreviewWrapper>
          </SandpackLayout>
        </EditorContainer>
      </SandpackProvider>
    </Container>
  );
};

const Container = styled.div<{ isFullScreen?: boolean }>`
  height: 100%;
  width: 100%;
  background: ${(props) => props.theme.colors.background};
  ${(props) =>
    props.isFullScreen &&
    `
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
  `}
`;

const EditorContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const ToolbarWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: ${(props) => props.theme.colors.surface};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const EditorWrapper = styled.div`
  flex: 1;
  min-width: 400px;
  height: 100%;
`;

const PreviewWrapper = styled.div`
  flex: 1;
  height: 100%;
`;

const FullScreenButton = styled.button`
  padding: 6px 12px;
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background: ${(props) => props.theme.colors.background};
  }
`;
