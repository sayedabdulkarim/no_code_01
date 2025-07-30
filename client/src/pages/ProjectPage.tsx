import React from 'react';
import { useParams } from 'react-router-dom';

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  
  return (
    <div>
      <h1>Project Page - Placeholder</h1>
      <p>Project ID: {projectId}</p>
      <p>Chat and tabs will go here</p>
    </div>
  );
};

export default ProjectPage;