import React from 'react';
import styled from 'styled-components';
import { FaTachometerAlt, FaBolt, FaChartLine } from 'react-icons/fa';
import { UnifiedResultsContainer, determineCategoryFromIssue } from './unified';

const PerformanceMetricsContainer = styled.div`
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-surface-elevated);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-primary);
`;

const MetricsTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
`;

const MetricCard = styled.div`
  background: var(--color-surface-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  text-align: center;
  border: 1px solid var(--color-border-secondary);
`;

const MetricValue = styled.div`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-xs);
  color: ${props => {
    if (props.$status === 'good') return 'var(--color-success)';
    if (props.$status === 'needs-improvement') return 'var(--color-warning)';
    if (props.$status === 'poor') return 'var(--color-error)';
    return 'var(--color-text-primary)';
  }};
`;

const MetricLabel = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
`;

const MetricThreshold = styled.div`
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  font-style: italic;
`;

const ScoreContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-surface-primary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-secondary);
`;

const OverallScore = styled.div`
  text-align: center;
`;

const ScoreValue = styled.div`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-extrabold);
  color: ${props => {
    if (props.$score >= 90) return 'var(--color-success)';
    if (props.$score >= 50) return 'var(--color-warning)';
    return 'var(--color-error)';
  }};
`;

const ScoreLabel = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
`;

const getMetricStatus = (value, thresholds) => {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
};

const formatMetricValue = (value, unit) => {
  if (value === null || value === undefined) return 'N/A';
  
  switch (unit) {
    case 's':
      return `${value.toFixed(2)}s`;
    case 'ms':
      return `${Math.round(value)}ms`;
    case 'score':
      return value.toFixed(3);
    default:
      return value.toString();
  }
};

const PerformanceResults = ({ performanceData, score, metrics }) => {
  // Transform performance data to include proper categories
  const transformedIssues = React.useMemo(() => {
    if (!performanceData || performanceData.length === 0) return [];
    
    return performanceData.map(issue => ({
      ...issue,
      category: determineCategoryFromIssue(issue)
    }));
  }, [performanceData]);

  // Core Web Vitals thresholds
  const cwvThresholds = {
    lcp: { good: 2.5, needsImprovement: 4 },
    cls: { good: 0.1, needsImprovement: 0.25 },
    tbt: { good: 200, needsImprovement: 600 },
    fcp: { good: 1.8, needsImprovement: 3 }
  };

  const coreWebVitals = [
    {
      key: 'lcp',
      label: 'Largest Contentful Paint',
      value: metrics?.lcp,
      unit: 's',
      threshold: 'Good: ≤2.5s, Poor: >4s',
      description: 'How quickly the main content loads'
    },
    {
      key: 'cls',
      label: 'Cumulative Layout Shift',
      value: metrics?.cls,
      unit: 'score',
      threshold: 'Good: ≤0.1, Poor: >0.25',
      description: 'Visual stability during loading'
    },
    {
      key: 'tbt',
      label: 'Total Blocking Time',
      value: metrics?.tbt,
      unit: 'ms',
      threshold: 'Good: ≤200ms, Poor: >600ms',
      description: 'How long the page is blocked from responding'
    },
    {
      key: 'fcp',
      label: 'First Contentful Paint',
      value: metrics?.fcp,
      unit: 's',
      threshold: 'Good: ≤1.8s, Poor: >3s',
      description: 'How quickly content first appears'
    }
  ];

  const renderMetrics = () => (
    <PerformanceMetricsContainer>
      <MetricsTitle>
        <FaChartLine />
        Core Web Vitals Metrics
      </MetricsTitle>
      
      <MetricsGrid>
        {coreWebVitals.map((metric) => {
          const status = metric.value ? getMetricStatus(metric.value, cwvThresholds[metric.key]) : null;
          
          return (
            <MetricCard key={metric.key}>
              <MetricLabel>{metric.label}</MetricLabel>
              <MetricValue $status={status}>
                {formatMetricValue(metric.value, metric.unit)}
              </MetricValue>
              <MetricThreshold>{metric.threshold}</MetricThreshold>
            </MetricCard>
          );
        })}
      </MetricsGrid>

      <ScoreContainer>
        <OverallScore>
          <ScoreValue $score={score || 0}>
            {score || 0}
          </ScoreValue>
          <ScoreLabel>Performance Score</ScoreLabel>
        </OverallScore>
      </ScoreContainer>
    </PerformanceMetricsContainer>
  );

  return (
    <>
      {metrics && renderMetrics()}
      <UnifiedResultsContainer
        title="Performance Analysis"
        titleIcon={<FaTachometerAlt />}
        score={score}
        issues={transformedIssues}
        type="Performance"
        emptyStateMessage={{
          title: 'Excellent Performance!',
          description: 'No significant performance issues were found. Your website loads fast and provides a great user experience.'
        }}
      />
    </>
  );
};

export default PerformanceResults;