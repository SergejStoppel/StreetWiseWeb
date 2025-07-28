import React, { useState } from 'react';
import styled from 'styled-components';
import { DetailedReportContent } from '../../models/DetailedReportContent';

const DetailedReportDisplay = ({ reportData }) => {
  const [activeTab, setActiveTab] = useState('executive');
  const [expandedSections, setExpandedSections] = useState({});

  // Check if we have proper detailed report data
  const hasDetailedData = reportData?.structuredReport || 
    (reportData?.reportType === 'detailed' && reportData?.executiveSummary);

  // If we don't have detailed data, show upgrade message
  if (!hasDetailedData) {
    return (
      <UpgradeContainer>
        <UpgradeIcon>🔒</UpgradeIcon>
        <UpgradeTitle>Detailed Report Not Available</UpgradeTitle>
        <UpgradeMessage>
          This analysis doesn't have detailed report data. The detailed report includes 
          comprehensive insights, code examples, and step-by-step remediation instructions.
        </UpgradeMessage>
        <UpgradeButton onClick={() => window.location.href = '/pricing'}>
          Upgrade to Access Detailed Reports
        </UpgradeButton>
      </UpgradeContainer>
    );
  }

  // Convert raw data to structured model with error handling
  let report, complianceStyle;
  try {
    report = new DetailedReportContent(reportData?.structuredReport || reportData);
    complianceStyle = report.getComplianceStatusStyling();
  } catch (error) {
    console.error('Error creating DetailedReportContent:', error);
    // Fallback to upgrade container if report creation fails
    return (
      <UpgradeContainer>
        <UpgradeIcon>⚠️</UpgradeIcon>
        <UpgradeTitle>Report Data Error</UpgradeTitle>
        <UpgradeMessage>
          There was an error processing the detailed report data. This might be because 
          the report doesn't contain the expected detailed structure.
        </UpgradeMessage>
        <UpgradeButton onClick={() => window.location.reload()}>
          Refresh Page
        </UpgradeButton>
      </UpgradeContainer>
    );
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const renderExecutiveSummary = () => (
    <TabContent>
      <SummaryGrid>
        <ScoreCard>
          <ScoreTitle>Overall Health Score</ScoreTitle>
          <OverallScore color={complianceStyle.color}>
            {report.executiveSummary.overallHealthScore}%
          </OverallScore>
          <ComplianceStatus style={complianceStyle}>
            <ComplianceBadge style={complianceStyle}>
              {report.executiveSummary.complianceStatus.level}
            </ComplianceBadge>
            <ComplianceMessage>
              {report.executiveSummary.complianceStatus.message}
            </ComplianceMessage>
          </ComplianceStatus>
        </ScoreCard>

        <LegalRiskCard>
          <CardTitle>Legal Risk Assessment</CardTitle>
          <RiskLevel color={report.executiveSummary.complianceStatus.legalRiskAssessment.riskColor}>
            {report.executiveSummary.complianceStatus.legalRiskAssessment.level} Risk
          </RiskLevel>
          <RiskDescription>
            {report.executiveSummary.complianceStatus.legalRiskAssessment.description}
          </RiskDescription>
        </LegalRiskCard>
      </SummaryGrid>

      <FindingsGrid>
        <FindingsCard>
          <CardTitle>Summary of Findings</CardTitle>
          <FindingsStat>
            <StatNumber>{report.executiveSummary.summaryOfFindings.totalIssues}</StatNumber>
            <StatLabel>Total Issues</StatLabel>
          </FindingsStat>
          
          <CategoryBreakdown>
            <BreakdownTitle>By Severity:</BreakdownTitle>
            <BreakdownItem critical>
              <BreakdownNumber>{report.executiveSummary.summaryOfFindings.byCategory?.accessibility?.critical || 0}</BreakdownNumber>
              <BreakdownLabel>Critical</BreakdownLabel>
            </BreakdownItem>
            <BreakdownItem serious>
              <BreakdownNumber>{report.executiveSummary.summaryOfFindings.byCategory?.accessibility?.serious || 0}</BreakdownNumber>
              <BreakdownLabel>Serious</BreakdownLabel>
            </BreakdownItem>
            <BreakdownItem moderate>
              <BreakdownNumber>{report.executiveSummary.summaryOfFindings.byCategory?.accessibility?.moderate || 0}</BreakdownNumber>
              <BreakdownLabel>Moderate</BreakdownLabel>
            </BreakdownItem>
            <BreakdownItem minor>
              <BreakdownNumber>{report.executiveSummary.summaryOfFindings.byCategory?.accessibility?.minor || 0}</BreakdownNumber>
              <BreakdownLabel>Minor</BreakdownLabel>
            </BreakdownItem>
          </CategoryBreakdown>
        </FindingsCard>

        <EffortCard>
          <CardTitle>Estimated Effort</CardTitle>
          <EffortStat>
            <StatNumber>{report.executiveSummary.estimatedEffort.totalHours}</StatNumber>
            <StatLabel>Total Hours</StatLabel>
          </EffortStat>
          
          <EffortBreakdown>
            <EffortItem>
              <EffortLabel>Accessibility</EffortLabel>
              <EffortHours>{report.executiveSummary.estimatedEffort.breakdown?.accessibility || 0}h</EffortHours>
            </EffortItem>
            <EffortItem>
              <EffortLabel>SEO</EffortLabel>
              <EffortHours>{report.executiveSummary.estimatedEffort.breakdown?.seo || 0}h</EffortHours>
            </EffortItem>
            <EffortItem>
              <EffortLabel>Testing</EffortLabel>
              <EffortHours>{report.executiveSummary.estimatedEffort.breakdown?.testing || 0}h</EffortHours>
            </EffortItem>
          </EffortBreakdown>
        </EffortCard>
      </FindingsGrid>

      <BusinessImpactSection>
        <CardTitle>Business Impact Analysis</CardTitle>
        <ImpactGrid>
          <ImpactItem>
            <ImpactTitle>Customer Impact</ImpactTitle>
            <ImpactDescription>{report.executiveSummary.businessImpact.potentialLostCustomers}</ImpactDescription>
          </ImpactItem>
          <ImpactItem>
            <ImpactTitle>SEO Impact</ImpactTitle>
            <ImpactDescription>{report.executiveSummary.businessImpact.seoImpact}</ImpactDescription>
          </ImpactItem>
          <ImpactItem>
            <ImpactTitle>Brand Impact</ImpactTitle>
            <ImpactDescription>{report.executiveSummary.businessImpact.brandReputation}</ImpactDescription>
          </ImpactItem>
          <ImpactItem>
            <ImpactTitle>Legal Exposure</ImpactTitle>
            <ImpactDescription>{report.executiveSummary.businessImpact.legalExposure}</ImpactDescription>
          </ImpactItem>
        </ImpactGrid>
      </BusinessImpactSection>
    </TabContent>
  );

  const renderAccessibilityViolations = () => (
    <TabContent>
      <ViolationsHeader>
        <ViolationsTitle>Accessibility Violations</ViolationsTitle>
        <ViolationsSubtitle>
          {report.accessibilityViolations.totalViolations} violations found, organized by WCAG principle
        </ViolationsSubtitle>
      </ViolationsHeader>

      {report.getViolationsByPrinciple().map((principle, index) => (
        <PrincipleSection key={index}>
          <PrincipleHeader 
            onClick={() => toggleSection(`principle-${index}`)}
            expanded={expandedSections[`principle-${index}`]}
          >
            <PrincipleTitle>{principle.principleDisplayName}</PrincipleTitle>
            <PrincipleDescription>{principle.principleDescription}</PrincipleDescription>
            <ViolationCount>{principle.violationCount} violations</ViolationCount>
            <ExpandIcon>{expandedSections[`principle-${index}`] ? '−' : '+'}</ExpandIcon>
          </PrincipleHeader>

          {expandedSections[`principle-${index}`] && (
            <ViolationsList>
              {principle.violations.map((violation, vIndex) => (
                <ViolationCard key={vIndex}>
                  <ViolationHeader>
                    <SeverityBadge color={violation.severityColor}>
                      {violation.severity}
                    </SeverityBadge>
                    <ViolationTitle>{violation.issueTitle}</ViolationTitle>
                    <WcagBadge color={violation.wcagCriteria.levelColor}>
                      WCAG {violation.wcagCriteria.level}
                    </WcagBadge>
                  </ViolationHeader>

                  <ViolationDetails>
                    <DetailSection>
                      <DetailTitle>What this means:</DetailTitle>
                      <DetailText>{violation.whatThisMeans}</DetailText>
                    </DetailSection>

                    <DetailSection>
                      <DetailTitle>Disability groups impacted:</DetailTitle>
                      <DisabilityGroups>
                        {violation.disabilityGroupsImpacted.map((group, gIndex) => (
                          <DisabilityGroup key={gIndex}>{group}</DisabilityGroup>
                        ))}
                      </DisabilityGroups>
                    </DetailSection>

                    <DetailSection>
                      <DetailTitle>Elements affected ({violation.elementsAffected.length}):</DetailTitle>
                      <ElementsList>
                        {violation.elementsAffected.slice(0, 3).map((element, eIndex) => (
                          <ElementItem key={eIndex}>
                            <CodeSnippet>{element.html}</CodeSnippet>
                            <ElementTarget>{element.target?.join(' ') || 'N/A'}</ElementTarget>
                          </ElementItem>
                        ))}
                        {violation.elementsAffected.length > 3 && (
                          <ShowMoreElements>
                            +{violation.elementsAffected.length - 3} more elements
                          </ShowMoreElements>
                        )}
                      </ElementsList>
                    </DetailSection>

                    <RemediationSection>
                      <DetailTitle>How to fix:</DetailTitle>
                      
                      {violation.howToFix.stepByStepInstructions.length > 0 && (
                        <StepsList>
                          {violation.howToFix.stepByStepInstructions.map((step, sIndex) => (
                            <StepItem key={sIndex}>
                              <StepNumber>{sIndex + 1}</StepNumber>
                              <StepText>{step}</StepText>
                            </StepItem>
                          ))}
                        </StepsList>
                      )}

                      {violation.howToFix.correctCodeExample && (
                        <CodeExample>
                          <CodeTitle>✅ Correct code:</CodeTitle>
                          <CodeSnippet correct>{violation.howToFix.correctCodeExample}</CodeSnippet>
                        </CodeExample>
                      )}

                      {violation.howToFix.incorrectCodeExample && (
                        <CodeExample>
                          <CodeTitle>❌ Incorrect code:</CodeTitle>
                          <CodeSnippet incorrect>{violation.howToFix.incorrectCodeExample}</CodeSnippet>
                        </CodeExample>
                      )}
                    </RemediationSection>

                    <TestingSection>
                      <DetailTitle>How to test:</DetailTitle>
                      <TestingText>{violation.howToTest}</TestingText>
                    </TestingSection>

                    <MetadataSection>
                      <MetadataItem>
                        <MetadataLabel>Estimated fix time:</MetadataLabel>
                        <MetadataValue>{violation.estimatedFixTime?.total || 'Unknown'}</MetadataValue>
                      </MetadataItem>
                      <MetadataItem>
                        <MetadataLabel>Business impact:</MetadataLabel>
                        <MetadataValue>{violation.businessImpact}</MetadataValue>
                      </MetadataItem>
                    </MetadataSection>
                  </ViolationDetails>
                </ViolationCard>
              ))}
            </ViolationsList>
          )}
        </PrincipleSection>
      ))}
    </TabContent>
  );

  const renderSeoRecommendations = () => (
    <TabContent>
      <SeoHeader>
        <SeoTitle>SEO Recommendations</SeoTitle>
        <SeoSubtitle>Comprehensive analysis organized by category</SeoSubtitle>
      </SeoHeader>

      {report.getSeoRecommendationsByCategory().map((category, index) => (
        <SeoCategory key={index}>
          <CategoryHeader 
            onClick={() => toggleSection(`seo-${index}`)}
            expanded={expandedSections[`seo-${index}`]}
          >
            <CategoryTitle>{category.name}</CategoryTitle>
            <RecommendationCount>{category.recommendations.length} recommendations</RecommendationCount>
            <ExpandIcon>{expandedSections[`seo-${index}`] ? '−' : '+'}</ExpandIcon>
          </CategoryHeader>

          {expandedSections[`seo-${index}`] && (
            <RecommendationsList>
              {category.recommendations.map((rec, rIndex) => (
                <RecommendationCard key={rIndex}>
                  <RecommendationHeader>
                    <PriorityBadge color={rec.priorityColor}>
                      {rec.priority} Priority
                    </PriorityBadge>
                    <RecommendationTitle>{rec.title}</RecommendationTitle>
                    <ImplementationTime>{rec.implementationTime}</ImplementationTime>
                  </RecommendationHeader>

                  <RecommendationDetails>
                    <DetailSection>
                      <DetailTitle>Why it matters:</DetailTitle>
                      <DetailText>{rec.whyItMatters}</DetailText>
                    </DetailSection>

                    <DetailSection>
                      <DetailTitle>Current state:</DetailTitle>
                      <CurrentState>{rec.currentState}</CurrentState>
                    </DetailSection>

                    <DetailSection>
                      <DetailTitle>Recommended action:</DetailTitle>
                      <RecommendedAction>{rec.recommendedAction}</RecommendedAction>
                    </DetailSection>

                    {rec.bestPracticeExample && (
                      <DetailSection>
                        <DetailTitle>Best practice example:</DetailTitle>
                        <BestPracticeExample>{rec.bestPracticeExample}</BestPracticeExample>
                      </DetailSection>
                    )}

                    {rec.tools.length > 0 && (
                      <DetailSection>
                        <DetailTitle>Recommended tools:</DetailTitle>
                        <ToolsList>
                          {rec.tools.map((tool, tIndex) => (
                            <ToolItem key={tIndex}>{tool}</ToolItem>
                          ))}
                        </ToolsList>
                      </DetailSection>
                    )}

                    <MetadataSection>
                      <MetadataItem>
                        <MetadataLabel>Estimated impact:</MetadataLabel>
                        <MetadataValue>{rec.estimatedImpact}</MetadataValue>
                      </MetadataItem>
                    </MetadataSection>
                  </RecommendationDetails>
                </RecommendationCard>
              ))}
            </RecommendationsList>
          )}
        </SeoCategory>
      ))}
    </TabContent>
  );

  const renderImplementationPlan = () => (
    <TabContent>
      <PlanHeader>
        <PlanTitle>Implementation Roadmap</PlanTitle>
        <PlanSubtitle>Prioritized action plan for maximum impact</PlanSubtitle>
      </PlanHeader>

      <RoadmapTimeline>
        {report.getImplementationPhases().map((phase, index) => (
          <PhaseCard key={index}>
            <PhaseHeader>
              <PhaseNumber>{index + 1}</PhaseNumber>
              <PhaseTitle>{phase.title}</PhaseTitle>
            </PhaseHeader>
            
            <TasksList>
              {phase.tasks.map((task, tIndex) => (
                <TaskItem key={tIndex}>
                  <TaskCheckbox />
                  <TaskText>{task}</TaskText>
                </TaskItem>
              ))}
            </TasksList>
            
            <ExpectedOutcome>
              <OutcomeTitle>Expected outcome:</OutcomeTitle>
              <OutcomeText>{phase.expectedOutcome}</OutcomeText>
            </ExpectedOutcome>
          </PhaseCard>
        ))}
      </RoadmapTimeline>

      <PriorityMatrix>
        <MatrixTitle>Priority Matrix</MatrixTitle>
        <MatrixSubtitle>Issues sorted by impact vs. effort</MatrixSubtitle>
        
        <MatrixList>
          {report.getPrioritizedActions().slice(0, 10).map((item, index) => (
            <MatrixItem key={index}>
              <MatrixRank>{index + 1}</MatrixRank>
              <MatrixDetails>
                <MatrixItemTitle>{item.title}</MatrixItemTitle>
                <MatrixStats>
                  <StatItem>Impact: {item.impact}/10</StatItem>
                  <StatItem>Effort: {item.effort}/10</StatItem>
                  <StatItem>Type: {item.type}</StatItem>
                </MatrixStats>
              </MatrixDetails>
            </MatrixItem>
          ))}
        </MatrixList>
      </PriorityMatrix>
    </TabContent>
  );

  return (
    <ReportContainer>
      {/* Header */}
      <ReportHeader>
        <HeaderContent>
          <WebsiteUrl>{report.url}</WebsiteUrl>
          <ReportMetadata>
            <HeaderMetadataItem>
              Report generated: {new Date(report.timestamp).toLocaleDateString()}
            </HeaderMetadataItem>
            <HeaderMetadataItem>
              Analysis depth: Comprehensive
            </HeaderMetadataItem>
            <DetailedReportBadge>DETAILED REPORT</DetailedReportBadge>
          </ReportMetadata>
        </HeaderContent>
        
        {report.screenshots && (report.screenshots.desktop || report.screenshots.mobile) && (
          <ScreenshotGrid>
            <ScreenshotContainer>
              <ScreenshotLabel>Desktop View</ScreenshotLabel>
              <Screenshot 
                src={report.screenshots.desktop?.url || report.screenshots.desktop} 
                alt="Desktop screenshot" 
              />
            </ScreenshotContainer>
            <ScreenshotContainer>
              <ScreenshotLabel>Mobile View</ScreenshotLabel>
              <Screenshot 
                src={report.screenshots.mobile?.url || report.screenshots.mobile} 
                alt="Mobile screenshot" 
              />
            </ScreenshotContainer>
          </ScreenshotGrid>
        )}
      </ReportHeader>

      {/* Navigation Tabs */}
      <TabNavigation>
        <TabButton 
          active={activeTab === 'executive'} 
          onClick={() => setActiveTab('executive')}
        >
          Executive Summary
        </TabButton>
        <TabButton 
          active={activeTab === 'accessibility'} 
          onClick={() => setActiveTab('accessibility')}
        >
          Accessibility Issues ({report.accessibilityViolations.totalViolations})
        </TabButton>
        <TabButton 
          active={activeTab === 'seo'} 
          onClick={() => setActiveTab('seo')}
        >
          SEO Recommendations
        </TabButton>
        <TabButton 
          active={activeTab === 'implementation'} 
          onClick={() => setActiveTab('implementation')}
        >
          Implementation Plan
        </TabButton>
      </TabNavigation>

      {/* Tab Content */}
      {activeTab === 'executive' && renderExecutiveSummary()}
      {activeTab === 'accessibility' && renderAccessibilityViolations()}
      {activeTab === 'seo' && renderSeoRecommendations()}
      {activeTab === 'implementation' && renderImplementationPlan()}

      {/* Export Options */}
      <ExportSection>
        <ExportTitle>Export Options</ExportTitle>
        <ExportButtons>
          <ExportButton primary>Download PDF Report</ExportButton>
          <ExportButton>Export CSV Data</ExportButton>
          <ExportButton>Generate Share Link</ExportButton>
        </ExportButtons>
      </ExportSection>
    </ReportContainer>
  );
};

// Styled Components (extensive styling - truncated for brevity)
const ReportContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #1f2937;
`;

const ReportHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const WebsiteUrl = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  word-break: break-all;
`;

const ReportMetadata = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
`;

const HeaderMetadataItem = styled.span`
  color: #6b7280;
  font-size: 0.9rem;
`;

const DetailedReportBadge = styled.span`
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ScreenshotGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ScreenshotContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ScreenshotLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
`;

const Screenshot = styled.img`
  width: 200px;
  height: auto;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    width: 100%;
    max-width: 250px;
  }
