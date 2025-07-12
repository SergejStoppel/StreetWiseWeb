/**
 * TouchTargetResults Component
 * 
 * Displays touch target size analysis results including:
 * - Overall touch target compliance score
 * - Small target detection
 * - Overlapping and closely spaced targets
 * - Target size statistics and recommendations
 * 
 * @param {Object} touchTargetData - Touch target analysis data from backend
 */
import React from 'react';
import styled from 'styled-components';
import { 
  FaHandPointer, 
  FaRulerCombined,
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaInfoCircle,
  FaTimes,
  FaMobileAlt,
  FaExpand
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
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
`;

const IssueIcon = styled.div`
  margin-top: 0.125rem;
  color: #ef4444;
`;

const IssueContent = styled.div`
  flex: 1;
`;

const IssueText = styled.div`
  font-size: 0.875rem;
  color: #7f1d1d;
  margin-bottom: 0.25rem;
`;

const TargetSize = styled.span`
  font-family: monospace;
  font-weight: 600;
  color: #dc2626;
`;

const DeficitBadge = styled.span`
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.5rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin: 1rem 0;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => props.percentage >= 80 ? '#10b981' : props.percentage >= 60 ? '#f59e0b' : '#ef4444'};
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
`;

const StatLabel = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
`;

const StatValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
`;

const TouchTargetResults = ({ touchTargetData }) => {
  if (!touchTargetData || !touchTargetData.summary) {
    return null;
  }

  const { summary, targets, issues } = touchTargetData;
  const complianceRate = summary.totalInteractiveElements > 0
    ? Math.round((summary.adequateTargets / summary.totalInteractiveElements) * 100)
    : 100;

  return (
    <Section>
      <SectionTitle>Touch Target Accessibility Analysis</SectionTitle>
      
      {/* Overview Cards */}
      <SummaryGrid>
        <SummaryCard>
          <SummaryIcon color={summary.score >= 80 ? "#10b981" : summary.score >= 60 ? "#f59e0b" : "#ef4444"}>
            <FaHandPointer />
          </SummaryIcon>
          <SummaryValue>{summary.score}%</SummaryValue>
          <SummaryLabel>Touch Target Score</SummaryLabel>
        </SummaryCard>
        
        <SummaryCard>
          <SummaryIcon color="#6b7280">
            <FaMobileAlt />
          </SummaryIcon>
          <SummaryValue>{summary.totalInteractiveElements}</SummaryValue>
          <SummaryLabel>Interactive Elements</SummaryLabel>
        </SummaryCard>
        
        <SummaryCard>
          <SummaryIcon color={summary.smallTargets > 0 ? "#ef4444" : "#10b981"}>
            {summary.smallTargets > 0 ? <FaTimes /> : <FaCheckCircle />}
          </SummaryIcon>
          <SummaryValue>{summary.smallTargets}</SummaryValue>
          <SummaryLabel>Small Targets</SummaryLabel>
        </SummaryCard>
        
        <SummaryCard>
          <SummaryIcon color="#6b7280">
            <FaRulerCombined />
          </SummaryIcon>
          <SummaryValue>{summary.averageTargetSize}px</SummaryValue>
          <SummaryLabel>Average Target Size</SummaryLabel>
        </SummaryCard>
      </SummaryGrid>

      {/* Compliance Overview */}
      <DetailSection>
        <DetailTitle>
          <FaInfoCircle />
          Touch Target Compliance
        </DetailTitle>
        <DetailContent>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>{complianceRate}%</strong> of interactive elements meet the minimum 44x44px requirement
          </div>
          <ProgressBar>
            <ProgressFill percentage={complianceRate} />
          </ProgressBar>
          <StatGrid>
            <StatItem>
              <StatLabel>Adequate Targets</StatLabel>
              <StatValue>{summary.adequateTargets}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Small Targets</StatLabel>
              <StatValue style={{ color: summary.smallTargets > 0 ? '#dc2626' : '#059669' }}>
                {summary.smallTargets}
              </StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Overlapping</StatLabel>
              <StatValue style={{ color: summary.overlappingTargets > 0 ? '#dc2626' : '#059669' }}>
                {summary.overlappingTargets}
              </StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Too Close</StatLabel>
              <StatValue style={{ color: summary.closelySpacedTargets > 0 ? '#f59e0b' : '#059669' }}>
                {summary.closelySpacedTargets}
              </StatValue>
            </StatItem>
          </StatGrid>
        </DetailContent>
      </DetailSection>

      {/* Small Targets Details */}
      {targets?.small?.length > 0 && (
        <DetailSection>
          <DetailTitle>
            <FaExclamationTriangle style={{ color: '#ef4444' }} />
            Small Touch Targets
          </DetailTitle>
          <DetailContent>
            <p style={{ marginBottom: '1rem' }}>
              The following interactive elements are smaller than the recommended 44x44 pixel minimum:
            </p>
            <IssuesList>
              {targets.small.slice(0, 5).map((target, index) => (
                <IssueItem key={index}>
                  <IssueIcon>
                    <FaExpand />
                  </IssueIcon>
                  <IssueContent>
                    <IssueText>
                      <strong>{target.identifier}</strong>
                      {target.text && ` - "${target.text.substring(0, 30)}..."`}
                    </IssueText>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Current size: <TargetSize>{target.width}x{target.height}px</TargetSize>
                      {target.isIconButton && (
                        <DeficitBadge>Icon Button</DeficitBadge>
                      )}
                      {!target.hasAriaLabel && target.isIconButton && (
                        <DeficitBadge>No Label</DeficitBadge>
                      )}
                    </div>
                  </IssueContent>
                </IssueItem>
              ))}
            </IssuesList>
            {targets.small.length > 5 && (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                ...and {targets.small.length - 5} more small targets
              </p>
            )}
          </DetailContent>
        </DetailSection>
      )}

      {/* Spacing Issues */}
      {(targets?.overlapping?.length > 0 || targets?.closelySpaced?.length > 0) && (
        <DetailSection>
          <DetailTitle>
            <FaExclamationTriangle style={{ color: '#f59e0b' }} />
            Target Spacing Issues
          </DetailTitle>
          <DetailContent>
            {targets.overlapping?.length > 0 && (
              <>
                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Overlapping Targets:</h4>
                <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                  {targets.overlapping.slice(0, 3).map((overlap, index) => (
                    <li key={index} style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                      {overlap.element1} overlaps with {overlap.element2}
                    </li>
                  ))}
                </ul>
              </>
            )}
            
            {targets.closelySpaced?.length > 0 && (
              <>
                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Closely Spaced Targets:</h4>
                <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>
                  {targets.closelySpaced.slice(0, 3).map((spacing, index) => (
                    <li key={index} style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                      {spacing.element1} is only {spacing.distance}px from {spacing.element2}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </DetailContent>
        </DetailSection>
      )}

      {/* Success Message */}
      {summary.smallTargets === 0 && summary.overlappingTargets === 0 && (
        <DetailSection>
          <DetailTitle>
            <FaCheckCircle style={{ color: '#10b981' }} />
            Excellent Touch Accessibility
          </DetailTitle>
          <DetailContent>
            <div style={{ textAlign: 'center', padding: '2rem', color: '#10b981' }}>
              <FaCheckCircle style={{ fontSize: '3rem', marginBottom: '1rem' }} />
              <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                All interactive elements meet touch target requirements!
              </div>
              <div style={{ marginTop: '0.5rem', color: '#6b7280' }}>
                Your website provides excellent touch accessibility for all users.
              </div>
            </div>
          </DetailContent>
        </DetailSection>
      )}

      {/* Recommendations */}
      {issues?.length > 0 && (
        <DetailSection>
          <DetailTitle>
            <FaInfoCircle />
            Recommendations
          </DetailTitle>
          <DetailContent>
            <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>
              {issues.map((issue, index) => (
                <li key={index} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <strong>{issue.message}</strong>
                  {issue.wcagCriterion && (
                    <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                      (WCAG {issue.wcagCriterion})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </DetailContent>
        </DetailSection>
      )}
    </Section>
  );
};

export default TouchTargetResults;