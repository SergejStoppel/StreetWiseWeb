import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaUsers,
  FaChartLine
} from 'react-icons/fa';

const OverviewContainer = styled.section`
  background: var(--color-surface-elevated);
  padding: var(--spacing-2xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--spacing-2xl);
  border: 1px solid var(--color-border-primary);
`;

const SectionTitle = styled.h2`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-family-primary);
  text-align: center;
`;

const SectionSubtitle = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-2xl);
  font-family: var(--font-family-secondary);
  text-align: center;
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
`;

const ScoreCard = styled.div`
  background: var(--color-surface-primary);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  border: 2px solid ${props => {
    if (props.score >= 80) return 'var(--color-success)';
    if (props.score >= 60) return 'var(--color-warning)';
    return 'var(--color-error)';
  }};
  text-align: center;
`;

const ScoreIcon = styled.div`
  font-size: var(--font-size-4xl);
  color: ${props => {
    if (props.score >= 80) return 'var(--color-success)';
    if (props.score >= 60) return 'var(--color-warning)';
    return 'var(--color-error)';
  }};
  margin-bottom: var(--spacing-md);
`;

const ScoreValue = styled.div`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-family-primary);
`;

const ScoreLabel = styled.div`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-family-primary);
`;

const ScoreDescription = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-family: var(--font-family-secondary);
`;

const RiskAssessment = styled.div`
  background: ${props => {
    if (props.risk === 'low') return 'var(--color-success-100)';
    if (props.risk === 'medium') return 'var(--color-warning-100)';
    return 'var(--color-error-100)';
  }};
  border: 1px solid ${props => {
    if (props.risk === 'low') return 'var(--color-success-300)';
    if (props.risk === 'medium') return 'var(--color-warning-300)';
    return 'var(--color-error-300)';
  }};
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-xl);
`;

const RiskHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
`;

const RiskIcon = styled.div`
  font-size: var(--font-size-2xl);
  color: ${props => {
    if (props.risk === 'low') return 'var(--color-success)';
    if (props.risk === 'medium') return 'var(--color-warning)';
    return 'var(--color-error)';
  }};
`;

const RiskTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: ${props => {
    if (props.risk === 'low') return 'var(--color-success-700)';
    if (props.risk === 'medium') return 'var(--color-warning-700)';
    return 'var(--color-error-700)';
  }};
  font-family: var(--font-family-primary);
`;

const RiskLevel = styled.span`
  background: ${props => {
    if (props.risk === 'low') return 'var(--color-success)';
    if (props.risk === 'medium') return 'var(--color-warning)';
    return 'var(--color-error)';
  }};
  color: var(--color-text-on-brand);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  margin-left: auto;
`;

const RiskDescription = styled.p`
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-family-secondary);
`;

const CustomerImpact = styled.div`
  background: var(--color-surface-primary);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-primary);
`;

const ImpactTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
  font-family: var(--font-family-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
`;

const ImpactList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ImpactItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-surface-secondary);
  border-radius: var(--border-radius-md);
`;

const ImpactIcon = styled.div`
  font-size: var(--font-size-lg);
  color: ${props => props.positive ? 'var(--color-success)' : 'var(--color-error)'};
  margin-top: var(--spacing-xs);
`;

const ImpactText = styled.div`
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-family-secondary);
`;

const OverviewSection = ({ analysisData }) => {
  const { t } = useTranslation(['results']);

  if (!analysisData) {
    return null;
  }

  // Calculate overall health score
  const overallScore = analysisData.overallScore || analysisData.summary?.overallScore || 0;
  
  // Determine risk level based on accessibility issues
  const getRiskLevel = () => {
    if (overallScore >= 80) return 'low';
    if (overallScore >= 60) return 'medium';
    return 'high';
  };

  const riskLevel = getRiskLevel();

  // Get health score description
  const getHealthDescription = () => {
    if (overallScore >= 80) return t('results:overview.healthScore.excellent');
    if (overallScore >= 60) return t('results:overview.healthScore.good');
    if (overallScore >= 40) return t('results:overview.healthScore.needsImprovement');
    return t('results:overview.healthScore.poor');
  };

  // Get customer impact insights
  const getCustomerImpacts = () => {
    const impacts = [];
    
    if (overallScore < 60) {
      impacts.push({
        positive: false,
        text: "Some customers with disabilities may not be able to use your website at all"
      });
      impacts.push({
        positive: false,
        text: "Customers may leave your site if it's difficult to navigate"
      });
    }
    
    if (overallScore < 40) {
      impacts.push({
        positive: false,
        text: "Your website may not show up in AI search results like ChatGPT"
      });
      impacts.push({
        positive: false,
        text: "Mobile users may have trouble making purchases or contacting you"
      });
    }
    
    if (overallScore >= 80) {
      impacts.push({
        positive: true,
        text: "Your website welcomes all customers, including those with disabilities"
      });
      impacts.push({
        positive: true,
        text: "Search engines and AI assistants can easily recommend your business"
      });
    }
    
    return impacts;
  };

  return (
    <OverviewContainer>
      <SectionTitle>{t('results:overview.title')}</SectionTitle>
      <SectionSubtitle>{t('results:overview.subtitle')}</SectionSubtitle>

      <OverviewGrid>
        {/* Overall Health Score */}
        <ScoreCard score={overallScore}>
          <ScoreIcon score={overallScore}>
            {overallScore >= 80 ? <FaCheckCircle /> : 
             overallScore >= 60 ? <FaExclamationTriangle /> : <FaTimesCircle />}
          </ScoreIcon>
          <ScoreValue>{overallScore}%</ScoreValue>
          <ScoreLabel>{t('results:overview.healthScore.title')}</ScoreLabel>
          <ScoreDescription>{getHealthDescription()}</ScoreDescription>
        </ScoreCard>

        {/* Customer Impact */}
        <CustomerImpact>
          <ImpactTitle>
            <FaUsers />
            {t('results:overview.customerImpact.title')}
          </ImpactTitle>
          <ImpactList>
            {getCustomerImpacts().map((impact, index) => (
              <ImpactItem key={index}>
                <ImpactIcon positive={impact.positive}>
                  {impact.positive ? <FaCheckCircle /> : <FaTimesCircle />}
                </ImpactIcon>
                <ImpactText>{impact.text}</ImpactText>
              </ImpactItem>
            ))}
          </ImpactList>
        </CustomerImpact>
      </OverviewGrid>

      {/* Legal Risk Assessment */}
      <RiskAssessment risk={riskLevel}>
        <RiskHeader>
          <RiskIcon risk={riskLevel}>
            <FaShieldAlt />
          </RiskIcon>
          <RiskTitle risk={riskLevel}>
            {t('results:overview.riskAssessment.title')}
          </RiskTitle>
          <RiskLevel risk={riskLevel}>
            {t(`results:overview.riskAssessment.${riskLevel}Risk`)}
          </RiskLevel>
        </RiskHeader>
        <RiskDescription>
          {t(`results:overview.riskAssessment.${riskLevel}RiskDescription`)}
        </RiskDescription>
      </RiskAssessment>
    </OverviewContainer>
  );
};

export default OverviewSection;