`;

const TabNavigation = styled.div`
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 2rem;
  overflow-x: auto;
`;

const TabButton = styled.button`
  padding: 1rem 1.5rem;
  border: none;
  background: ${props => props.active ? '#6366f1' : 'transparent'};
  color: ${props => props.active ? 'white' : '#6b7280'};
  font-weight: 600;
  cursor: pointer;
  border-bottom: 3px solid ${props => props.active ? '#6366f1' : 'transparent'};
  transition: all 0.2s;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.active ? '#6366f1' : '#f3f4f6'};
    color: ${props => props.active ? 'white' : '#1f2937'};
  }
`;

const TabContent = styled.div`
  min-height: 500px;
`;

// Executive Summary Styles
const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ScoreCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const ScoreTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 1rem 0;
`;

const OverallScore = styled.div`
  font-size: 4rem;
  font-weight: 800;
  color: ${props => props.color};
  line-height: 1;
  margin-bottom: 1rem;
`;

const ComplianceStatus = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ComplianceBadge = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
  background-color: ${props => props.backgroundColor};
  color: ${props => props.color};
  border: 2px solid ${props => props.borderColor};
`;

const ComplianceMessage = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
`;

// Accessibility Violations Styles
const ViolationsHeader = styled.div`
  margin-bottom: 2rem;
`;

const ViolationsTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const ViolationsSubtitle = styled.p`
  color: #6b7280;
  margin: 0;
`;

const PrincipleSection = styled.div`
  margin-bottom: 2rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
`;

const PrincipleHeader = styled.div`
  background: #f9fafb;
  padding: 1.5rem;
  cursor: pointer;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1rem;
  align-items: center;
  transition: background-color 0.2s;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const PrincipleTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const PrincipleDescription = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
  grid-column: 1 / -1;
`;

const ViolationCount = styled.span`
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
`;

const ExpandIcon = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: #6b7280;
`;

const ViolationsList = styled.div`
  padding: 1rem;
`;

const ViolationCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  overflow: hidden;
`;

const ViolationHeader = styled.div`
  background: #f9fafb;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const SeverityBadge = styled.span`
  background: ${props => props.color};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const ViolationTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;
  min-width: 200px;
`;

const WcagBadge = styled.span`
  background: ${props => props.color};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ViolationDetails = styled.div`
  padding: 1rem;
`;

const DetailSection = styled.div`
  margin-bottom: 1.5rem;
`;

const DetailTitle = styled.h5`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DetailText = styled.p`
  color: #6b7280;
  margin: 0;
`;

const DisabilityGroups = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const DisabilityGroup = styled.span`
  background: #dbeafe;
  color: #1e40af;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
