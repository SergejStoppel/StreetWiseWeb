import React, { useState } from 'react';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const DashboardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
`;

const HeaderIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const HeaderTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const HeaderSubtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const InsightCard = styled.div`
  background: ${props => props.background || '#f9fafb'};
  border: 1px solid ${props => props.borderColor || '#e5e7eb'};
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const InsightIcon = styled.div`
  width: 32px;
  height: 32px;
  background: ${props => props.background || '#667eea'};
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 1rem;
`;

const InsightTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const InsightValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.color || '#1f2937'};
  margin-bottom: 0.5rem;
`;

const InsightDescription = styled.p`
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
`;

const RecommendationsSection = styled.div`
  margin-top: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RecommendationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RecommendationCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 4px solid ${props => props.priorityColor || '#667eea'};
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f1f5f9;
  }
`;

const RecommendationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const RecommendationTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const PriorityBadge = styled.span`
  background: ${props => props.background || '#667eea'};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  white-space: nowrap;
`;

const RecommendationDescription = styled.p`
  color: #4b5563;
  margin: 0 0 1rem 0;
  line-height: 1.6;
`;

const RecommendationMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const WebsiteContextSection = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const ContextGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const ContextItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ContextLabel = styled.span`
  font-weight: 500;
  color: #374151;
`;

const ContextValue = styled.span`
  color: #6b7280;
  text-transform: capitalize;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const EmptyStateIcon = styled.div`
  width: 60px;
  height: 60px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
  color: #9ca3af;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 0.875rem;
  margin-left: auto;
  
  &:hover {
    text-decoration: underline;
  }
`;

const AiIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const InsightIcon1 = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
  </svg>
);

