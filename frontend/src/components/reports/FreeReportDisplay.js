import React from 'react';
import styled from 'styled-components';
import { FreeReportSummary } from '../../models/FreeReportSummary';

const FreeReportDisplay = ({ reportData, onUpgradeRequest }) => {
  // Convert raw data to structured model
  const report = new FreeReportSummary(reportData?.structuredReport || reportData);
  const complianceStyle = report.getComplianceStatusStyling();

  // Handle upgrade button clicks
  const handleUpgradeClick = (actionType = 'upgrade_to_detailed') => {
    if (onUpgradeRequest) {
      onUpgradeRequest({
        action: actionType,
        analysisId: report.analysisId,
        url: report.url
      });
    } else {
      // Fallback: request detailed report for same URL
      window.location.href = `/analyze?url=${encodeURIComponent(report.url)}&type=detailed`;
    }
  };

  return (
    <ReportContainer>
      {/* Header with Website Info */}
      <ReportHeader>
        <WebsiteInfo>
          <WebsiteUrl>{report.url}</WebsiteUrl>
          <ReportTimestamp>
            Report generated on {new Date(report.timestamp).toLocaleDateString()}
          </ReportTimestamp>
          <FreeReportBadge>FREE REPORT</FreeReportBadge>
        </WebsiteInfo>
        
        {report.screenshot && (
          <ScreenshotContainer>
            {report.screenshot.desktop && (
              <ScreenshotViewport>
                <ViewportLabel>Desktop</ViewportLabel>
                <Screenshot src={report.screenshot.desktop} alt="Desktop website preview" />
                <WatermarkOverlay>Preview - Full resolution in detailed report</WatermarkOverlay>
              </ScreenshotViewport>
            )}
            {report.screenshot.mobile && (
              <ScreenshotViewport>
                <ViewportLabel>Mobile</ViewportLabel>
                <Screenshot src={report.screenshot.mobile} alt="Mobile website preview" />
                <WatermarkOverlay>Preview - Full resolution in detailed report</WatermarkOverlay>
              </ScreenshotViewport>
            )}
            {/* Fallback for legacy single screenshot */}
            {!report.screenshot.desktop && !report.screenshot.mobile && (
              <ScreenshotViewport>
                <Screenshot src={report.screenshot.url || report.screenshot} alt="Website preview" />
                <WatermarkOverlay>Preview - Full resolution in detailed report</WatermarkOverlay>
              </ScreenshotViewport>
            )}
          </ScreenshotContainer>
        )}
      </ReportHeader>

      {/* Executive Summary */}
      <Section>
        <SectionTitle>{report.executiveSummary.headline}</SectionTitle>
        
        <ScoreContainer>
          <OverallScore color={complianceStyle.color}>
            {report.executiveSummary.overallScore}%
          </OverallScore>
          <ComplianceStatus style={complianceStyle}>
            <ComplianceBadge style={complianceStyle}>
              {report.executiveSummary.complianceStatus.level}
            </ComplianceBadge>
            <ComplianceMessage>
              {report.executiveSummary.complianceStatus.message}
            </ComplianceMessage>
          </ComplianceStatus>
        </ScoreContainer>

        <KeyTakeaway>
          <strong>Key Finding:</strong> {report.executiveSummary.keyTakeaway}
        </KeyTakeaway>

        <IssueCounts>
          <IssueCountItem>
            <IssueNumber>{report.formattedIssueCounts.total}</IssueNumber>
            <IssueLabel>Total Issues Found</IssueLabel>
          </IssueCountItem>
          <IssueCountItem critical>
            <IssueNumber>{report.formattedIssueCounts.critical}</IssueNumber>
            <IssueLabel>Critical Issues</IssueLabel>
          </IssueCountItem>
          <IssueCountItem serious>
            <IssueNumber>{report.formattedIssueCounts.serious}</IssueNumber>
            <IssueLabel>Serious Issues</IssueLabel>
          </IssueCountItem>
        </IssueCounts>
      </Section>

      {/* Top 3 Accessibility Issues */}
      <Section>
        <SectionTitle>{report.topAccessibilityIssues.headline}</SectionTitle>
        <IssuesList>
          {report.topAccessibilityIssues.issues.map((issue, index) => (
            <IssueCard key={index}>
              <IssueHeader>
                <IssueNumberBadge>{index + 1}</IssueNumberBadge>
                <IssueTitleContainer>
                  <IssueTitle>{issue.title}</IssueTitle>
                  <ElementsAffected>
                    {issue.elementsAffected} element{issue.elementsAffected !== 1 ? 's' : ''} affected
                  </ElementsAffected>
                </IssueTitleContainer>
              </IssueHeader>
              
              <IssueDescription>
                <strong>Why it matters:</strong> {issue.whyItMatters}
              </IssueDescription>
              
              {issue.wcagReference && (
                <WcagReference>{issue.wcagReference}</WcagReference>
              )}
              
              <NextStep>
                <strong>Next step:</strong> {issue.suggestedNextStep}
              </NextStep>

              <UpgradePrompt>
                <UpgradeIcon>🔒</UpgradeIcon>
                <UpgradeText>
                  See detailed remediation steps, code examples, and testing instructions in the detailed report
                </UpgradeText>
              </UpgradePrompt>
            </IssueCard>
          ))}
        </IssuesList>
      </Section>

      {/* Top SEO Improvement */}
      <Section>
        <SectionTitle>{report.topSeoImprovement.headline}</SectionTitle>
        <SeoCard>
          <SeoIssueTitle>{report.topSeoImprovement.issue.title}</SeoIssueTitle>
          <SeoDescription>
            <strong>Why it matters:</strong> {report.topSeoImprovement.issue.whyItMatters}
          </SeoDescription>
          <SeoNextStep>
            <strong>Next step:</strong> {report.topSeoImprovement.issue.suggestedNextStep}
          </SeoNextStep>
          
          <UpgradePrompt>
            <UpgradeIcon>🔒</UpgradeIcon>
            <UpgradeText>
              Get complete SEO analysis with technical recommendations, competitor insights, and AI suggestions
            </UpgradeText>
          </UpgradePrompt>
        </SeoCard>
      </Section>

      {/* Call to Action */}
      <Section>
        <CallToActionContainer>
          <CTATitle>{report.callToAction.headline}</CTATitle>
          <CTAContent>{report.callToAction.content}</CTAContent>
          
          <CTAButtons>
            <PrimaryCTAButton 
              highlight={report.callToAction.primaryCTA.highlight}
              onClick={() => handleUpgradeClick('get_detailed_report')}
            >
              {report.callToAction.primaryCTA.text}
            </PrimaryCTAButton>
            <SecondaryCTAButton onClick={() => handleUpgradeClick('schedule_consultation')}>
              {report.callToAction.secondaryCTA.text}
            </SecondaryCTAButton>
          </CTAButtons>

          {/* Show upgrade prompts if available */}
          {report.hasUpgradePrompts && (
            <UpgradePrompts>
              <UpgradePromptsTitle>What you're missing:</UpgradePromptsTitle>
              {report.getUpgradePrompts().map((prompt, index) => (
                <UpgradePromptItem key={index}>
                  <UpgradePromptMessage>{prompt.message}</UpgradePromptMessage>
                  <UpgradePromptCTA>{prompt.cta}</UpgradePromptCTA>
                </UpgradePromptItem>
              ))}
            </UpgradePrompts>
          )}
        </CallToActionContainer>
      </Section>

      {/* Disclaimer */}
      <Disclaimer>{report.disclaimer}</Disclaimer>
    </ReportContainer>
  );
};