`;

const ElementsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ElementItem = styled.div`
  background: #f3f4f6;
  padding: 0.75rem;
  border-radius: 0.25rem;
  border-left: 3px solid #6b7280;
`;

const CodeSnippet = styled.code`
  background: ${props => 
    props.correct ? '#d1fae5' : 
    props.incorrect ? '#fee2e2' : 
    '#f3f4f6'
  };
  color: ${props => 
    props.correct ? '#065f46' : 
    props.incorrect ? '#991b1b' : 
    '#374151'
  };
  padding: 0.5rem;
  border-radius: 0.25rem;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.875rem;
  display: block;
  overflow-x: auto;
  white-space: pre-wrap;
`;

const ElementTarget = styled.div`
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  font-family: monospace;
`;

const ShowMoreElements = styled.div`
  color: #6366f1;
  font-size: 0.875rem;
  cursor: pointer;
  text-align: center;
  padding: 0.5rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const RemediationSection = styled.div`
  background: #f0fdf4;
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid #10b981;
  margin-bottom: 1rem;
`;

const StepsList = styled.ol`
  margin: 0 0 1rem 0;
  padding-left: 1.5rem;
`;

const StepItem = styled.li`
  margin-bottom: 0.5rem;
  color: #374151;
`;

const StepNumber = styled.span`
  background: #10b981;
  color: white;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 0.5rem;
`;

