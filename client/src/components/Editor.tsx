import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from '@emotion/styled';
import MonacoEditor from '@monaco-editor/react';
import axios from 'axios';

interface EditorProps {
  projectName?: string;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface OpenFile {
  path: string;
  content: string;
  isDirty: boolean;
}

const Editor: React.FC<EditorProps> = ({ projectName }) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [openFiles, setOpenFiles] = useState<Map<string, OpenFile>>(new Map());
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  

  // Fetch file tree when project changes
  useEffect(() => {
    if (projectName) {
      fetchFileTree();
    }
  }, [projectName]);
  
  // Remove keyboard shortcut since we have auto-save

  const fetchFileTree = async () => {
    if (!projectName) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5001/api/project-files/${projectName}`);
      setFileTree(response.data.files);
      // Expand src directory by default
      setExpandedDirs(new Set(['src']));
    } catch (error) {
      console.error('Failed to fetch file tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDirectory = (path: string) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const openFile = async (filePath: string) => {
    if (!projectName) return;
    
    // If file is already open, just activate it
    if (openFiles.has(filePath)) {
      setActiveFile(filePath);
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5001/api/project-file/${projectName}/${filePath}`
      );
      
      const newOpenFiles = new Map(openFiles);
      newOpenFiles.set(filePath, {
        path: filePath,
        content: response.data.content,
        isDirty: false
      });
      
      setOpenFiles(newOpenFiles);
      setActiveFile(filePath);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const closeFile = (filePath: string) => {
    const newOpenFiles = new Map(openFiles);
    newOpenFiles.delete(filePath);
    setOpenFiles(newOpenFiles);
    
    // If closing active file, activate another
    if (activeFile === filePath) {
      const remainingFiles = Array.from(newOpenFiles.keys());
      setActiveFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null);
    }
  };


  // Debounce function
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Auto-save function
  const autoSave = useCallback(
    debounce(async (filePath: string, content: string) => {
      if (!projectName) return;
      
      try {
        await axios.put(
          `http://localhost:5001/api/project-file/${projectName}/${filePath}`,
          { content }
        );
        
        // Mark file as saved
        setOpenFiles(prev => {
          const newMap = new Map(prev);
          const file = newMap.get(filePath);
          if (file) {
            newMap.set(filePath, { ...file, isDirty: false });
          }
          return newMap;
        });
        
        console.log(`Auto-saved: ${filePath}`);
      } catch (error) {
        console.error('Failed to auto-save file:', error);
      }
    }, 1000), // Auto-save after 1 second of inactivity
    [projectName]
  );

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFile || value === undefined) return;
    
    const file = openFiles.get(activeFile);
    if (!file) return;
    
    const newOpenFiles = new Map(openFiles);
    newOpenFiles.set(activeFile, {
      ...file,
      content: value,
      isDirty: true
    });
    setOpenFiles(newOpenFiles);
    
    // Trigger auto-save
    autoSave(activeFile, value);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      js: '📄',
      jsx: '⚛️',
      ts: '📘',
      tsx: '⚛️',
      css: '🎨',
      json: '📋',
      md: '📝',
      html: '🌐',
      svg: '🖼️',
      png: '🖼️',
      jpg: '🖼️',
      gif: '🖼️',
    };
    return iconMap[ext || ''] || '📄';
  };

  const handleDownloadProject = async () => {
    if (!projectName) return;
    
    setDownloading(true);
    try {
      const response = await axios.get(
        `http://localhost:5001/api/download-project/${projectName}`,
        {
          responseType: 'blob',
        }
      );
      
      // Create a download link
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download project:', error);
      alert('Failed to download project. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => {
      if (node.type === 'directory') {
        const isExpanded = expandedDirs.has(node.path);
        return (
          <div key={node.path}>
            <TreeItem 
              level={level}
              onClick={() => toggleDirectory(node.path)}
            >
              <span>{isExpanded ? '📂' : '📁'} {node.name}</span>
            </TreeItem>
            {isExpanded && node.children && (
              <div>{renderFileTree(node.children, level + 1)}</div>
            )}
          </div>
        );
      } else {
        return (
          <TreeItem
            key={node.path}
            level={level}
            onClick={() => openFile(node.path)}
            isActive={activeFile === node.path}
          >
            <span>{getFileIcon(node.name)} {node.name}</span>
          </TreeItem>
        );
      }
    });
  };

  if (!projectName) {
    return (
      <Container>
        <EmptyState>
          <EmptyIcon>📝</EmptyIcon>
          <EmptyTitle>No Project Selected</EmptyTitle>
          <EmptyText>Select a project from "Your Projects" to start editing</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <FileExplorer>
        <ExplorerHeader>
          <HeaderContent>
            <h4>EXPLORER</h4>
            <DownloadButton 
              onClick={handleDownloadProject}
              disabled={downloading}
              title="Download project as ZIP"
            >
              {downloading ? '⏳' : '📥'}
            </DownloadButton>
          </HeaderContent>
        </ExplorerHeader>
        <FileTree>
          {loading ? (
            <LoadingState>Loading files...</LoadingState>
          ) : (
            renderFileTree(fileTree)
          )}
        </FileTree>
      </FileExplorer>
      
      <EditorArea>
        <TabBar>
          {Array.from(openFiles.entries()).map(([path, file]) => (
            <Tab
              key={path}
              isActive={activeFile === path}
              onClick={() => setActiveFile(path)}
            >
              <TabContent>
                {file.isDirty && <DirtyIndicator>●</DirtyIndicator>}
                <TabName>{path.split('/').pop()}</TabName>
                <CloseButton onClick={(e) => {
                  e.stopPropagation();
                  closeFile(path);
                }}>×</CloseButton>
              </TabContent>
            </Tab>
          ))}
        </TabBar>
        
        <EditorContainer>
          {activeFile && openFiles.get(activeFile) ? (
            <>
              <EditorHeader>
                <FilePath>{activeFile}</FilePath>
                {openFiles.get(activeFile)?.isDirty && (
                  <SavingIndicator>Saving...</SavingIndicator>
                )}
              </EditorHeader>
              <MonacoEditor
                height="calc(100% - 40px)"
                language={getLanguageFromPath(activeFile)}
                value={openFiles.get(activeFile)?.content}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
                beforeMount={(monaco) => {
                  // Configure TypeScript compiler options
                  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                    target: monaco.languages.typescript.ScriptTarget.Latest,
                    allowNonTsExtensions: true,
                    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                    module: monaco.languages.typescript.ModuleKind.CommonJS,
                    noEmit: true,
                    esModuleInterop: true,
                    jsx: monaco.languages.typescript.JsxEmit.React,
                    allowJs: true,
                    typeRoots: ["node_modules/@types"]
                  });
                  
                  // Disable TypeScript diagnostics to avoid false errors
                  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                    noSemanticValidation: true,
                    noSyntaxValidation: false,
                  });
                  
                  // Also for JavaScript
                  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                    noSemanticValidation: true,
                    noSyntaxValidation: false,
                  });
                }}
              />
            </>
          ) : (
            <EmptyEditor>
              <EmptyIcon>📄</EmptyIcon>
              <EmptyText>Select a file to edit</EmptyText>
            </EmptyEditor>
          )}
        </EditorContainer>
      </EditorArea>
    </Container>
  );
};

