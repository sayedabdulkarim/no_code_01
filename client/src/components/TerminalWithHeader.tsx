import styled from "@emotion/styled";
import React from "react";
import { CommandSuggestion } from "../types/terminal";
import Terminal from "./Terminal";

interface TerminalWithHeaderProps {
  addErrorMessage: (message: string) => void;
  addMessage: (text: string, isError: boolean) => void;
  addSuggestions: (
    originalCommand: string,
    errorMessage: string,
    suggestions: CommandSuggestion[]
  ) => void;
  runCommand?: (command: string) => void;
  onSocketReady?: (socketId: string) => void;
  socketId: string | null;
  loading: boolean;
}

const TerminalWithHeader: React.FC<TerminalWithHeaderProps> = ({
  addErrorMessage,
  addMessage,
  addSuggestions,
  runCommand,
  onSocketReady,
  socketId,
  loading,
}) => {
  // Show "Connecting..." initially instead of "Disconnected"
  const getConnectionText = () => {
    if (socketId === null) {
      return "Connecting...";
    }
    return socketId ? "Connected" : "Disconnected";
  };

  const getStatusDotState = () => {
    if (socketId === null) {
      return "connecting";
    }
    return socketId ? "connected" : "disconnected";
  };

  return (
    <Container>
      <Header>
        <ConnectionStatus>
          <StatusDot status={getStatusDotState()} />
          <span>Terminal ({getConnectionText()})</span>
        </ConnectionStatus>
        {loading && (
          <StatusMessage>Project initialization in progress...</StatusMessage>
        )}
      </Header>
      <TerminalContainer>
        <Terminal
          addErrorMessage={addErrorMessage}
          addMessage={addMessage}
          addSuggestions={addSuggestions}
          runCommand={runCommand}
          onSocketReady={onSocketReady}
        />
      </TerminalContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div`
  padding: 8px 12px;
  background: ${(props) => props.theme.colors.surface};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
`;

const StatusDot = styled.span<{ status: "connecting" | "connected" | "disconnected" }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: ${(props) => {
    switch (props.status) {
      case "connected":
        return "#4CAF50";
      case "connecting":
        return "#FFA726";
      case "disconnected":
        return "#9e9e9e";
    }
  }};
  display: inline-block;
  ${(props) => props.status === "connecting" && `
    animation: pulse 1.5s ease-in-out infinite;
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `}
`;

const StatusMessage = styled.span`
  font-size: 12px;
  color: #888;
`;

const TerminalContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
`;

export default TerminalWithHeader;