const StepText = styled.span`
  color: #374151;
`;

const CodeExample = styled.div`
  margin-bottom: 1rem;
`;

const CodeTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
`;

const TestingSection = styled.div`
  background: #fef3c7;
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid #f59e0b;
  margin-bottom: 1rem;
`;

const TestingText = styled.p`
  color: #92400e;
  margin: 0;
`;

const MetadataSection = styled.div`
  display: flex;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const MetadataItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const MetadataLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MetadataValue = styled.span`
  font-size: 0.875rem;
  color: #374151;
`;

// Executive Summary styled components
const LegalRiskCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const CardTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 1rem 0;
`;

const RiskLevel = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.color};
  margin-bottom: 0.5rem;
`;

const RiskDescription = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
`;

const FindingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FindingsCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const FindingsStat = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const StatNumber = styled.div`
  font-size: 3rem;
  font-weight: 800;
  color: #1f2937;
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-weight: 500;
`;

const CategoryBreakdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const BreakdownTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
`;

const BreakdownItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: ${props => 
    props.critical ? '#fee2e2' : 
    props.serious ? '#fef3c7' : 
    props.moderate ? '#dbeafe' : 
    '#f3f4f6'
  };
  border-radius: 0.25rem;
`;

const BreakdownNumber = styled.span`
  font-weight: 600;
  color: #1f2937;
