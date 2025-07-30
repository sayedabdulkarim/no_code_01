import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [requirement, setRequirement] = useState<string>('');
  const socketIdRef = useRef<string | null>(null);
  
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
    socketIdRef.current = id;
  }, []);
  
  // Initialize the page
  useEffect(() => {
    if (isNewProject && initialRequirement) {
      // Store the requirement
      setRequirement(initialRequirement);
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
    
    if (!prd) {
      setMessages(prev => [
        ...prev,
        {
          type: 'agent',
          content: 'Error: Missing PRD. Please try again.',
          category: 'error'
        }
      ]);
      return;
    }
    
    // If socket isn't ready yet, wait for it
    if (!socketId) {
      setMessages(prev => [
        ...prev,
        {
          type: 'agent',
          content: 'Waiting for terminal connection...',
          category: 'analysis'
        }
      ]);
      
      // Wait for socket to be ready
      const checkSocket = setInterval(() => {
        if (socketIdRef.current) {
          clearInterval(checkSocket);
          handlePRDApproval(true); // Retry with socket ready
        }
      }, 500);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkSocket);
        if (!socketIdRef.current) {
          setMessages(prev => [
            ...prev,
            {
              type: 'agent',
              content: 'Error: Could not establish terminal connection. Please refresh and try again.',
              category: 'error'
            }
          ]);
          setLoading(false);
        }
      }, 10000);
      
      return;
    }
    
    setLoading(true);
    
    try {
      // Initialize the project with the approved PRD
      const result = await axios.post(
        'http://localhost:5001/api/initialize-project',
        { prd, socketId }
      );
      
      const projectName = result.data.projectName;
      
      // Update messages to show project creation success
      setMessages(prev => [
        ...prev,
        {
          type: 'agent',
          content: `Project "${projectName}" created successfully!`,
          category: 'success'
        }
      ]);
      
      // Check if project URL is available (dev server started)
      if (result.data.url) {
        setProjectUrl(result.data.url);
        setMessages(prev => [
          ...prev,
          {
            type: 'agent',
            content: `🚀 Development server running at: ${result.data.url}`,
            category: 'success'
          }
        ]);
      }
      
      // Hide PRD panel and show chat
      setPRD(null);
      
      // Now generate the code for the project
      setMessages(prev => [
        ...prev,
        {
          type: 'agent',
          content: 'Starting code generation based on the PRD...',
          category: 'analysis'
        }
      ]);
      
      // Call generate-v2 endpoint to generate the code
      const generateResult = await axios.post(
        'http://localhost:5001/api/generate-v2',
        { 
          requirement: requirement || initialRequirement || messages.find(m => m.type === 'user')?.content,
          socketId 
        }
      );
      
      if (generateResult.data.success) {
        setMessages(prev => [
          ...prev,
          {
            type: 'agent',
            content: '✅ Project generated successfully! Your app is ready.',
            category: 'success'
          }
        ]);
        
        // Update project URL if provided
        if (generateResult.data.url) {
          setProjectUrl(generateResult.data.url);
        }
      }
      
      // Navigate to the new project page
      navigate(`/project/${projectName}`, { replace: true });
      
    } catch (error) {
      console.error('Error initializing project:', error);
      setMessages(prev => [
        ...prev,
        {
          type: 'agent',
          content: 'Failed to initialize project. Please check the terminal for details.',
          category: 'error'
        }
      ]);
    } finally {
      setLoading(false);
    }
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