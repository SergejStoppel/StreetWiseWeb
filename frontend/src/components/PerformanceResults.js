import React from 'react';
import { FaRocket } from 'react-icons/fa';
import { UnifiedResultsContainer, determineCategoryFromIssue } from './unified';

const PerformanceResults = ({ performanceData, score }) => {
  // Transform Performance data to include proper categories
  const transformedIssues = React.useMemo(() => {
    if (!performanceData || performanceData.length === 0) return [];

    return performanceData.map(issue => ({
      ...issue,
      category: determineCategoryFromIssue(issue)
    }));
  }, [performanceData]);

  return (
    <UnifiedResultsContainer
      title="Performance Analysis"
      titleIcon={<FaRocket />}
      score={score}
      issues={transformedIssues}
      type="Performance"
      emptyStateMessage={{
        title: 'Excellent Performance!',
        description: 'No significant performance issues were found. Your website loads efficiently and follows best practices.'
      }}
    />
  );
};

export default PerformanceResults;
