import styled from "@emotion/styled";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import React, { useState } from "react";
import { LiveEditor } from "./LiveEditor";

interface EditorPanelProps {
  files: Record<string, string>;
  activeFile: string;
  onFileChange: (filename: string) => void;
  onCodeChange?: (filename: string, content: string) => void;
  isFullScreen: boolean;
  onToggleFullscreen: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  files,
  activeFile,
  onFileChange,
  onCodeChange,
  isFullScreen,
  onToggleFullscreen,
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    Object.entries(files).forEach(([filename, content]) => {
      // Remove leading slash if present
      const cleanName = filename.startsWith("/")
        ? filename.substring(1)
        : filename;
      zip.file(cleanName, content);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "project.zip");
    setShowOptions(false);
  };

  return (
    <Container>
      <HeaderContainer>
        <Actions>
          <OptionsDropdownButton onClick={() => setShowOptions(!showOptions)}>
            Actions ▾
          </OptionsDropdownButton>
          {showOptions && (
            <DropdownMenu>
              <MenuItem onClick={handleDownloadZip}>Download as ZIP</MenuItem>
            </DropdownMenu>
          )}
        </Actions>
      </HeaderContainer>

      <EditorContainer>
        <LiveEditor
          files={files}
          activeFile={activeFile}
          onFileChange={onFileChange}
          isFullScreen={isFullScreen}
          onToggleFullscreen={onToggleFullscreen}
        />
      </EditorContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${(props) => props.theme.colors.background};
  overflow: hidden;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${(props) => props.theme.colors.surface};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const Actions = styled.div`
  position: relative;
  margin-right: ${(props) => props.theme.spacing.md};
`;

const OptionsDropdownButton = styled.button`
  padding: 8px 16px;
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: ${(props) => props.theme.colors.background};
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #333;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 4px;
  min-width: 180px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const MenuItem = styled.button`
  width: 100%;
  padding: 8px 16px;
  background: none;
  border: none;
  color: #eee;
  text-align: left;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #444;
  }

  & + & {
    border-top: 1px solid ${(props) => props.theme.colors.border};
  }
`;

const EditorContainer = styled.div`
  flex: 1;
  min-height: 0;
  border: 1px solid ${(props) => props.theme.colors.border};
`;
