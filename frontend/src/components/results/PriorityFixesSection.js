import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import {
  FaExclamationTriangle,
  FaWrench,
  FaDollarSign,
  FaUsers,
  FaThumbsUp,
  FaClock,
  FaCheckCircle
} from 'react-icons/fa';

const PriorityContainer = styled.section`
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
`;

const SectionSubtitle = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-2xl);
  font-family: var(--font-family-secondary);
`;

const FixesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
`;

const FixCard = styled.div`
  background: var(--color-surface-primary);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-primary);
  border-left: 4px solid ${props => {
    if (props.priority === 'high') return 'var(--color-error)';
    if (props.priority === 'medium') return 'var(--color-warning)';
    return 'var(--color-info)';
  }};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    transition: all var(--transition-fast);
  }
`;

const FixHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-md);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const FixTitleSection = styled.div`
  flex: 1;
`;

const FixNumber = styled.div`
  background: ${props => {
    if (props.priority === 'high') return 'var(--color-error)';
    if (props.priority === 'medium') return 'var(--color-warning)';
    return 'var(--color-info)';
  }};
  color: var(--color-text-on-brand);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-sm);
`;

const FixTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-family-primary);
`;

const FixDescription = styled.p`
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-family-secondary);
`;

const FixBadges = styled.div`
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    margin-top: var(--spacing-md);
  }
`;

const Badge = styled.span`
  background: ${props => {
    if (props.type === 'impact-high') return 'var(--color-error-100)';
    if (props.type === 'impact-medium') return 'var(--color-warning-100)';
    if (props.type === 'impact-low') return 'var(--color-info-100)';
    if (props.type === 'effort-easy') return 'var(--color-success-100)';
    if (props.type === 'effort-moderate') return 'var(--color-warning-100)';
    if (props.type === 'effort-complex') return 'var(--color-error-100)';
    return 'var(--color-neutral-100)';
  }};
  color: ${props => {
    if (props.type === 'impact-high') return 'var(--color-error-700)';
    if (props.type === 'impact-medium') return 'var(--color-warning-700)';
    if (props.type === 'impact-low') return 'var(--color-info-700)';
    if (props.type === 'effort-easy') return 'var(--color-success-700)';
    if (props.type === 'effort-moderate') return 'var(--color-warning-700)';
    if (props.type === 'effort-complex') return 'var(--color-error-700)';
    return 'var(--color-neutral-700)';
  }};
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
`;

const BenefitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
`;

const BenefitCard = styled.div`
  background: var(--color-surface-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-secondary);
`;

const BenefitTitle = styled.div`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-family: var(--font-family-primary);
`;

const BenefitText = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-family-secondary);
`;

const NoIssuesCard = styled.div`
  background: var(--color-success-100);
  border: 1px solid var(--color-success-300);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  text-align: center;
`;

const NoIssuesIcon = styled.div`
  font-size: var(--font-size-4xl);
  color: var(--color-success);
  margin-bottom: var(--spacing-md);
`;

const NoIssuesText = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-success-700);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-secondary);
`;

