import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import {
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaWrench,
  FaDollarSign,
  FaUsers,
  FaCode,
  FaExternalLinkAlt
} from 'react-icons/fa';

const DetailedContainer = styled.section`
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

const CategoryTabs = styled.div`
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-2xl);
  flex-wrap: wrap;
`;

const CategoryTab = styled.button`
  background: ${props => props.active ? 'var(--color-interactive-primary)' : 'var(--color-surface-primary)'};
  color: ${props => props.active ? 'var(--color-text-on-brand)' : 'var(--color-text-primary)'};
  padding: var(--spacing-md) var(--spacing-lg);
  border: 1px solid ${props => props.active ? 'var(--color-interactive-primary)' : 'var(--color-border-primary)'};
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &:hover {
    background: ${props => props.active ? 'var(--color-interactive-primary-hover)' : 'var(--color-surface-secondary)'};
    transform: translateY(-1px);
  }
`;

const IssuesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
`;

const IssueCard = styled.div`
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-primary);
  border-left: 4px solid ${props => {
    if (props.severity === 'critical') return 'var(--color-error)';
    if (props.severity === 'serious') return 'var(--color-warning)';
    return 'var(--color-info)';
  }};
  border-radius: var(--border-radius-lg);
  overflow: hidden;
`;

const IssueHeader = styled.div`
  padding: var(--spacing-lg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  
  &:hover {
    background: var(--color-surface-secondary);
  }
`;

const IssueHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
`;

const IssueIcon = styled.div`
  font-size: var(--font-size-lg);
  color: ${props => {
    if (props.severity === 'critical') return 'var(--color-error)';
    if (props.severity === 'serious') return 'var(--color-warning)';
    return 'var(--color-info)';
  }};
`;

const IssueTitleSection = styled.div`
  flex: 1;
`;

const IssueTitle = styled.h3`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  font-family: var(--font-family-primary);
`;

const IssueCount = styled.span`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-family: var(--font-family-secondary);
`;

const SeverityBadge = styled.span`
  background: ${props => {
    if (props.severity === 'critical') return 'var(--color-error-100)';
    if (props.severity === 'serious') return 'var(--color-warning-100)';
    return 'var(--color-info-100)';
  }};
  color: ${props => {
    if (props.severity === 'critical') return 'var(--color-error-700)';
    if (props.severity === 'serious') return 'var(--color-warning-700)';
    return 'var(--color-info-700)';
  }};
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-transform: capitalize;
`;

const ExpandIcon = styled.div`
  font-size: var(--font-size-lg);
  color: var(--color-text-tertiary);
  transition: transform var(--transition-fast);
  transform: ${props => props.expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const IssueDetails = styled.div`
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  display: ${props => props.expanded ? 'block' : 'none'};
`;

const BusinessImpactSection = styled.div`
  background: var(--color-surface-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
`;

const SectionHeader = styled.h4`
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-family-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const SectionContent = styled.p`
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-family-secondary);
`;

const FixInstructions = styled.div`
  background: var(--color-success-50);
  border: 1px solid var(--color-success-200);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
`;

const CodeExample = styled.pre`
  background: var(--color-neutral-900);
  color: var(--color-neutral-100);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-family: 'Monaco', 'Consolas', monospace;
  overflow-x: auto;
  margin: var(--spacing-md) 0;
`;

const BenefitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
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

const TechnicalDetails = styled.details`
  margin-top: var(--spacing-lg);
`;

const TechnicalSummary = styled.summary`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-tertiary);
  cursor: pointer;
  margin-bottom: var(--spacing-md);
  
  &:hover {
    color: var(--color-text-secondary);
  }
`;

const TechnicalContent = styled.div`
  background: var(--color-neutral-50);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-family: var(--font-family-secondary);
`;

const WcagReference = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
`;

const WcagLink = styled.a`
  color: var(--color-interactive-primary);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const DetailedAnalysisSection = ({ analysisData, isPremium = false }) => {
  const { t } = useTranslation(['results']);
  const [activeCategory, setActiveCategory] = useState('accessibility');
  const [expandedIssues, setExpandedIssues] = useState(new Set());

  if (!isPremium) {
    return null; // This section is only shown for premium users
  }

  const toggleIssue = (issueId) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  const getBusinessExplanation = (violation) => {
    const explanationMap = {
      'color-contrast': 'When text doesn\'t have enough contrast with its background, customers - especially older customers or those with vision difficulties - can\'t read your content. This means they might miss important information about your products or services, or abandon your site entirely.',
      'image-alt': 'Images without descriptions are invisible to customers using screen readers (software that reads websites aloud). This means these customers can\'t understand your product photos, diagrams, or important visual information.',
      'form-label': 'Forms without clear labels confuse customers about what information to enter. This leads to incomplete forms, frustrated customers, and lost sales opportunities.',
      'link-name': 'Links that don\'t clearly describe their destination (like "click here" or "read more") make it hard for customers to navigate your site confidently, especially those using assistive technology.',
    };
    
    return explanationMap[violation.id] || 'This accessibility issue may prevent some customers from using your website effectively, potentially resulting in lost business.';
  };

  const getFixInstructions = (violation) => {
    const instructionMap = {
      'color-contrast': 'Change text colors to have stronger contrast with their backgrounds. Use dark text on light backgrounds or light text on dark backgrounds. Online contrast checkers can help you verify your colors meet accessibility standards.',
      'image-alt': 'Add descriptive text (alt text) to all images. Describe what the image shows and why it\'s important to understanding your content. For decorative images, use empty alt text (alt="").',
      'form-label': 'Add clear labels to all form fields. Each input field should have a label that explains what information the customer should enter. Group related fields together logically.',
      'link-name': 'Rewrite link text to clearly describe where the link goes or what it does. Instead of "click here," use "view our pricing" or "download the catalog."',
    };
    
    return instructionMap[violation.id] || 'Contact a web developer to fix this accessibility issue according to WCAG guidelines.';
  };

  const getCodeExample = (violation) => {
    const exampleMap = {
      'color-contrast': `/* Bad: Low contrast */
