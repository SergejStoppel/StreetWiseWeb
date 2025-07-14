import React from 'react';
import styled from 'styled-components';
import { FaExclamationTriangle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

const Card = styled.div`
  background: var(--color-surface-elevated);
  padding: var(--spacing-2xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  text-align: center;
  position: relative;
  overflow: hidden;
  border: 2px solid ${props => props.borderColor || 'var(--color-border-primary)'};
  transition: all var(--transition-fast);
  
  &:hover {
    box-shadow: var(--shadow-xl);
    transform: translateY(-3px);
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
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
  line-height: 1;
`;

const ScoreUnit = styled.span`
  font-size: var(--font-size-lg);
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

// Enhanced components for competitor-style display
const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  margin-bottom: var(--spacing-lg);
  background: ${props => props.compliant ? 'var(--color-success-light)' : 'var(--color-error-light)'};
  color: ${props => props.compliant ? 'var(--color-success-text)' : 'var(--color-error-text)'};
  border: 1px solid ${props => props.compliant ? 'var(--color-success)' : 'var(--color-error)'};
`;

const RiskWarning = styled.div`
  background: var(--color-warning-light);
  border: 1px solid var(--color-warning);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-top: var(--spacing-lg);
  color: var(--color-warning-text);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-secondary);
  text-align: center;
  line-height: 1.5;
`;

const WcagBreakdown = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-secondary);
`;

const WcagStat = styled.div`
  text-align: center;
`;

const WcagValue = styled.div`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: ${props => props.color};
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-xs);
`;

const WcagLabel = styled.div`
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-family: var(--font-family-secondary);
  text-transform: uppercase;
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
`;

const ScoreCard = ({ title, score, description, color, wcagBreakdown, enhanced = false }) => {
  const percentage = Math.max(0, Math.min(100, score));
  const isCompliant = score >= 95;
  
  // Enhanced version with competitor-style features
  if (enhanced) {
    return (
      <Card borderColor={isCompliant ? 'var(--color-success)' : 'var(--color-error)'}>
        <StatusBadge compliant={isCompliant}>
          {isCompliant ? (
            <>
              <FaCheckCircle /> COMPLIANT
            </>
          ) : (
            <>
              <FaExclamationTriangle /> NOT COMPLIANT
            </>
          )}
        </StatusBadge>
        
        <ScoreCircle color={color} percentage={percentage * 3.6}>
          <ScoreValue>
            {score}
            <ScoreUnit>%</ScoreUnit>
          </ScoreValue>
        </ScoreCircle>
        
        <Title>{title}</Title>
        <Description>{description}</Description>
        
        {!isCompliant && (
          <RiskWarning>
            <FaInfoCircle style={{ marginRight: '8px' }} />
            Your site may be at risk of accessibility lawsuits. Websites with scores lower than 95% are at risk of accessibility compliance issues.
          </RiskWarning>
        )}
        
        {wcagBreakdown && (
          <WcagBreakdown>
            <WcagStat>
              <WcagValue color="var(--color-error)">{wcagBreakdown.critical || 0}</WcagValue>
              <WcagLabel>Critical Issues</WcagLabel>
            </WcagStat>
            <WcagStat>
              <WcagValue color="var(--color-success)">{wcagBreakdown.passed || 0}</WcagValue>
              <WcagLabel>Passed Audits</WcagLabel>
            </WcagStat>
            <WcagStat>
              <WcagValue color="var(--color-warning)">{wcagBreakdown.manual || 0}</WcagValue>
              <WcagLabel>Manual Audits</WcagLabel>
            </WcagStat>
            <WcagStat>
              <WcagValue color="var(--color-text-tertiary)">{wcagBreakdown.notApplicable || 0}</WcagValue>
              <WcagLabel>Not Applicable</WcagLabel>
            </WcagStat>
          </WcagBreakdown>
        )}
      </Card>
    );
  }
  
  // Original version for backwards compatibility
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