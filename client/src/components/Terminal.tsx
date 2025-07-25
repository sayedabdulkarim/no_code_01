import axios from "axios";
import React, { useCallback, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
// import { CommandSuggestion } from "../utils/commandFixerAgent";
import styled from "@emotion/styled";
import "xterm/css/xterm.css";
import { CommandSuggestion } from "../types/terminal";

// Style for the terminal container
const TerminalContainer = styled.div`
  height: 100%;
  width: 100%;
  background-color: #1e1e1e;
  border-radius: 4px;
  overflow: hidden;

  .xterm {
    height: 100%;
  }
`;

interface TerminalProps {
  addErrorMessage: (message: string) => void;
  addMessage: (text: string, isError: boolean) => void;
  addSuggestions: (
    originalCommand: string,
    errorMessage: string,
    suggestions: CommandSuggestion[]
  ) => void;
  runCommand?: (command: string) => void;
  onSocketReady?: (socketId: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({
  addErrorMessage,
  addMessage,
  addSuggestions,
  runCommand,
  onSocketReady,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<XTerm | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const processingErrorRef = useRef<boolean>(false);
  const lastCommandRef = useRef<string>("");
  const currentCommandRef = useRef<string>("");
  const lastErrorRef = useRef<string>(""); // Track the last error we processed
  const commandHistoryRef = useRef<string[]>([]); // Track recent commands
  const processedPairsRef = useRef<Set<string>>(new Set()); // Track command+error pairs we've already processed
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]); // Store all timeout IDs for cleanup
  const resizeObserverRef = useRef<ResizeObserver | null>(null); // Track ResizeObserver for cleanup
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000; // 2 seconds between reconnection attempts

  // Execute a command in the terminal
  const executeCommand = useCallback((command: string) => {
    if (!command) {
      console.warn("Attempted to execute empty command");
      return;
    }

    if (socketRef.current && terminalInstance.current) {
      try {
        // Write the command to terminal
        terminalInstance.current.write(command);
        // Send command to server
        socketRef.current.emit("input", command);
        // Also send an Enter key to execute
        socketRef.current.emit("input", "\r");
      } catch (e) {
        console.error("Error executing command:", e);
        // Try to recover if possible
        const recoveryTimeout = setTimeout(() => {
          // Check if references are still valid
          if (socketRef.current && command) {
            try {
              socketRef.current.emit("input", command + "\r");
            } catch (innerE) {
              console.error("Retry command execution failed:", innerE);
            }
          }
        }, 100);

        // Add to timeout tracking for cleanup
        timeoutIdsRef.current.push(recoveryTimeout);
      }
    } else {
      console.error("Cannot execute command: terminal or socket not available");
    }
  }, []);

  // Memoize the error detection function to prevent re-creating it on each render
  const detectAndHandleError = useCallback(
    (data: string) => {
      // Don't process if we're already handling an error
      if (processingErrorRef.current) return;

      console.log(
        "Checking terminal output for errors:",
        data.substring(0, 100) + "..."
      );

      try {
        // Detect exit codes with enhanced pattern recognition
        const exitCodePattern = /exit (\d+)/i;
        const exitCodeMatch = data.match(exitCodePattern);
        let exitCodeValue = 0;

        // Check if we found an exit code and it's not zero
        if (exitCodeMatch && exitCodeMatch[1] !== "0") {
          exitCodeValue = parseInt(exitCodeMatch[1], 10);
          console.log(`Detected explicit non-zero exit code: ${exitCodeValue}`);
        }

        // Consider it an error if we have a non-zero exit code
        const isNonZeroExit =
          exitCodeValue > 0 ||
          (data.includes("exit ") && !data.includes("exit 0"));

        // Also check for common error indicator words when no exit code is available
        // This is a simplified approach compared to the previous regex patterns
        const hasErrorText = [
          "error",
          "command not found",
          "permission denied",
          "failed",
          "invalid",
          "not recognized",
          "unexpected",
          "traceback",
          "exception",
        ].some((errorText) => data.toLowerCase().includes(errorText));

        if (isNonZeroExit || hasErrorText) {
          // Set processing flag to prevent re-entrancy
          processingErrorRef.current = true;
          console.log(
            hasErrorText
              ? "Error text detected in terminal output!"
              : `Non-zero exit code detected (${exitCodeValue || "unknown"})!`
          );

          // Split by both \n and \r\n to handle different line endings
          const lines = data.split(/\r?\n/).filter((line) => line.trim());

          // Find the specific line containing an error indicator
          const errorKeywords = [
            "error",
            "command not found",
            "permission denied",
            "failed",
            "invalid",
            "not recognized",
            "unexpected",
            "traceback",
            "exception",
          ];

          let errorMessage = lines.find((line) =>
            errorKeywords.some((keyword) =>
              line.toLowerCase().includes(keyword)
            )
          );

          // Specific handling for common CLI tools where errors often appear in stdout
          // even if they don't match our regular error patterns
          const commonCliTools = [
            "npm",
            "yarn",
            "npx",
            "pnpm",
            "cargo",
            "pip",
            "git",
            "docker",
          ];
          const isCommonCliToolOutput = commonCliTools.some((tool) =>
            lastCommandRef.current.trim().startsWith(tool)
          );

          if (isCommonCliToolOutput && !errorMessage) {
            console.log("Checking CLI tool output for error indications");

            // For CLI tools, look for lines containing keywords that suggest errors
            const cliErrorKeywords = [
              "error",
              "fail",
              "invalid",
              "not found",
              "not recognized",
              "cannot",
              "couldn't",
              "missing",
              "command not found",
            ];

            // Look for lines containing error keywords
            errorMessage = lines.find((line) =>
              cliErrorKeywords.some((keyword) =>
                line.toLowerCase().includes(keyword)
              )
            );

            // Specific handling for Yarn/NPM errors which often have a specific format
            if (!errorMessage) {
              // Look for patterns like "error Command "test" not found"
              const yarnErrorLine = lines.find((line) =>
                line.match(/error\s+Command\s+".*"\s+not found/i)
              );

              if (yarnErrorLine) {
                errorMessage = yarnErrorLine;
                console.log(
                  "Found Yarn command not found error:",
                  errorMessage
                );
              }

              // Look for package.json not found errors
              const packageJsonErrorLine = lines.find(
                (line) =>
                  line.includes("package.json") &&
                  line.toLowerCase().includes("couldn't find")
              );

              if (packageJsonErrorLine) {
                errorMessage = packageJsonErrorLine;
                console.log("Found package.json error:", errorMessage);
              }
            }

            if (errorMessage) {
              console.log("Found CLI tool error message:", errorMessage);
            }
          }

          // If no specific error message was identified but we have a non-zero exit code
          if (!errorMessage && isNonZeroExit) {
            console.log("Using non-zero exit code as primary error indicator");

            // Use a fallback error message
            if (lines.length > 0) {
              // Extract the exit code value if available
              const exitCodeMatch = data.match(/exit (\d+)/i);
              const exitCodeValue = exitCodeMatch
                ? parseInt(exitCodeMatch[1], 10)
                : 1;

              // Use the first non-empty line as the error message (could be stdout instead of stderr)
              errorMessage =
                lines[0].trim() ||
                `Non-zero exit code (${exitCodeValue}) with no matched error pattern`;
              console.log("Using first line as error message:", errorMessage);
            } else {
              const exitCodeMatch = data.match(/exit (\d+)/i);
              const exitCodeValue = exitCodeMatch
                ? parseInt(exitCodeMatch[1], 10)
                : 1;
              errorMessage = `Non-zero exit code (${exitCodeValue}) with no output`;
            }
          }

          if (errorMessage) {
            // Check if this is the same error we just processed
            if (lastErrorRef.current === errorMessage) {
              console.log("Skipping duplicate error:", errorMessage);
              processingErrorRef.current = false;
              return;
            }

            // Update our tracking of the last error we processed
            lastErrorRef.current = errorMessage;

            console.log("Error message identified:", errorMessage);
            console.log("Last command was:", lastCommandRef.current);

            // Analyze compound commands (commands with pipes or chains)
            const isCompoundCommand =
              lastCommandRef.current.includes("|") ||
              lastCommandRef.current.includes("&&") ||
              lastCommandRef.current.includes(";");

            if (isCompoundCommand) {
              console.log(
                "Detected compound command with potential for partial failure"
              );
              // For compound commands, we need to be careful about which part failed
              // This is handled by more detailed error analysis below
            }

            // Specific error type detection logging
            if (
              errorMessage === "unknown option --v" ||
              errorMessage.includes("unknown option --v")
            ) {
              console.log(
                "🐍 Python version flag error detected specifically:",
                errorMessage
              );
            }

            // Check for common CLI tools where errors often appear in stdout
            const commonCliTools = [
              "npm",
              "yarn",
              "npx",
              "pnpm",
              "cargo",
              "pip",
            ];

            // Detect if this is a CLI tool error
            const isCommonCliToolError = commonCliTools.some((tool) => {
              // Check if command starts with the tool name
              const startsWithTool = lastCommandRef.current.startsWith(tool);

              // Look for error patterns in the output lines
              const hasErrorIndication = lines.some(
                (line) =>
                  line.toLowerCase().includes("error") ||
                  line.toLowerCase().includes("not found") ||
                  line.toLowerCase().includes("couldn't find")
              );

              return startsWithTool && hasErrorIndication;
            });

            if (isCommonCliToolError) {
              console.log(
                "Detected error in common CLI tool output:",
                lastCommandRef.current
              );

              // For CLI tool errors, make sure we include the most relevant error line
              if (!errorMessage || errorMessage.trim() === "") {
                // Find the most relevant error line
                const errorLines = lines.filter(
                  (line) =>
                    line.toLowerCase().includes("error") ||
                    line.toLowerCase().includes("not found") ||
                    line.toLowerCase().includes("couldn't find")
                );

                if (errorLines.length > 0) {
                  errorMessage = errorLines[0];
                  console.log("Using detected CLI error line:", errorMessage);
                }
              }
            }

            // Special handling for various error types

            // 0. Command not found errors - always use the exact command that caused the error
            if (errorMessage.includes("command not found")) {
              // First try the more specific shell error format (zsh: command not found: mk)
              const shellErrorMatch = errorMessage.match(
                /\w+:\s+command not found:\s+(\w+)/i
              );
              let commandName: string | undefined;

              if (shellErrorMatch && shellErrorMatch[1]) {
                // This matches patterns like "zsh: command not found: mk"
                commandName = shellErrorMatch[1].trim();
                console.log("📍 Shell command not found:", commandName);
              } else {
                // Fall back to the original pattern for errors like "command: command not found"
                const commandMatch = errorMessage.match(
                  /([^\s:]+):\s+command not found/
                );
                if (commandMatch && commandMatch[1]) {
                  commandName = commandMatch[1].trim();
                  console.log("📍 Basic command not found for:", commandName);
                }
              }

              if (commandName) {
                // Check command history to see if this command was recently used
                const recentCommand = commandHistoryRef.current.find(
                  (cmd) =>
                    cmd === commandName || cmd.startsWith(commandName + " ")
                );

                if (recentCommand) {
                  console.log(
                    "Found matching command in history:",
                    recentCommand
                  );
                  lastCommandRef.current = recentCommand;
                }
                // If the last command doesn't match what the error says, update it
                else if (
                  !lastCommandRef.current.startsWith(commandName + " ") &&
                  lastCommandRef.current !== commandName
                ) {
                  console.log(
                    "Updating lastCommandRef to match the failed command:",
                    commandName
                  );
                  lastCommandRef.current = commandName;
                }

                // For command not found errors, we want to ensure we get fresh suggestions
                // each time, so completely reset all processed pairs
                console.log(
                  "Command not found - completely resetting processed pairs"
                );
                processedPairsRef.current = new Set();
              }
            }

            // 1. Node version errors
            const isNodeVersionError =
              (errorMessage.includes("bad option") &&
                errorMessage.includes("-ver")) ||
              errorMessage.match(/\/.*node:.*bad option/i) !== null;

            if (
              isNodeVersionError &&
              !lastCommandRef.current.includes("node")
            ) {
              console.log(
                "🔄 Detected node version error but command doesn't match. Setting command to 'node -ver'"
              );
              lastCommandRef.current = "node -ver";
            }

            // 2. Python errors
            const isPythonError =
              (errorMessage.includes("python") ||
                errorMessage === "unknown option --v") &&
              (errorMessage.includes("unknown option") ||
                errorMessage.includes("invalid option"));

            if (isPythonError && !lastCommandRef.current.includes("python")) {
              console.log(
                "🔄 Detected Python error but command doesn't match. Setting command appropriately"
              );
              // Check if it's likely a version check error
              if (
                errorMessage.includes("--v") ||
                errorMessage.includes("-ver") ||
                errorMessage === "unknown option --v"
              ) {
                lastCommandRef.current = "python --v";
              }
            }

            // Debug log for specific error patterns
            if (
              lastCommandRef.current.includes("node") &&
              (errorMessage.includes("bad option") ||
                errorMessage.includes("-ver"))
            ) {
              console.log("🚨 Detected node command with bad option error!");
            }

            if (
              lastCommandRef.current.includes("python") &&
              (errorMessage.includes("unknown option") ||
                errorMessage.includes("invalid option"))
            ) {
              console.log("🚨 Detected Python command with option error!");
            }

            // Format error to include the last command
            let formattedError: string;

            // Special handling for package manager errors
            if (
              lastCommandRef.current.startsWith("yarn") ||
              lastCommandRef.current.startsWith("npm")
            ) {
              const cmdParts = lastCommandRef.current.split(" ");
              const packageManager = cmdParts[0]; // yarn or npm

              // Check if error indicates package.json not found
              if (
                errorMessage &&
                errorMessage.toLowerCase().includes("package.json")
              ) {
                formattedError = `${errorMessage.trim()}\nTry: cd into a directory with a package.json file before running ${packageManager} commands`;
              }
              // Check if error indicates command not found
              else if (
                errorMessage &&
                errorMessage.toLowerCase().includes("command") &&
                errorMessage.toLowerCase().includes("not found")
              ) {
                formattedError = `${errorMessage.trim()}\nTry checking available scripts in package.json`;
              }
              // Default formatting
              else {
                formattedError = lastCommandRef.current
                  ? `Error after: ${lastCommandRef.current}\n→ ${
                      errorMessage?.trim() || "Unknown error"
                    }`
                  : errorMessage?.trim() || "Unknown error";
              }
            }
            // Default formatting for other commands
            else {
              formattedError = lastCommandRef.current
                ? `Error after: ${lastCommandRef.current}\n→ ${
                    errorMessage?.trim() || "Unknown error"
                  }`
                : errorMessage?.trim() || "Unknown error";
            }

            // Use requestAnimationFrame to avoid blocking the UI
            requestAnimationFrame(async () => {
              // Add the error message to the chat panel
              addErrorMessage(formattedError);

              // Try to suggest a fixed command if there's a last command
              if (lastCommandRef.current) {
                try {
                  // Check if we've already processed this exact command+error pair
                  // Add timestamp to avoid permanent caching (reset after 30 seconds)
                  const currentTime = Math.floor(Date.now() / 1000);
                  const commandErrorPair = `${lastCommandRef.current}|||${
                    errorMessage?.trim() || "unknown-error"
                  }|||${Math.floor(currentTime / 30)}`;

                  if (processedPairsRef.current.has(commandErrorPair)) {
                    console.log(
                      "🔄 Skipping duplicate command+error pair:",
                      commandErrorPair
                    );
                    processingErrorRef.current = false;
                    return;
                  }

                  // Track that we're processing this command+error pair
                  processedPairsRef.current.add(commandErrorPair);

                  // Save the current command for history
                  if (
                    lastCommandRef.current &&
                    !commandHistoryRef.current.includes(lastCommandRef.current)
                  ) {
                    commandHistoryRef.current.push(lastCommandRef.current);
                    // Keep only the last 10 commands
                    if (commandHistoryRef.current.length > 10) {
                      commandHistoryRef.current.shift();
                    }
                  }

                  console.log(
                    "Requesting command suggestions for:",
                    lastCommandRef.current
                  );

                  // Add a loading message in the chat panel
                  addMessage("Getting command suggestions...", false);

                  // Get suggested fixes from the command fixer agent
                  try {
                    console.log(
                      "Requesting command suggestions for:",
                      lastCommandRef.current
                    );

                    // Add a loading message in the chat panel
                    addMessage("Getting command suggestions...", false);

                    let suggestions = [];
                    try {
                      // Try to extract the actual exit code from the terminal output
                      // This will be our primary error detection mechanism
                      const exitCodeMatch = data.match(/exit (\d+)/i);
                      const exitCode =
                        exitCodeMatch && exitCodeMatch[1] !== "0"
                          ? parseInt(exitCodeMatch[1], 10)
                          : isNonZeroExit
                          ? 1
                          : 0; // Use exit code 1 for errors without explicit code

                      // Use error message if available, otherwise provide a detailed fallback
                      const errorContent =
                        errorMessage?.trim() ||
                        (exitCode > 0
                          ? `Non-zero exit code ${exitCode} detected with command: ${lastCommandRef.current}`
                          : "");

                      console.log(
                        `Calling backend fix-command API with: command="${
                          lastCommandRef.current
                        }", exitCode=${exitCode}, error="${errorContent.substring(
                          0,
                          50
                        )}..."`
                      );

                      // Call our backend API instead of direct command fixer
                      const response = await axios.post(
                        "http://localhost:5001/api/fix-command",
                        {
                          command: lastCommandRef.current,
                        }
                      );

                      console.log("Backend API response:", response.data);

                      if (response.data && response.data.suggestions) {
                        suggestions = response.data.suggestions;
                      } else {
                        // If no suggestions were returned, create a default message
                        suggestions = [
                          {
                            command: "echo 'Command failed'",
                            description:
                              response.data.stderr ||
                              "Command execution failed",
                          },
                        ];
                      }

                      console.log(suggestions, " hello");
                    } catch (apiError) {
                      console.warn("Initial API call failed:", apiError);
                      addMessage("Retrying with simplified command...", false);

                      // If the original command fails, try with a simplified version
                      // This is useful for complex commands with multiple arguments
                      const simplifiedCommand =
                        lastCommandRef.current.split(" ")[0];
                      if (
                        simplifiedCommand &&
                        simplifiedCommand !== lastCommandRef.current
                      ) {
                        try {
                          // Extract exit code from the original attempt if possible
                          const exitCodeMatch = data.match(/exit (\d+)/i);
                          const exitCode =
                            exitCodeMatch && exitCodeMatch[1] !== "0"
                              ? parseInt(exitCodeMatch[1], 10)
                              : isNonZeroExit
                              ? 1
                              : 0;

                          console.log(
                            `Retrying with simplified command: "${simplifiedCommand}", exitCode=${exitCode}`
                          );

                          // Call our backend API with the simplified command
                          const response = await axios.post(
                            "http://localhost:5001/api/fix-command",
                            {
                              command: simplifiedCommand,
                            }
                          );

                          if (response.data && response.data.suggestions) {
                            suggestions = response.data.suggestions;
                          } else {
                            // If no suggestions were returned, create a default message
                            suggestions = [
                              {
                                command: "echo 'Command failed'",
                                description:
                                  response.data.stderr ||
                                  "Command execution failed",
                              },
                            ];
                          }
                        } catch (retryError) {
                          console.error(
                            "Retry API call also failed:",
                            retryError
                          );
                          throw retryError; // Re-throw to be handled by outer catch
                        }
                      } else {
                        throw apiError; // Re-throw the original error
                      }
                    }

                    // If we have no suggestions, we can try one more time with a simplified approach
                    if (suggestions.length === 0) {
                      console.log(
                        "No suggestions found. Trying a more generic approach."
                      );

                      try {
                        // Extract exit code from the output if possible
                        const exitCodeMatch = data.match(/exit (\d+)/i);
                        const exitCode =
                          exitCodeMatch && exitCodeMatch[1] !== "0"
                            ? parseInt(exitCodeMatch[1], 10)
                            : isNonZeroExit
                            ? 1
                            : 0; // Use exit code 1 for errors without explicit code

                        // Log what we're attempting
                        console.log(
                          `Making final generic attempt with exitCode=${exitCode}`
                        );

                        // Make one final call to the backend API
                        const response = await axios.post(
                          "http://localhost:5001/api/fix-command",
                          {
                            command: lastCommandRef.current,
                          }
                        );

                        if (response.data && response.data.suggestions) {
                          suggestions = response.data.suggestions;
                        } else {
                          // If no suggestions were returned, create a simple fallback
                          suggestions = [
                            {
                              command: `${
                                lastCommandRef.current.split(" ")[0]
                              } --help`,
                              description: "Get help for this command",
                            },
                          ];
                        }
                      } catch (genericError) {
                        console.error(
                          "Generic fallback API call failed:",
                          genericError
                        );
                        // Continue with whatever suggestions we have
                      }
                    }

                    console.log({
                      lastCommandRef: lastCommandRef.current,
                      errorMessage:
                        errorMessage?.trim() || "No specific error message",
                      suggestionsReceived: suggestions.length,
                    });

                    if (suggestions.length > 0) {
                      console.log(
                        "Command suggestions received: ====",
                        suggestions
                      );
                      addSuggestions(
                        lastCommandRef.current,
                        errorMessage?.trim() || "Command execution error",
                        suggestions
                      );
                    } else {
                      // If we couldn't get any suggestions, inform the user
                      addMessage(
                        "Couldn't generate specific suggestions for this error. Try a different command.",
                        true
                      );
                    }
                  } catch (error: unknown) {
                    console.error("Error getting command suggestions:", error);

                    // Safely extract error message if it exists
                    const errorMessage =
                      error instanceof Error
                        ? error.message
                        : typeof error === "string"
                        ? error
                        : "Unknown error";

                    // Provide helpful feedback based on the type of error
                    if (errorMessage.includes("API key")) {
                      addMessage(
                        "Command suggestions unavailable: API key not configured.",
                        true
                      );
                      addMessage(
                        "Please contact the administrator to set up the API key.",
                        false
                      );
                    } else if (errorMessage.includes("timeout")) {
                      addMessage(
                        "Command suggestions timed out. The API server might be busy.",
                        true
                      );
                      addMessage("Try again in a moment.", false);
                    } else {
                      // Generic error handling for any type of command or language
                      const baseCommand = lastCommandRef.current.split(" ")[0];
                      const simplifiedSuggestions = [];

                      if (baseCommand) {
                        // Generic help suggestion works for many command-line tools
                        simplifiedSuggestions.push({
                          command: `${baseCommand} --help`,
                          description: "Show help for this command",
                        });

                        // Adding version check as it's common across many tools
                        simplifiedSuggestions.push({
                          command: `${baseCommand} --version`,
                          description: "Check version of this tool",
                        });

                        // General troubleshooting suggestions
                        if (
                          errorMessage
                            .toLowerCase()
                            .includes("command not found")
                        ) {
                          simplifiedSuggestions.push({
                            command: `which ${baseCommand}`,
                            description: "Check if this command is installed",
                          });
                          simplifiedSuggestions.push({
                            command: `echo $PATH`,
                            description: "Check your PATH environment variable",
                          });

                          // Add installation suggestions for common tools
                          if (
                            ["npm", "yarn", "node", "python", "pip"].includes(
                              baseCommand
                            )
                          ) {
                            simplifiedSuggestions.push({
                              command: `brew install ${baseCommand}`,
                              description: `Try installing ${baseCommand} with Homebrew`,
                            });
                          }
                        }

                        // Permission denied errors
                        if (
                          errorMessage
                            .toLowerCase()
                            .includes("permission denied")
                        ) {
                          simplifiedSuggestions.push({
                            command: `chmod +x ${
                              lastCommandRef.current.split(" ")[1] || "filename"
                            }`,
                            description:
                              "Make the file executable if it's a script",
                          });
                        }
                      }

                      if (simplifiedSuggestions.length > 0) {
                        addMessage(
                          "API call failed, but here are some general suggestions:",
                          true
                        );
                        addSuggestions(
                          lastCommandRef.current,
                          errorMessage.trim(),
                          simplifiedSuggestions
                        );
                      } else {
                        addMessage(
                          "Couldn't generate suggestions. The command suggestion service is unavailable.",
                          true
                        );
                        addMessage(
                          "Please try again later or modify your command.",
                          false
                        );
                      }
                    }
                  }
                } catch (err) {
                  console.error("Error getting command suggestions:", err);
                  // Even on error, try to provide some fallback suggestions
                  // but don't force any hardcoded suggestions
                  addMessage(
                    "Error getting command suggestions. The API might be unavailable.",
                    true
                  );

                  // Provide minimal guidance based on the command pattern
                  const fallbackGuidance = [];

                  if (lastCommandRef.current) {
                    const cmdParts = lastCommandRef.current.split(" ");
                    const baseCmd = cmdParts[0];

                    if (baseCmd) {
                      fallbackGuidance.push({
                        command: `man ${baseCmd}`,
                        description: "Check the manual for this command",
                      });

                      fallbackGuidance.push({
                        command: `${baseCmd} --help`,
                        description: "Show help for this command",
                      });
                    }
                  }

                  if (fallbackGuidance.length > 0) {
                    addSuggestions(
                      lastCommandRef.current,
                      errorMessage?.trim() || "Command execution error",
                      fallbackGuidance
                    );
                  }
                }
              }

              // Reset the processing flag after a small delay
              const errorResetTimeout = setTimeout(() => {
                // Check if component is still mounted before updating refs
                if (processingErrorRef.current !== undefined) {
                  processingErrorRef.current = false;

                  // Also reset the current command ref to ensure we don't
                  // track commands incorrectly after errors
                  if (currentCommandRef.current === lastCommandRef.current) {
                    currentCommandRef.current = "";
                  }
                }
              }, 300);

              // Store the timeout ID for cleanup
              timeoutIdsRef.current.push(errorResetTimeout);
            });
          } else {
            processingErrorRef.current = false;
          }
        }
      } catch (err) {
        console.error("Error in terminal error detection:", err);
        processingErrorRef.current = false;
      }
    },
    [addErrorMessage, addMessage, addSuggestions]
  );
  useEffect(() => {
    console.log("Initializing terminal component");

    // Helper function for safer terminal fitting
    const runSafeFit = () => {
      if (
        fitAddonRef.current &&
        terminalInstance.current &&
        terminalRef.current &&
        document.body.contains(terminalRef.current)
      ) {
        try {
          // Check for valid dimensions before attempting fit
          if (
            terminalRef.current.offsetWidth > 0 &&
            terminalRef.current.offsetHeight > 0
          ) {
            console.log("Running safe fit with dimensions:", {
              width: terminalRef.current.offsetWidth,
              height: terminalRef.current.offsetHeight,
            });

            fitAddonRef.current.fit();

            // Verify dimensions exist after fit before emitting
            if (
              terminalInstance.current &&
              typeof terminalInstance.current.cols === "number" &&
              typeof terminalInstance.current.rows === "number"
            ) {
              console.log("Terminal dimensions after fit:", {
                cols: terminalInstance.current.cols,
                rows: terminalInstance.current.rows,
              });

              if (socketRef.current) {
                socketRef.current.emit("resize", {
                  cols: terminalInstance.current.cols,
                  rows: terminalInstance.current.rows,
                });
              }
            } else {
              console.warn(
                "Terminal dimensions unavailable after fit:",
                terminalInstance.current
              );
            }
          } else {
            console.warn("Terminal container has no dimensions for fit");
          }
        } catch (e) {
          console.error("Error in safe fit:", e);
        }
      } else {
        console.warn("Missing references for safe fit");
      }
    };

    // Initialize socket connection with reconnection logic
    try {
      // Set up socket with reconnection options
      socketRef.current = io("http://localhost:5001", {
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 10000,
      });

      console.log("Socket connection initializing...");

      // Handle connection events
      socketRef.current.on("connect", () => {
        console.log(
          "Socket connected successfully with ID:",
          socketRef.current?.id
        );
        terminalInstance.current?.write(
          "\r\n\x1b[32m> Connected to server.\x1b[0m\r\n"
        );
        reconnectAttemptsRef.current = 0; // Reset reconnection attempts on successful connection
      });

      socketRef.current.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        terminalInstance.current?.write(
          `\r\n\x1b[31m> Connection error: ${err.message}\x1b[0m\r\n`
        );
        addErrorMessage(
          `Terminal connection error: ${err.message}. Attempting to reconnect...`
        );
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        terminalInstance.current?.write(
          `\r\n\x1b[33m> Disconnected from server: ${reason}\x1b[0m\r\n`
        );

        if (reason === "io server disconnect") {
          // Server initiated the disconnect, try to reconnect manually
          socketRef.current?.connect();
        }
      });

      socketRef.current.on("reconnect", (attemptNumber) => {
        console.log("Socket reconnected after", attemptNumber, "attempts");
        terminalInstance.current?.write(
          `\r\n\x1b[32m> Reconnected to server after ${attemptNumber} attempts\x1b[0m\r\n`
        );
        addMessage("Terminal connection restored.", false);
      });

      socketRef.current.on("reconnect_attempt", (attemptNumber) => {
        console.log("Socket reconnection attempt:", attemptNumber);
        terminalInstance.current?.write(
          `\r\n\x1b[33m> Attempting to reconnect (${attemptNumber})...\x1b[0m\r\n`
        );
      });

      socketRef.current.on("reconnect_failed", () => {
        console.log("Socket reconnection failed");
        terminalInstance.current?.write(
          "\r\n\x1b[31m> Reconnection failed. Please refresh the page.\x1b[0m\r\n"
        );
        addErrorMessage(
          "Terminal connection failed. Please refresh the page to try again."
        );
      });
    } catch (err) {
      console.error("Error initializing socket connection:", err);
      addErrorMessage("Failed to initialize terminal connection");
    }

    // Properly clean up any existing terminal instance
    if (terminalInstance.current) {
      try {
        console.log("Disposing previous terminal instance");
        terminalInstance.current.dispose();
        terminalInstance.current = null;
      } catch (err) {
        console.error("Error disposing previous terminal instance:", err);
      }
    }

    // Initialize terminal with robust error handling
    try {
      // Create new terminal instance
      const term = new XTerm({
        cursorBlink: true,
        theme: {
          background: "#1e1e1e",
          foreground: "#f0f0f0",
        },
        fontFamily: "monospace",
        fontSize: 14,
        scrollback: 1000,
        allowTransparency: true,
      });

      terminalInstance.current = term;
      console.log("Terminal instance created");

      // Initialize addons
      const fitAddon = new FitAddon();
      fitAddonRef.current = fitAddon;
      const webLinksAddon = new WebLinksAddon();

      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);
      console.log("Terminal addons loaded");
    } catch (e) {
      console.error("Error initializing terminal:", e);
    }

    // Make sure we have a valid terminal element before opening
    if (!terminalRef.current) {
      console.error("Terminal container reference is not available");
      return;
    }

    // Open terminal
    if (terminalRef.current && terminalInstance.current) {
      try {
        terminalInstance.current.open(terminalRef.current);
        console.log("Terminal opened successfully");

        // Give the DOM time to properly update and render the terminal
        // before attempting to access dimensions or fit
        const domUpdateDelay = setTimeout(() => {
          // Double check that elements are still valid after the timeout
          if (
            !terminalRef.current ||
            !terminalInstance.current ||
            !fitAddonRef.current
          ) {
            console.warn(
              "Terminal references lost during initialization delay"
            );
            return;
          }

          // Initialize ResizeObserver for more reliable dimension tracking
          // This addresses issues with dimensions during page reloads
          try {
            // Remove any existing observer first
            if (resizeObserverRef.current) {
              resizeObserverRef.current.disconnect();
            }

            // Create new observer
            resizeObserverRef.current = new ResizeObserver(() => {
              // Only run fit if all components exist and terminal is visible
              if (
                fitAddonRef.current &&
                terminalInstance.current &&
                terminalRef.current &&
                document.body.contains(terminalRef.current) &&
                terminalRef.current.offsetWidth > 0 &&
                terminalRef.current.offsetHeight > 0
              ) {
                try {
                  // Safety check for valid cols and rows before fit
                  fitAddonRef.current.fit();

                  // Only emit resize after confirming dimensions exist
                  if (
                    terminalInstance.current.cols &&
                    terminalInstance.current.rows
                  ) {
                    if (socketRef.current) {
                      socketRef.current.emit("resize", {
                        cols: terminalInstance.current.cols,
                        rows: terminalInstance.current.rows,
                      });
                    }
                  }
                } catch (fitErr) {
                  console.error("Error in ResizeObserver fit:", fitErr);
                }
              }
            });

            // Start observing the terminal container
            resizeObserverRef.current.observe(terminalRef.current);
            console.log("ResizeObserver attached to terminal");

            // Initial fit after terminal initialization
            runSafeFit();
          } catch (resizeObserverErr) {
            console.error(
              "Error setting up ResizeObserver:",
              resizeObserverErr
            );
            // Fall back to manual fit logic if ResizeObserver fails
            runSafeFit();
          }
        }, 150); // Slightly longer delay to ensure DOM is ready

        timeoutIdsRef.current.push(domUpdateDelay);
      } catch (err) {
        console.error("Error opening terminal:", err);
      } // Ensure terminal is properly mounted and visible before fitting
      // This is now handled by ResizeObserver and runSafeFit
      // No need for the delayed manual fit attempts
    }

    // Handle terminal output from server with improved display and error detection
    if (socketRef.current) {
      socketRef.current.on("output", (data: string) => {
        if (terminalInstance.current) {
          // Add special formatting for common status messages
          let processedData = data;

          // Format initialization messages
          if (data.includes("Starting project initialization")) {
            processedData = `\x1b[1;34m${data}\x1b[0m`;
          }
          // Format success messages
          else if (
            data.includes("success") ||
            data.includes("completed successfully") ||
            data.includes("Saved lockfile")
          ) {
            processedData = `\x1b[1;32m${data}\x1b[0m`;
          }
          // Format error messages
          else if (
            data.toLowerCase().includes("error") ||
            data.toLowerCase().includes("failed")
          ) {
            processedData = `\x1b[1;31m${data}\x1b[0m`;
          }
          // Format warning messages
          else if (
            data.toLowerCase().includes("warning") ||
            data.toLowerCase().includes("note:") ||
            data.includes("info")
          ) {
            processedData = `\x1b[1;33m${data}\x1b[0m`;
          }
          // Format installation steps
          else if (
            data.includes("Installing") ||
            data.includes("Resolving") ||
            data.includes("Fetching") ||
            data.includes("Linking") ||
            data.includes("Building")
          ) {
            processedData = `\x1b[1;36m${data}\x1b[0m`;
          }

          // Write the processed data to the terminal
          terminalInstance.current.write(processedData);

          // Process error detection in an optimized way
          detectAndHandleError(data);

          // Keep terminal scrolled to bottom for real-time updates
          try {
            if (terminalInstance.current.buffer.active) {
              terminalInstance.current.scrollToBottom();
            }
          } catch (e) {
            console.error("Error scrolling terminal:", e);
          }
        }
      });
    }

    // Handle user input
    if (terminalInstance.current) {
      terminalInstance.current.onData((data: string) => {
        if (socketRef.current) {
          socketRef.current.emit("input", data); // Track command as user types - improved tracking
          if (data === "\r") {
            // Enter key pressed - save the current command as the last command and reset
            const trimmedCommand = currentCommandRef.current.trim();
            if (trimmedCommand) {
              console.log("Command executed:", trimmedCommand);

              // Reset the processed pairs set when executing a new command that doesn't match the last command
              // This ensures we generate new suggestions for the same error with different commands
              if (lastCommandRef.current !== trimmedCommand) {
                // Only reset the processed pairs related to the previous command
                const newProcessedPairs = new Set<string>();
                processedPairsRef.current.forEach((pair) => {
                  if (!pair.startsWith(lastCommandRef.current + "|||")) {
                    newProcessedPairs.add(pair);
                  }
                });
                processedPairsRef.current = newProcessedPairs;

                // When the command changes, clear the last error to ensure fresh processing
                lastErrorRef.current = "";
              }

              // Update the last command reference with the current command
              lastCommandRef.current = trimmedCommand;

              // Also track this in command history
              if (!commandHistoryRef.current.includes(trimmedCommand)) {
                commandHistoryRef.current.push(trimmedCommand);
                if (commandHistoryRef.current.length > 10) {
                  commandHistoryRef.current.shift();
                }
                console.log(
                  "Updated command history:",
                  commandHistoryRef.current
                );
              }

              // Enhanced tracking for specific commands known to cause errors
              if (
                trimmedCommand.match(/node\s+-ver\b/) ||
                trimmedCommand.match(/node\s+--ver\b/)
              ) {
                console.log(
                  "⚠️ Detected potentially problematic command pattern: node -ver or --ver"
                );
                // Pre-emptively notify the user this may cause an error
                addMessage(
                  "Note: The command you entered might be using an incorrect version flag. Watching for errors...",
                  false
                );
              }

              // Python-specific command tracking
              if (
                trimmedCommand.match(/python\s+--v\b/) ||
                trimmedCommand.match(/python3\s+--v\b/) ||
                trimmedCommand.match(/python\s+-ver\b/) ||
                trimmedCommand.match(/python3\s+-ver\b/)
              ) {
                console.log(
                  "⚠️ Detected potentially problematic Python command:",
                  trimmedCommand
                );
                // Store this explicitly as the last command to ensure it's tracked properly
                lastCommandRef.current = trimmedCommand;
                // Clear the processed pairs to ensure we get fresh suggestions
                processedPairsRef.current.clear();
                console.log(
                  "Python command stored in lastCommandRef:",
                  lastCommandRef.current
                );

                addMessage(
                  "Note: Python uses -V (capital V) or --version for checking version. Watching for errors...",
                  false
                );
              }

              // Other node commands that might cause errors
              if (
                trimmedCommand.match(/node\s+-[a-z]{3,}\b/) &&
                !trimmedCommand.includes("--")
              ) {
                console.log(
                  "⚠️ Detected potentially invalid node flag:",
                  trimmedCommand
                );
              }
            }
            currentCommandRef.current = "";
          } else if (data === "\u007F" || data === "\b") {
            // Backspace key - remove last character
            currentCommandRef.current = currentCommandRef.current.slice(0, -1);
          } else if (data === "\u0003") {
            // Ctrl+C - clear current command
            currentCommandRef.current = "";
          } else if (!data.startsWith("\u001b")) {
            // Ignore escape sequences and other control characters
            // Only track printable characters
            currentCommandRef.current += data;
            // Debug logging to see what's being captured
            console.log("Current command buffer:", currentCommandRef.current);
          }
        }
      });
    }

    // Handle window resize
    const handleResize = () => {
      // Use the safer fit method that includes all necessary checks
      runSafeFit();
    };

    window.addEventListener("resize", handleResize);

    // Delay the initial resize to ensure terminal is ready
    const initialResizeTimeout = setTimeout(handleResize, 100);
    timeoutIdsRef.current.push(initialResizeTimeout);

    // Clean up
    return () => {
      console.log("Cleaning up terminal component...");

      // First, remove event listeners
      window.removeEventListener("resize", handleResize);

      // Disconnect ResizeObserver
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
          resizeObserverRef.current = null;
          console.log("ResizeObserver disconnected");
        } catch (err) {
          console.error("Error disconnecting ResizeObserver:", err);
        }
      }

      // Clear any pending timeouts
      if (timeoutIdsRef.current.length > 0) {
        console.log(
          `Clearing ${timeoutIdsRef.current.length} pending timeouts`
        );
        timeoutIdsRef.current.forEach((id) => clearTimeout(id));
        timeoutIdsRef.current = [];
      }

      // Cleanup socket connection
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
          socketRef.current = null;
          console.log("Socket disconnected");
        } catch (socketErr) {
          console.error("Error disconnecting socket:", socketErr);
        }
      }

      // Cleanup fit addon
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.dispose();
          fitAddonRef.current = null;
          console.log("FitAddon disposed");
        } catch (fitErr) {
          console.error("Error disposing fit addon:", fitErr);
        }
      }

      // Cleanup terminal instance last
      if (terminalInstance.current) {
        try {
          terminalInstance.current.dispose();
          terminalInstance.current = null;
          console.log("Terminal instance disposed");
        } catch (termErr) {
          console.error("Error disposing terminal:", termErr);
        }
      }

      // Reset any remaining references as a safety measure
      processingErrorRef.current = false;

      console.log("Terminal cleanup complete");
    };
  }, [addErrorMessage, addSuggestions, detectAndHandleError, addMessage]);

  // Expose the ability to run commands from outside the terminal component
  React.useEffect(() => {
    if (runCommand) {
      (window as any).runTerminalCommand = executeCommand;
    }
    return () => {
      delete (window as any).runTerminalCommand;
    };
  }, [runCommand, executeCommand]);

  // Notify parent component when socket is ready
  useEffect(() => {
    if (socketRef.current && onSocketReady) {
      socketRef.current.on("connect", () => {
        console.log("Socket connected with ID:", socketRef.current?.id);
        if (socketRef.current?.id) {
          onSocketReady(socketRef.current.id);
        }
      });

      // If socket is already connected, notify right away
      if (socketRef.current.connected && socketRef.current.id) {
        onSocketReady(socketRef.current.id);
      }
    }
  }, [onSocketReady]);

  return <TerminalContainer ref={terminalRef} className="terminal-container" />;
};

export default Terminal;
