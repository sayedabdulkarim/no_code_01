import React from "react";
import styled from "@emotion/styled";
import { Task } from "../types/chat";

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return "✓";
      case "in_progress":
        return "🔄";
      case "failed":
        return "✗";
      case "pending":
        return "○";
      default:
        return "•";
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return "#10b981";
      case "in_progress":
        return "#3b82f6";
      case "failed":
        return "#ef4444";
      case "pending":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  return (
    <Container>
      <Title>Generated Tasks:</Title>
      <TaskItems>
        {tasks.map((task) => (
          <TaskItem key={task.id}>
            <StatusIcon color={getStatusColor(task.status)}>
              {getStatusIcon(task.status)}
            </StatusIcon>
            <TaskContent>
              <TaskTitle status={task.status}>
                Task {task.id}: {task.title}
              </TaskTitle>
              {task.details && <TaskDetails>{task.details}</TaskDetails>}
            </TaskContent>
          </TaskItem>
        ))}
      </TaskItems>
    </Container>
  );
};

const Container = styled.div`
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 8px;
  padding: ${(props) => props.theme.spacing.md};
  margin: ${(props) => props.theme.spacing.sm} 0;
`;

const Title = styled.h4`
  margin: 0 0 ${(props) => props.theme.spacing.md} 0;
  color: ${(props) => props.theme.colors.text};
  font-size: 14px;
  font-weight: 600;
`;

const TaskItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.sm};
`;

const TaskItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${(props) => props.theme.spacing.sm};
`;

const StatusIcon = styled.span<{ color: string }>`
  color: ${(props) => props.color};
  font-size: 16px;
  line-height: 20px;
  flex-shrink: 0;
`;

const TaskContent = styled.div`
  flex: 1;
`;

const TaskTitle = styled.div<{ status: Task["status"] }>`
  font-size: 14px;
  color: ${(props) => props.theme.colors.text};
  text-decoration: ${(props) =>
    props.status === "completed" ? "line-through" : "none"};
  opacity: ${(props) => (props.status === "completed" ? 0.7 : 1)};
`;

const TaskDetails = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.colors.textSecondary || "#6b7280"};
  margin-top: 2px;
`;

export default TaskList;