import React from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import CubeLoader from "./CubeLoader";

interface StatusMessageProps {
  content: string;
  statusType: "processing" | "success" | "error" | "info";
  icon?: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ content, statusType, icon }) => {
  const getIcon = () => {
    if (icon) return icon;
    switch (statusType) {
      case "processing":
        return "🔄";
      case "success":
        return "✓";
      case "error":
        return "✗";
      case "info":
        return "ℹ️";
      default:
        return "•";
    }
  };

  return (
    <Container statusType={statusType}>
      {statusType === "processing" && content.includes("Updating") ? (
        <CubeLoader text={content} />
      ) : (
        <>
          <IconWrapper statusType={statusType}>
            <Icon>{getIcon()}</Icon>
          </IconWrapper>
          <Content>{content}</Content>
        </>
      )}
    </Container>
  );
};

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Container = styled.div<{ statusType: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: ${(props) => {
    switch (props.statusType) {
      case "processing":
        return props.theme.colors.surface;
      case "success":
        return `${props.theme.colors.primary}10`;
      case "error":
        return "#ff444410";
      case "info":
        return props.theme.colors.surface;
      default:
        return props.theme.colors.surface;
    }
  }};
  border: 1px solid ${(props) => {
    switch (props.statusType) {
      case "processing":
        return props.theme.colors.border;
      case "success":
        return `${props.theme.colors.primary}30`;
      case "error":
        return "#ff444430";
      case "info":
        return props.theme.colors.border;
      default:
        return props.theme.colors.border;
    }
  }};
`;

const IconWrapper = styled.div<{ statusType: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  animation: ${(props) => props.statusType === "processing" ? spin : "none"} 2s linear infinite;
`;

const Icon = styled.span`
  font-size: 16px;
  line-height: 1;
`;

const Content = styled.div`
  flex: 1;
  color: ${(props) => props.theme.colors.text};
  font-size: 14px;
  line-height: 1.5;
`;

export default StatusMessage;