import React from 'react';
import { FaAccessibleIcon } from 'react-icons/fa';
import { UnifiedResultsContainer, determineCategoryFromIssue } from './unified';

const AccessibilityResults = ({ accessibilityData, score }) => {
  // Transform issues to add proper categories
  const transformedIssues = React.useMemo(() => {
    if (!accessibilityData || accessibilityData.length === 0) return [];
    
    return accessibilityData.map(issue => ({
      ...issue,
      category: determineCategoryFromIssue(issue)
    }));
  }, [accessibilityData]);

  return (
    <UnifiedResultsContainer
      title="Accessibility Analysis"
      titleIcon={<FaAccessibleIcon />}
      score={score}
      issues={transformedIssues}
      type="accessibility"
      emptyStateMessage={{
        title: 'Great Accessibility Implementation!',
        description: 'No accessibility issues found! Your website meets all accessibility requirements we tested.'
      }}
    />
  );
};

export default AccessibilityResults;