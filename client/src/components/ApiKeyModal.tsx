import React, { useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { getBackendUrl } from '../utils/environment';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContainer = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 500px;
  margin: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid ${props => props.theme.colors.border};
  animation: ${slideUp} 0.3s ease-out;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const Input = styled.input`
  padding: 16px;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  font-size: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const ErrorMessage = styled.div`
  padding: 12px 16px;
  background: #dc3545;
  color: white;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.4;
`;

const SubmitButton = styled.button<{ isLoading: boolean }>`
  padding: 16px;
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: ${props => props.isLoading ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: ${props => props.isLoading ? 0.7 : 1};

  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primary}dd;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const InfoSection = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: ${props => props.theme.colors.background};
  border-radius: 8px;
  border-left: 4px solid ${props => props.theme.colors.primary};
`;

const InfoTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 8px 0;
`;

const InfoText = styled.p`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
  line-height: 1.4;
`;

const InfoLink = styled.a`
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

interface ApiKeyModalProps {
  onValidKey: (apiKey: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onValidKey }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateKeyFormat = (key: string): boolean => {
    // Basic format validation for Anthropic API keys
    return key.startsWith('sk-ant-api') && key.length > 20;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!apiKey.trim()) {
      setError('Please enter your Anthropic API key');
      return;
    }

    if (!validateKeyFormat(apiKey.trim())) {
      setError('Invalid API key format. Anthropic keys should start with "sk-ant-api"');
      return;
    }

    setIsLoading(true);

    try {
      // Call backend validation endpoint
      const response = await fetch(`${getBackendUrl()}/api/validate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        // Key is valid, pass it to parent component
        onValidKey(apiKey.trim());
      } else {
        // Show specific error from backend
        setError(data.message || `API validation failed (Status: ${response.status})`);
      }
    } catch (err) {
      setError('Unable to validate API key. Please check your connection and try again.');
      console.error('API key validation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Overlay>
      <ModalContainer>
        <Header>
          <Title>API Key Required</Title>
          <Subtitle>
            Enter your Anthropic API key to use Synth AI. Your key is stored securely 
            in your browser session and never saved permanently.
          </Subtitle>
        </Header>

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="apiKey">Anthropic API Key</Label>
            <Input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              disabled={isLoading}
              autoFocus
            />
          </InputGroup>

          {error && (
            <ErrorMessage>{error}</ErrorMessage>
          )}

          <SubmitButton type="submit" disabled={isLoading} isLoading={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner />
                Validating key...
              </>
            ) : (
              'Continue'
            )}
          </SubmitButton>
        </Form>

        <InfoSection>
          <InfoTitle>💡 How to get your API key</InfoTitle>
          <InfoText>
            1. Visit <InfoLink href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">
              console.anthropic.com
            </InfoLink><br/>
            2. Sign in or create an account<br/>
            3. Go to "API Keys" section<br/>
            4. Click "Create Key" and copy the generated key
          </InfoText>
        </InfoSection>
      </ModalContainer>
    </Overlay>
  );
};

export default ApiKeyModal;