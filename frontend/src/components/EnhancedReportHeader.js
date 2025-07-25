import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SiteTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const SiteUrl = styled.a`
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: white;
    text-decoration: underline;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const MetricCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.color || '#fff'};
  margin-bottom: 0.25rem;
`;

const MetricLabel = styled.div`
  font-size: 0.875rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ScreenshotSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ScreenshotContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const ScreenshotFrame = styled.div`
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  position: relative;
  
  &::before {
    content: '${props => props.label}';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    text-align: center;
    z-index: 1;
  }
`;

const ScreenshotImage = styled.img`
  width: ${props => props.width || '140px'};
  height: auto;
  display: block;
  margin-top: 1.5rem;
  
  @media (max-width: 768px) {
    width: ${props => props.width === '200px' ? '160px' : '120px'};
  }
`;

const ScreenshotPlaceholder = styled.div`
  width: ${props => props.width || '140px'};
  height: ${props => props.height || '100px'};
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin-top: 1.5rem;
  
  @media (max-width: 768px) {
    width: ${props => props.width === '200px' ? '160px' : '120px'};
    height: ${props => props.width === '200px' ? '88px' : '68px'};
  }
`;

const AnalysisInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
`;

const AnalysisDate = styled.div`
  opacity: 0.8;
  font-size: 0.9rem;
`;

const AnalysisType = styled.div`
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
`;

const ExternalLinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15,3 21,3 21,9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

const EnhancedReportHeader = ({ report }) => {
  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    if (score >= 50) return '#f97316';
    return '#ef4444';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWebsiteTitle = () => {
    if (report?.metadata?.title) return report.metadata.title;
    if (report?.url) {
      try {
        const urlObj = new URL(report.url);
        return urlObj.hostname;
      } catch (e) {
        return 'Website Analysis';
      }
    }
    return 'Website Analysis';
  };

  const summary = report?.summary || {};
  const screenshot = report?.screenshot || {};
  const websiteContext = report?.aiInsights?.websiteContext || {};
  
  // Debug screenshot data
  console.log('📸 EnhancedReportHeader screenshot data:', {
    reportHasScreenshot: !!report?.screenshot,
    screenshot: screenshot,
    screenshotType: typeof screenshot,
    screenshotKeys: screenshot ? Object.keys(screenshot) : 'no screenshot',
    desktopUrl: screenshot?.desktop,
    mobileUrl: screenshot?.mobile,
    isDataUrl: screenshot?.desktop?.startsWith('data:') || screenshot?.mobile?.startsWith('data:'),
    isSupabaseUrl: screenshot?.desktop?.includes('supabase.co') || screenshot?.mobile?.includes('supabase.co')
  });

  return (
    <HeaderContainer>
      <HeaderContent>
        <TitleSection>
          <SiteTitle>{getWebsiteTitle()}</SiteTitle>
          
          {report?.url && (
            <SiteUrl href={report.url} target="_blank" rel="noopener noreferrer">
              {report.url}
              <ExternalLinkIcon />
            </SiteUrl>
          )}

          <MetricsGrid>
            <MetricCard>
              <MetricValue color={getScoreColor(summary.overallScore || 0)}>
                {summary.overallScore || 0}
              </MetricValue>
              <MetricLabel>Overall Score</MetricLabel>
            </MetricCard>
            
            <MetricCard>
              <MetricValue color={getScoreColor(summary.accessibilityScore || 0)}>
                {summary.accessibilityScore || 0}
              </MetricValue>
              <MetricLabel>Accessibility</MetricLabel>
            </MetricCard>
            
            <MetricCard>
              <MetricValue color={getScoreColor(summary.seoScore || 0)}>
                {summary.seoScore || 0}
              </MetricValue>
              <MetricLabel>SEO</MetricLabel>
            </MetricCard>
            
            <MetricCard>
              <MetricValue color={getScoreColor(summary.performanceScore || 0)}>
                {summary.performanceScore || 0}
              </MetricValue>
              <MetricLabel>Performance</MetricLabel>
            </MetricCard>
          </MetricsGrid>
        </TitleSection>

        <ScreenshotSection>
          <ScreenshotContainer>
            <ScreenshotFrame label="Desktop">
              {screenshot.desktop ? (
                <ScreenshotImage 
                  src={screenshot.desktop} 
                  alt="Desktop screenshot" 
                  width="200px"
                  onLoad={() => console.log('🖼️ Desktop screenshot loaded successfully:', screenshot.desktop)}
                  onError={(e) => {
                    console.error('❌ Desktop screenshot failed to load:', screenshot.desktop);
                    console.error('Error details:', e);
                  }}
                />
              ) : (
                <ScreenshotPlaceholder width="200px" height="110px">
                  Desktop View
                </ScreenshotPlaceholder>
              )}
            </ScreenshotFrame>
            
            <ScreenshotFrame label="Mobile">
              {screenshot.mobile ? (
                <ScreenshotImage 
                  src={screenshot.mobile} 
                  alt="Mobile screenshot" 
                  width="80px"
                  onLoad={() => console.log('🖼️ Mobile screenshot loaded successfully:', screenshot.mobile)}
                  onError={(e) => {
                    console.error('❌ Mobile screenshot failed to load:', screenshot.mobile);
                    console.error('Error details:', e);
                  }}
                />
              ) : (
                <ScreenshotPlaceholder width="80px" height="85px">
                  Mobile View
                </ScreenshotPlaceholder>
              )}
            </ScreenshotFrame>
          </ScreenshotContainer>
        </ScreenshotSection>
      </HeaderContent>

      <AnalysisInfo>
        <AnalysisDate>
          Analyzed on {formatDate(report?.timestamp || new Date().toISOString())}
        </AnalysisDate>
        
        <AnalysisType>
          {websiteContext.type && websiteContext.type !== 'unknown' 
            ? `${websiteContext.type.charAt(0).toUpperCase() + websiteContext.type.slice(1)} Website`
            : 'Comprehensive Analysis'
          }
        </AnalysisType>
      </AnalysisInfo>
    </HeaderContainer>
  );
};

export default EnhancedReportHeader;