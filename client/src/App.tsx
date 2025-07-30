import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import styled from '@emotion/styled';
import { darkTheme } from './theme';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
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
`;

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <AppContainer>
        <Header />
        <MainContent>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/project/:projectId" element={<ProjectPage />} />
          </Routes>
        </MainContent>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;