.text { color: #888; background: #fff; }

/* Good: High contrast */
.text { color: #333; background: #fff; }`,
      'image-alt': `<!-- Bad: No description -->
<img src="product.jpg">

<!-- Good: Descriptive text -->
<img src="product.jpg" alt="Blue wireless headphones with noise cancellation">`,
      'form-label': `<!-- Bad: No label -->
<input type="email">

<!-- Good: Clear label -->
<label for="email">Your Email Address</label>
<input type="email" id="email" name="email">`,
      'link-name': `<!-- Bad: Unclear link -->
<a href="/pricing">Click here</a>

<!-- Good: Descriptive link -->
<a href="/pricing">View our pricing plans</a>`,
    };
    
    return exampleMap[violation.id] || '';
  };

  const categories = [
    { id: 'accessibility', label: t('results:detailed.sections.accessibility') },
    { id: 'seo', label: t('results:detailed.sections.seo') },
    { id: 'performance', label: t('results:detailed.sections.performance') },
    { id: 'mobile', label: t('results:detailed.sections.mobile') }
  ];

  const getIssuesForCategory = (category) => {
    if (!analysisData?.violations) return [];
    
    // Filter violations based on category
    return analysisData.violations.filter(violation => {
      // Categorize violations based on their type
      if (category === 'accessibility') {
        return ['color-contrast', 'image-alt', 'form-label', 'link-name', 'heading-order', 'keyboard-trap'].includes(violation.id);
      }
      // Add more category filters as needed
      return false;
    });
  };

  const issues = getIssuesForCategory(activeCategory);

  return (
    <DetailedContainer>
      <SectionTitle>{t('results:detailed.title')}</SectionTitle>
      <SectionSubtitle>{t('results:detailed.subtitle')}</SectionSubtitle>

      <CategoryTabs>
        {categories.map(category => (
          <CategoryTab
            key={category.id}
            active={activeCategory === category.id}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.label}
          </CategoryTab>
        ))}
      </CategoryTabs>

      <IssuesList>
        {issues.map((issue, index) => (
          <IssueCard key={issue.id} severity={issue.impact}>
            <IssueHeader onClick={() => toggleIssue(issue.id)}>
              <IssueHeaderLeft>
                <IssueIcon severity={issue.impact}>
                  {issue.impact === 'critical' ? <FaExclamationTriangle /> : 
                   issue.impact === 'serious' ? <FaInfoCircle /> : <FaCheckCircle />}
                </IssueIcon>
                <IssueTitleSection>
                  <IssueTitle>{issue.description}</IssueTitle>
                  <IssueCount>{issue.nodes?.length || 1} instance(s) found</IssueCount>
                </IssueTitleSection>
              </IssueHeaderLeft>
              <SeverityBadge severity={issue.impact}>
                {issue.impact}
              </SeverityBadge>
              <ExpandIcon expanded={expandedIssues.has(issue.id)}>
                <FaChevronDown />
              </ExpandIcon>
            </IssueHeader>

            <IssueDetails expanded={expandedIssues.has(issue.id)}>
              <BusinessImpactSection>
                <SectionHeader>
                  <FaDollarSign />
                  {t('results:detailed.issueCard.whyItMatters')}
                </SectionHeader>
                <SectionContent>{getBusinessExplanation(issue)}</SectionContent>
              </BusinessImpactSection>

              <FixInstructions>
                <SectionHeader>
                  <FaWrench />
                  {t('results:detailed.issueCard.howToFix')}
                </SectionHeader>
                <SectionContent>{getFixInstructions(issue)}</SectionContent>
                {getCodeExample(issue) && (
                  <CodeExample>{getCodeExample(issue)}</CodeExample>
                )}
              </FixInstructions>

              <BenefitsGrid>
                <BenefitCard>
                  <BenefitTitle>
                    <FaDollarSign />
                    Business Impact
                  </BenefitTitle>
                  <BenefitText>
                    Improved customer experience leads to higher conversion rates
                  </BenefitText>
                </BenefitCard>
                
                <BenefitCard>
                  <BenefitTitle>
                    <FaUsers />
                    Customer Benefit
                  </BenefitTitle>
                  <BenefitText>
                    All customers can access and use your website effectively
                  </BenefitText>
                </BenefitCard>
              </BenefitsGrid>

              <TechnicalDetails>
                <TechnicalSummary>
                  {t('results:detailed.issueCard.technicalDetails')}
                </TechnicalSummary>
                <TechnicalContent>
                  <strong>Rule ID:</strong> {issue.id}<br />
                  <strong>Impact:</strong> {issue.impact}<br />
                  <strong>Help URL:</strong> <WcagLink href={issue.helpUrl} target="_blank" rel="noopener noreferrer">
                    View guidance <FaExternalLinkAlt />
                  </WcagLink>
                </TechnicalContent>
              </TechnicalDetails>

              <WcagReference>
                <FaExternalLinkAlt />
                {t('results:detailed.issueCard.wcagReference')}: 
                <WcagLink href={issue.helpUrl} target="_blank" rel="noopener noreferrer">
                  {issue.id}
                </WcagLink>
              </WcagReference>
            </IssueDetails>
          </IssueCard>
        ))}
      </IssuesList>
    </DetailedContainer>
  );
};

export default DetailedAnalysisSection;