// Styled Components
const ReportContainer = styled.div`
  max-width: 800px;
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
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const WebsiteInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const WebsiteUrl = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  word-break: break-all;
`;

const ReportTimestamp = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
`;

const FreeReportBadge = styled.span`
  display: inline-block;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  width: fit-content;
`;

const ScreenshotContainer = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const ScreenshotViewport = styled.div`
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  flex: 1;
`;

const ViewportLabel = styled.div`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 1;
`;

const Screenshot = styled.img`
  width: 100%;
  max-width: 200px;
  height: auto;
  display: block;
  
  @media (max-width: 768px) {
    width: 100%;
    max-width: 300px;
  }
`;

const WatermarkOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem;
  font-size: 0.75rem;
  text-align: center;
`;

const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
`;

const ScoreContainer = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2rem;
  align-items: center;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 1rem;
  }
`;

const OverallScore = styled.div`
  font-size: 4rem;
  font-weight: 800;
  color: ${props => props.color};
  line-height: 1;
`;

const ComplianceStatus = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ComplianceBadge = styled.div`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
  text-align: center;
  background-color: ${props => props.backgroundColor};
  color: ${props => props.color};
  border: 2px solid ${props => props.borderColor};
`;

const ComplianceMessage = styled.p`
  margin: 0;
  color: #4b5563;
`;

