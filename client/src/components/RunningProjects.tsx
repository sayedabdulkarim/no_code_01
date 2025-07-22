import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from '@emotion/styled';

const Container = styled.div`
  background: #2a2a2a;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  color: #f0f0f0;
  margin: 0 0 12px 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProjectList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ProjectItem = styled.div`
  background: #1e1e1e;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProjectInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProjectName = styled.span`
  color: #f0f0f0;
  font-weight: 500;
`;

const ProjectUrl = styled.a`
  color: #4a9eff;
  text-decoration: none;
  font-size: 14px;
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
  font-size: 14px;
  transition: background 0.2s;
  
  &:hover {
    background: #c82333;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  color: #888;
  text-align: center;
  padding: 20px;
  font-size: 14px;
`;

const StatusIndicator = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #28a745;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
`;

interface RunningProject {
  name: string;
  port: number;
  url: string;
  projectPath: string;
  startTime: string;
}

interface RunningProjectsProps {
  onProjectStopped?: () => void;
}

const RunningProjects: React.FC<RunningProjectsProps> = ({ onProjectStopped }) => {
  const [projects, setProjects] = useState<RunningProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [stoppingProject, setStoppingProject] = useState<string | null>(null);

  const fetchRunningProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/running-projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching running projects:', error);
    }
  };

  useEffect(() => {
    fetchRunningProjects();
    // Refresh every 5 seconds
    const interval = setInterval(fetchRunningProjects, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStopProject = async (projectName: string) => {
    setStoppingProject(projectName);
    try {
      await axios.post('http://localhost:5001/api/stop-project', { projectName });
      await fetchRunningProjects();
      if (onProjectStopped) {
        onProjectStopped();
      }
    } catch (error) {
      console.error('Error stopping project:', error);
      alert('Failed to stop project. Please try again.');
    } finally {
      setStoppingProject(null);
    }
  };

  return (
    <Container>
      <Title>
        <StatusIndicator />
        Running Projects ({projects.length})
      </Title>
      {projects.length === 0 ? (
        <EmptyState>No projects are currently running</EmptyState>
      ) : (
        <ProjectList>
          {projects.map((project) => (
            <ProjectItem key={project.name}>
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
            </ProjectItem>
          ))}
        </ProjectList>
      )}
    </Container>
  );
};

export default RunningProjects;