import React from 'react';
import styled from 'styled-components';
import { FaChevronDown, FaChevronRight, FaExclamationTriangle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import { AccessibilityIssue } from '../../../../models/AccessibilityIssue';

const TableRow = styled.tr`
  transition: var(--transition-fast);
  cursor: pointer;
  
  &:hover {
    background: var(--color-surface-secondary);
  }
  
  &.expanded {
    background: var(--color-surface-secondary);
  }
`;

const TableCell = styled.td`
  padding: var(--spacing-lg);
  vertical-align: top;
  border-bottom: 1px solid var(--color-border-secondary);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
`;

const IssueTitle = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
`;

const ExpandIcon = styled.span`
  display: inline-flex;
  align-items: center;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
  transition: var(--transition-fast);
  
  &:hover {
    color: var(--color-text-secondary);
  }
`;

const IssueDescription = styled.div`
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  line-height: var(--line-height-normal);
  margin-top: var(--spacing-xs);
`;

const SeverityBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  
  ${props => {
    switch (props.severity) {
      case 'critical':
        return `
          background: #FFEBEE;
          color: #C62828;
          border: 1px solid #F44336;
        `;
      case 'serious':
        return `
          background: #FFF3E0;
          color: #E65100;
          border: 1px solid #FF9800;
        `;
      case 'moderate':
        return `
          background: #F3E5F5;
          color: #6A1B9A;
          border: 1px solid #9C27B0;
        `;
      case 'minor':
        return `
          background: #E8F5E8;
          color: #2E7D32;
          border: 1px solid #4CAF50;
        `;
      default:
        return `
          background: var(--color-surface-tertiary);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border-primary);
        `;
    }
  }}
`;

const CategoryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  background: ${props => props.backgroundColor || 'var(--color-surface-tertiary)'};
  color: var(--color-text-secondary);
  border: 1px solid ${props => props.borderColor || 'var(--color-border-primary)'};
  margin-left: var(--spacing-sm);
`;

const CategoryIcon = styled.span`
  font-size: var(--font-size-sm);
`;

const BadgeContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
`;

const ElementCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-tertiary);
  color: var(--color-text-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  min-width: 32px;
  height: 24px;
`;

const WcagBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-warning-light);
  color: var(--color-warning-text);
  border: 1px solid var(--color-warning);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
`;

const DisabilityGroups = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
`;

const DisabilityBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-info-light);
  color: var(--color-info-text);
  border: 1px solid var(--color-info);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-interactive-primary);
  color: var(--color-text-on-brand);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-fast);
  
  &:hover {
    background: var(--color-interactive-primary-hover);
    transform: translateY(-1px);
  }
`;

const ExpandedRow = styled.tr`
  background: var(--color-surface-secondary);
  
  td {
    padding: 0;
    border-bottom: 2px solid var(--color-border-primary);
  }
`;

const ExpandedContent = styled.div`
  padding: var(--spacing-xl);
  background: var(--color-surface-secondary);
  border-top: 1px solid var(--color-border-primary);
`;

const getSeverityIcon = (severity) => {
  switch (severity) {
    case 'critical':
      return <FaExclamationTriangle />;
    case 'serious':
      return <FaExclamationCircle />;
    case 'moderate':
    case 'minor':
      return <FaInfoCircle />;
    default:
      return <FaInfoCircle />;
  }
};

const IssueRow = ({ issue, isExpanded, onToggle }) => {
  const handleRowClick = (e) => {
    // Don't toggle if clicking on action buttons
    if (e.target.closest('button') && !e.target.closest('.expand-button')) {
      return;
    }
    onToggle();
  };

  // Create AccessibilityIssue instance if not already
  const issueInstance = issue instanceof AccessibilityIssue ? issue : new AccessibilityIssue(issue);

  return (
    <>
      <TableRow 
        onClick={handleRowClick}
        className={isExpanded ? 'expanded' : ''}
      >
        <TableCell>
          <IssueTitle>
            <ExpandIcon className="expand-button">
              {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            </ExpandIcon>
            {issueInstance.title}
          </IssueTitle>
          <IssueDescription>
            {issueInstance.description}
          </IssueDescription>
        </TableCell>
        
        <TableCell>
          <BadgeContainer>
            <SeverityBadge severity={issueInstance.severity}>
              {getSeverityIcon(issueInstance.severity)}
              {issueInstance.severity}
            </SeverityBadge>
          </BadgeContainer>
        </TableCell>
        
        <TableCell>
          <ElementCount>
            {issueInstance.elementCount}
          </ElementCount>
        </TableCell>
        
        <TableCell>
          <WcagBadge>
            Level {issueInstance.wcagLevel}
          </WcagBadge>
        </TableCell>
        
        <TableCell>
          <DisabilityGroups>
            {issueInstance.disabilityGroups.slice(0, 2).map((group, index) => (
              <DisabilityBadge key={index}>
                {group}
              </DisabilityBadge>
            ))}
            {issueInstance.disabilityGroups.length > 2 && (
              <DisabilityBadge>
                +{issueInstance.disabilityGroups.length - 2} more
              </DisabilityBadge>
            )}
          </DisabilityGroups>
        </TableCell>
        
        <TableCell>
          <ActionButton onClick={() => console.log('View details for:', issue.id)}>
            View Details
          </ActionButton>
        </TableCell>
      </TableRow>
      
      {isExpanded && (
        <ExpandedRow>
          <td colSpan="6">
            <ExpandedContent>
              <div>
                <h4>Issue Details</h4>
                <p><strong>Elements Affected:</strong> {issueInstance.elementCount}</p>
                
                <h5>WCAG Success Criteria</h5>
                <ul>
                  {issueInstance.wcagCriteria.map((criterion, index) => (
                    <li key={index}>
                      <strong>{criterion.id}:</strong> {criterion.title} (Level {criterion.level})
                    </li>
                  ))}
                </ul>
                
                <h5>Affected Disability Groups</h5>
                <div>
                  {issueInstance.disabilityGroups.map((group, index) => (
                    <DisabilityBadge key={index} style={{ marginRight: '8px', marginBottom: '4px' }}>
                      {group}
                    </DisabilityBadge>
                  ))}
                </div>
                
                {issueInstance.remediation.summary && (
                  <>
                    <h5>How to Fix</h5>
                    <p>{issueInstance.remediation.summary}</p>
                    {issueInstance.remediation.steps && issueInstance.remediation.steps.length > 0 && (
                      <ol>
                        {issueInstance.remediation.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    )}
                  </>
                )}
              </div>
            </ExpandedContent>
          </td>
        </ExpandedRow>
      )}
    </>
  );
};

export default IssueRow;