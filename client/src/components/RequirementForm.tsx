import React from "react";
import styled from "@emotion/styled";

interface RequirementFormProps {
  requirement: string;
  setRequirement: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export const RequirementForm: React.FC<RequirementFormProps> = ({
  requirement,
  setRequirement,
  onSubmit,
  loading,
}) => (
  <Form onSubmit={onSubmit}>
    <TextArea
      value={requirement}
      onChange={(e) => setRequirement(e.target.value)}
      placeholder="Describe the UI you want to create..."
      rows={5}
    />
    <Button type="submit" disabled={loading}>
      {loading ? "Generating..." : "Generate UI"}
    </Button>
  </Form>
);

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.md};
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  padding: ${(props) => props.theme.spacing.lg};
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${(props) => props.theme.spacing.md};
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 4px;
  resize: vertical;
  font-size: 16px;
  min-height: 120px;
`;

const Button = styled.button`
  padding: ${(props) => props.theme.spacing.md};
  background: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
