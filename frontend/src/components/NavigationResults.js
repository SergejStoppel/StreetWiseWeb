/**
 * NavigationResults Component
 * 
 * Displays comprehensive navigation accessibility analysis results including:
 * - Overall navigation score
 * - Primary navigation analysis
 * - Skip links detection and validation
 * - Breadcrumb navigation analysis
 * - Navigation consistency issues
 * 
 * @param {Object} navigationData - Navigation analysis data from backend
 * @param {Object} navigationData.navigationElements - Navigation elements found
 * @param {Object} navigationData.consistencyAnalysis - Navigation consistency analysis
 * @param {Object} navigationData.breadcrumbAnalysis - Breadcrumb analysis
 * @param {Object} navigationData.skipNavigationAnalysis - Skip links analysis
 * @param {number} navigationData.overallScore - Overall navigation score (0-100)
 */
import React from 'react';
import styled from 'styled-components';
import { 
  FaCompass, 
  FaRoute, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaInfoCircle,
  FaTimes,
  FaArrowRight
} from 'react-icons/fa';

const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SummaryCard = styled.div`
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
`;

const SummaryIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: ${props => props.color || '#6b7280'};
`;

const SummaryValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
`;

const SummaryLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const DetailSection = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const DetailTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DetailContent = styled.div`
  color: #6b7280;
  line-height: 1.6;
`;

const IssuesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0;
`;

const IssueItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
  
  &:last-child {
    border-bottom: none;
  }
`;

const IssueIcon = styled.div`
  margin-top: 0.125rem;
  color: ${props => props.severity === 'high' ? '#ef4444' : props.severity === 'medium' ? '#f59e0b' : '#6b7280'};
`;

const IssueText = styled.div`
  flex: 1;
  font-size: 0.875rem;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => props.success ? '#dcfce7' : '#fef2f2'};
  color: ${props => props.success ? '#166534' : '#dc2626'};
`;

const SkipLinkItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
`;

const SkipLinkText = styled.div`
  flex: 1;
  font-weight: 500;
  color: #1f2937;
`;

const SkipLinkTarget = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-family: monospace;
`;

