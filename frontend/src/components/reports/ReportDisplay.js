import React from 'react';
import styled from 'styled-components';
import FreeReportDisplay from './FreeReportDisplay';
import DetailedReportDisplay from './DetailedReportDisplay';

/**
 * ReportDisplay - Main component that renders appropriate report type
 * Automatically chooses between FreeReportDisplay and DetailedReportDisplay
 * based on the report data
 */
const ReportDisplay = ({ reportData, loading = false, error = null, onUpgradeRequest }) => {
  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Generating your accessibility report...</LoadingText>
        <LoadingSubtext>This may take a few moments while we analyze your website</LoadingSubtext>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <ErrorIcon>⚠️</ErrorIcon>
        <ErrorTitle>Report Generation Failed</ErrorTitle>
        <ErrorMessage>{error}</ErrorMessage>
        <RetryButton onClick={() => window.location.reload()}>
          Try Again
        </RetryButton>
      </ErrorContainer>
    );
  }

  if (!reportData) {
    return (
      <EmptyContainer>
        <EmptyIcon>📊</EmptyIcon>
        <EmptyTitle>No Report Data</EmptyTitle>
        <EmptyMessage>Please run an accessibility analysis to view your report.</EmptyMessage>
      </EmptyContainer>
    );
  }

  // Determine report type from the data
  const reportType = reportData.structuredReport?.reportType || 
                    reportData.reportType || 
                    'free'; // Default to free

  const isDetailedReport = reportType === 'detailed';

  return (
    <ReportContainer>
      {/* Show upgrade notice for free reports */}
      {!isDetailedReport && (
        <UpgradeNotice>
          <UpgradeIcon>⭐</UpgradeIcon>
          <UpgradeContent>
            <UpgradeTitle>This is your free accessibility overview</UpgradeTitle>
            <UpgradeText>
              Get the complete picture with detailed remediation steps, code examples, 
              and AI-powered insights in our comprehensive report.
            </UpgradeText>
          </UpgradeContent>
          <UpgradeButton onClick={() => onUpgradeRequest && onUpgradeRequest({
            action: 'upgrade_to_detailed',
            url: reportData.url || reportData.structuredReport?.url
          })}>
            Upgrade to Detailed Report
          </UpgradeButton>
        </UpgradeNotice>
      )}

      {/* Render appropriate report component */}
      {isDetailedReport ? (
        <DetailedReportDisplay reportData={reportData} />
      ) : (
        <FreeReportDisplay reportData={reportData} onUpgradeRequest={onUpgradeRequest} />
      )}

    </ReportContainer>
  );
};

// Styled Components
const ReportContainer = styled.div`
  min-height: 100vh;
  background: #f9fafb;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
`;

const LoadingSpinner = styled.div`
  width: 4rem;
  height: 4rem;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const LoadingSubtext = styled.p`
  color: #6b7280;
  margin: 0;
  max-width: 400px;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #ef4444;
  margin: 0 0 1rem 0;
`;

const ErrorMessage = styled.p`
  color: #6b7280;
  margin: 0 0 2rem 0;
  max-width: 500px;
  line-height: 1.6;
`;

const RetryButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
  }
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
`;

const EmptyMessage = styled.p`
  color: #6b7280;
  margin: 0;
  max-width: 400px;
`;

const UpgradeNotice = styled.div`
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
`;

const UpgradeIcon = styled.div`
  font-size: 2rem;
  flex-shrink: 0;
`;

const UpgradeContent = styled.div`
  flex: 1;
`;

const UpgradeTitle = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const UpgradeText = styled.div`
  opacity: 0.9;
  line-height: 1.5;
`;

const UpgradeButton = styled.button`
  background: white;
  color: #6366f1;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  
  &:hover {
    background: #f3f4f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const DebugInfo = styled.div`
  background: #1f2937;
  color: #e5e7eb;
  padding: 1rem;
  margin: 2rem;
  border-radius: 0.5rem;
  font-family: monospace;
  font-size: 0.875rem;
`;

const DebugTitle = styled.div`
  color: #fbbf24;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const DebugItem = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 0.25rem;
`;

const DebugLabel = styled.span`
  color: #9ca3af;
  min-width: 120px;
`;

const DebugValue = styled.span`
  color: #10b981;
`;

export default ReportDisplay;