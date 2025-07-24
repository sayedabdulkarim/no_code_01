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
  const [showDropdown, setShowDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const prompts = [
    { name: "Counter App", prompt: "Create a simple counter app with increment and decrement buttons" },
    { name: "Todo List", prompt: "Build a todo app where I can add items and mark them complete" },
    { name: "Color Picker", prompt: "Make a color picker that shows the hex code of the selected color" },
    { name: "Timer/Stopwatch", prompt: "Create a simple stopwatch with start, stop, and reset buttons" },
    { name: "Temperature Converter", prompt: "Build a Celsius to Fahrenheit converter" },
    { name: "Random Quote Generator", prompt: "Make a random quote display with a button to get new quotes" },
    { name: "Simple Calculator", prompt: "Create a calculator with add, subtract, multiply, divide" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-wrapper')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
    setShowDropdown(false);
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
          <InputWrapper className="dropdown-wrapper">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the UI you want to create..."
              disabled={loading}
            />
            <DropdownButton type="button" onClick={() => setShowDropdown(!showDropdown)}>
              ▼ Prompts
            </DropdownButton>
            {showDropdown && (
              <DropdownMenu>
                {prompts.map((item, index) => (
                  <DropdownItem key={index} onClick={() => handlePromptSelect(item.prompt)}>
                    <DropdownTitle>{item.name}</DropdownTitle>
                    <DropdownText>{item.prompt}</DropdownText>
                  </DropdownItem>
                ))}
              </DropdownMenu>
            )}
          </InputWrapper>
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

const InputWrapper = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  gap: ${(props) => props.theme.spacing.sm};
`;

const DropdownButton = styled.button`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;

  &:hover {
    background: ${(props) => props.theme.colors.background};
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: ${(props) => props.theme.spacing.sm};
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
`;

const DropdownItem = styled.div`
  padding: ${(props) => props.theme.spacing.md};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: ${(props) => props.theme.colors.background};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const DropdownTitle = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme.colors.primary};
  margin-bottom: 4px;
`;

const DropdownText = styled.div`
  font-size: 0.9rem;
  color: ${(props) => props.theme.colors.text};
`;
