import React, { useState } from 'react';
import styled from '@emotion/styled';
import TerminalWithHeader from './TerminalWithHeader';
import Preview from './Preview';
import { CommandSuggestion } from '../types/terminal';

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
}

const TabbedPanel: React.FC<TabbedPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'preview'>('terminal');

  return (
    <Container>
      <TabHeader>
        <Tab 
          active={activeTab === 'terminal'} 
          onClick={() => setActiveTab('terminal')}
        >
          <TabIcon>💻</TabIcon>
          Terminal
        </Tab>
        <Tab 
          active={activeTab === 'preview'} 
          onClick={() => setActiveTab('preview')}
        >
          <TabIcon>🌐</TabIcon>
          Preview
        </Tab>
      </TabHeader>
      
      <TabContent>
        {activeTab === 'terminal' ? (
          <TerminalWithHeader
            addErrorMessage={props.addErrorMessage}
            addMessage={props.addMessage}
            addSuggestions={props.addSuggestions}
            runCommand={props.runCommand}
            onSocketReady={props.onSocketReady}
            socketId={props.socketId}
            loading={props.loading}
          />
        ) : (
          <Preview 
            projectUrl={props.projectUrl}
            projectName={props.projectName}
          />
        )}
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
  background: ${props => props.theme.colors.surface};
  border-bottom: 2px solid ${props => props.theme.colors.border};
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.active ? props.theme.colors.background : 'transparent'};
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.text};
  border: none;
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : 'normal'};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};

  &:hover {
    background: ${props => props.theme.colors.background};
  }
`;

const TabIcon = styled.span`
  font-size: 16px;
`;

const TabContent = styled.div`
  flex: 1;
  overflow: hidden;
`;

export default TabbedPanel;