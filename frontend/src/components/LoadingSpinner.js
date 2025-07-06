import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerContainer = styled.div`
  display: inline-block;
  width: ${props => props.size === 'small' ? '16px' : props.size === 'large' ? '40px' : '24px'};
  height: ${props => props.size === 'small' ? '16px' : props.size === 'large' ? '40px' : '24px'};
`;

const Spinner = styled.div`
  width: 100%;
  height: 100%;
  border: 2px solid ${props => props.color || '#f3f4f6'};
  border-top: 2px solid ${props => props.accentColor || '#2563eb'};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingSpinner = ({ size = 'medium', color, accentColor, className }) => {
  return (
    <SpinnerContainer size={size} className={className}>
      <Spinner color={color} accentColor={accentColor} />
    </SpinnerContainer>
  );
};

export default LoadingSpinner;