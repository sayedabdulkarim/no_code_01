import React from "react";
import styled from "@emotion/styled";

interface PRDPanelProps {
  prd: string;
  loading: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export const PRDPanel: React.FC<PRDPanelProps> = ({
  prd,
  loading,
  onApprove,
  onReject,
}) => (
  <Container>
    <Title>Generated Requirements</Title>
    <Content>{prd}</Content>
    <Actions>
      <ApproveButton onClick={onApprove} disabled={loading}>
        {loading ? "Generating..." : "Approve & Generate Code"}
      </ApproveButton>
      <RejectButton onClick={onReject}>Reject & Start Over</RejectButton>
    </Actions>
  </Container>
);

const Container = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border-radius: 8px;
  padding: ${(props) => props.theme.spacing.lg};
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
`;

const Title = styled.h2`
  color: ${(props) => props.theme.colors.text};
  margin: 0 0 ${(props) => props.theme.spacing.md};
`;

const Content = styled.pre`
  background: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  padding: ${(props) => props.theme.spacing.md};
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
`;

const Actions = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.md};
  justify-content: center;
  margin-top: ${(props) => props.theme.spacing.lg};
`;

const Button = styled.button`
  padding: ${(props) => props.theme.spacing.md};
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ApproveButton = styled(Button)`
  background: ${(props) => props.theme.colors.primary};
  color: white;
`;

const RejectButton = styled(Button)`
  background: #dc3545;
  color: white;
`;
