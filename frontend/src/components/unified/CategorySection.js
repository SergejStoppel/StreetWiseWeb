import React from 'react';
import styled from 'styled-components';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import CollapsibleIssueCard from './CollapsibleIssueCard';

const CategoryContainer = styled.div`
  margin-bottom: var(--spacing-xl);
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--color-surface-secondary);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: ${props => props.$isExpanded ? 'var(--spacing-md)' : '0'};
  
  &:hover {
    background: var(--color-surface-tertiary);
  }
`;

const CategoryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
`;

const CategoryIcon = styled.div`
  font-size: var(--font-size-xl);
  color: ${props => props.$color || 'var(--color-text-primary)'};
`;

const CategoryTitle = styled.h3`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
`;

const CategoryMeta = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
`;

const IssueCountBadge = styled.span`
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

const IssuesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
`;

const CategorySection = ({
  category,
  issues,
  isExpanded,
  onToggle,
  expandedIssues,
  onToggleIssue
}) => {
  const CategoryIconComponent = category.icon;

  return (
    <CategoryContainer>
      <CategoryHeader $isExpanded={isExpanded} onClick={onToggle}>
        <CategoryInfo>
          <CategoryIcon $color={category.color}>
            {CategoryIconComponent && <CategoryIconComponent />}
          </CategoryIcon>
          <CategoryTitle>{category.label}</CategoryTitle>
        </CategoryInfo>
        
        <CategoryMeta>
          <IssueCountBadge>
            {category.issueCount} issue{category.issueCount !== 1 ? 's' : ''}
          </IssueCountBadge>
          <ExpandIcon>
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </ExpandIcon>
        </CategoryMeta>
      </CategoryHeader>
      
      {isExpanded && (
        <IssuesList>
          {issues.map((issue) => (
            <CollapsibleIssueCard
              key={issue.id}
              issue={issue}
              isExpanded={expandedIssues.has(issue.id)}
              onToggle={() => onToggleIssue(issue.id)}
            />
          ))}
        </IssuesList>
      )}
    </CategoryContainer>
  );
};

export default CategorySection;