import React from 'react';
import styled from 'styled-components';

const DebugContainer = styled.div`
  background: #f3f4f6;
  border: 2px dashed #9ca3af;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  overflow-x: auto;
`;

const DebugTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-weight: 600;
`;

const DebugDataDisplay = ({ title, data }) => {
  return (
    <DebugContainer>
      <DebugTitle>DEBUG: {title}</DebugTitle>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </DebugContainer>
  );
};

export default DebugDataDisplay;