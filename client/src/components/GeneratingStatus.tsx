import React from 'react';
import styled from '@emotion/styled';

const StatusContainer = styled.div`
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 12px;
  padding: 16px 20px;
  margin: 16px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const StatusContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SpinnerIcon = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #666;
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const StatusText = styled.span`
  color: #e0e0e0;
  font-size: 15px;
  font-weight: 500;
`;

const StopButton = styled.button`
  background: transparent;
  border: 1px solid #666;
  color: #999;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background: #3a3a3a;
    border-color: #888;
    color: #fff;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

interface GeneratingStatusProps {
  message?: string;
  onStop?: () => void;
}

const GeneratingStatus: React.FC<GeneratingStatusProps> = ({ 
  message = "Generating...", 
  onStop 
}) => {
  return (
    <StatusContainer>
      <StatusContent>
        <SpinnerIcon />
        <StatusText>{message}</StatusText>
      </StatusContent>
      {onStop && (
        <StopButton onClick={onStop}>
          Stop
        </StopButton>
      )}
    </StatusContainer>
  );
};

export default GeneratingStatus;