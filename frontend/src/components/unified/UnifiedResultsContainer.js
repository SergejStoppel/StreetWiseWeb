import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaTimes,
  FaCheck,
  FaInfoCircle
} from 'react-icons/fa';
import CategorySection from './CategorySection';
import { getCategoryConfig } from './categoryConfig';

const ResultsSection = styled.section`
  background: var(--color-surface-elevated);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--spacing-xl);
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-lg);
`;

const SectionTitle = styled.h2`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const ScoreGrid = styled.div`
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
`;

const ScoreCard = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-surface-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-secondary);
`;

const ScoreIcon = styled.div`
  font-size: var(--font-size-lg);
  color: ${props => props.$color};
`;

const ScoreValue = styled.div`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
`;

const ScoreLabel = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
`;

const StatusBanner = styled.div`
  background: ${props => props.$variant === 'success' ? 'var(--color-success-100)' : 'var(--color-error-100)'};
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
  border: 1px solid ${props => props.$variant === 'success' ? 'var(--color-success-300)' : 'var(--color-error-300)'};
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const StatusIcon = styled.div`
  font-size: var(--font-size-lg);
  color: ${props => props.$variant === 'success' ? 'var(--color-success-600)' : 'var(--color-error-600)'};
  flex-shrink: 0;
`;

const StatusContent = styled.div`
  flex: 1;
`;

const StatusTitle = styled.div`
  font-weight: var(--font-weight-medium);
  color: ${props => props.$variant === 'success' ? 'var(--color-success-700)' : 'var(--color-error-700)'};
  font-size: var(--font-size-sm);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-secondary);
  background: var(--color-surface-secondary);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-secondary);
`;

const EmptyStateIcon = styled.div`
  font-size: var(--font-size-4xl);
  color: var(--color-success);
  margin-bottom: var(--spacing-lg);
`;

const UnifiedResultsContainer = ({ 
  title, 
  titleIcon, 
  score, 
  issues, 
  type = 'accessibility',
  emptyStateMessage
}) => {
  // Group issues by category
  const categorizedIssues = React.useMemo(() => {
    if (!issues || issues.length === 0) return {};
    
    const grouped = {};
    issues.forEach(issue => {
      const category = issue.category || 'general';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(issue);
    });
    
    return grouped;
  }, [issues]);

  // Initialize with first category expanded
  const firstCategory = Object.keys(categorizedIssues)[0] || null;
  const [expandedCategories, setExpandedCategories] = useState(() => {
    return firstCategory ? new Set([firstCategory]) : new Set();
  });
  const [expandedIssues, setExpandedIssues] = useState(new Set());

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleIssue = (issueId) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const totalIssues = issues?.length || 0;
  const criticalIssues = issues?.filter(issue => 
    issue.severity === 'critical' || issue.severity === 'serious'
  ).length || 0;
  const hasIssues = totalIssues > 0;

  if (!issues || issues.length === 0) {
    return (
      <ResultsSection>
        <HeaderSection>
          <SectionTitle>
            {titleIcon}
            {title}
          </SectionTitle>
          
          <ScoreCard>
            <ScoreIcon $color="var(--color-success)">
              <FaCheckCircle />
            </ScoreIcon>
            <ScoreValue>{score || 100}</ScoreValue>
            <ScoreLabel>/100</ScoreLabel>
          </ScoreCard>
        </HeaderSection>

        <EmptyState>
          <EmptyStateIcon>
            <FaCheckCircle />
          </EmptyStateIcon>
          <h3>{emptyStateMessage?.title || `Great ${type} implementation!`}</h3>
          <p>{emptyStateMessage?.description || `No ${type} issues were found. Your website follows best practices.`}</p>
        </EmptyState>
      </ResultsSection>
    );
  }

  return (
    <ResultsSection>
      <HeaderSection>
        <SectionTitle>
          {titleIcon}
          {title}
        </SectionTitle>
        
        <ScoreGrid>
          <ScoreCard>
            <ScoreIcon $color={getScoreColor(score || 0)}>
              <FaInfoCircle />
            </ScoreIcon>
            <ScoreValue>{score || 0}</ScoreValue>
            <ScoreLabel>/100</ScoreLabel>
          </ScoreCard>
          
          <ScoreCard>
            <ScoreIcon $color={hasIssues ? 'var(--color-warning)' : 'var(--color-success)'}>
              {hasIssues ? <FaExclamationTriangle /> : <FaCheckCircle />}
            </ScoreIcon>
            <ScoreValue>{totalIssues}</ScoreValue>
            <ScoreLabel>issues</ScoreLabel>
          </ScoreCard>
          
          {criticalIssues > 0 && (
            <ScoreCard>
              <ScoreIcon $color="var(--color-error)">
                <FaTimes />
              </ScoreIcon>
              <ScoreValue>{criticalIssues}</ScoreValue>
              <ScoreLabel>critical</ScoreLabel>
            </ScoreCard>
          )}
        </ScoreGrid>
      </HeaderSection>

      <StatusBanner $variant={score >= 80 ? 'success' : 'error'}>
        <StatusIcon $variant={score >= 80 ? 'success' : 'error'}>
          {score >= 80 ? <FaCheckCircle /> : <FaExclamationTriangle />}
        </StatusIcon>
        <StatusContent>
          <StatusTitle $variant={score >= 80 ? 'success' : 'error'}>
            {score >= 80 
              ? `Good ${type} foundation`
              : `${type} needs improvement`
            }
            {totalIssues === 0 
              ? ` - Your website follows ${type} best practices well.`
              : ` - Found ${totalIssues} ${type.toLowerCase()} issues${criticalIssues > 0 ? ` (${criticalIssues} critical)` : ''}.`
            }
          </StatusTitle>
        </StatusContent>
      </StatusBanner>

      {Object.entries(categorizedIssues).map(([categoryKey, categoryIssues]) => {
        const categoryConfig = getCategoryConfig(categoryKey);
        
        return (
          <CategorySection
            key={categoryKey}
            category={{
              key: categoryKey,
              ...categoryConfig,
              issueCount: categoryIssues.length
            }}
            issues={categoryIssues}
            isExpanded={expandedCategories.has(categoryKey)}
            onToggle={() => toggleCategory(categoryKey)}
            expandedIssues={expandedIssues}
            onToggleIssue={toggleIssue}
          />
        );
      })}
    </ResultsSection>
  );
};

export default UnifiedResultsContainer;