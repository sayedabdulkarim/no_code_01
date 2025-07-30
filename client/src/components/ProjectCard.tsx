import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

const Card = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 280px;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ThumbnailContainer = styled.div`
  width: 100%;
  height: 140px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
`;

const ThumbnailText = styled.div`
  color: white;
  font-size: 48px;
  font-weight: 700;
  opacity: 0.3;
  user-select: none;
`;

const ProjectInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ProjectTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProjectMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const TechStack = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: auto;
`;

const TechBadge = styled.span`
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

interface ProjectCardProps {
  projectName: string;
  lastModified?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ projectName, lastModified }) => {
  const navigate = useNavigate();
  
  // Memoize random gradient based on project name
  const randomGradient = useMemo(() => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ];
    
    // Use project name to generate a consistent index
    let hash = 0;
    for (let i = 0; i < projectName.length; i++) {
      hash = ((hash << 5) - hash) + projectName.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  }, [projectName]);
  
  // Memoize modified time
  const modifiedTime = useMemo(() => {
    if (lastModified) return lastModified;
    
    const times = [
      '2 hours ago',
      '5 hours ago',
      '1 day ago',
      '2 days ago',
      '1 week ago',
    ];
    
    // Use project name to generate a consistent time
    let hash = 0;
    for (let i = 0; i < projectName.length; i++) {
      hash = ((hash << 3) - hash) + projectName.charCodeAt(i);
      hash = hash & hash;
    }
    const index = Math.abs(hash) % times.length;
    return times[index];
  }, [projectName, lastModified]);
  
  const handleClick = () => {
    navigate(`/project/${projectName}`);
  };
  
  return (
    <Card onClick={handleClick}>
      <ThumbnailContainer style={{ background: randomGradient }}>
        <ThumbnailText>{projectName.substring(0, 2).toUpperCase()}</ThumbnailText>
      </ThumbnailContainer>
      
      <ProjectInfo>
        <ProjectTitle title={projectName}>{projectName}</ProjectTitle>
        
        <ProjectMeta>
          <MetaItem>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Modified {modifiedTime}
          </MetaItem>
        </ProjectMeta>
        
        <TechStack>
          <TechBadge>Next.js</TechBadge>
          <TechBadge>TypeScript</TechBadge>
          <TechBadge>Tailwind</TechBadge>
        </TechStack>
      </ProjectInfo>
    </Card>
  );
};

export default ProjectCard;