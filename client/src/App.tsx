import React from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from '@emotion/styled';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import ApiKeyModal from './components/ApiKeyModal';
import { useApiKey } from './hooks/useApiKey';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  overflow: hidden;
  height: calc(100vh - 60px); /* Subtract header height */
`;

// Component that uses the hooks (must be inside providers)
const AppContent: React.FC = () => {
  const { showModal, setApiKey } = useApiKey();

  const handleValidApiKey = (apiKey: string) => {
    setApiKey(apiKey);
  };

  return (
    <AppContainer>
      <Header />
      <MainContent>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/project/:projectId" element={<ProjectPage />} />
        </Routes>
      </MainContent>
      
      {showModal && (
        <ApiKeyModal onValidKey={handleValidApiKey} />
      )}
    </AppContainer>
  );
};

function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;