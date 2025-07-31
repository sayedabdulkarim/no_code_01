import styled from "@emotion/styled";
import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChatThread } from "../components/ChatThread";
import { PRDPanel } from "../components/PRDPanel";
import TabbedPanel from "../components/TabbedPanel";
import { Message } from "../types/chat";
import { CommandSuggestion } from "../types/terminal";

const PageContainer = styled.div`
  width: 100%;
  height: 94vh;
  display: flex;
  background: ${(props) => props.theme.colors.background};
  position: relative;
`;

const LeftPanel = styled.div`
  width: 50%;
  height: 100%;
  border-right: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

const RightPanel = styled.div`
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

interface PRDResponse {
  prd: string;
}

interface StartProjectResponse {
  message?: string;
  port?: number;
  url?: string;
  projectName?: string;
}

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoadingState] = useState(false);

  // Wrapper to track loading state changes
  const setLoading = (value: boolean) => {
    setLoadingState(value);
  };
  const [isInitializing, setIsInitializing] = useState(true); // Track initial load
  const [prd, setPRD] = useState<string | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [projectUrl, setProjectUrl] = useState<string | undefined>(undefined);
  const [requirement, setRequirement] = useState<string>("");
  const [isProjectRunning, setIsProjectRunning] = useState(false);
  const socketIdRef = useRef<string | null>(null);

  // Check if this is a new project
  const isNewProject = projectId === "new";
  const initialRequirement = location.state?.requirement;

  // Terminal state handlers
  const addMessage = useCallback((text: string, isError: boolean) => {
    console.log(`Terminal message: ${text} (Error: ${isError})`);
  }, []);

  const addErrorMessage = useCallback((message: string) => {
    console.log(`Terminal error: ${message}`);
  }, []);

  const addSuggestions = useCallback(
    (
      originalCommand: string,
      errorMessage: string,
      suggestions: CommandSuggestion[]
    ) => {
      console.log("Terminal suggestions:", {
        originalCommand,
        errorMessage,
        suggestions,
      });
    },
    []
  );

  const handleSocketReady = useCallback((id: string) => {
    console.log("Terminal socket ready:", id);
    setSocketId(id);
    socketIdRef.current = id;
  }, []);

  // Start project function
  const startProject = useCallback(async () => {
    if (!projectId || isNewProject) return;

    console.log('Starting project:', projectId, 'with socketId:', socketId);
    setLoading(true);
    try {
      // Get project path from the backend
      const projectsResponse = await axios.get(
        "http://localhost:5001/api/list-projects"
      );
      const project = projectsResponse.data.projects.find(
        (p: any) => p.name === projectId
      );

      if (!project) {
        throw new Error("Project not found");
      }

      console.log('Calling /api/run-project with:', { projectName: projectId, socketId });
      const response = await axios.post<StartProjectResponse>(
        "http://localhost:5001/api/run-project",
        { projectName: projectId, socketId }
      );

      console.log('Run project response:', response.data);
      if (response.data.url) {
        setProjectUrl(response.data.url);
        setIsProjectRunning(true);
        setMessages((prev) => [
          ...prev,
          {
            type: "agent",
            content: `✅ Project started successfully at: ${response.data.url}`,
            category: "success",
          },
        ]);
      }
    } catch (error) {
      console.error("Error starting project:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "agent",
          content:
            "Failed to start project. Please check the terminal for details.",
          category: "error",
        },
      ]);
    } finally {
      // Only reset loading if it was set
      if (loading) {
        setLoading(false);
      }
    }
  }, [projectId, isNewProject, socketId, loading]);

  // Fetch project status for existing projects
  const fetchProjectStatus = useCallback(
    async (projectName: string, showMessage = true) => {
      try {
        console.log('Fetching project status for:', projectName);
        const response = await axios.get(
          "http://localhost:5001/api/running-projects"
        );
        console.log('Running projects:', response.data.projects);
        const runningProject = response.data.projects.find(
          (p: any) => p.name === projectName
        );

        if (runningProject) {
          console.log('Project is running:', runningProject);
          const wasRunning = isProjectRunning;
          setProjectUrl(runningProject.url);
          setIsProjectRunning(true);

          // Reset loading state when project is detected as running
          if (loading) {
            setLoading(false);
          }

          // Only show message on initial load or status change
          if (showMessage && !wasRunning) {
            setMessages((prev) => [
              ...prev,
              {
                type: "agent",
                content: `🚀 Your project is running at: ${runningProject.url}`,
                category: "success",
              },
            ]);
          }
          return true; // Project is running
        } else {
          console.log('Project is not running');
          const wasRunning = isProjectRunning;
          setIsProjectRunning(false);
          setProjectUrl(undefined);

          // Only show message on initial load or status change
          if (showMessage && wasRunning !== false) {
            setMessages((prev) => [
              ...prev,
              {
                type: "agent",
                content: "Starting your project...",
                category: "analysis",
              },
            ]);
          }
          return false; // Project is not running
        }
      } catch (error) {
        console.error("Error fetching project status:", error);
        return false;
      }
    },
    [isProjectRunning, loading]
  );

  // Check if project exists
  const checkProjectExists = useCallback(
    async (projectName: string) => {
      try {
        const response = await axios.get(
          "http://localhost:5001/api/list-projects"
        );
        const projectExists = response.data.projects.some(
          (p: any) => p.name === projectName
        );

        if (!projectExists) {
          // Project doesn't exist, redirect to home
          setMessages([
            {
              type: "agent",
              content: `Project "${projectName}" not found. Redirecting to home...`,
              category: "error",
            },
          ]);
          setTimeout(() => navigate("/"), 2000);
          return false;
        }
        return true;
      } catch (error) {
        console.error("Error checking project existence:", error);
        return false;
      }
    },
    [navigate]
  );

  // Initialize the page
  useEffect(() => {
    if (isNewProject && initialRequirement) {
      // Store the requirement
      setRequirement(initialRequirement);
      // Automatically generate PRD for new project
      handleSendMessage(initialRequirement);
      setIsInitializing(false);
    } else if (!isNewProject && projectId) {
      // For existing projects
      setLoading(false); // Ensure loading is false for existing projects
      checkProjectExists(projectId).then((exists) => {
        if (exists) {
          setMessages([
            {
              type: "agent",
              content: `Welcome back to ${projectId}! How can I help you update your project?`,
              category: "success",
            },
          ]);
          // Fetch project status first
          fetchProjectStatus(projectId).then((isRunning) => {
            // If project is not running, automatically start it
            if (!isRunning && socketId) {
              setTimeout(() => {
                startProject();
              }, 1000);
            }
          });
        }
        setIsInitializing(false);
      });
    } else {
      setIsInitializing(false);
    }
  }, [
    isNewProject,
    initialRequirement,
    projectId,
    checkProjectExists,
    fetchProjectStatus,
  ]);

  // Auto-start project when socket becomes ready
  useEffect(() => {
    if (!isNewProject && projectId && socketId && !isProjectRunning && !loading) {
      // Check if project exists and is not running, then start it
      fetchProjectStatus(projectId, false).then((isRunning) => {
        if (!isRunning) {
          console.log('Auto-starting project as socket is ready and project is not running');
          startProject();
        }
      });
    }
  }, [socketId, projectId, isNewProject]);

  // Periodically check project status for existing projects
  useEffect(() => {
    if (!isNewProject && projectId) {
      const interval = setInterval(() => {
        fetchProjectStatus(projectId, false); // Don't show messages on periodic checks
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isNewProject, projectId, fetchProjectStatus]);

  const handleSendMessage = async (message: string) => {
    // Don't set loading for existing projects - only for PRD generation
    if (isNewProject && !prd) {
      setLoading(true);
    }

    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        content: message,
        category: "requirement",
      },
    ]);

    try {
      if (isNewProject && !prd) {
        // Generate PRD for new project
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

        setPRD(prdResult.data.prd);
      } else {
        // Handle updates for existing project
        setMessages((prev) => [
          ...prev,
          {
            type: "agent",
            content: "Analyzing your update request...",
            category: "analysis",
          },
        ]);

        // Call update endpoint
        const updateResult = await axios.post(
          "http://localhost:5001/api/update-project-v2",
          {
            projectName: projectId,
            requirement: message,
            socketId,
          }
        );

        if (updateResult.data.success) {
          setMessages((prev) => [
            ...prev,
            {
              type: "agent",
              content:
                "✅ Project updated successfully! Check the preview to see your changes.",
              category: "success",
            },
          ]);
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          type: "agent",
          content: "Sorry, there was an error. Please try again.",
          category: "error",
        },
      ]);
    } finally {
      // Only reset loading if it was set
      if (loading) {
        setLoading(false);
      }
    }
  };

  const handlePRDApproval = async (approved: boolean) => {
    if (!approved) {
      // Reject PRD and go back to home
      navigate("/");
      return;
    }

    if (!prd) {
      setMessages((prev) => [
        ...prev,
        {
          type: "agent",
          content: "Error: Missing PRD. Please try again.",
          category: "error",
        },
      ]);
      return;
    }

    // If socket isn't ready yet, wait for it
    if (!socketId) {
      setMessages((prev) => [
        ...prev,
        {
          type: "agent",
          content: "Waiting for terminal connection...",
          category: "analysis",
        },
      ]);

      // Wait for socket to be ready
      const checkSocket = setInterval(() => {
        if (socketIdRef.current) {
          clearInterval(checkSocket);
          handlePRDApproval(true); // Retry with socket ready
        }
      }, 500);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkSocket);
        if (!socketIdRef.current) {
          setMessages((prev) => [
            ...prev,
            {
              type: "agent",
              content:
                "Error: Could not establish terminal connection. Please refresh and try again.",
              category: "error",
            },
          ]);
          setLoading(false);
        }
      }, 10000);

      return;
    }

    setLoading(true);

    try {
      // Initialize the project with the approved PRD
      const result = await axios.post(
        "http://localhost:5001/api/initialize-project",
        { prd, socketId }
      );

      const projectName = result.data.projectName;

      // Update messages to show project creation success
      setMessages((prev) => [
        ...prev,
        {
          type: "agent",
          content: `Project "${projectName}" created successfully!`,
          category: "success",
        },
      ]);

      // Check if project URL is available (dev server started)
      if (result.data.url) {
        setProjectUrl(result.data.url);
        setMessages((prev) => [
          ...prev,
          {
            type: "agent",
            content: `🚀 Development server running at: ${result.data.url}`,
            category: "success",
          },
        ]);
      }

      // Hide PRD panel and show chat
      setPRD(null);

      // Now generate the code for the project
      setMessages((prev) => [
        ...prev,
        {
          type: "agent",
          content: "Starting code generation based on the PRD...",
          category: "analysis",
        },
      ]);

      // Call generate-v2 endpoint to generate the code
      const generateResult = await axios.post(
        "http://localhost:5001/api/generate-v2",
        {
          requirement:
            requirement ||
            initialRequirement ||
            messages.find((m) => m.type === "user")?.content,
          socketId,
        }
      );

      if (generateResult.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            type: "agent",
            content: "✅ Project generated successfully! Your app is ready.",
            category: "success",
          },
        ]);

        // Update project URL if provided
        if (generateResult.data.url) {
          setProjectUrl(generateResult.data.url);
        }
      }

      // Navigate to the new project page
      navigate(`/project/${projectName}`, { replace: true });
    } catch (error) {
      console.error("Error initializing project:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "agent",
          content:
            "Failed to initialize project. Please check the terminal for details.",
          category: "error",
        },
      ]);
    } finally {
      // Only reset loading if it was set
      if (loading) {
        setLoading(false);
      }
    }
  };

  return (
    <PageContainer>
      <LeftPanel>
        {prd ? (
          <PRDPanel
            prd={prd}
            loading={loading}
            onApprove={() => handlePRDApproval(true)}
            onReject={() => handlePRDApproval(false)}
          />
        ) : (
          <ChatThread
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={loading}
          />
        )}
      </LeftPanel>

      <RightPanel>
        <TabbedPanel
          addErrorMessage={addErrorMessage}
          addMessage={addMessage}
          addSuggestions={addSuggestions}
          runCommand={(cmd) => console.log("Run command:", cmd)}
          onSocketReady={handleSocketReady}
          socketId={socketId}
          loading={loading}
          projectUrl={projectUrl}
          projectName={projectId === "new" ? undefined : projectId}
        />
      </RightPanel>
    </PageContainer>
  );
};

export default ProjectPage;
