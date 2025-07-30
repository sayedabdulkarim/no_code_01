import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import axios from 'axios';
import { ChatThread } from '../components/ChatThread';
import TabbedPanel from '../components/TabbedPanel';
import { PRDPanel } from '../components/PRDPanel';
import { Message } from '../types/chat';
import { CommandSuggestion } from '../types/terminal';

const PageContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  background: ${props => props.theme.colors.background};
`;

const LeftPanel = styled.div`
  width: 50%;
  height: 100%;
  border-right: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const RightPanel = styled.div`
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

interface PRDResponse {
  prd: string;
}

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [prd, setPRD] = useState<string | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [projectUrl, setProjectUrl] = useState<string | undefined>(undefined);
  
  // Check if this is a new project
  const isNewProject = projectId === 'new';
  const initialRequirement = location.state?.requirement;
  
  // Terminal state handlers
  const addMessage = useCallback((text: string, isError: boolean) => {
    console.log(`Terminal message: ${text} (Error: ${isError})`);
  }, []);
  
  const addErrorMessage = useCallback((message: string) => {
    console.log(`Terminal error: ${message}`);
  }, []);
  
  const addSuggestions = useCallback((
    originalCommand: string,
    errorMessage: string,
    suggestions: CommandSuggestion[]
  ) => {
    console.log('Terminal suggestions:', { originalCommand, errorMessage, suggestions });
  }, []);
  
  const handleSocketReady = useCallback((id: string) => {
    console.log('Terminal socket ready:', id);
    setSocketId(id);
  }, []);
  
  // Initialize the page
  useEffect(() => {
    if (isNewProject && initialRequirement) {
      // Automatically generate PRD for new project
      handleSendMessage(initialRequirement);
    } else if (!isNewProject) {
      // Show welcome message for existing project
      setMessages([{
        type: 'agent',
        content: 'Welcome back! Please add your requirement and I\'m happy to help update your project.',
        category: 'success'
      }]);
    }
  }, [isNewProject, initialRequirement]);
  
  const handleSendMessage = async (message: string) => {
    setMessages(prev => [
      ...prev,
      {
        type: 'user',
        content: message,
        category: 'requirement'
      }
    ]);
    
    setLoading(true);
    
    try {
      if (isNewProject && !prd) {
        // Generate PRD for new project
        const prdResult = await axios.post<PRDResponse>(
          'http://localhost:5001/generate-prd',
          { requirement: message }
        );
        
        setMessages(prev => [
          ...prev,
          {
            type: 'agent',
            content: prdResult.data.prd,
            category: 'prd'
          }
        ]);
        
        setPRD(prdResult.data.prd);
      } else {
        // Handle updates for existing project
        // TODO: Implement update logic
        setMessages(prev => [
          ...prev,
          {
            type: 'agent',
            content: 'Update functionality will be implemented here.',
            category: 'success'
          }
        ]);
      }
    } catch (err) {
      console.error('Error:', err);
      setMessages(prev => [
        ...prev,
        {
          type: 'agent',
          content: 'Sorry, there was an error. Please try again.',
          category: 'error'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePRDApproval = async (approved: boolean) => {
    if (!approved) {
      // Reject PRD and go back to home
      navigate('/');
      return;
    }
    
    // TODO: Implement PRD approval logic
    console.log('PRD approved, initializing project...');
    setPRD(null);
  };
  
  return (
    <PageContainer>
      <LeftPanel>
        {prd ? (
          <PRDPanel
            prd={prd}
            loading={loading}
            onApprove={() => handlePRDApproval(true)}
            onReject={() => handlePRDApproval(false)}
          />
        ) : (
          <ChatThread
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={loading}
          />
        )}
      </LeftPanel>
      
      <RightPanel>
        <TabbedPanel
          addErrorMessage={addErrorMessage}
          addMessage={addMessage}
          addSuggestions={addSuggestions}
          runCommand={(cmd) => console.log('Run command:', cmd)}
          onSocketReady={handleSocketReady}
          socketId={socketId}
          loading={loading}
          projectUrl={projectUrl}
          projectName={projectId === 'new' ? undefined : projectId}
        />
      </RightPanel>
    </PageContainer>
  );
};

export default ProjectPage;