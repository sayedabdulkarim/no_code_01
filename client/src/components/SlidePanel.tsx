import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100%);
  }
`;

const Backdrop = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: ${props => props.isOpen ? 'block' : 'none'};
  cursor: pointer;
`;

const PanelContainer = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 400px;
  background: ${props => props.theme.colors.surface};
  border-left: 1px solid ${props => props.theme.colors.border};
  z-index: 1000;
  transform: translateX(${props => props.isOpen ? '0' : '100%'});
  animation: ${props => props.isOpen ? slideIn : slideOut} 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const PanelHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const FeatureSection = styled.div`
  margin-bottom: 32px;
`;

const FeatureTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FeatureDescription = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.6;
  margin-bottom: 16px;
`;

const ComingSoonBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  background: ${props => props.theme.colors.primary}20;
  color: ${props => props.theme.colors.primary};
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
  padding: 12px;
  margin-bottom: 8px;
  background: ${props => props.theme.colors.background};
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: transform 0.2s;

  &:hover {
    transform: translateX(4px);
  }
`;

const FeatureIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${props => props.theme.colors.primary}15;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.primary};
`;

const FeatureInfo = styled.div`
  flex: 1;
`;

const FeatureName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  margin-bottom: 2px;
`;

const FeatureStatus = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
`;

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SlidePanel: React.FC<SlidePanelProps> = ({ isOpen, onClose }) => {
  return (
    <>
      <Backdrop isOpen={isOpen} onClick={onClose} />
      <PanelContainer isOpen={isOpen}>
        <PanelHeader>
          <PanelTitle>Upcoming Features</PanelTitle>
          <CloseButton onClick={onClose}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </CloseButton>
        </PanelHeader>
        
        <PanelContent>
          <FeatureSection>
            <FeatureTitle>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security & Data
            </FeatureTitle>
            <FeatureDescription>
              Secure authentication and persistent data storage
            </FeatureDescription>
            <FeatureList>
              <FeatureItem>
                <FeatureIcon>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </FeatureIcon>
                <FeatureInfo>
                  <FeatureName>User Authentication</FeatureName>
                  <FeatureStatus>OAuth & JWT support</FeatureStatus>
                </FeatureInfo>
                <ComingSoonBadge>Soon</ComingSoonBadge>
              </FeatureItem>
              
              <FeatureItem>
                <FeatureIcon>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </FeatureIcon>
                <FeatureInfo>
                  <FeatureName>Database Integration</FeatureName>
                  <FeatureStatus>PostgreSQL/MongoDB support</FeatureStatus>
                </FeatureInfo>
                <ComingSoonBadge>Planning</ComingSoonBadge>
              </FeatureItem>
              
              <FeatureItem>
                <FeatureIcon>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </FeatureIcon>
                <FeatureInfo>
                  <FeatureName>Chat History</FeatureName>
                  <FeatureStatus>Save & restore conversations</FeatureStatus>
                </FeatureInfo>
                <ComingSoonBadge>Soon</ComingSoonBadge>
              </FeatureItem>
            </FeatureList>
          </FeatureSection>

          <FeatureSection>
            <FeatureTitle>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Project Management
            </FeatureTitle>
            <FeatureDescription>
              Advanced project organization and management tools
            </FeatureDescription>
            <FeatureList>
              <FeatureItem>
                <FeatureIcon>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </FeatureIcon>
                <FeatureInfo>
                  <FeatureName>Project Templates</FeatureName>
                  <FeatureStatus>Pre-built starter templates</FeatureStatus>
                </FeatureInfo>
                <ComingSoonBadge>Soon</ComingSoonBadge>
              </FeatureItem>
              
              <FeatureItem>
                <FeatureIcon>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </FeatureIcon>
                <FeatureInfo>
                  <FeatureName>Version Control</FeatureName>
                  <FeatureStatus>Track project changes</FeatureStatus>
                </FeatureInfo>
                <ComingSoonBadge>Planning</ComingSoonBadge>
              </FeatureItem>
              
              <FeatureItem>
                <FeatureIcon>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </FeatureIcon>
                <FeatureInfo>
                  <FeatureName>Export & Backup</FeatureName>
                  <FeatureStatus>Download project files</FeatureStatus>
                </FeatureInfo>
                <ComingSoonBadge>Beta</ComingSoonBadge>
              </FeatureItem>
            </FeatureList>
          </FeatureSection>

          <FeatureSection>
            <FeatureTitle>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              Integrations
            </FeatureTitle>
            <FeatureDescription>
              Connect with your favorite tools and services
            </FeatureDescription>
            <FeatureList>
              <FeatureItem>
                <FeatureIcon>
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </FeatureIcon>
                <FeatureInfo>
                  <FeatureName>GitHub Integration</FeatureName>
                  <FeatureStatus>Testing phase</FeatureStatus>
                </FeatureInfo>
                <ComingSoonBadge>Testing</ComingSoonBadge>
              </FeatureItem>
              
              <FeatureItem>
                <FeatureIcon>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </FeatureIcon>
                <FeatureInfo>
                  <FeatureName>Cloud Deployment</FeatureName>
                  <FeatureStatus>Coming soon</FeatureStatus>
                </FeatureInfo>
                <ComingSoonBadge>Soon</ComingSoonBadge>
              </FeatureItem>
            </FeatureList>
          </FeatureSection>
        </PanelContent>
      </PanelContainer>
    </>
  );
};

export default SlidePanel;