const AiInsightsDashboard = ({ aiInsights }) => {
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  // Debug: Log the aiInsights data to see what we're receiving
  console.log('AiInsightsDashboard received aiInsights:', aiInsights);
  
  if (!aiInsights || (typeof aiInsights === 'object' && Object.keys(aiInsights).length === 0)) {
    return (
      <DashboardContainer>
        <DashboardHeader>
          <HeaderIcon>
            <AiIcon />
          </HeaderIcon>
          <div>
            <HeaderTitle>AI Insights</HeaderTitle>
            <HeaderSubtitle>Intelligent analysis and recommendations</HeaderSubtitle>
          </div>
        </DashboardHeader>
        
        <EmptyState>
          <EmptyStateIcon>
            <AiIcon />
          </EmptyStateIcon>
          <h3>AI Analysis In Progress</h3>
          <p>Advanced AI insights will appear here once the analysis is complete.</p>
        </EmptyState>
      </DashboardContainer>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getBusinessImpactColor = (impact) => {
    switch (impact) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const websiteContext = aiInsights.websiteContext || {};
  const businessInsights = aiInsights.businessInsights || [];
  const recommendations = aiInsights.recommendations || [];
  const estimatedImpact = aiInsights.estimatedImpact || {};

  const displayedRecommendations = showAllRecommendations ? recommendations : recommendations.slice(0, 3);

  return (
    <DashboardContainer>
      <DashboardHeader>
        <HeaderIcon>
          <AiIcon />
        </HeaderIcon>
        <div>
          <HeaderTitle>AI Insights</HeaderTitle>
          <HeaderSubtitle>Intelligent analysis and context-aware recommendations</HeaderSubtitle>
        </div>
      </DashboardHeader>

      {/* Website Context */}
      <WebsiteContextSection>
        <SectionTitle>Website Context</SectionTitle>
        <ContextGrid>
          <ContextItem>
            <ContextLabel>Type:</ContextLabel>
            <ContextValue>{websiteContext.type || 'Unknown'}</ContextValue>
          </ContextItem>
          <ContextItem>
            <ContextLabel>Industry:</ContextLabel>
            <ContextValue>{websiteContext.industry || 'Unknown'}</ContextValue>
          </ContextItem>
          <ContextItem>
            <ContextLabel>Target Audience:</ContextLabel>
            <ContextValue>{websiteContext.targetAudience || 'Unknown'}</ContextValue>
          </ContextItem>
          <ContextItem>
            <ContextLabel>Tech Stack:</ContextLabel>
            <ContextValue>{websiteContext.techStack || 'Unknown'}</ContextValue>
          </ContextItem>
          <ContextItem>
            <ContextLabel>Business Model:</ContextLabel>
            <ContextValue>{websiteContext.businessModel || 'Unknown'}</ContextValue>
          </ContextItem>
          <ContextItem>
            <ContextLabel>User Interaction:</ContextLabel>
            <ContextValue>{websiteContext.userInteractionLevel || 'Unknown'}</ContextValue>
          </ContextItem>
        </ContextGrid>
      </WebsiteContextSection>

      {/* Business Insights */}
      <InsightsGrid>
        {businessInsights.map((insight, index) => (
          <InsightCard key={index}>
            <InsightIcon background={getBusinessImpactColor(insight.type)}>
              <InsightIcon1 />
            </InsightIcon>
            <InsightTitle>{insight.title}</InsightTitle>
            <InsightValue color={getBusinessImpactColor(insight.type)}>
              {insight.value}
            </InsightValue>
            <InsightDescription>{insight.explanation}</InsightDescription>
          </InsightCard>
        ))}
        
        {/* Estimated Impact */}
        <InsightCard>
          <InsightIcon background="#10b981">
            <InsightIcon1 />
          </InsightIcon>
          <InsightTitle>Improvement Potential</InsightTitle>
          <InsightValue color="#10b981">
            {estimatedImpact.accessibilityImprovement || 0}%
          </InsightValue>
          <InsightDescription>
            Estimated accessibility improvement with recommended fixes
          </InsightDescription>
        </InsightCard>
        
        <InsightCard>
          <InsightIcon background="#3b82f6">
            <InsightIcon1 />
          </InsightIcon>
          <InsightTitle>Business Impact</InsightTitle>
          <InsightValue color="#3b82f6">
            {estimatedImpact.businessImpact || 'Medium'}
          </InsightValue>
          <InsightDescription>
            Expected business impact level from accessibility improvements
          </InsightDescription>
        </InsightCard>
      </InsightsGrid>

      {/* Recommendations */}
      <RecommendationsSection>
        <SectionTitle>
          AI Recommendations
          {recommendations.length > 3 && (
            <ToggleButton onClick={() => setShowAllRecommendations(!showAllRecommendations)}>
              {showAllRecommendations ? 'Show Less' : `Show All (${recommendations.length})`}
            </ToggleButton>
          )}
        </SectionTitle>
        
        <RecommendationsList>
          {displayedRecommendations.map((recommendation, index) => (
            <RecommendationCard 
              key={index}
              priorityColor={getPriorityColor(recommendation.priority)}
            >
              <RecommendationHeader>
                <RecommendationTitle>{recommendation.title}</RecommendationTitle>
                <PriorityBadge background={getPriorityColor(recommendation.priority)}>
                  {recommendation.priority}
                </PriorityBadge>
              </RecommendationHeader>
              
              <RecommendationDescription>
                {recommendation.description}
              </RecommendationDescription>
              
              <RecommendationMeta>
                {recommendation.businessImpact && (
                  <MetaItem>
                    <strong>Impact:</strong> {recommendation.businessImpact}
                  </MetaItem>
                )}
                {recommendation.estimatedROI && (
                  <MetaItem>
                    <strong>ROI:</strong> {recommendation.estimatedROI}
                  </MetaItem>
                )}
                {recommendation.timeToImplement && (
                  <MetaItem>
                    <strong>Time:</strong> {recommendation.timeToImplement}
                  </MetaItem>
                )}
              </RecommendationMeta>
            </RecommendationCard>
          ))}
        </RecommendationsList>
      </RecommendationsSection>
    </DashboardContainer>
  );
};

export default AiInsightsDashboard;