import styled from "@emotion/styled";
import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChatThread } from "../components/ChatThread";
import { PRDPanel } from "../components/PRDPanel";
import TabbedPanel from "../components/TabbedPanel";
import GeneratingStatus from "../components/GeneratingStatus";
import CubeLoader from "../components/CubeLoader";
import { Message } from "../types/chat";
import { CommandSuggestion } from "../types/terminal";
import { API_ENDPOINTS } from "../config/api";
import { useSocket } from "../context/SocketContext";

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
  const { socket } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoadingState] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState("");

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
  
  // Track project creation lifecycle (must be after isNewProject)
  const [projectCreationPhase, setProjectCreationPhase] = useState<
    "initial" | "prd_generated" | "prd_approved" | "creating" | "created" | "existing"
  >(isNewProject ? "initial" : "existing");
  const initialRequirement = location.state?.requirement;
  const [hasProcessedInitialRequirement, setHasProcessedInitialRequirement] = useState(false);

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
  const addStatusMessage = useCallback((content: string, statusType: "processing" | "success" | "error" | "info", messageId?: string) => {
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
            id: messageId,
            type: "status",
            content,
            statusType,
          },
        ];
      }
      return prev;
    });
  }, []);
  
  // Helper to update status message by ID
  const updateStatusMessage = useCallback((messageId: string, updates: { content?: string; statusType?: "processing" | "success" | "error" | "info"; icon?: string }) => {
    setMessages((prev) => prev.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, ...updates };
      }
      return msg;
    }));
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
    addStatusMessage("Starting your project...", "processing", "status-project-start");
    
    try {
      // Get project path from the backend
      const projectsResponse = await axios.get(
        API_ENDPOINTS.LIST_PROJECTS
      );
      const project = projectsResponse.data.projects.find(
        (p: any) => p.name === projectId
      );

      if (!project) {
        throw new Error("Project not found");
      }

      console.log('Calling /api/run-project with:', { projectName: projectId, socketId });
      const response = await axios.post<StartProjectResponse>(
        API_ENDPOINTS.RUN_PROJECT,
        { projectName: projectId, socketId }
      );

      console.log('Run project response:', response.data);
      if (response.data.url) {
        setProjectUrl(response.data.url);
        setIsProjectRunning(true);
        // Update the starting message to remove spinner
        updateStatusMessage("status-project-start", {
          content: "Project started successfully!",
          statusType: "success",
          icon: "✅"
        });
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
          API_ENDPOINTS.RUNNING_PROJECTS
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
          API_ENDPOINTS.LIST_PROJECTS
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
    if (isNewProject && initialRequirement && projectCreationPhase === "initial" && !hasProcessedInitialRequirement) {
      // Store the requirement
      setRequirement(initialRequirement);
      // Mark as processed to prevent duplicate calls
      setHasProcessedInitialRequirement(true);
      // Automatically generate PRD for new project (only once)
      handleSendMessage(initialRequirement);
      setIsInitializing(false);
    } else if (!isNewProject && projectId) {
      // For existing projects
      setLoading(false); // Ensure loading is false for existing projects
      
      // If socket is already connected, establish the socket ID immediately
      if (socket?.connected && socket?.id) {
        console.log('Socket already connected when entering project, setting socketId:', socket.id);
        setSocketId(socket.id);
        socketIdRef.current = socket.id;
      }
      
      checkProjectExists(projectId).then((exists) => {
        // Only show welcome message for truly existing projects, not newly created ones
        if (exists && !hasShownWelcome && projectCreationPhase === "existing") {
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
    projectCreationPhase,
    checkProjectExists,
    fetchProjectStatus,
    socket,
  ]);

  // Handle socket connection changes
  useEffect(() => {
    if (socket) {
      const handleSocketConnect = () => {
        console.log('Socket connected/reconnected with ID:', socket.id);
        if (socket.id && socket.id !== socketIdRef.current) {
          console.log('Updating socket ID from', socketIdRef.current, 'to', socket.id);
          setSocketId(socket.id);
          socketIdRef.current = socket.id;
        }
      };

      // Listen for socket connection events
      socket.on('connect', handleSocketConnect);
      
      // If socket is already connected, handle it immediately
      if (socket.connected && socket.id && !socketIdRef.current) {
        handleSocketConnect();
      }

      return () => {
        socket.off('connect', handleSocketConnect);
      };
    }
  }, [socket]);
  
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
      
      // Only handle events for our project (or events without projectName like tasks_generated)
      if (data.projectName === projectId || !data.projectName) {
        // Handle different stages with user-friendly status messages
        switch (data.stage) {
          case 'initializing':
            addStatusMessage("Creating your new project...", "processing", "status-initializing");
            setIsBuildComplete(false);
            break;
            
          case 'server_starting':
            console.log('Server starting...');
            addStatusMessage("Starting development server...", "processing", "status-server");
            setIsBuildComplete(false);
            break;
            
          case 'server_ready':
            console.log('Server ready! Enabling tabs.');
            // Update the server starting message to remove spinner
            updateStatusMessage("status-server", {
              content: "Development server is ready!",
              statusType: "success",
              icon: "✅"
            });
            setIsBuildComplete(true);
            // Clear generation status when server is ready (project creation complete)
            setIsGenerating(false);
            setGeneratingMessage("");
            // Mark phase as created if we were creating
            if (projectCreationPhase === "creating") {
              setProjectCreationPhase("created");
            }
            if (data.url) {
              setProjectUrl(data.url);
            }
            // Re-establish socket ID when server restarts
            // The socket connection persists, just need to update UI state
            if (socket?.id) {
              console.log('Re-establishing socket ID after server restart:', socket.id);
              setSocketId(socket.id);
              socketIdRef.current = socket.id;
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
            // Reset socket ID to trigger terminal reconnection when project restarts
            setSocketId(null);
            socketIdRef.current = null;
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
            // Only show generating status if we're actually creating or updating
            if (projectCreationPhase === "creating" || projectCreationPhase === "existing") {
              setIsGenerating(true);
              setGeneratingMessage("Starting to generate your project code...");
            }
            addStatusMessage("Starting to generate your project code...", "processing", "status-codegen");
            setIsBuildComplete(false);
            break;
            
          case 'analyzing_requirements':
            // Only show generating status if we're actually creating or updating
            if (projectCreationPhase === "creating" || projectCreationPhase === "existing") {
              setIsGenerating(true);
              setGeneratingMessage("Analyzing your requirements and planning the implementation...");
            }
            addStatusMessage("Analyzing your requirements and planning the implementation...", "processing", "status-analyzing");
            setIsBuildComplete(false);
            // Check if tasks are included in the data
            if (data.tasks && Array.isArray(data.tasks)) {
              setMessages((prev) => [
                ...prev,
                {
                  type: "tasks",
                  content: "Task breakdown for your project:",
                  tasks: data.tasks.map((task: any, index: number) => ({
                    id: index + 1,
                    title: task.title || task,
                    status: "pending",
                    details: task.details || undefined
                  }))
                },
              ]);
            }
            break;
            
          case 'checking_build':
            addStatusMessage("Running quality checks and fixing any issues...", "processing", "status-build-check");
            setIsBuildComplete(false);
            break;
            
          case 'initialized':
            // Update the initializing message to remove spinner
            updateStatusMessage("status-initializing", {
              content: "Project structure created successfully!",
              statusType: "success",
              icon: "✅"
            });
            break;
            
          case 'code_generation_complete':
            setIsGenerating(false);
            setGeneratingMessage("");
            // Update the code generation message to remove spinner
            updateStatusMessage("status-codegen", {
              content: "Code generation completed successfully!",
              statusType: "success",
              icon: "✅"
            });
            // Update analyzing message if it exists
            updateStatusMessage("status-analyzing", {
              content: "Requirements analyzed successfully!",
              statusType: "success",
              icon: "✅"
            });
            // Update build check message if it exists
            updateStatusMessage("status-build-check", {
              content: "Quality checks passed!",
              statusType: "success",
              icon: "✅"
            });
            // Update the update request message if it exists
            updateStatusMessage("status-update-request", {
              content: "Update request processed successfully!",
              statusType: "success",
              icon: "✅"
            });
            // Don't enable tabs yet - wait for server_ready
            break;
            
          case 'code_generation_complete_with_errors':
            setIsGenerating(false);
            setGeneratingMessage("");
            // Update messages to show completion with warnings
            updateStatusMessage("status-codegen", {
              content: "Code generation completed with some warnings",
              statusType: "info",
              icon: "⚠️"
            });
            updateStatusMessage("status-build-check", {
              content: "Quality checks completed with warnings",
              statusType: "info",
              icon: "⚠️"
            });
            // Update the update request message if it exists
            updateStatusMessage("status-update-request", {
              content: "Update completed with warnings",
              statusType: "info",
              icon: "⚠️"
            });
            setIsBuildComplete(true); // Enable tabs so user can fix errors
            break;
            
          case 'tasks_generated':
            // Display the generated tasks
            console.log('Handling tasks_generated with tasks:', data.tasks);
            if (data.tasks && Array.isArray(data.tasks)) {
              const taskMessage = {
                type: "tasks" as const,
                content: "Task breakdown for your project:",
                tasks: data.tasks.map((task: any, index: number) => ({
                  id: index + 1,
                  title: task.title || task,
                  status: "pending" as const,
                  details: task.details || undefined
                }))
              };
              console.log('Adding task message:', taskMessage);
              setMessages((prev) => [...prev, taskMessage]);
            }
            break;
            
          case 'task_started':
            // Update task status to in_progress
            if (data.taskId) {
              setMessages((prev) => prev.map(msg => {
                if (msg.type === "tasks" && msg.tasks) {
                  return {
                    ...msg,
                    tasks: msg.tasks.map(task => 
                      task.id === data.taskId 
                        ? { ...task, status: "in_progress" as const }
                        : task
                    )
                  };
                }
                return msg;
              }));
            }
            break;
            
          case 'task_completed':
            // Update task status to completed
            if (data.taskId) {
              setMessages((prev) => prev.map(msg => {
                if (msg.type === "tasks" && msg.tasks) {
                  return {
                    ...msg,
                    tasks: msg.tasks.map(task => 
                      task.id === data.taskId 
                        ? { ...task, status: "completed" as const }
                        : task
                    )
                  };
                }
                return msg;
              }));
            }
            break;
            
          case 'task_failed':
            // Update task status to failed
            if (data.taskId) {
              setMessages((prev) => prev.map(msg => {
                if (msg.type === "tasks" && msg.tasks) {
                  return {
                    ...msg,
                    tasks: msg.tasks.map(task => 
                      task.id === data.taskId 
                        ? { ...task, status: "failed" as const, details: data.error || task.details }
                        : task
                    )
                  };
                }
                return msg;
              }));
            }
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
  }, [projectId, addStatusMessage, updateStatusMessage, projectCreationPhase]);

  const handleSendMessage = async (message: string) => {
    console.log("handleSendMessage called with:", message, "phase:", projectCreationPhase);
    
    // Don't allow sending messages during certain phases
    if (projectCreationPhase === "creating" || projectCreationPhase === "prd_approved") {
      console.log("Message blocked: Project is being created");
      return;
    }
    
    // Check if this is a duplicate initial requirement (prevent double PRD generation)
    if (isNewProject && projectCreationPhase !== "initial") {
      console.log("Message blocked: PRD already generated or in progress");
      return;
    }
    
    // Don't set loading for existing projects - only for PRD generation
    if (isNewProject && !prd) {
      setLoading(true);
    }

    // Check if this exact message already exists to prevent duplicates
    setMessages((prev) => {
      const isDuplicate = prev.some(
        msg => msg.type === "user" && msg.content === message && msg.category === "requirement"
      );
      
      if (isDuplicate) {
        console.log("Duplicate message detected, not adding");
        return prev;
      }
      
      return [
        ...prev,
        {
          type: "user",
          content: message,
          category: "requirement",
        },
      ];
    });

    try {
      if (isNewProject && !prd && projectCreationPhase === "initial") {
        // Generate PRD for new project
        const prdResult = await axios.post<PRDResponse>(
          API_ENDPOINTS.GENERATE_PRD,
          { requirement: message, socketId }
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
        setProjectCreationPhase("prd_generated");
        setLoading(false); // Stop loading after PRD is generated
      } else if (projectCreationPhase === "existing" && projectId) {
        // Handle updates for existing project only (not during initial creation)
        setIsGenerating(true);
        setGeneratingMessage(`Updating ${projectId} to implement your changes...`);
        addStatusMessage("Processing your update request...", "processing", "status-update-request");

        // Disable tabs and switch to terminal for update
        setIsBuildComplete(false);
        setActiveTab("terminal");
        
        // Call update endpoint
        const updateResult = await axios.post(
          API_ENDPOINTS.UPDATE_PROJECT_V2,
          {
            projectName: projectId,
            requirements: message,
            socketId,
          }
        );

        if (updateResult.data.success) {
          setIsGenerating(false);
          setGeneratingMessage("");
          // Update the processing message to remove spinner
          updateStatusMessage("status-update-request", {
            content: "Update request processed successfully!",
            statusType: "success",
            icon: "✅"
          });
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
      } else if (projectCreationPhase === "created" && projectId) {
        // After initial project creation is complete, handle as updates
        setProjectCreationPhase("existing"); // Convert to existing project
        
        // Now handle as update
        setIsGenerating(true);
        setGeneratingMessage(`Updating ${projectId} to implement your changes...`);
        addStatusMessage("Processing your update request...", "processing");

        // Disable tabs and switch to terminal for update
        setIsBuildComplete(false);
        setActiveTab("terminal");
        
        // Call update endpoint
        const updateResult = await axios.post(
          API_ENDPOINTS.UPDATE_PROJECT_V2,
          {
            projectName: projectId,
            requirements: message,
            socketId,
          }
        );

        if (updateResult.data.success) {
          setIsGenerating(false);
          setGeneratingMessage("");
          // Update the processing message to remove spinner
          updateStatusMessage("status-update-request", {
            content: "Update processed successfully!",
            statusType: "success",
            icon: "✅"
          });
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
      setIsGenerating(false);
      setGeneratingMessage("");
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
    
    // Mark PRD as approved
    setProjectCreationPhase("prd_approved");

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
    setProjectCreationPhase("creating"); // Mark as creating
    
    // Add status message for project creation
    addStatusMessage("Creating your project structure...", "processing", "status-project-creation");

    try {
      // Initialize the project with the approved PRD
      const result = await axios.post(
        API_ENDPOINTS.INITIALIZE_PROJECT,
        { prd, socketId }
      );

      const projectName = result.data.projectName;

      // Update the creation message to remove spinner
      updateStatusMessage("status-project-creation", {
        content: "Project structure created successfully!",
        statusType: "success",
        icon: "✅"
      });
      
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
      
      // Mark project as created
      setProjectCreationPhase("created");

      // Now generate the code for the project using task-based approach
      addStatusMessage("Generating code for your project...", "processing", "status-project-codegen");

      // Call update-project-v2 endpoint to generate the code
      // Get the PRD from messages (it was already generated and approved)
      const prdMessage = messages.find(m => m.category === "prd");
      const prdContent = prdMessage?.content || prd || "";
      
      // Ensure tabs are disabled for code generation
      setIsBuildComplete(false);
      setActiveTab("terminal");
      
      const updateResult = await axios.post(
        API_ENDPOINTS.UPDATE_PROJECT_V2,
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

      // Clear generation status before navigation
      setIsGenerating(false);
      setGeneratingMessage("");
      
      // Navigate to the new project page
      navigate(`/project/${projectName}`, { replace: true });
    } catch (error) {
      console.error("Error initializing project:", error);
      setIsGenerating(false);
      setGeneratingMessage("");
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
            isGenerating={isGenerating}
            generatingMessage={generatingMessage}
            onStopGeneration={() => {
              setIsGenerating(false);
              setGeneratingMessage("");
              // TODO: Implement actual stop generation logic
            }}
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
