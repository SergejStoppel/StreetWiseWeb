import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { FaExclamationTriangle, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';

const Container = styled.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7280;
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const EmptyDescription = styled.p`
  color: #9ca3af;
`;

const RecommendationCard = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const RecommendationHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const PriorityIcon = styled.div`
  font-size: 1.25rem;
  color: ${props => {
    switch (props.priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  }};
  margin-top: 0.125rem;
`;

const RecommendationContent = styled.div`
  flex: 1;
`;

const RecommendationTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const RecommendationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
`;

const PriorityBadge = styled.span`
  background: ${props => {
    switch (props.priority) {
      case 'high': return '#fee2e2';
      case 'medium': return '#fef3c7';
      case 'low': return '#d1fae5';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  }};
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
`;

const CategoryBadge = styled.span`
  background: #e5e7eb;
  color: #4b5563;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
`;

const Description = styled.p`
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const ActionSection = styled.div`
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  border-left: 4px solid ${props => {
    switch (props.priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  }};
`;

const ActionTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ActionText = styled.p`
  color: #4b5563;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const getPriorityIcon = (priority) => {
  switch (priority) {
    case 'high':
      return <FaExclamationTriangle />;
    case 'medium':
      return <FaInfoCircle />;
    case 'low':
      return <FaCheckCircle />;
    default:
      return <FaInfoCircle />;
  }
};

const RecommendationsList = ({ recommendations }) => {
  const { t } = useTranslation('dashboard');
  if (!recommendations || recommendations.length === 0) {
    return (
      <Container>
        <EmptyState>
          <EmptyTitle>{t('recommendations.noRecommendations.title')}</EmptyTitle>
          <EmptyDescription>
            {t('recommendations.noRecommendations.description')}
          </EmptyDescription>
        </EmptyState>
      </Container>
    );
  }

  // Sort recommendations by priority (high -> medium -> low)
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const sortedRecommendations = [...recommendations].sort(
    (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
  );

  return (
    <Container>
      {sortedRecommendations.map((recommendation, index) => (
        <RecommendationCard key={index}>
          <RecommendationHeader>
            <PriorityIcon priority={recommendation.priority}>
              {getPriorityIcon(recommendation.priority)}
            </PriorityIcon>
            <RecommendationContent>
              <RecommendationTitle>{recommendation.title}</RecommendationTitle>
              <RecommendationMeta>
                <PriorityBadge priority={recommendation.priority}>
                  {t('recommendations.priority.' + recommendation.priority)} {t('recommendations.priorityLabel')}
                </PriorityBadge>
                {recommendation.category && (
                  <CategoryBadge>{recommendation.category}</CategoryBadge>
                )}
              </RecommendationMeta>
              <Description>{recommendation.description}</Description>
              <ActionSection priority={recommendation.priority}>
                <ActionTitle>{t('recommendations.recommendedAction')}</ActionTitle>
                <ActionText>{recommendation.action}</ActionText>
              </ActionSection>
            </RecommendationContent>
          </RecommendationHeader>
        </RecommendationCard>
      ))}
    </Container>
  );
};

export default RecommendationsList;