const PriorityFixesSection = ({ analysisData }) => {
  const { t } = useTranslation(['results']);

  // Extract priority fixes from analysis data
  const getPriorityFixes = () => {
    if (!analysisData) return [];
    
    const fixes = [];
    // Look for violations in multiple possible locations
    const violations = analysisData.violations || analysisData.recommendations || [];
    
    // Sort violations by impact and add business context
    violations
      .sort((a, b) => {
        const impactOrder = { critical: 4, serious: 3, moderate: 2, minor: 1 };
        return (impactOrder[b.impact] || 0) - (impactOrder[a.impact] || 0);
      })
      .slice(0, 3) // Top 3 only
      .forEach((violation, index) => {
        fixes.push({
          id: violation.id,
          priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
          title: getBusinessTitle(violation),
          description: getBusinessDescription(violation),
          impact: getImpactLevel(violation),
          effort: getEffortLevel(violation),
          businessBenefit: getBusinessBenefit(violation),
          customerBenefit: getCustomerBenefit(violation)
        });
      });
    
    return fixes;
  };

  const getBusinessTitle = (violation) => {
    // Convert technical violations to business-friendly titles
    const titleMap = {
      'color-contrast': 'Text is hard to read',
      'image-alt': 'Images are missing descriptions', 
      'heading-order': 'Page structure is confusing',
      'form-label': 'Forms are difficult to fill out',
      'link-name': 'Links are unclear',
      'keyboard-trap': 'Keyboard users get stuck',
      'focus-order': 'Navigation order is confusing'
    };
    
    return titleMap[violation.id] || 'Accessibility issue found';
  };

  const getBusinessDescription = (violation) => {
    // Convert technical descriptions to business impact
    const descriptionMap = {
      'color-contrast': 'Some text on your website is too light or doesn\'t have enough contrast, making it hard for customers to read.',
      'image-alt': 'Your images don\'t have descriptions, so customers using screen readers can\'t understand what they show.',
      'heading-order': 'Your page headings skip around, making it confusing for customers to follow your content.',
      'form-label': 'Your contact forms and other forms don\'t clearly label what information customers need to enter.',
      'link-name': 'Some of your links just say "click here" instead of explaining where they go.',
      'keyboard-trap': 'Customers who can\'t use a mouse get trapped and can\'t navigate away from certain parts of your site.',
      'focus-order': 'When customers navigate with a keyboard, the order doesn\'t make logical sense.'
    };
    
    return descriptionMap[violation.id] || 'This accessibility issue may prevent some customers from using your website effectively.';
  };

  const getImpactLevel = (violation) => {
    if (violation.impact === 'critical' || violation.impact === 'serious') return 'high';
    if (violation.impact === 'moderate') return 'medium';
    return 'low';
  };

  const getEffortLevel = (violation) => {
    // Determine effort based on violation type
    const easyFixes = ['image-alt', 'form-label', 'link-name'];
    const complexFixes = ['color-contrast', 'keyboard-trap', 'focus-order'];
    
    if (easyFixes.includes(violation.id)) return 'easy';
    if (complexFixes.includes(violation.id)) return 'complex';
    return 'moderate';
  };

  const getBusinessBenefit = (violation) => {
    const benefitMap = {
      'color-contrast': 'More customers can read your content clearly',
      'image-alt': 'Better search engine rankings and accessibility',
      'heading-order': 'Customers find information faster',
      'form-label': 'More customers complete your forms',
      'link-name': 'Customers know where links will take them',
      'keyboard-trap': 'All customers can navigate your entire site',
      'focus-order': 'Keyboard users have a smooth experience'
    };
    
    return benefitMap[violation.id] || 'Improved customer experience';
  };

  const getCustomerBenefit = (violation) => {
    const benefitMap = {
      'color-contrast': 'Easier to read, especially for older customers',
      'image-alt': 'Screen reader users understand all content',
      'heading-order': 'Logical flow through your information',
      'form-label': 'Clear guidance on what to enter',
      'link-name': 'Confidence about where links lead',
      'keyboard-trap': 'Freedom to navigate anywhere',
      'focus-order': 'Predictable navigation experience'
    };
    
    return benefitMap[violation.id] || 'Better accessibility for all customers';
  };

  const priorityFixes = getPriorityFixes();

  if (priorityFixes.length === 0) {
    return (
      <PriorityContainer>
        <SectionTitle>{t('results:priorities.title')}</SectionTitle>
        <NoIssuesCard>
          <NoIssuesIcon>
            <FaCheckCircle />
          </NoIssuesIcon>
          <NoIssuesText>
            {t('results:priorities.noIssues')}
          </NoIssuesText>
        </NoIssuesCard>
      </PriorityContainer>
    );
  }

  return (
    <PriorityContainer>
      <SectionTitle>{t('results:priorities.title')}</SectionTitle>
      <SectionSubtitle>{t('results:priorities.subtitle')}</SectionSubtitle>

      <FixesList>
        {priorityFixes.map((fix, index) => (
          <FixCard key={fix.id} priority={fix.priority}>
            <FixHeader>
              <FixTitleSection>
                <FixNumber priority={fix.priority}>{index + 1}</FixNumber>
                <FixTitle>{fix.title}</FixTitle>
                <FixDescription>{fix.description}</FixDescription>
              </FixTitleSection>
              
              <FixBadges>
                <Badge type={`impact-${fix.impact}`}>
                  <FaExclamationTriangle />
                  {t(`results:priorities.impact.${fix.impact}`)}
                </Badge>
                <Badge type={`effort-${fix.effort}`}>
                  <FaWrench />
                  {t(`results:priorities.effort.${fix.effort}`)}
                </Badge>
              </FixBadges>
            </FixHeader>

            <BenefitsGrid>
              <BenefitCard>
                <BenefitTitle>
                  <FaDollarSign />
                  {t('results:priorities.businessBenefit')}
                </BenefitTitle>
                <BenefitText>{fix.businessBenefit}</BenefitText>
              </BenefitCard>
              
              <BenefitCard>
                <BenefitTitle>
                  <FaUsers />
                  {t('results:priorities.customerBenefit')}
                </BenefitTitle>
                <BenefitText>{fix.customerBenefit}</BenefitText>
              </BenefitCard>
            </BenefitsGrid>
          </FixCard>
        ))}
      </FixesList>
    </PriorityContainer>
  );
};

export default PriorityFixesSection;