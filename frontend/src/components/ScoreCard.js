import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: var(--color-surface-elevated);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  text-align: center;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border-primary);
  transition: all var(--transition-fast);
  
  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
`;

const ScoreCircle = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    ${props => props.color} ${props => props.percentage}%,
    var(--color-border-secondary) ${props => props.percentage}%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-md);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    width: 90px;
    height: 90px;
    background: var(--color-surface-elevated);
    border-radius: 50%;
  }
`;

const ScoreValue = styled.div`
  position: relative;
  z-index: 1;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
`;

const ScoreUnit = styled.span`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
`;

const Title = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-family-primary);
`;

const Description = styled.p`
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-family-secondary);
`;

const ScoreCard = ({ title, score, description, color }) => {
  const percentage = Math.max(0, Math.min(100, score));
  
  return (
    <Card>
      <ScoreCircle color={color} percentage={percentage * 3.6}>
        <ScoreValue>
          {score}
          <ScoreUnit>/100</ScoreUnit>
        </ScoreValue>
      </ScoreCircle>
      <Title>{title}</Title>
      <Description>{description}</Description>
    </Card>
  );
};

export default ScoreCard;