`;

const BreakdownLabel = styled.span`
  color: #6b7280;
  font-size: 0.875rem;
`;

const EffortCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const EffortStat = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const EffortBreakdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const EffortItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 0.25rem;
`;

const EffortLabel = styled.span`
  color: #6b7280;
  font-size: 0.875rem;
`;

const EffortHours = styled.span`
  font-weight: 600;
  color: #1f2937;
`;

const BusinessImpactSection = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const ImpactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const ImpactItem = styled.div`
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border-left: 4px solid #6366f1;
`;

const ImpactTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const ImpactDescription = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
`;

// SEO styled components
const SeoHeader = styled.div`
  margin-bottom: 2rem;
`;

const SeoTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const SeoSubtitle = styled.p`
  color: #6b7280;
  margin: 0;
`;

const SeoCategory = styled.div`
  margin-bottom: 2rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
`;

const CategoryHeader = styled.div`
  background: #f9fafb;
  padding: 1.5rem;
  cursor: pointer;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1rem;
  align-items: center;
  transition: background-color 0.2s;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const CategoryTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const RecommendationCount = styled.span`
  background: #6366f1;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
`;

const RecommendationsList = styled.div`
  padding: 1rem;
`;

const RecommendationCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  overflow: hidden;
`;

const RecommendationHeader = styled.div`
  background: #f9fafb;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const PriorityBadge = styled.span`
  background: ${props => props.color};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const RecommendationTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;
  min-width: 200px;
