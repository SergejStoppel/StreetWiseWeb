import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { FaChevronDown, FaExclamationTriangle, FaTimesCircle, FaInfoCircle, FaExclamationCircle } from 'react-icons/fa';

const Container = styled.div`
  background: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  border: 1px solid var(--color-border-primary);
`;

const EmptyState = styled.div`
  padding: var(--spacing-3xl);
  text-align: center;
  color: var(--color-text-secondary);
`;

const EmptyTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
`;

const EmptyDescription = styled.p`
  color: var(--color-text-tertiary);
  font-family: var(--font-family-secondary);
`;

const ViolationCard = styled.div`
  border-bottom: 1px solid var(--color-border-primary);
  
  &:last-child {
    border-bottom: none;
  }
`;

const ViolationHeader = styled.div`
  padding: var(--spacing-lg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  transition: background-color var(--transition-fast);
  
  &:hover {
    background-color: var(--color-surface-secondary);
  }
`;

const ViolationHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
`;

const ImpactIcon = styled.div`
  font-size: var(--font-size-xl);
  color: ${props => {
    switch (props.impact) {
      case 'critical': return 'var(--color-error)';
      case 'serious': return 'var(--color-warning)';
      case 'moderate': return 'var(--color-info)';
      case 'minor': return 'var(--color-text-tertiary)';
      default: return 'var(--color-text-tertiary)';
    }
  }};
`;

const ViolationTitle = styled.h3`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  font-family: var(--font-family-primary);
`;

const ViolationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
`;

const ImpactBadge = styled.span`
  background: ${props => {
    switch (props.impact) {
      case 'critical': return 'var(--color-error-light)';
      case 'serious': return 'var(--color-warning-light)';
      case 'moderate': return 'var(--color-info-light)';
      case 'minor': return 'var(--color-surface-tertiary)';
      default: return 'var(--color-surface-tertiary)';
    }
  }};
  color: ${props => {
    switch (props.impact) {
      case 'critical': return 'var(--color-error-text)';
      case 'serious': return 'var(--color-warning-text)';
      case 'moderate': return 'var(--color-info-text)';
      case 'minor': return 'var(--color-text-tertiary)';
      default: return 'var(--color-text-tertiary)';
    }
  }};
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  font-family: var(--font-family-secondary);
`;

const ElementCount = styled.span`
  background: var(--color-surface-tertiary);
  color: var(--color-text-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-secondary);
`;

const ExpandIcon = styled.div`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  transition: transform var(--transition-fast);
  transform: ${props => props.expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const ViolationDetails = styled.div`
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  background: var(--color-surface-secondary);
  border-top: 1px solid var(--color-border-primary);
`;

const Description = styled.p`
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-family-secondary);
`;


const NodesSection = styled.div`
  margin-top: var(--spacing-md);
`;

const NodesTitle = styled.h4`
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-family-primary);
`;

const NodeItem = styled.div`
  background: var(--color-surface-elevated);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-sm);
  border-left: 4px solid var(--color-border-primary);
  border: 1px solid var(--color-border-secondary);
`;

const NodeSelector = styled.code`
  background: var(--color-surface-secondary);
  color: var(--color-text-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-monospace);
  border: 1px solid var(--color-border-secondary);
`;

const NodeMessage = styled.p`
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-sm);
  font-family: var(--font-family-secondary);
`;

const getImpactIcon = (impact) => {
  switch (impact) {
    case 'critical':
      return <FaTimesCircle />;
    case 'serious':
      return <FaExclamationTriangle />;
    case 'moderate':
      return <FaExclamationCircle />;
    case 'minor':
      return <FaInfoCircle />;
    default:
      return <FaInfoCircle />;
  }
};

const ViolationsList = ({ violations }) => {
  const { t } = useTranslation('dashboard');
  const [expandedViolations, setExpandedViolations] = useState(new Set());

  // Helper function to translate Axe-core violation messages
  const translateViolation = (violation) => {
    const ruleId = violation.id;
    
    // Try to get translated version, fallback to original if not found
    let translatedHelp = violation.help;
    let translatedDescription = violation.description;
    
    try {
      const helpKey = `violations.axeViolations.${ruleId}`;
      const descKey = `violations.axeViolations.${ruleId}-desc`;
      
      // Check if translation exists before using it
      if (t(helpKey) !== helpKey) {
        translatedHelp = t(helpKey);
      }
      if (t(descKey) !== descKey) {
        translatedDescription = t(descKey);
      }
    } catch (error) {
      // If translation fails, use original text
      console.log(`Translation not found for violation ${ruleId}`);
    }
    
    return {
      ...violation,
      help: translatedHelp,
      description: translatedDescription
    };
  };

  const toggleViolation = (violationId) => {
    const newExpanded = new Set(expandedViolations);
    if (newExpanded.has(violationId)) {
      newExpanded.delete(violationId);
    } else {
      newExpanded.add(violationId);
    }
    setExpandedViolations(newExpanded);
  };

  if (!violations || violations.length === 0) {
    return (
      <Container>
        <EmptyState>
          <EmptyTitle>{t('violations.noViolations.title')}</EmptyTitle>
          <EmptyDescription>
            {t('violations.noViolations.description')}
          </EmptyDescription>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      {violations.map((violation, index) => {
        const translatedViolation = translateViolation(violation);
        const isExpanded = expandedViolations.has(violation.id);
        
        return (
          <ViolationCard key={violation.id || index}>
            <ViolationHeader onClick={() => toggleViolation(violation.id)}>
              <ViolationHeaderLeft>
                <ImpactIcon impact={violation.impact}>
                  {getImpactIcon(violation.impact)}
                </ImpactIcon>
                <div>
                  <ViolationTitle>{translatedViolation.help}</ViolationTitle>
                  <ViolationMeta>
                    <ImpactBadge impact={violation.impact}>
                      {t('violations.impact.' + (violation.impact || 'unknown'))}
                    </ImpactBadge>
                    <ElementCount>
                      {t('violations.elementCount', { count: violation.nodes.length })}
                    </ElementCount>
                  </ViolationMeta>
                </div>
              </ViolationHeaderLeft>
              <ExpandIcon expanded={isExpanded}>
                <FaChevronDown />
              </ExpandIcon>
            </ViolationHeader>
            
            {isExpanded && (
              <ViolationDetails>
                <Description>{translatedViolation.description}</Description>
                
                
                {violation.nodes && violation.nodes.length > 0 && (
                  <NodesSection>
                    <NodesTitle>{t('violations.affectedElements')}:</NodesTitle>
                    {violation.nodes.slice(0, 5).map((node, nodeIndex) => (
                      <NodeItem key={nodeIndex}>
                        {node.target && (
                          <NodeSelector>
                            {node.target.join(', ')}
                          </NodeSelector>
                        )}
                        {node.failureSummary && (
                          <NodeMessage>{node.failureSummary}</NodeMessage>
                        )}
                      </NodeItem>
                    ))}
                    {violation.nodes.length > 5 && (
                      <NodeMessage>
                        {t('violations.moreElements', { count: violation.nodes.length - 5 })}
                      </NodeMessage>
                    )}
                  </NodesSection>
                )}
              </ViolationDetails>
            )}
          </ViolationCard>
        );
      })}
    </Container>
  );
};

export default ViolationsList;