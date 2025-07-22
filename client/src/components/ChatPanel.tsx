import React from "react";
import styled from "@emotion/styled";

interface ChatPanelProps {
  analysis?: string | null;
  plan?: string | null;
  feedback?: string | null;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  analysis,
  plan,
  feedback,
}) => (
  <Container>
    {analysis && (
      <Message>
        <Title>Analysis</Title>
        <Content>{analysis}</Content>
      </Message>
    )}
    {plan && (
      <Message>
        <Title>Implementation Plan</Title>
        <Content>{plan}</Content>
      </Message>
    )}
    {feedback && (
      <Message>
        <Title>Feedback</Title>
        <Content>{feedback}</Content>
      </Message>
    )}
  </Container>
);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.md};
  padding: ${(props) => props.theme.spacing.md};
  background: ${(props) => props.theme.colors.surface};
  border-radius: 4px;
  height: 100%;
  overflow-y: auto;
`;

const Message = styled.div`
  background: ${(props) => props.theme.colors.background};
  border-radius: 4px;
  padding: ${(props) => props.theme.spacing.md};
`;

const Title = styled.h3`
  color: ${(props) => props.theme.colors.primary};
  margin: 0 0 ${(props) => props.theme.spacing.sm};
  font-size: 1rem;
`;

const Content = styled.div`
  color: ${(props) => props.theme.colors.text};
  white-space: pre-wrap;
  font-size: 0.9rem;
  line-height: 1.5;
`;
