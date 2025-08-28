import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { UnifiedResultsContainer, determineCategoryFromIssue } from './unified';

const SeoResults = ({ seoData, score }) => {
  // Transform SEO data to include proper categories
  const transformedIssues = React.useMemo(() => {
    if (!seoData || seoData.length === 0) return [];
    
    return seoData.map(issue => ({
      ...issue,
      category: determineCategoryFromIssue(issue)
    }));
  }, [seoData]);

  return (
    <UnifiedResultsContainer
      title="SEO Analysis"
      titleIcon={<FaSearch />}
      score={score}
      issues={transformedIssues}
      type="SEO"
      emptyStateMessage={{
        title: 'Great SEO Implementation!',
        description: 'No significant SEO issues were found. Your website is well-optimized for search engines.'
      }}
    />
  );
};

export default SeoResults;