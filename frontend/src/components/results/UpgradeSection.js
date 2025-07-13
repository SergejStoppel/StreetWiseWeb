import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import {
  FaStar,
  FaCheckCircle,
  FaFileAlt,
  FaPhone,
  FaArrowRight,
  FaLock,
  FaChartLine,
  FaCode,
  FaImage,
  FaDollarSign,
  FaShieldAlt
} from 'react-icons/fa';

const UpgradeContainer = styled.section`
  background: linear-gradient(135deg, var(--color-interactive-primary-50) 0%, var(--color-surface-elevated) 100%);
  padding: var(--spacing-2xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--spacing-2xl);
  border: 1px solid var(--color-interactive-primary-200);
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
  margin: 0 auto var(--spacing-xl) auto;
  font-family: var(--font-family-secondary);
  text-align: center;
  max-width: 600px;
`;

const LimitationsBox = styled.div`
  background: var(--color-surface-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-primary);
  margin-bottom: var(--spacing-xl);
  text-align: center;
`;

const LimitationsText = styled.p`
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-family-secondary);
`;

const FeaturesTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
  font-family: var(--font-family-primary);
  text-align: center;
`;

const FeaturesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-surface-primary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-primary);
`;

const FeatureIcon = styled.div`
  font-size: var(--font-size-lg);
  color: var(--color-interactive-primary);
  margin-top: var(--spacing-xs);
  flex-shrink: 0;
`;

const FeatureText = styled.div`
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-family-secondary);
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
`;

const PricingCard = styled.div`
  background: var(--color-surface-primary);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  border: 2px solid ${props => props.popular ? 'var(--color-interactive-primary)' : 'var(--color-border-primary)'};
  text-align: center;
  position: relative;
  
  ${props => props.popular && `
    transform: scale(1.05);
    box-shadow: var(--shadow-xl);
  `}
`;

const PopularBadge = styled.div`
  background: var(--color-interactive-primary);
  color: var(--color-text-on-brand);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
`;

const PricingTitle = styled.h4`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-family-primary);
`;

const PricingPrice = styled.div`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-interactive-primary);
  margin-bottom: var(--spacing-lg);
  font-family: var(--font-family-primary);
`;

const PricingDescription = styled.p`
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  margin-bottom: var(--spacing-lg);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-family-secondary);
`;

const CTAButton = styled.button`
  background: ${props => props.primary ? 'var(--color-interactive-primary)' : 'var(--color-surface-secondary)'};
  color: ${props => props.primary ? 'var(--color-text-on-brand)' : 'var(--color-text-primary)'};
  padding: var(--spacing-md) var(--spacing-xl);
  border: ${props => props.primary ? 'none' : '2px solid var(--color-border-primary)'};
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  width: 100%;
  box-shadow: ${props => props.primary ? 'var(--shadow-md)' : 'none'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.primary ? 'var(--shadow-lg)' : 'var(--shadow-md)'};
    background: ${props => props.primary ? 'var(--color-interactive-primary-hover)' : 'var(--color-surface-elevated)'};
  }
`;

const ContactSection = styled.div`
  background: var(--color-surface-primary);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-primary);
  text-align: center;
`;

const ContactTitle = styled.h4`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-family-primary);
`;

const ContactText = styled.p`
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  margin-bottom: var(--spacing-lg);
  font-family: var(--font-family-secondary);
`;

const ContactButton = styled(CTAButton)`
  max-width: 200px;
  margin: 0 auto;
`;

const UpgradeSection = ({ analysisData, onUpgrade }) => {
  const { t } = useTranslation(['results']);

  const features = [
    {
      icon: <FaFileAlt />,
      text: t('results:upgrade.features.0')
    },
    {
      icon: <FaCode />,
      text: t('results:upgrade.features.1')
    },
    {
      icon: <FaImage />,
      text: t('results:upgrade.features.2')
    },
    {
      icon: <FaChartLine />,
      text: t('results:upgrade.features.3')
    },
    {
      icon: <FaDollarSign />,
      text: t('results:upgrade.features.4')
    },
    {
      icon: <FaShieldAlt />,
      text: t('results:upgrade.features.5')
    }
  ];

  const handleBuyReport = () => {
    // In development mode, directly show the detailed report
    if (process.env.NODE_ENV === 'development') {
      if (onUpgrade) {
        onUpgrade('detailed');
      }
    } else {
      // TODO: Implement Stripe payment flow
      console.log('Redirect to payment for detailed report');
    }
  };

  const handleScheduleCall = () => {
    // In development mode, directly show the detailed report
    if (process.env.NODE_ENV === 'development') {
      if (onUpgrade) {
        onUpgrade('consultation');
      }
    } else {
      // TODO: Implement Stripe payment flow and scheduling
      console.log('Redirect to payment and scheduling for consultation');
    }
  };

  const handleContactUs = () => {
    // TODO: Implement contact flow
    console.log('Contact us');
  };

  return (
    <UpgradeContainer>
      <SectionTitle>{t('results:upgrade.title')}</SectionTitle>
      <SectionSubtitle>{t('results:upgrade.subtitle')}</SectionSubtitle>

      <FeaturesTitle>{t('results:upgrade.detailedReportIncludes')}</FeaturesTitle>
      
      <FeaturesList>
        {features.map((feature, index) => (
          <FeatureItem key={index}>
            <FeatureIcon>{feature.icon}</FeatureIcon>
            <FeatureText>{feature.text}</FeatureText>
          </FeatureItem>
        ))}
      </FeaturesList>

      <PricingGrid>
        <PricingCard>
          <PricingTitle>Detailed Report</PricingTitle>
          <PricingPrice>$99</PricingPrice>
          <PricingDescription>
            Complete analysis with step-by-step instructions and priority recommendations.
          </PricingDescription>
          <CTAButton primary onClick={handleBuyReport}>
            <FaFileAlt />
            {t('results:upgrade.cta.buyReport')}
          </CTAButton>
        </PricingCard>

        <PricingCard popular>
          <PopularBadge>
            <FaStar />
            Most Popular
          </PopularBadge>
          <PricingTitle>Report + Consultation</PricingTitle>
          <PricingPrice>$199</PricingPrice>
          <PricingDescription>
            Detailed report plus 30-minute consultation to discuss your specific needs and priorities.
          </PricingDescription>
          <CTAButton primary onClick={handleScheduleCall}>
            <FaPhone />
            {t('results:upgrade.cta.scheduleCall')}
          </CTAButton>
        </PricingCard>
      </PricingGrid>

      <ContactSection>
        <ContactTitle>Have Questions?</ContactTitle>
        <ContactText>
          We're here to help you understand your website's needs and how to improve it for your customers.
        </ContactText>
        <ContactButton onClick={handleContactUs}>
          <FaArrowRight />
          {t('results:upgrade.cta.contactUs')}
        </ContactButton>
      </ContactSection>
    </UpgradeContainer>
  );
};

export default UpgradeSection;