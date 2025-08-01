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
  
  // Flags to prevent duplicate operations
  const [isStartingProject, setIsStartingProject] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const lastProjectStatusRef = useRef<boolean | null>(null);
  
  // Tab control state
  const [activeTab, setActiveTab] = useState<"terminal" | "preview" | "editor">("terminal");
  const [isBuildComplete, setIsBuildComplete] = useState(true); // Default to true for existing projects

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
  
  // Helper to add status message without duplicates
  const addStatusMessage = useCallback((content: string, statusType: "processing" | "success" | "error" | "info") => {
    setMessages((prev) => {
      // Check if we already have this exact status message
      const hasSimilarMessage = prev.some(msg => 
        msg.type === "status" && 
        msg.content === content && 
        msg.statusType === statusType
      );
      if (!hasSimilarMessage) {
        return [
          ...prev,
          {
            type: "status",
            content,
            statusType,
          },
        ];
      }
      return prev;
    });
  }, []);
  
  
  const handleTabChange = useCallback((tab: "terminal" | "preview" | "editor") => {
    setActiveTab(tab);
  }, []);

  // Start project function
  const startProject = useCallback(async () => {
    if (!projectId || isNewProject || isStartingProject) return;

    console.log('Starting project:', projectId, 'with socketId:', socketId);
    setIsStartingProject(true);
    setLoading(true);
    setIsBuildComplete(false); // Disable tabs during build
    setActiveTab("terminal"); // Switch to terminal tab
    
    // Add status message for starting project only once
    setMessages((prev) => {
      // Check if we already have a "Starting" message
      const hasStartingMessage = prev.some(msg => 
        msg.content.includes("Starting") && msg.statusType === "processing"
      );
      if (!hasStartingMessage) {
        return [
          ...prev,
          {
            type: "status",
            content: "Starting your project...",
            statusType: "processing",
          },
        ];
      }
      return prev;
    });
    
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
      setIsStartingProject(false);
    }
  }, [projectId, isNewProject, socketId, loading, isStartingProject]);

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
          const wasRunning = lastProjectStatusRef.current;
          lastProjectStatusRef.current = true;
          setProjectUrl(runningProject.url);
          setIsProjectRunning(true);

          // Reset loading state when project is detected as running
          if (loading) {
            setLoading(false);
          }

          // Only show message on actual status change
          if (showMessage && wasRunning !== true) {
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
          const wasRunning = lastProjectStatusRef.current;
          lastProjectStatusRef.current = false;
          setIsProjectRunning(false);
          setProjectUrl(undefined);

          // Only show message on actual status change from running to not running
          if (showMessage && wasRunning === true) {
            setMessages((prev) => [
              ...prev,
              {
                type: "agent",
                content: "Project stopped. You can restart it anytime.",
                category: "info",
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
        if (exists && !hasShownWelcome) {
          setHasShownWelcome(true);
          setMessages((prev) => [
            ...prev,
            {
              type: "agent",
              content: `Welcome back to ${projectId}! How can I help you update your project?`,
              category: "success",
            },
          ]);
          // Fetch project status first, don't show messages on initial check
          fetchProjectStatus(projectId, false).then((isRunning) => {
            // If project is not running and socket is ready, start it
            if (!isRunning && socketId && !isStartingProject) {
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
    if (!isNewProject && projectId && socketId && !isProjectRunning && !loading && !isStartingProject) {
      // Check if project exists and is not running, then start it
      fetchProjectStatus(projectId, false).then((isRunning) => {
        if (!isRunning && !isStartingProject) {
          console.log('Auto-starting project as socket is ready and project is not running');
          startProject();
        }
      });
    }
  }, [socketId, projectId, isNewProject, isStartingProject]);

  // Periodically check project status for existing projects
  useEffect(() => {
    if (!isNewProject && projectId) {
      const interval = setInterval(() => {
        fetchProjectStatus(projectId, false); // Don't show messages on periodic checks
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isNewProject, projectId, fetchProjectStatus]);

  // Listen for project status events on the existing socket connection
  useEffect(() => {
    // We need to get the socket instance from the Terminal component
    // The Terminal component already has a socket connection with the socketId
    // We'll listen for events using a global event system
    
    const handleProjectStatus = (event: CustomEvent) => {
      const data = event.detail;
      console.log('Received project:status event:', data);
      
      // Only handle events for our project
      if (data.projectName === projectId) {
        // Handle different stages with user-friendly status messages
        switch (data.stage) {
          case 'initializing':
            addStatusMessage("Creating your new project...", "processing");
            setIsBuildComplete(false);
            break;
            
          case 'server_starting':
            console.log('Server starting...');
            addStatusMessage("Starting development server...", "processing");
            setIsBuildComplete(false);
            break;
            
          case 'server_ready':
            console.log('Server ready! Enabling tabs.');
            addStatusMessage("Development server is ready!", "success");
            setIsBuildComplete(true);
            if (data.url) {
              setProjectUrl(data.url);
            }
            break;
            
          case 'server_stopped':
            console.log('Server stopped');
            setMessages((prev) => [
              ...prev,
              {
                type: "status",
                content: "Development server stopped",
                statusType: "info",
              },
            ]);
            setIsProjectRunning(false);
            break;
            
          case 'server_error':
            console.log('Server error:', data.error);
            setMessages((prev) => [
              ...prev,
              {
                type: "status",
                content: "Server encountered an error. Check the terminal for details.",
                statusType: "error",
              },
            ]);
            setIsBuildComplete(true); // Enable tabs on error so user can investigate
            break;
            
          case 'code_generation_starting':
            addStatusMessage("Starting to generate your project code...", "processing");
            setIsBuildComplete(false);
            break;
            
          case 'analyzing_requirements':
            setMessages((prev) => [
              ...prev,
              {
                type: "status",
                content: "Analyzing your requirements and planning the implementation...",
                statusType: "processing",
              },
            ]);
            setIsBuildComplete(false);
            break;
            
          case 'checking_build':
            setMessages((prev) => [
              ...prev,
              {
                type: "status",
                content: "Running quality checks and fixing any issues...",
                statusType: "processing",
              },
            ]);
            setIsBuildComplete(false);
            break;
            
          case 'initialized':
            setMessages((prev) => [
              ...prev,
              {
                type: "status",
                content: "Project structure created successfully!",
                statusType: "success",
              },
            ]);
            break;
            
          case 'code_generation_complete':
            setMessages((prev) => [
              ...prev,
              {
                type: "status",
                content: "Code generation completed successfully!",
                statusType: "success",
              },
            ]);
            // Don't enable tabs yet - wait for server_ready
            break;
            
          case 'code_generation_complete_with_errors':
            setMessages((prev) => [
              ...prev,
              {
                type: "status",
                content: "Code generation completed with some warnings. Your app should still work!",
                statusType: "info",
              },
            ]);
            setIsBuildComplete(true); // Enable tabs so user can fix errors
            break;
        }
      }
    };

    // Listen for custom events that will be dispatched from Terminal component
    window.addEventListener('project:status', handleProjectStatus as EventListener);

    // Clean up
    return () => {
      window.removeEventListener('project:status', handleProjectStatus as EventListener);
    };
  }, [projectId, addStatusMessage]);

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
      } else if (!isNewProject && projectId) {
        // Handle updates for existing project only
        addStatusMessage("Processing your update request...", "processing");

        // Disable tabs and switch to terminal for update
        setIsBuildComplete(false);
        setActiveTab("terminal");
        
        // Call update endpoint
        const updateResult = await axios.post(
          "http://localhost:5001/api/update-project-v2",
          {
            projectName: projectId,
            requirements: message,
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
      } else if (isNewProject && prd) {
        // For new projects that already have PRD, do nothing on subsequent messages
        // This prevents calling update API before project is created
        setMessages((prev) => [
          ...prev,
          {
            type: "agent",
            content: "Please approve the PRD to create your project.",
            category: "analysis",
          },
        ]);
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
    setIsBuildComplete(false); // Disable tabs during project creation
    setActiveTab("terminal"); // Switch to terminal tab
    
    // Add status message for project creation
    setMessages((prev) => [
      ...prev,
      {
        type: "status",
        content: "Creating your project structure...",
        statusType: "processing",
      },
    ]);

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

      // Now generate the code for the project using task-based approach
      setMessages((prev) => [
        ...prev,
        {
          type: "status",
          content: "Generating code for your project...",
          statusType: "processing",
        },
      ]);

      // Call update-project-v2 endpoint to generate the code
      // Get the PRD from messages (it was already generated and approved)
      const prdMessage = messages.find(m => m.category === "prd");
      const prdContent = prdMessage?.content || prd || "";
      
      // Ensure tabs are disabled for code generation
      setIsBuildComplete(false);
      setActiveTab("terminal");
      
      const updateResult = await axios.post(
        "http://localhost:5001/api/update-project-v2",
        {
          projectName: projectName,
          requirements: prdContent,
          socketId,
        }
      );

      if (updateResult.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            type: "agent",
            content: `✅ ${updateResult.data.message || "Project generated successfully! Your app is ready."}`,
            category: "success",
          },
        ]);

        // Show task summary if available
        if (updateResult.data.summary) {
          const summary = updateResult.data.summary;
          setMessages((prev) => [
            ...prev,
            {
              type: "agent",
              content: `📊 Summary: ${summary.successful}/${summary.total} tasks completed successfully`,
              category: "analysis",
            },
          ]);
          if (summary.failed > 0) {
            setMessages((prev) => [
              ...prev,
              {
                type: "agent",
                content: `⚠️ ${summary.failed} tasks failed - check terminal for details`,
                category: "error",
              },
            ]);
          }
        }

        // Update project URL if provided
        if (updateResult.data.url) {
          setProjectUrl(updateResult.data.url);
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
          disabledTabs={isBuildComplete ? [] : ["preview", "editor"]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </RightPanel>
    </PageContainer>
  );
};

export default ProjectPage;
