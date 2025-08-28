import React from 'react';
import styled from 'styled-components';
import { 
  FaTimes, 
  FaExclamationTriangle, 
  FaExclamationCircle, 
  FaInfoCircle,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';

const IssueCard = styled.div`
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  border-left: 4px solid ${props => getSeverityColor(props.$severity)};
`;

const IssueHeader = styled.div`
  padding: var(--spacing-lg);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-md);
  background: ${props => props.$expanded ? 'var(--color-surface-secondary)' : 'transparent'};
  transition: all var(--transition-fast);
  
  &:hover {
    background: var(--color-surface-secondary);
  }
`;

const IssueTitle = styled.div`
  flex: 1;
`;

const IssueName = styled.h4`
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const IssueDescription = styled.p`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--line-height-relaxed);
`;

const IssueMeta = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
`;

const SeverityBadge = styled.span`
  background: ${props => getSeverityColor(props.$severity)};
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
`;

const OccurrenceCount = styled.span`
  background: var(--color-surface-tertiary);
  color: var(--color-text-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
`;

const ExpandIcon = styled.div`
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
`;

const IssueContent = styled.div`
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  border-top: 1px solid var(--color-border-secondary);
`;

const OccurrenceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
`;

const OccurrenceItem = styled.div`
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
`;

const OccurrenceLocation = styled.div`
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-sm);
  background: var(--color-surface-tertiary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  display: inline-block;
`;

const OccurrenceCode = styled.pre`
  background: var(--color-surface-tertiary);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  overflow-x: auto;
  white-space: pre-wrap;
  margin: var(--spacing-sm) 0;
  border: 1px solid var(--color-border-tertiary);
`;

const OccurrenceFix = styled.div`
  background: var(--color-success-100);
  border: 1px solid var(--color-success-300);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-md);
  margin-top: var(--spacing-sm);
  
  &:before {
    content: '💡 Fix: ';
    font-weight: var(--font-weight-semibold);
    color: var(--color-success-700);
  }
  
  color: var(--color-success-600);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  white-space: pre-line;
`;

// Helper functions
const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical': return 'var(--color-error)';
    case 'serious': return 'var(--color-warning)';
    case 'moderate': return 'var(--color-info)';
    case 'minor': return 'var(--color-success)';
    default: return 'var(--color-text-tertiary)';
  }
};

const getSeverityIcon = (severity) => {
  switch (severity) {
    case 'critical': return <FaTimes />;
    case 'serious': return <FaExclamationTriangle />;
    case 'moderate': return <FaExclamationCircle />;
    case 'minor': return <FaInfoCircle />;
    default: return <FaInfoCircle />;
  }
};

const CollapsibleIssueCard = ({ issue, isExpanded, onToggle }) => {
  const occurrenceCount = issue.count || issue.occurrences?.length || 1;
  
  return (
    <IssueCard $severity={issue.severity}>
      <IssueHeader 
        $expanded={isExpanded}
        onClick={onToggle}
      >
        <IssueTitle>
          <IssueName>
            {getSeverityIcon(issue.severity)}
            {issue.rule?.name || issue.title || issue.message}
          </IssueName>
          <IssueDescription>
            {issue.description || issue.rule?.description || issue.message}
          </IssueDescription>
        </IssueTitle>
        
        <IssueMeta>
          <SeverityBadge $severity={issue.severity}>
            {issue.severity}
          </SeverityBadge>
          {occurrenceCount > 1 && (
            <OccurrenceCount>
              {occurrenceCount} occurrence{occurrenceCount !== 1 ? 's' : ''}
            </OccurrenceCount>
          )}
          <ExpandIcon>
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </ExpandIcon>
        </IssueMeta>
      </IssueHeader>
      
      {isExpanded && (
        <IssueContent>
          {/* If we have structured occurrences */}
          {issue.occurrences && issue.occurrences.length > 0 && (
            <OccurrenceList>
              {issue.occurrences.map((occurrence, index) => (
                <OccurrenceItem key={index}>
                  {occurrence.location && (
                    <OccurrenceLocation>
                      📍 {occurrence.location}
                    </OccurrenceLocation>
                  )}
                  
                  {occurrence.code && (
                    <OccurrenceCode>{occurrence.code}</OccurrenceCode>
                  )}
                  
                  {occurrence.fix && (
                    <OccurrenceFix>{occurrence.fix}</OccurrenceFix>
                  )}
                </OccurrenceItem>
              ))}
            </OccurrenceList>
          )}
          
          {/* Fallback for single issues without occurrences */}
          {(!issue.occurrences || issue.occurrences.length === 0) && (
            <OccurrenceItem>
              {(issue.location_path || issue.location) && (
                <OccurrenceLocation>
                  📍 {issue.location_path || issue.location}
                </OccurrenceLocation>
              )}
              
              {issue.code_snippet && (
                <OccurrenceCode>{issue.code_snippet}</OccurrenceCode>
              )}
              
              {issue.fix_suggestion && (
                <OccurrenceFix>{issue.fix_suggestion}</OccurrenceFix>
              )}
            </OccurrenceItem>
          )}
        </IssueContent>
      )}
    </IssueCard>
  );
};

export default CollapsibleIssueCard;