`;

const ImplementationTime = styled.span`
  background: #e5e7eb;
  color: #374151;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
`;

const RecommendationDetails = styled.div`
  padding: 1rem;
`;

const CurrentState = styled.div`
  background: #fee2e2;
  color: #991b1b;
  padding: 0.5rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;
`;

const RecommendedAction = styled.div`
  background: #d1fae5;
  color: #065f46;
  padding: 0.75rem;
  border-radius: 0.25rem;
`;

const BestPracticeExample = styled.div`
  background: #f0fdf4;
  color: #166534;
  padding: 0.75rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;
`;

const ToolsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ToolItem = styled.span`
  background: #dbeafe;
  color: #1e40af;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
`;

// Implementation Plan styled components
const PlanHeader = styled.div`
  margin-bottom: 2rem;
`;

const PlanTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const PlanSubtitle = styled.p`
  color: #6b7280;
  margin: 0;
`;

const RoadmapTimeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 3rem;
`;

const PhaseCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-left: 6px solid #6366f1;
`;

const PhaseHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const PhaseNumber = styled.div`
  background: #6366f1;
  color: white;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
`;

const PhaseTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const TasksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const TaskItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const TaskCheckbox = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #d1d5db;
  border-radius: 0.25rem;
  flex-shrink: 0;
`;

const TaskText = styled.span`
  color: #374151;
`;

const ExpectedOutcome = styled.div`
  background: #f0fdf4;
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid #10b981;
`;

const OutcomeTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #065f46;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const OutcomeText = styled.p`
  color: #166534;
  margin: 0;
  font-size: 0.875rem;
`;

const PriorityMatrix = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const MatrixTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const MatrixSubtitle = styled.p`
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;
`;

const MatrixList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MatrixItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

const MatrixRank = styled.div`
  background: #6366f1;
  color: white;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
`;

const MatrixDetails = styled.div`
  flex: 1;
`;

const MatrixItemTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const MatrixStats = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
`;

const StatItem = styled.span`
  color: #6b7280;
`;

const ExportSection = styled.div`
  background: #f9fafb;
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  margin-top: 3rem;
`;

const ExportTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
`;

const ExportButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const ExportButton = styled.button`
  background: ${props => props.primary ? '#6366f1' : 'white'};
  color: ${props => props.primary ? 'white' : '#6366f1'};
  border: 2px solid #6366f1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.primary ? '#4f46e5' : '#6366f1'};
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
  }
`;

// Upgrade Container Components
const UpgradeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 3rem;
  text-align: center;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin: 2rem;
`;

const UpgradeIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
`;

const UpgradeTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
`;

const UpgradeMessage = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 0 2rem 0;
`;

const UpgradeButton = styled.button`
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
  }
`;

// Additional styled components for other sections would go here...
// (SEO recommendations, implementation plan, etc.)

export default DetailedReportDisplay;