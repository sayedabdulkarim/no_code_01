import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';

interface PreviewProps {
  projectUrl?: string;
  projectName?: string;
}

const Preview: React.FC<PreviewProps> = ({ projectUrl, projectName }) => {
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectUrl) {
      setIframeError(false);
      setIsLoading(true);
      // Force reload the iframe when component mounts or projectUrl changes
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (iframe && iframe.src !== projectUrl) {
        iframe.src = projectUrl;
      }
    }
  }, [projectUrl]);
  if (!projectUrl) {
    return (
      <Container>
        <EmptyState>
          <EmptyIcon>🌐</EmptyIcon>
          <EmptyTitle>No Preview Available</EmptyTitle>
          <EmptyText>
            {projectName 
              ? `Starting your project, please wait...`
              : `Select a project from the homepage to get started`
            }
          </EmptyText>
        </EmptyState>
      </Container>
    );
  }

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIsLoading(false);
  };

  return (
    <Container>
      <PreviewHeader>
        <PreviewUrl>{projectUrl}</PreviewUrl>
        <RefreshButton onClick={() => {
          const iframe = document.querySelector('iframe') as HTMLIFrameElement;
          if (iframe) {
            iframe.src = iframe.src;
          }
        }}>
          🔄 Refresh
        </RefreshButton>
      </PreviewHeader>
      <IframeContainer>
        {isLoading && (
          <LoadingOverlay>
            <LoadingSpinner>⟳</LoadingSpinner>
            <LoadingText>Loading preview...</LoadingText>
          </LoadingOverlay>
        )}
        {iframeError ? (
          <ErrorState>
            <ErrorIcon>⚠️</ErrorIcon>
            <ErrorTitle>Preview Connection Issue</ErrorTitle>
            <ErrorText>
              The preview couldn't connect to {projectUrl}
            </ErrorText>
            <ErrorActions>
              <ActionButton 
                href={projectUrl} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Open in New Tab →
              </ActionButton>
              <SecondaryButton onClick={() => {
                setIframeError(false);
                setIsLoading(true);
              }}>
                Try Again
              </SecondaryButton>
            </ErrorActions>
          </ErrorState>
        ) : (
          <PreviewIframe
            src={projectUrl}
            title={`Preview of ${projectName}`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-modals"
            allow="accelerometer; camera; encrypted-media; fullscreen; gyroscope; magnetometer; microphone; midi; payment; usb; xr-spatial-tracking"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}
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

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background};
  z-index: 10;
`;

const LoadingSpinner = styled.div`
  font-size: 48px;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: ${props => props.theme.colors.text};
  margin-top: ${props => props.theme.spacing.md};
`;

const ErrorState = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.lg};
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ErrorTitle = styled.h3`
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`;

const ErrorText = styled.p`
  color: ${props => props.theme.colors.text};
  opacity: 0.7;
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
  text-align: center;
`;

const ErrorActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
`;

const ActionButton = styled.a`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.primary};
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 14px;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const SecondaryButton = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background: transparent;
  color: ${props => props.theme.colors.primary};
  border: 1px solid ${props => props.theme.colors.primary};
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

export default Preview;