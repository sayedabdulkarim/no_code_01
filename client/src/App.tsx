import { ThemeProvider } from "@emotion/react";
import styled from "@emotion/styled";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { ChatThread } from "./components/ChatThread";
import { EditorPanel } from "./components/EditorPanel";
import { Layout, WorkspaceLayout } from "./components/Layout";
import { PRDPanel } from "./components/PRDPanel";
import RunningProjects from "./components/RunningProjects";
import TabbedPanel from "./components/TabbedPanel";
import { darkTheme } from "./theme";
import { Message } from "./types/chat";
import { CommandSuggestion } from "./types/terminal";

interface GenerateResponse {
  files: {
    "index.html": string;
    "style.css": string;
    "script.js": string;
  };
  analysis?: string;
  plan?: string;
  feedback?: string;
}

interface TerminalMessage {
  id: number;
  text: string;
  isError: boolean;
  timestamp: Date;
  suggestions?: CommandSuggestion[];
  isSuggestion?: boolean;
}

interface PRDResponse {
  prd: string;
}

interface Project {
  name: string;
  path: string;
}

function App() {
  const [requirement, setRequirement] = useState("");
  const [loading, setLoading] = useState(false);
  const [prd, setPRD] = useState<string | null>(null);
  // const [prd, setPRD] = useState<string | null>("true");
  const [response, setResponse] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeFile, setActiveFile] = useState("index.html");
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [socketId, setSocketId] = useState<string | null>(null);

  // Project management states
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [updateRequirement, setUpdateRequirement] = useState("");
  const [projectUrl, setProjectUrl] = useState<string | null>(null);

  /**
   *  1. Fix the CSS validator to preserve existing Tailwind configuration
   *  2. Complete the MCP implementation or remove it until ready
   *  3. Add import detection logic to the code generator
   *  4. Use the same context (with file access) for both generation and error fixing
   */
  const [test, setTest] = useState(false);

  // terminal start
  const [terminalMessages, setTerminalMessages] = useState<TerminalMessage[]>([
    {
      id: 1,
      text: "Welcome to the terminal. Error messages will appear here.",
      isError: false,
      timestamp: new Date(),
    },
  ]);

  // Callback function to receive socket ID from Terminal
  const handleSocketReady = useCallback((id: string) => {
    console.log("Terminal socket is ready with ID:", id);
    setSocketId(id);
  }, []);

  const addMessage = useCallback((text: string, isError: boolean) => {
    setTerminalMessages((prevMessages) => [
      ...prevMessages,
      {
        id: Date.now(),
        text,
        isError,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Memoize addErrorMessage for Terminal component
  const addErrorMessage = useCallback(
    (message: string) => {
      addMessage(message, true);
    },
    [addMessage]
  );

  // Add command suggestions to the chat panel
  const addSuggestions = useCallback(
    (
      originalCommand: string,
      errorMessage: string,
      suggestions: CommandSuggestion[]
    ) => {
      setTerminalMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now(),
          text: `Suggestions for: ${originalCommand}`,
          isError: false,
          isSuggestion: true,
          suggestions,
          timestamp: new Date(),
        },
      ]);
    },
    []
  );

  // Run a command in the terminal
  const runCommand = useCallback(
    (command: string) => {
      if (!command || typeof command !== "string") {
        console.warn("Invalid command passed to runCommand:", command);
        return;
      }

      // The terminal component will expose this function globally
      if ((window as any).runTerminalCommand) {
        try {
          (window as any).runTerminalCommand(command);
          // Also add the command as a message to show what was executed
          addMessage(`Executed: ${command}`, false);
        } catch (e) {
          console.error("Error running command:", e);
          // Add an error message if the command execution fails
          addMessage(`Failed to execute: ${command}. Please try again.`, true);
        }
      } else {
        console.warn("runTerminalCommand function not available");
        addMessage(`Unable to run command: Terminal not ready`, true);
      }
    },
    [addMessage]
  );

  // terminal end

  const handleSendMessage = async (message: string) => {
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        content: message,
        category: "requirement",
      },
    ]);

    setLoading(true);
    try {
      // Generate PRD first
      const prdResult = await axios.post<PRDResponse>(
        "http://localhost:5001/generate-prd",
        { requirement: message }
      );

      setMessages((prev) => [
        ...prev,
        {
          type: "agent",
          content: prdResult.data.prd,
          category: "prd",
        },
      ]);

      // Set PRD and wait for approval
      setPRD(prdResult.data.prd);
      setRequirement(message);
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          type: "agent",
          content: "Sorry, there was an error. Please try again.",
          category: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePRDApproval = async (approved: boolean) => {
    if (!approved || !prd || !requirement) {
      setPRD(null);
      return;
    }

    setLoading(true);
    try {
      const result = await axios.post<GenerateResponse>(
        "http://localhost:5001/approve-prd",
        { requirement, prd, approved }
      );

      if (result.data.analysis) {
        setMessages((prev) => [
          ...prev,
          {
            type: "agent",
            content: result.data.analysis!,
            category: "analysis",
          },
        ]);
      }
      if (result.data.plan) {
        setMessages((prev) => [
          ...prev,
          {
            type: "agent",
            content: result.data.plan!,
            category: "plan",
          },
        ]);
      }

      setResponse(result.data);
      setPRD(null);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to generate UI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initialize Next.js project with PRD
  const handleInitializeProject = async () => {
    if (!prd) {
      setError("No PRD available to initialize the project.");
      return;
    }

    if (!socketId) {
      addMessage("Waiting for terminal connection to be established...", false);
      // Wait briefly for socket connection
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!socketId) {
        setError("Terminal connection not established. Please try again.");
        return;
      }
    }

    setLoading(true);
    addMessage("Starting project initialization...", false);

    try {
      // Clear any previous error
      setError(null);

      // Send socketId to receive real-time updates in the terminal
      addMessage(`Initializing project with socket ID: ${socketId}`, false);

      const result = await axios.post(
        "http://localhost:5001/api/initialize-project",
        { prd, socketId }
      );

      const projectName = result.data.projectName;
      addMessage(`Project "${projectName}" created successfully!`, false);

      // Check if project URL is available (dev server started)
      if (result.data.url) {
        addMessage(
          `🚀 Development server running at: ${result.data.url}`,
          false
        );
        addMessage(
          `You can open your project in the browser at the above URL.`,
          false
        );

        // Open the project in a new tab (optional - you can comment this out if you don't want auto-open)
        // window.open(result.data.url, '_blank');
      }

      // Update the project with the PRD content using task-based approach
      addMessage("Enhancing project with AI-generated content...", false);
      addMessage(
        "Using task-based code generation for better results...",
        false
      );

      let updateResult;
      try {
        // Try the new v2 endpoint first
        updateResult = await axios.post(
          "http://localhost:5001/api/update-project-v2",
          {
            projectName,
            requirements: prd,
            socketId, // Pass socketId for real-time progress updates
          }
        );

        if (updateResult.data && updateResult.data.message) {
          addMessage(`✅ ${updateResult.data.message}`, false);

          // Show task summary if available
          if (updateResult.data.summary) {
            const summary = updateResult.data.summary;
            addMessage(
              `📊 Summary: ${summary.successful}/${summary.total} tasks completed successfully`,
              false
            );
            if (summary.failed > 0) {
              addMessage(
                `⚠️ ${summary.failed} tasks failed - check terminal for details`,
                false
              );
            }
            addMessage(`📁 Generated ${summary.generatedFiles} files`, false);
          }
        } else if (updateResult.data && updateResult.data.error) {
          setError(updateResult.data.error);
          addErrorMessage(updateResult.data.error);
        } else {
          addMessage("Project updated, but no message returned.", false);
        }
      } catch (updateError: any) {
        console.error("Error with v2 update, falling back to v1:", updateError);
        addMessage(
          "⚠️ Task-based generation failed, trying standard generation...",
          false
        );

        // Fallback to original update-project endpoint
        try {
          updateResult = await axios.post(
            "http://localhost:5001/api/update-project",
            {
              projectName,
              requirements: prd,
            }
          );

          if (updateResult.data && updateResult.data.message) {
            addMessage(
              `✅ ${updateResult.data.message} (using fallback method)`,
              false
            );
          }
        } catch (fallbackError: any) {
          console.error("Fallback also failed:", fallbackError);
          addErrorMessage(
            `Failed to generate code: ${
              fallbackError.response?.data?.error ||
              fallbackError.response?.data?.details ||
              fallbackError.message
            }`
          );

          // Don't throw the error - project was still created successfully
          addMessage(
            "⚠️ Project created but code generation failed. You can retry later.",
            false
          );
        }
      }

      // Add the project path to the terminal messages
      addMessage(`📁 Project Path: ${result.data.projectPath}`, false);

      // Remind about the dev server URL if available
      if (result.data.url) {
        addMessage(`🔗 Access your project at: ${result.data.url}`, false);
      }

      // Set selected project to the newly created one
      setSelectedProject(projectName);

      // Refresh project list
      fetchProjects();

      addMessage(
        "Project initialization complete! You can now start working on your project.",
        false
      );
    } catch (err: any) {
      console.error("Error initializing project:", err);
      setError("Failed to initialize the project. Please try again.");
      addErrorMessage(
        `Failed to initialize the project: ${
          err.response?.data?.details || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (filename: string, content: string) => {
    setFiles((prev) => ({
      ...prev,
      [filename]: content,
    }));
  };

  // Initialize files when response changes
  useEffect(() => {
    if (response?.files) {
      setFiles(response.files);
    }
  }, [response]);

  // Extract fetchProjects as a reusable function
  const fetchProjects = async () => {
    try {
      const result = await axios.get("http://localhost:5001/api/list-projects");
      console.log("Fetched projects:", result.data);
      setProjects(result.data.projects || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to fetch projects");
    }
  };

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, [test, prd]);

  // Handle project update
  const handleUpdateProject = async () => {
    if (!selectedProject || !updateRequirement.trim()) {
      setError("Please select a project and enter update requirements");
      return;
    }

    setLoading(true);
    try {
      const result = await axios.post(
        "http://localhost:5001/api/update-project",
        {
          projectName: selectedProject,
          requirements: updateRequirement,
        }
      );

      if (result.data && result.data.message) {
        addMessage(`Project updated: ${result.data.message}`, false);

        // Add success message
        setMessages((prev) => [
          ...prev,
          {
            type: "agent",
            content: `Project ${selectedProject} updated successfully! ${
              result.data.explanation || ""
            }`,
            category: "success",
          },
        ]);

        // Reset update requirement
        setUpdateRequirement("");
      } else if (result.data && result.data.error) {
        setError(result.data.error);
        addErrorMessage(result.data.error);
      }
    } catch (err: any) {
      console.error("Error updating project:", err);
      setError("Failed to update project");
      addErrorMessage(
        "Failed to update project: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle clear history
  const handleClearHistory = async (projectName: string) => {
    try {
      const result = await axios.delete(
        `http://localhost:5001/api/clear-project-history/${projectName}`
      );

      if (result.data && result.data.message) {
        addMessage(`${result.data.message}`, false);

        // Add success message
        setMessages((prev) => [
          ...prev,
          {
            type: "agent",
            content: `Project history cleared for ${projectName}. Future updates will start from a clean slate.`,
            category: "success",
          },
        ]);
      }
    } catch (err: any) {
      console.error("Error clearing project history:", err);
      setError("Failed to clear project history");
      addErrorMessage(
        "Failed to clear project history: " +
          (err.response?.data?.error || err.message)
      );
    }
  };

  // Handle running a project
  const handleRunProject = async (projectName: string) => {
    try {
      setLoading(true);

      // Wait for socket connection if not available
      if (!socketId) {
        addMessage("Waiting for terminal connection...", false);
        // Wait up to 3 seconds for socket connection
        let attempts = 0;
        while (!socketId && attempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }
        if (!socketId) {
          addMessage(
            "⚠️ Terminal connection not established, proceeding anyway...",
            false
          );
        }
      }

      addMessage(`Starting ${projectName}...`, false);

      // First, stop all running projects
      try {
        const runningProjects = await axios.get(
          "http://localhost:5001/api/running-projects"
        );
        const projects = runningProjects.data.projects || [];

        // Stop all running projects
        for (const project of projects) {
          addMessage(`Stopping ${project.name}...`, false);
          await axios.post("http://localhost:5001/api/stop-project", {
            projectName: project.name,
          });
        }
      } catch (stopError) {
        console.error("Error stopping projects:", stopError);
      }

      // Run the selected project
      const result = await axios.post("http://localhost:5001/api/run-project", {
        projectName,
        socketId,
      });

      if (result.data.url) {
        setProjectUrl(result.data.url);
        addMessage(`✅ Project is running at: ${result.data.url}`, false);
      } else {
        addMessage(`⚠️ Project started but no URL returned`, false);
      }
    } catch (err: any) {
      console.error("Error running project:", err);
      addErrorMessage(
        `Failed to run project: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      {/* <button onClick={() => console.log({ projects }, " ppp")}>Hello</button>
      <button onClick={() => setTest(!test)}>Test</button> */}
      <ProjectManagementPanel>
        <h2>Your Projects</h2>
        <ProjectPillContainer>
          {projects.map((project) => (
            <ProjectPill
              key={project.name}
              isSelected={selectedProject === project.name}
              onClick={() => {
                setSelectedProject(project.name);
                // Wait a bit for terminal to connect before running project
                setTimeout(() => {
                  handleRunProject(project.name);
                }, 500);
              }}
            >
              {project.name}
            </ProjectPill>
          ))}
        </ProjectPillContainer>

        {selectedProject && (
          <ProjectUpdateForm>
            <h3>Update Project: {selectedProject}</h3>
            <textarea
              placeholder="Enter new requirements or updates for your project"
              value={updateRequirement}
              onChange={(e) => setUpdateRequirement(e.target.value)}
              rows={5}
            />
            <ButtonContainer>
              <UpdateButton
                onClick={() => handleRunProject(selectedProject)}
                disabled={loading}
                style={{ backgroundColor: "#28a745" }}
              >
                {loading ? "Starting..." : "Run Project"}
              </UpdateButton>
              <UpdateButton
                onClick={handleUpdateProject}
                disabled={loading || !updateRequirement.trim()}
              >
                {loading ? "Updating..." : "Update Project"}
              </UpdateButton>
              <ClearHistoryButton
                onClick={() => handleClearHistory(selectedProject)}
                disabled={loading}
              >
                Clear History
              </ClearHistoryButton>
              <UpdateButton
                onClick={async () => {
                  try {
                    const response = await axios.post(
                      "http://localhost:5001/api/fix-page-integration",
                      { projectName: selectedProject }
                    );
                    addMessage(`✅ ${response.data.message}`, false);
                  } catch (error: any) {
                    addErrorMessage(
                      `Failed to fix page: ${
                        error.response?.data?.error || error.message
                      }`
                    );
                  }
                }}
                disabled={loading}
                style={{ backgroundColor: "#28a745" }}
              >
                Fix Page Display
              </UpdateButton>
            </ButtonContainer>
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </ProjectUpdateForm>
        )}
      </ProjectManagementPanel>
      <RunningProjects onProjectStopped={fetchProjects} />
      <Layout>
        {/* <Terminal
          addErrorMessage={addErrorMessage}
          addMessage={addMessage}
          addSuggestions={addSuggestions}
          runCommand={runCommand}
        /> */}
        {/* Project management UI */}
        {prd ? (
          <DualPanelLayout>
            <Panel>
              <PRDPanel
                prd={prd}
                loading={loading}
                // onApprove={() => handlePRDApproval(true)}
                onApprove={() => handleInitializeProject()}
                onReject={() => handlePRDApproval(false)}
              />
            </Panel>
            <TerminalPanel>
              <TabbedPanel
                addErrorMessage={addErrorMessage}
                addMessage={addMessage}
                addSuggestions={addSuggestions}
                runCommand={runCommand}
                onSocketReady={handleSocketReady}
                socketId={socketId}
                loading={loading}
                projectUrl={projectUrl || undefined}
                projectName={selectedProject || undefined}
              />
            </TerminalPanel>
          </DualPanelLayout>
        ) : selectedProject ? (
          <DualPanelLayout>
            <Panel>
              <ChatThread
                messages={messages}
                onSendMessage={handleSendMessage}
                loading={loading}
              />
            </Panel>
            <TerminalPanel>
              <TabbedPanel
                addErrorMessage={addErrorMessage}
                addMessage={addMessage}
                addSuggestions={addSuggestions}
                runCommand={runCommand}
                onSocketReady={handleSocketReady}
                socketId={socketId}
                loading={loading}
                projectUrl={projectUrl || undefined}
                projectName={selectedProject || undefined}
              />
            </TerminalPanel>
          </DualPanelLayout>
        ) : !response ? (
          <InitialLayout>
            {/* Original chat thread */}
            <ChatThread
              messages={messages}
              onSendMessage={handleSendMessage}
              loading={loading}
            />
          </InitialLayout>
        ) : (
          <WorkspaceLayout isFullScreen={isFullScreen}>
            {!isFullScreen && (
              <ChatThread
                messages={messages}
                onSendMessage={handleSendMessage}
                loading={loading}
              />
            )}

            <EditorPanel
              files={files}
              activeFile={activeFile}
              onFileChange={setActiveFile}
              onCodeChange={handleCodeChange}
              isFullScreen={isFullScreen}
              onToggleFullscreen={() => setIsFullScreen(!isFullScreen)}
            />
          </WorkspaceLayout>
        )}
      </Layout>
    </ThemeProvider>
  );
}

const InitialLayout = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  padding: ${(props) => props.theme.spacing.md};
`;

const DualPanelLayout = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100vh;
  position: relative;
`;

const Panel = styled.div`
  flex: 1;
  overflow: auto;
  padding: ${(props) => props.theme.spacing.sm};
  display: flex;
  flex-direction: column;
`;

const TerminalPanel = styled(Panel)`
  background-color: ${(props) => props.theme.colors.background};
  border-left: 1px solid ${(props) => props.theme.colors.border};
  position: relative;
`;

// Removed unused styled components

// Project management UI components
const ProjectManagementPanel = styled.div`
  width: 100%;
  margin-bottom: 20px;
  padding: 20px;
  background: ${(props) => props.theme.colors.surface};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  h2,
  h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: ${(props) => props.theme.colors.primary};
  }
`;

const ProjectPillContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
`;

const ProjectPill = styled.div<{ isSelected: boolean }>`
  padding: 8px 16px;
  border-radius: 20px;
  background: ${(props) =>
    props.isSelected
      ? props.theme.colors.primary
      : props.theme.colors.background};
  color: ${(props) => (props.isSelected ? "#fff" : props.theme.colors.text)};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;

  &:hover {
    transform: translateY(-2px);
    background: ${(props) =>
      props.isSelected
        ? props.theme.colors.primary
        : props.theme.colors.surface};
  }
`;

const ProjectUpdateForm = styled.div`
  width: 100%;
  padding-top: 15px;
  border-top: 1px solid ${(props) => props.theme.colors.border};

  textarea {
    margin-bottom: 15px;
    border: 1px solid ${(props) => props.theme.colors.border};
    border-radius: 4px;
    background: ${(props) => props.theme.colors.background};
    padding: 12px;
    width: 100%;
    resize: vertical;
    color: ${(props) => props.theme.colors.text};
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: ${(props) => props.theme.colors.primary};
    }
  }
`;

const UpdateButton = styled.button`
  padding: 10px 20px;
  background: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${(props) => `${props.theme.colors.primary}dd`};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  margin-top: 10px;
  font-size: 14px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
`;

const ClearHistoryButton = styled.button`
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #5a6268;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ProjectInfoPanel = styled.div`
  padding: ${(props) => props.theme.spacing.lg};
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  h2 {
    margin-bottom: ${(props) => props.theme.spacing.lg};
    color: ${(props) => props.theme.colors.primary};
  }
`;

const ProjectActions = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.md};
`;

const ActionButton = styled.button`
  padding: 12px 24px;
  background: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default App;
