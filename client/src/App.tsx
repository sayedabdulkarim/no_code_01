import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import { darkTheme } from './theme';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/project/:projectId" element={<ProjectPage />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;