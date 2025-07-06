import React, { useState } from 'react';
import styled from 'styled-components';
import { FaChevronDown, FaChevronUp, FaExclamationTriangle, FaTimesCircle, FaInfoCircle, FaExclamationCircle } from 'react-icons/fa';

const Container = styled.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7280;
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const EmptyDescription = styled.p`
  color: #9ca3af;
`;

const ViolationCard = styled.div`
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ViolationHeader = styled.div`
  padding: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const ViolationHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const ImpactIcon = styled.div`
  font-size: 1.25rem;
  color: ${props => {
    switch (props.impact) {
      case 'critical': return '#dc2626';
      case 'serious': return '#f59e0b';
      case 'moderate': return '#3b82f6';
      case 'minor': return '#6b7280';
      default: return '#6b7280';
    }
  }};
`;

const ViolationTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const ViolationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const ImpactBadge = styled.span`
  background: ${props => {
    switch (props.impact) {
      case 'critical': return '#fee2e2';
      case 'serious': return '#fef3c7';
      case 'moderate': return '#dbeafe';
      case 'minor': return '#f3f4f6';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.impact) {
      case 'critical': return '#dc2626';
      case 'serious': return '#d97706';
      case 'moderate': return '#2563eb';
      case 'minor': return '#6b7280';
      default: return '#6b7280';
    }
  }};
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
`;

const ElementCount = styled.span`
  background: #e5e7eb;
  color: #4b5563;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
`;

const ExpandIcon = styled.div`
  font-size: 1rem;
  color: #6b7280;
  transition: transform 0.2s ease;
  transform: ${props => props.expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const ViolationDetails = styled.div`
  padding: 0 1.5rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
`;

const Description = styled.p`
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const HelpLink = styled.a`
  color: #2563eb;
  text-decoration: underline;
  font-size: 0.875rem;
  
  &:hover {
    color: #1d4ed8;
  }
`;

const NodesSection = styled.div`
  margin-top: 1rem;
`;

const NodesTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const NodeItem = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  border-left: 4px solid #e5e7eb;
`;

const NodeSelector = styled.code`
  background: #f3f4f6;
  color: #1f2937;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
`;

const NodeMessage = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.5rem;
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
  const [expandedViolations, setExpandedViolations] = useState(new Set());

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
          <EmptyTitle>No Accessibility Violations Found</EmptyTitle>
          <EmptyDescription>
            Great! No accessibility violations were detected in the analysis.
          </EmptyDescription>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      {violations.map((violation, index) => {
        const isExpanded = expandedViolations.has(violation.id);
        
        return (
          <ViolationCard key={violation.id || index}>
            <ViolationHeader onClick={() => toggleViolation(violation.id)}>
              <ViolationHeaderLeft>
                <ImpactIcon impact={violation.impact}>
                  {getImpactIcon(violation.impact)}
                </ImpactIcon>
                <div>
                  <ViolationTitle>{violation.help}</ViolationTitle>
                  <ViolationMeta>
                    <ImpactBadge impact={violation.impact}>
                      {violation.impact || 'Unknown'}
                    </ImpactBadge>
                    <ElementCount>
                      {violation.nodes.length} element{violation.nodes.length !== 1 ? 's' : ''}
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
                <Description>{violation.description}</Description>
                
                {violation.helpUrl && (
                  <HelpLink 
                    href={violation.helpUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Learn more about this issue
                  </HelpLink>
                )}
                
                {violation.nodes && violation.nodes.length > 0 && (
                  <NodesSection>
                    <NodesTitle>Affected Elements:</NodesTitle>
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
                        ... and {violation.nodes.length - 5} more element{violation.nodes.length - 5 !== 1 ? 's' : ''}
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