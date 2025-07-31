import styled from "@emotion/styled";
import React, { useState } from "react";
import { CommandSuggestion } from "../types/terminal";
import Editor from "./Editor";
import Preview from "./Preview";
import TerminalWithHeader from "./TerminalWithHeader";

interface TabbedPanelProps {
  // Terminal props
  addErrorMessage: (message: string) => void;
  addMessage: (text: string, isError: boolean) => void;
  addSuggestions: (
    originalCommand: string,
    errorMessage: string,
    suggestions: CommandSuggestion[]
  ) => void;
  runCommand?: (command: string) => void;
  onSocketReady?: (socketId: string) => void;
  socketId: string | null;
  loading: boolean;

  // Preview props
  projectUrl?: string;
  projectName?: string;

  // Tab control props
  disabledTabs?: string[];
  onTabChange?: (tab: "terminal" | "preview" | "editor") => void;
  activeTab?: "terminal" | "preview" | "editor";
}

const TabbedPanel: React.FC<TabbedPanelProps> = (props) => {
  const [localActiveTab, setLocalActiveTab] = useState<
    "terminal" | "preview" | "editor"
  >("terminal");

  // Use controlled state if provided, otherwise use local state
  const activeTab = props.activeTab || localActiveTab;
  const disabledTabs = props.disabledTabs || [];

  const handleTabClick = (tab: "terminal" | "preview" | "editor") => {
    // Don't allow clicking on disabled tabs
    if (disabledTabs.includes(tab)) {
      return;
    }

    if (props.onTabChange) {
      props.onTabChange(tab);
    } else {
      setLocalActiveTab(tab);
    }
  };

  console.log("TabbedPanel render:", { activeTab, disabledTabs, props });

  return (
    <Container>
      <TabHeader>
        <Tab
          active={activeTab === "terminal"}
          disabled={disabledTabs.includes("terminal")}
          onClick={() => handleTabClick("terminal")}
        >
          <TabIcon>💻</TabIcon>
          Terminal
        </Tab>
        <Tab
          active={activeTab === "preview"}
          disabled={disabledTabs.includes("preview")}
          onClick={() => handleTabClick("preview")}
        >
          <TabIcon>🌐</TabIcon>
          Preview
        </Tab>
        <Tab
          active={activeTab === "editor"}
          disabled={disabledTabs.includes("editor")}
          onClick={() => handleTabClick("editor")}
        >
          <TabIcon>📝</TabIcon>
          Editor
        </Tab>
      </TabHeader>

      <TabContent>
        <TabPanel show={activeTab === "terminal"}>
          <TerminalWithHeader
            addErrorMessage={props.addErrorMessage}
            addMessage={props.addMessage}
            addSuggestions={props.addSuggestions}
            runCommand={props.runCommand}
            onSocketReady={props.onSocketReady}
            socketId={props.socketId}
            loading={props.loading}
          />
        </TabPanel>
        <TabPanel show={activeTab === "preview"}>
          <Preview
            key={`preview-${activeTab === "preview" ? "active" : "inactive"}`}
            projectUrl={props.projectUrl}
            projectName={props.projectName}
          />
        </TabPanel>
        <TabPanel show={activeTab === "editor"}>
          <Editor projectName={props.projectName} />
        </TabPanel>
      </TabContent>
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const TabHeader = styled.div`
  display: flex;
  background: ${(props) => props.theme.colors.surface};
  border-bottom: 2px solid ${(props) => props.theme.colors.border};
`;

const Tab = styled.button<{ active: boolean; disabled?: boolean }>`
  flex: 1;
  padding: ${(props) => props.theme.spacing.md};
  background: ${(props) =>
    props.active ? props.theme.colors.background : "transparent"};
  color: ${(props) =>
    props.disabled
      ? props.theme.colors.textSecondary
      : props.active
      ? props.theme.colors.primary
      : props.theme.colors.text};
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.active ? props.theme.colors.primary : "transparent")};
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-weight: ${(props) => (props.active ? "600" : "normal")};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.spacing.sm};
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};

  &:hover {
    background: ${(props) =>
      props.disabled ? "transparent" : props.theme.colors.background};
  }
`;

const TabIcon = styled.span`
  font-size: 16px;
`;

const TabContent = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`;

const TabPanel = styled.div<{ show: boolean }>`
  display: ${(props) => (props.show ? "flex" : "none")};
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

export default TabbedPanel;