// Helper function to determine language from file path
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    css: 'css',
    scss: 'scss',
    json: 'json',
    md: 'markdown',
    html: 'html',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
  };
  return languageMap[ext || ''] || 'plaintext';
}

// Styled Components
const Container = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  background: ${props => props.theme.colors.background};
  position: relative;
  overflow: hidden;
`;

const FileExplorer = styled.div`
  width: 240px;
  background: ${props => props.theme.colors.surface};
  border-right: 1px solid ${props => props.theme.colors.border};
  overflow-y: auto;
`;

const ExplorerHeader = styled.div`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h4 {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    opacity: 0.7;
  }
`;

const DownloadButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primary}20;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FileTree = styled.div`
  padding: ${props => props.theme.spacing.sm} 0;
`;

const TreeItem = styled.div<{ level: number; isActive?: boolean }>`
  padding: 4px 8px;
  padding-left: ${props => 8 + props.level * 16}px;
  cursor: pointer;
  color: ${props => props.theme.colors.text};
  background: ${props => props.isActive ? props.theme.colors.primary + '20' : 'transparent'};
  border-left: 2px solid ${props => props.isActive ? props.theme.colors.primary : 'transparent'};
  user-select: none;
  font-size: 13px;
  
  &:hover {
    background: ${props => props.theme.colors.primary + '10'};
  }
  
  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const LoadingState = styled.div`
  padding: ${props => props.theme.spacing.md};
  text-align: center;
  color: ${props => props.theme.colors.text};
  opacity: 0.5;
`;

const EditorArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TabBar = styled.div`
  display: flex;
  background: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
  }
`;

const Tab = styled.div<{ isActive: boolean }>`
  padding: 8px 12px;
  background: ${props => props.isActive ? props.theme.colors.background : 'transparent'};
  border-right: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
  min-width: 120px;
  max-width: 200px;
  
  &:hover {
    background: ${props => props.isActive ? props.theme.colors.background : props.theme.colors.surface};
  }
`;

const TabContent = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TabName = styled.span`
  flex: 1;
  font-size: 13px;
  color: ${props => props.theme.colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DirtyIndicator = styled.span`
  color: ${props => props.theme.colors.primary};
  font-size: 16px;
`;

const CloseButton = styled.span`
  font-size: 18px;
  line-height: 1;
  opacity: 0.5;
  
  &:hover {
    opacity: 1;
  }
`;

const EditorContainer = styled.div`
  flex: 1;
  background: #1e1e1e;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #252526;
  border-bottom: 1px solid #3e3e42;
`;

const FilePath = styled.span`
  font-size: 13px;
  color: #cccccc;
  font-family: monospace;
`;

const SavingIndicator = styled.span`
  font-size: 12px;
  color: ${props => props.theme.colors.primary};
  opacity: 0.7;
  font-style: italic;
`;

const EmptyEditor = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme.colors.text};
  opacity: 0.5;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.lg};
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const EmptyTitle = styled.h3`
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`;

const EmptyText = styled.p`
  color: ${props => props.theme.colors.text};
  opacity: 0.7;
  margin: 0;
  max-width: 400px;
`;

export default Editor;