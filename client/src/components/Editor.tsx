import React, { useState, useEffect, useRef } from 'react';
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
  
  // Add ref to store save function for keyboard shortcut
  const saveFileRef = useRef<(filePath: string) => Promise<void>>();

  // Fetch file tree when project changes
  useEffect(() => {
    if (projectName) {
      fetchFileTree();
    }
  }, [projectName]);
  
  // Keyboard shortcut support (Ctrl+S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeFile && saveFileRef.current) {
          saveFileRef.current(activeFile);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile]);

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

  // Update ref when saveFile changes
  useEffect(() => {
    saveFileRef.current = saveFile;
  });
  
  const saveFile = async (filePath: string) => {
    if (!projectName) return;
    
    const file = openFiles.get(filePath);
    if (!file || !file.isDirty) return;

    setSaving(true);
    try {
      await axios.put(
        `http://localhost:5001/api/project-file/${projectName}/${filePath}`,
        { content: file.content }
      );
      
      // Mark file as saved
      const newOpenFiles = new Map(openFiles);
      newOpenFiles.set(filePath, { ...file, isDirty: false });
      setOpenFiles(newOpenFiles);
      
      // Show success message (you might want to add a toast notification here)
      console.log(`File saved: ${filePath}`);
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('Failed to save file. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
          <h4>EXPLORER</h4>
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
                <SaveButton 
                  onClick={() => saveFile(activeFile)}
                  disabled={!openFiles.get(activeFile)?.isDirty || saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </SaveButton>
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
  background: ${props => props.theme.colors.background};
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
  
  h4 {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    opacity: 0.7;
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

const SaveButton = styled.button`
  padding: 4px 12px;
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    opacity: 0.8;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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