const KeyTakeaway = styled.div`
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid #6366f1;
  margin-bottom: 1.5rem;
`;

const IssueCounts = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`;

const IssueCountItem = styled.div`
  text-align: center;
  padding: 1rem;
  border-radius: 0.5rem;
  background: #f9fafb;
  border: 2px solid ${props => 
    props.critical ? '#ef4444' : 
    props.serious ? '#f59e0b' : '#e5e7eb'
  };
`;

const IssueNumber = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: #1f2937;
`;

const IssueLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;

const IssuesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const IssueCard = styled.div`
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const IssueHeader = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const IssueNumberBadge = styled.div`
  background: #ef4444;
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

const IssueTitleContainer = styled.div`
  flex: 1;
`;

const IssueTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
`;

const ElementsAffected = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
`;

const IssueDescription = styled.p`
  margin: 0 0 1rem 0;
  color: #4b5563;
`;

const WcagReference = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
  margin-bottom: 1rem;
`;

const NextStep = styled.div`
  background: #dbeafe;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border-left: 4px solid #3b82f6;
  margin-bottom: 1rem;
`;

const SeoCard = styled.div`
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SeoIssueTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
`;

const SeoDescription = styled.p`
  margin: 0 0 1rem 0;
  color: #4b5563;
`;

const SeoNextStep = styled.div`
  background: #f0fdf4;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border-left: 4px solid #10b981;
  margin-bottom: 1rem;
`;

const UpgradePrompt = styled.div`
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  padding: 1rem;
  border-radius: 0.5rem;
  border: 2px dashed #9ca3af;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const UpgradeIcon = styled.span`
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const UpgradeText = styled.span`
  color: #4b5563;
  font-size: 0.875rem;
  font-style: italic;
`;

const CallToActionContainer = styled.div`
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
`;

const CTATitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
`;

const CTAContent = styled.p`
  font-size: 1.1rem;
  margin: 0 0 2rem 0;
  opacity: 0.9;
`;

const CTAButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const PrimaryCTAButton = styled.button`
  background: ${props => props.highlight ? '#ef4444' : 'white'};
  color: ${props => props.highlight ? 'white' : '#6366f1'};
  border: 2px solid ${props => props.highlight ? '#ef4444' : 'white'};
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const SecondaryCTAButton = styled.button`
  background: transparent;
  color: white;
  border: 2px solid white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: white;
    color: #6366f1;
  }
`;

const UpgradePrompts = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const UpgradePromptsTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
`;

const UpgradePromptItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const UpgradePromptMessage = styled.span`
  opacity: 0.9;
`;

const UpgradePromptCTA = styled.span`
  color: #fbbf24;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Disclaimer = styled.div`
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  border-left: 4px solid #9ca3af;
  margin-top: 2rem;
`;

export default FreeReportDisplay;