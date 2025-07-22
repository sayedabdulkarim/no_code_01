import React, { useState, useRef, useEffect } from "react";
import styled from "@emotion/styled";
import { Message } from "../types/chat";

interface ChatThreadProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  loading?: boolean;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  messages,
  onSendMessage,
  loading,
}) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <Container>
      <MessagesWrapper>
        <MessagesContainer>
          {messages.map((message, index) => (
            <MessageBubble key={index} type={message.type}>
              {message.category && <Category>{message.category}</Category>}
              <Content>{message.content}</Content>
            </MessageBubble>
          ))}
          <div ref={messagesEndRef} />
        </MessagesContainer>
      </MessagesWrapper>
      <InputArea>
        <InputForm onSubmit={handleSubmit}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the UI you want to create..."
            disabled={loading}
          />
          <SendButton type="submit" disabled={loading || !input.trim()}>
            {loading ? "Generating..." : "Send"}
          </SendButton>
        </InputForm>
      </InputArea>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${(props) => props.theme.colors.background};
  position: relative;
`;

const MessagesWrapper = styled.div`
  flex: 1;
  overflow: hidden;
  padding: ${(props) => props.theme.spacing.md};
`;

const MessagesContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.md};
`;

const MessageBubble = styled.div<{ type: "user" | "agent" }>`
  max-width: 80%;
  padding: ${(props) => props.theme.spacing.md};
  border-radius: 8px;
  align-self: ${(props) => (props.type === "user" ? "flex-end" : "flex-start")};
  background: ${(props) =>
    props.type === "user"
      ? props.theme.colors.primary
      : props.theme.colors.surface};
  color: ${(props) =>
    props.type === "user" ? "white" : props.theme.colors.text};
`;

const Category = styled.div`
  font-size: 0.8rem;
  color: ${(props) => props.theme.colors.primary};
  margin-bottom: ${(props) => props.theme.spacing.sm};
  text-transform: capitalize;
`;

const Content = styled.div`
  white-space: pre-wrap;
`;

const InputArea = styled.div`
  position: sticky;
  bottom: 0;
  background: ${(props) => props.theme.colors.background};
  padding: ${(props) => props.theme.spacing.md};
  border-top: 1px solid ${(props) => props.theme.colors.border};
`;

const InputForm = styled.form`
  display: flex;
  gap: ${(props) => props.theme.spacing.md};
  padding: ${(props) => props.theme.spacing.md};
  background: ${(props) => props.theme.colors.surface};
  border-top: 1px solid ${(props) => props.theme.colors.border};
`;

const Input = styled.textarea`
  flex: 1;
  padding: ${(props) => props.theme.spacing.md};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 4px;
  background: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  resize: none;
  rows: 1;
  min-height: 40px;

  &:disabled {
    opacity: 0.7;
  }
`;

const SendButton = styled.button`
  padding: ${(props) => props.theme.spacing.md}
    ${(props) => props.theme.spacing.lg};
  background: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
