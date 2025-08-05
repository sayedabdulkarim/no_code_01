import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import SlidePanel from './SlidePanel';
import { API_ENDPOINTS } from '../config/api';

const HeaderContainer = styled.header`
  height: 60px;
  background: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Logo = styled(Link)`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.8;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const IconButton = styled.button<{ disabled?: boolean }>`
  background: none;
  border: none;
  color: ${props => props.disabled ? props.theme.colors.textSecondary : props.theme.colors.text};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme.colors.background};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const RunningProjectsSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: ${props => props.theme.colors.background};
  border-radius: 8px;
`;

const ProjectInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ProjectName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const ProjectUrl = styled.a`
  font-size: 12px;
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const StopButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.2s;
  
  &:hover {
    background: #c82333;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const StatusIndicator = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #28a745;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

interface RunningProject {
  name: string;
  port: number;
  url: string;
  projectPath: string;
  startTime: string;
}

const Header: React.FC = () => {
  const [runningProjects, setRunningProjects] = useState<RunningProject[]>([]);
  const [stoppingProject, setStoppingProject] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  const fetchRunningProjects = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.RUNNING_PROJECTS);
      setRunningProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching running projects:', error);
    }
  };

  useEffect(() => {
    fetchRunningProjects();
    const interval = setInterval(fetchRunningProjects, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStopProject = async (projectName: string) => {
    setStoppingProject(projectName);
    try {
      await axios.post(API_ENDPOINTS.STOP_PROJECT, { projectName });
      await fetchRunningProjects();
    } catch (error) {
      console.error('Error stopping project:', error);
      alert('Failed to stop project. Please try again.');
    } finally {
      setStoppingProject(null);
    }
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <Logo to="/">Synth AI</Logo>
      </LeftSection>
      
      <RightSection>
        {runningProjects.length > 0 && (
          <RunningProjectsSection>
            <StatusIndicator />
            {runningProjects.map((project) => (
              <React.Fragment key={project.name}>
                <ProjectInfo>
                  <ProjectName>{project.name}</ProjectName>
                  <ProjectUrl href={project.url} target="_blank" rel="noopener noreferrer">
                    {project.url}
                  </ProjectUrl>
                </ProjectInfo>
                <StopButton
                  onClick={() => handleStopProject(project.name)}
                  disabled={stoppingProject === project.name}
                >
                  {stoppingProject === project.name ? 'Stopping...' : 'Stop'}
                </StopButton>
              </React.Fragment>
            ))}
          </RunningProjectsSection>
        )}
        
        <IconButton onClick={toggleTheme} title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
          {isDarkMode ? (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </IconButton>
        
        <IconButton disabled title="Settings (Coming Soon)">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </IconButton>
        
        <IconButton onClick={() => setIsPanelOpen(true)} title="Upcoming Features">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </IconButton>
        
        <IconButton disabled title="User Profile (Coming Soon)">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </IconButton>
      </RightSection>
      
      <SlidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </HeaderContainer>
  );
};

export default Header;