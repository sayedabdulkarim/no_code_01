import styled from "@emotion/styled";

export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  overflow: hidden;
`;

export const WorkspaceLayout = styled.div<{ isFullScreen: boolean }>`
  display: grid;
  grid-template-columns: ${(props) => (props.isFullScreen ? "1fr" : "40% 60%")};
  gap: ${(props) => props.theme.spacing.md};
  height: 100vh;
  overflow: hidden;
`;

export const ToggleButton = styled.button`
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 100;
  background-color: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
`;
