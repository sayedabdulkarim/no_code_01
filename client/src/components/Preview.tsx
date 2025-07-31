import React from 'react';
import styled from '@emotion/styled';

interface PreviewProps {
  projectUrl?: string;
  projectName?: string;
}

const Preview: React.FC<PreviewProps> = ({ projectUrl, projectName }) => {
  if (!projectUrl) {
    return (
      <Container>
        <EmptyState>
          <EmptyIcon>🌐</EmptyIcon>
          <EmptyTitle>No Preview Available</EmptyTitle>
          <EmptyText>
            {projectName 
              ? `Select a project and click "Run Project" to see the preview`
              : `Select a project from "Your Projects" to get started`
            }
          </EmptyText>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <PreviewHeader>
        <PreviewUrl>{projectUrl}</PreviewUrl>
        <RefreshButton onClick={() => window.location.reload()}>
          🔄 Refresh
        </RefreshButton>
      </PreviewHeader>
      <IframeContainer>
        <PreviewIframe
          src={projectUrl}
          title={`Preview of ${projectName}`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </IframeContainer>
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme.colors.background};
  position: relative;
  overflow: hidden;
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

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const PreviewUrl = styled.div`
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  font-family: monospace;
`;

const RefreshButton = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const IframeContainer = styled.div`
  flex: 1;
  position: relative;
  background: white;
  width: 100%;
  min-height: 0;
`;

const PreviewIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

export default Preview;