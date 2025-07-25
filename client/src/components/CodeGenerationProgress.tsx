import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from '@emotion/styled';
import { API_URL } from '../config/api';

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
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 24px;
  background: #1e1e1e;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  margin-bottom: 8px;
`;

const ProgressFill = styled.div<{ percentage: number; status: string }>`
  height: 100%;
  background: ${props => 
    props.status === 'completed' ? '#28a745' : 
    props.status === 'partial' ? '#ffc107' : 
    '#007bff'
  };
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.1) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.1) 75%,
      transparent 75%,
      transparent
    );
    background-size: 40px 40px;
    animation: ${props => props.status === 'in_progress' ? 'move 2s linear infinite' : 'none'};
  }
  
  @keyframes move {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 40px 40px;
    }
  }
`;

const ProgressText = styled.div`
  color: #f0f0f0;
  font-size: 14px;
  text-align: center;
  margin-bottom: 4px;
`;

const CurrentTask = styled.div`
  color: #888;
  font-size: 13px;
  text-align: center;
  font-style: italic;
`;

interface ProgressData {
  totalTasks: number;
  completedTasks: number;
  currentTask: string | null;
  status: 'in_progress' | 'completed' | 'partial' | 'not_found';
}

interface CodeGenerationProgressProps {
  projectName: string | null;
}

const CodeGenerationProgress: React.FC<CodeGenerationProgressProps> = ({ projectName }) => {
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    if (!projectName) {
      setProgress(null);
      return;
    }

    const fetchProgress = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/project-progress/${projectName}`
        );
        
        if (response.data.status !== 'not_found') {
          setProgress(response.data);
        } else {
          setProgress(null);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
        setProgress(null);
      }
    };

    // Fetch immediately
    fetchProgress();

    // Then fetch every 2 seconds
    const interval = setInterval(fetchProgress, 2000);

    return () => clearInterval(interval);
  }, [projectName]);

  if (!progress || progress.status === 'not_found') {
    return null;
  }

  const percentage = progress.totalTasks > 0 
    ? (progress.completedTasks / progress.totalTasks) * 100 
    : 0;

  return (
    <Container>
      <Title>Code Generation Progress</Title>
      <ProgressBar>
        <ProgressFill percentage={percentage} status={progress.status} />
      </ProgressBar>
      <ProgressText>
        {progress.completedTasks} of {progress.totalTasks} tasks completed ({Math.round(percentage)}%)
      </ProgressText>
      {progress.currentTask && progress.status === 'in_progress' && (
        <CurrentTask>Current: {progress.currentTask}</CurrentTask>
      )}
      {progress.status === 'completed' && (
        <CurrentTask>✅ All tasks completed successfully!</CurrentTask>
      )}
      {progress.status === 'partial' && (
        <CurrentTask>⚠️ Some tasks failed - check terminal for details</CurrentTask>
      )}
    </Container>
  );
};

export default CodeGenerationProgress;