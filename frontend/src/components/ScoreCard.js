import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  text-align: center;
  position: relative;
  overflow: hidden;
`;

const ScoreCircle = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    ${props => props.color} ${props => props.percentage}%,
    #e5e7eb ${props => props.percentage}%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    width: 90px;
    height: 90px;
    background: white;
    border-radius: 50%;
  }
`;

const ScoreValue = styled.div`
  position: relative;
  z-index: 1;
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
`;

const ScoreUnit = styled.span`
  font-size: 1rem;
  color: #6b7280;
`;

const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const Description = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
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