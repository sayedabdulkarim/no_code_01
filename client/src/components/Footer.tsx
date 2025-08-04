import React from 'react';
import styled from '@emotion/styled';

const FooterContainer = styled.footer`
  background: ${props => props.theme.colors.surface};
  border-top: 1px solid ${props => props.theme.colors.border};
  padding: 16px 24px;
  height: 60px;
  display: flex;
  align-items: center;
`;

const FooterContent = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 12px;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const BrandName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
`;

const Tagline = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
`;

const CenterSection = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;

  @media (max-width: 768px) {
    gap: 16px;
  }
`;

const FooterLink = styled.a`
  color: ${props => props.theme.colors.textSecondary};
  text-decoration: none;
  font-size: 13px;
  transition: color 0.2s;

  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CreatedBy = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
  
  span {
    color: ${props => props.theme.colors.text};
    font-weight: 500;
  }
`;

const Separator = styled.span`
  color: ${props => props.theme.colors.border};
  
  @media (max-width: 480px) {
    display: none;
  }
`;

const Copyright = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
  
  @media (max-width: 480px) {
    display: none;
  }
`;

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer>
      <FooterContent>
        <LeftSection>
          <BrandName>Synth AI</BrandName>
          <Separator>•</Separator>
          <Tagline>Build Next.js apps with natural language</Tagline>
        </LeftSection>

        <CenterSection>
          <FooterLink href="https://github.com" target="_blank" rel="noopener noreferrer">
            GitHub
          </FooterLink>
          <FooterLink href="#" onClick={(e) => { e.preventDefault(); alert('Documentation coming soon!'); }}>
            Documentation
          </FooterLink>
          <FooterLink href="#" onClick={(e) => { e.preventDefault(); alert('Support coming soon!'); }}>
            Support
          </FooterLink>
        </CenterSection>

        <RightSection>
          <CreatedBy>
            Created by <span>Sayed Abdul Karim</span>
          </CreatedBy>
          <Separator>•</Separator>
          <Copyright>
            © {currentYear} Synth AI
          </Copyright>
        </RightSection>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;