const NavigationResults = ({ navigationData }) => {
  if (!navigationData) {
    return null;
  }

  const {
    navigationElements,
    consistencyAnalysis,
    breadcrumbAnalysis,
    skipNavigationAnalysis,
    overallScore
  } = navigationData;

  return (
    <Section>
      <SectionTitle>Navigation Accessibility Analysis</SectionTitle>
      
      {/* Overview Cards */}
      <SummaryGrid>
        <SummaryCard>
          <SummaryIcon color={overallScore >= 80 ? "#10b981" : overallScore >= 60 ? "#f59e0b" : "#ef4444"}>
            <FaCompass />
          </SummaryIcon>
          <SummaryValue>{overallScore}%</SummaryValue>
          <SummaryLabel>Navigation Score</SummaryLabel>
        </SummaryCard>
        
        <SummaryCard>
          <SummaryIcon color="#6b7280">
            <FaInfoCircle />
          </SummaryIcon>
          <SummaryValue>{navigationElements?.totalNavElements || 0}</SummaryValue>
          <SummaryLabel>Navigation Elements</SummaryLabel>
        </SummaryCard>
        
        <SummaryCard>
          <SummaryIcon color={skipNavigationAnalysis?.hasSkipLinks ? "#10b981" : "#ef4444"}>
            {skipNavigationAnalysis?.hasSkipLinks ? <FaCheckCircle /> : <FaTimes />}
          </SummaryIcon>
          <SummaryValue>
            <StatusBadge success={skipNavigationAnalysis?.hasSkipLinks}>
              {skipNavigationAnalysis?.hasSkipLinks ? <FaCheckCircle /> : <FaTimes />}
              {skipNavigationAnalysis?.hasSkipLinks ? 'Present' : 'Missing'}
            </StatusBadge>
          </SummaryValue>
          <SummaryLabel>Skip Links</SummaryLabel>
        </SummaryCard>
        
        <SummaryCard>
          <SummaryIcon color={breadcrumbAnalysis?.hasBreadcrumbs ? "#10b981" : "#f59e0b"}>
            <FaRoute />
          </SummaryIcon>
          <SummaryValue>
            <StatusBadge success={breadcrumbAnalysis?.hasBreadcrumbs}>
              {breadcrumbAnalysis?.hasBreadcrumbs ? <FaCheckCircle /> : <FaInfoCircle />}
              {breadcrumbAnalysis?.hasBreadcrumbs ? 'Present' : 'Optional'}
            </StatusBadge>
          </SummaryValue>
          <SummaryLabel>Breadcrumbs</SummaryLabel>
        </SummaryCard>
      </SummaryGrid>

      {/* Primary Navigation Details */}
      {navigationElements?.primaryNav && (
        <DetailSection>
          <DetailTitle>
            <FaCompass />
            Primary Navigation
          </DetailTitle>
          <DetailContent>
            <SummaryGrid>
              <SummaryCard>
                <SummaryIcon color="#6b7280">
                  <FaInfoCircle />
                </SummaryIcon>
                <SummaryValue>{navigationElements.primaryNav.tagName?.toUpperCase() || 'Unknown'}</SummaryValue>
                <SummaryLabel>Element Type</SummaryLabel>
              </SummaryCard>
              
              <SummaryCard>
                <SummaryIcon color="#6b7280">
                  <FaInfoCircle />
                </SummaryIcon>
                <SummaryValue>{navigationElements.primaryNav.itemCount || 0}</SummaryValue>
                <SummaryLabel>Navigation Items</SummaryLabel>
              </SummaryCard>
              
              <SummaryCard>
                <SummaryIcon color={navigationElements.primaryNav.hasAriaLabel || navigationElements.primaryNav.hasAriaLabelledby ? "#10b981" : "#f59e0b"}>
                  {navigationElements.primaryNav.hasAriaLabel || navigationElements.primaryNav.hasAriaLabelledby ? <FaCheckCircle /> : <FaExclamationTriangle />}
                </SummaryIcon>
                <SummaryValue>
                  <StatusBadge success={navigationElements.primaryNav.hasAriaLabel || navigationElements.primaryNav.hasAriaLabelledby}>
                    {navigationElements.primaryNav.hasAriaLabel || navigationElements.primaryNav.hasAriaLabelledby ? 'Yes' : 'No'}
                  </StatusBadge>
                </SummaryValue>
                <SummaryLabel>Accessible Label</SummaryLabel>
              </SummaryCard>
              
              <SummaryCard>
                <SummaryIcon color={navigationElements.primaryNav.hasNestedLists ? "#10b981" : "#6b7280"}>
                  <FaInfoCircle />
                </SummaryIcon>
                <SummaryValue>{navigationElements.primaryNav.hasNestedLists ? 'Yes' : 'No'}</SummaryValue>
                <SummaryLabel>Nested Structure</SummaryLabel>
              </SummaryCard>
            </SummaryGrid>
          </DetailContent>
        </DetailSection>
      )}

      {/* Skip Links Details */}
      {skipNavigationAnalysis?.hasSkipLinks && (
        <DetailSection>
          <DetailTitle>
            <FaArrowRight />
            Skip Navigation Links ({skipNavigationAnalysis.skipLinkCount})
          </DetailTitle>
          <DetailContent>
            {skipNavigationAnalysis.skipLinkTargets?.map((skipLink, index) => (
              <SkipLinkItem key={index}>
                <div style={{ flex: 1 }}>
                  <SkipLinkText>"{skipLink.text}"</SkipLinkText>
                  <SkipLinkTarget>Target: {skipLink.href}</SkipLinkTarget>
                </div>
                <StatusBadge success={skipLink.hasTarget}>
                  {skipLink.hasTarget ? <FaCheckCircle /> : <FaTimes />}
                  {skipLink.hasTarget ? 'Valid' : 'Broken'}
                </StatusBadge>
              </SkipLinkItem>
            ))}
          </DetailContent>
        </DetailSection>
      )}

      {/* Breadcrumb Details */}
      {breadcrumbAnalysis?.hasBreadcrumbs && (
        <DetailSection>
          <DetailTitle>
            <FaRoute />
            Breadcrumb Navigation
          </DetailTitle>
          <DetailContent>
            <SummaryGrid>
              <SummaryCard>
                <SummaryIcon color="#6b7280">
                  <FaInfoCircle />
                </SummaryIcon>
                <SummaryValue>{breadcrumbAnalysis.breadcrumbStructure?.itemCount || 0}</SummaryValue>
                <SummaryLabel>Breadcrumb Items</SummaryLabel>
              </SummaryCard>
              
              <SummaryCard>
                <SummaryIcon color={breadcrumbAnalysis.breadcrumbStructure?.hasCurrentPage ? "#10b981" : "#f59e0b"}>
                  {breadcrumbAnalysis.breadcrumbStructure?.hasCurrentPage ? <FaCheckCircle /> : <FaExclamationTriangle />}
                </SummaryIcon>
                <SummaryValue>
                  <StatusBadge success={breadcrumbAnalysis.breadcrumbStructure?.hasCurrentPage}>
                    {breadcrumbAnalysis.breadcrumbStructure?.hasCurrentPage ? 'Yes' : 'No'}
                  </StatusBadge>
                </SummaryValue>
                <SummaryLabel>Current Page Marked</SummaryLabel>
              </SummaryCard>
              
              <SummaryCard>
                <SummaryIcon color={breadcrumbAnalysis.breadcrumbStructure?.hasStructuredData ? "#10b981" : "#6b7280"}>
                  <FaInfoCircle />
                </SummaryIcon>
                <SummaryValue>{breadcrumbAnalysis.breadcrumbStructure?.hasStructuredData ? 'Yes' : 'No'}</SummaryValue>
                <SummaryLabel>Structured Data</SummaryLabel>
              </SummaryCard>
              
              <SummaryCard>
                <SummaryIcon color="#6b7280">
                  <FaInfoCircle />
                </SummaryIcon>
                <SummaryValue>"{breadcrumbAnalysis.breadcrumbStructure?.separator || 'Unknown'}"</SummaryValue>
                <SummaryLabel>Separator</SummaryLabel>
              </SummaryCard>
            </SummaryGrid>
          </DetailContent>
        </DetailSection>
      )}

      {/* Issues and Recommendations */}
      {(consistencyAnalysis?.inconsistencies?.length > 0 || 
        skipNavigationAnalysis?.issues?.length > 0 || 
        breadcrumbAnalysis?.issues?.length > 0) && (
        <DetailSection>
          <DetailTitle>
            <FaExclamationTriangle />
            Navigation Issues
          </DetailTitle>
          <DetailContent>
            <IssuesList>
              {consistencyAnalysis?.inconsistencies?.map((issue, index) => (
                <IssueItem key={`consistency-${index}`}>
                  <IssueIcon severity="medium">
                    <FaExclamationTriangle />
                  </IssueIcon>
                  <IssueText>
                    <strong>Navigation Consistency:</strong> {issue.message}
                  </IssueText>
                </IssueItem>
              ))}
              
              {skipNavigationAnalysis?.issues?.map((issue, index) => (
                <IssueItem key={`skip-${index}`}>
                  <IssueIcon severity={issue.type === 'broken_skip_link' ? 'high' : 'medium'}>
                    <FaExclamationTriangle />
                  </IssueIcon>
                  <IssueText>
                    <strong>Skip Navigation:</strong> {issue.message}
                  </IssueText>
                </IssueItem>
              ))}
              
              {breadcrumbAnalysis?.issues?.map((issue, index) => (
                <IssueItem key={`breadcrumb-${index}`}>
                  <IssueIcon severity="medium">
                    <FaExclamationTriangle />
                  </IssueIcon>
                  <IssueText>
                    <strong>Breadcrumb:</strong> {issue.message}
                  </IssueText>
                </IssueItem>
              ))}
            </IssuesList>
          </DetailContent>
        </DetailSection>
      )}

      {/* No Issues Message */}
      {(!consistencyAnalysis?.inconsistencies?.length && 
        !skipNavigationAnalysis?.issues?.length && 
        !breadcrumbAnalysis?.issues?.length) && (
        <DetailSection>
          <DetailTitle>
            <FaCheckCircle style={{ color: '#10b981' }} />
            Navigation Status
          </DetailTitle>
          <DetailContent>
            <div style={{ textAlign: 'center', padding: '2rem', color: '#10b981' }}>
              <FaCheckCircle style={{ fontSize: '3rem', marginBottom: '1rem' }} />
              <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                No navigation accessibility issues detected!
              </div>
              <div style={{ marginTop: '0.5rem', color: '#6b7280' }}>
                Your website's navigation follows accessibility best practices.
              </div>
            </div>
          </DetailContent>
        </DetailSection>
      )}
    </Section>
  );
};

export default NavigationResults;