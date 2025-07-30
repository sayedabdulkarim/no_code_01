import React, { useState, useEffect, KeyboardEvent } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProjectCard from '../components/ProjectCard';

const PageContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme.colors.background};
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  padding-bottom: 120px; // Space for chat input
`;

const PageTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin: 0 0 32px 0;
  text-align: center;
`;

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${props => props.theme.colors.textSecondary};
  
  h2 {
    font-size: 24px;
    margin-bottom: 12px;
    color: ${props => props.theme.colors.text};
  }
  
  p {
    font-size: 16px;
    margin-bottom: 24px;
  }
`;

const ChatInputContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.surface};
  border-top: 1px solid ${props => props.theme.colors.border};
  padding: 24px;
  z-index: 10;
`;

const ChatInputWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  gap: 12px;
  align-items: flex-end;
`;

const ChatInput = styled.textarea`
  flex: 1;
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 12px 16px;
  color: ${props => props.theme.colors.text};
  font-family: inherit;
  font-size: 16px;
  resize: none;
  min-height: 56px;
  max-height: 120px;
  outline: none;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const SendButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PromptsButton = styled.button`
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 16px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.theme.colors.background};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const InputWrapper = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  gap: 12px;
`;

const DropdownMenu = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 8px;
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
`;

const DropdownItem = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: ${props => props.theme.colors.background};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const DropdownTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 4px;
`;

const DropdownText = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text};
`;

interface Project {
  name: string;
  path: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [requirement, setRequirement] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const prompts = [
    { name: "Counter App", prompt: "Create a simple counter app with increment and decrement buttons" },
    { name: "Todo List", prompt: "Build a todo app where I can add items and mark them complete" },
    { name: "Color Picker", prompt: "Make a color picker that shows the hex code of the selected color" },
    { name: "Timer/Stopwatch", prompt: "Create a simple stopwatch with start, stop, and reset buttons" },
    { name: "Temperature Converter", prompt: "Build a Celsius to Fahrenheit converter" },
    { name: "Random Quote Generator", prompt: "Make a random quote display with a button to get new quotes" },
    { name: "Simple Calculator", prompt: "Create a calculator with add, subtract, multiply, divide" },
  ];
  
  useEffect(() => {
    fetchProjects();
  }, []);
  
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
  
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/list-projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = () => {
    if (requirement.trim()) {
      // Navigate to new project page with the requirement
      navigate('/project/new', { state: { requirement: requirement.trim() } });
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };
  
  const handlePromptSelect = (prompt: string) => {
    setRequirement(prompt);
    setShowDropdown(false);
    // Adjust textarea height after setting the prompt
    setTimeout(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
      }
    }, 0);
  };
  
  return (
    <PageContainer>
      <ContentArea>
        <PageTitle>Your AI Projects</PageTitle>
        
        {loading ? (
          <EmptyState>
            <p>Loading projects...</p>
          </EmptyState>
        ) : projects.length === 0 ? (
          <EmptyState>
            <h2>No projects yet</h2>
            <p>Create your first project by describing what you want to build below</p>
          </EmptyState>
        ) : (
          <ProjectsGrid>
            {projects.map((project) => (
              <ProjectCard
                key={project.name}
                projectName={project.name}
              />
            ))}
          </ProjectsGrid>
        )}
      </ContentArea>
      
      <ChatInputContainer>
        <ChatInputWrapper className="dropdown-wrapper">
          <InputWrapper>
            <ChatInput
              placeholder="Describe the UI you want to create..."
              value={requirement}
              onChange={(e) => {
                setRequirement(e.target.value);
                adjustTextareaHeight(e);
              }}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <PromptsButton type="button" onClick={() => setShowDropdown(!showDropdown)}>
              ▼ Prompts
            </PromptsButton>
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
          
          <SendButton 
            onClick={handleSubmit}
            disabled={!requirement.trim()}
          >
            Send
          </SendButton>
        </ChatInputWrapper>
      </ChatInputContainer>
    </PageContainer>
  );
};

export default HomePage;