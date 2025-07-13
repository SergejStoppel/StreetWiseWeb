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

  // Extract all issues from analysis data (same as DetailedAnalysisSection)
  const getAllAnalysisResults = () => {
    if (!analysisData) return [];
    
    const allResults = [];
    
    // Extract issues from all analyzer results
    const analyzers = [
      'axeResults', 'structureData', 'ariaData', 'formData', 'tableData',
      'keyboardData', 'textReadabilityData', 'enhancedImageData', 
      'focusManagementData', 'navigationData', 'touchTargetData',
      'keyboardShortcutData', 'contentStructureData', 'mobileAccessibilityData',
      'colorContrastData'
    ];
    
    analyzers.forEach(analyzerKey => {
      const analyzerData = analysisData[analyzerKey];
      if (!analyzerData) return;
      
      // Handle different data structures
      if (analyzerData.violations) {
        analyzerData.violations.forEach(violation => {
          allResults.push({
            ...violation,
            source: analyzerKey,
            title: violation.description || violation.message || violation.id,
            severity: violation.impact || 'info'
          });
        });
      }
      
      if (analyzerData.issues) {
        analyzerData.issues.forEach(issue => {
          allResults.push({
            ...issue,
            source: analyzerKey,
            title: issue.description || issue.message || issue.type,
            severity: issue.severity || issue.impact || 'info'
          });
        });
      }
      
      if (analyzerData.recommendations) {
        analyzerData.recommendations.forEach(rec => {
          allResults.push({
            ...rec,
            source: analyzerKey,
            title: rec.description || rec.message || rec.type,
            severity: rec.severity || rec.impact || 'info'
          });
        });
      }
    });
    
    // Also include top-level recommendations
    if (analysisData.recommendations) {
      analysisData.recommendations.forEach(rec => {
        allResults.push({
          ...rec,
          source: 'general',
          title: rec.description || rec.message || rec.type || 'Accessibility Issue',
          severity: rec.severity || rec.impact || 'info'
        });
      });
    }
    
    return allResults;
  };

  // Extract priority fixes from analysis data
  const getPriorityFixes = () => {
    const allIssues = getAllAnalysisResults();
    if (allIssues.length === 0) return [];
    
    // Sort by severity and impact, then take top 3
    const sortedIssues = allIssues
      .map(issue => ({
        ...issue,
        severityScore: getSeverityScore(issue),
        impactScore: getImpactScore(issue)
      }))
      .sort((a, b) => {
        // Sort by severity first, then impact
        if (b.severityScore !== a.severityScore) {
          return b.severityScore - a.severityScore;
        }
        return b.impactScore - a.impactScore;
      })
      .slice(0, 3);

    return sortedIssues.map((issue, index) => ({
      id: issue.id || `issue-${index}`,
      priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
      title: getBusinessTitle(issue),
      description: getBusinessDescription(issue),
      impact: getImpactLevel(issue),
      effort: getEffortLevel(issue),
      businessBenefit: getBusinessBenefit(issue),
      customerBenefit: getCustomerBenefit(issue)
    }));
  };

  const getSeverityScore = (issue) => {
    const severity = issue.severity || issue.impact || 'info';
    const scoreMap = { critical: 4, serious: 3, moderate: 2, minor: 1, info: 1 };
    return scoreMap[severity.toLowerCase()] || 1;
  };

  const getImpactScore = (issue) => {
    // Calculate impact based on issue type
    const desc = issue.description?.toLowerCase() || '';
    const type = issue.type?.toLowerCase() || '';
    const id = issue.id?.toLowerCase() || '';
    
    // High impact issues
    if (desc.includes('contrast') || type.includes('contrast')) return 4;
    if (desc.includes('alt') || type.includes('alt')) return 4;
    if (desc.includes('form') || desc.includes('label')) return 4;
    if (desc.includes('keyboard') || desc.includes('focus')) return 3;
    if (desc.includes('heading') || type.includes('heading')) return 3;
    if (desc.includes('touch target') || desc.includes('target size')) return 3;
    
    return 2; // Default medium impact
  };

  const getBusinessTitle = (issue) => {
    const desc = issue.description?.toLowerCase() || '';
    const type = issue.type?.toLowerCase() || '';
    const id = issue.id?.toLowerCase() || '';
    
    // Content structure specific titles
    if (desc.includes('content chunks') || desc.includes('content exceed') || desc.includes('word count')) {
      const count = desc.match(/(\d+)/)?.[1] || 'Some';
      return `${count} content sections are too long`;
    }
    
    if (desc.includes('line height') || type.includes('line-height')) {
      return 'Text is cramped and hard to read';
    }
    
    if (desc.includes('white space') || desc.includes('whitespace')) {
      return 'Content needs more breathing room';
    }
    
    // Color contrast issues
    if (desc.includes('contrast') || type.includes('contrast') || id.includes('contrast')) {
      const ratio = desc.match(/(\d+\.?\d*):1/)?.[1];
      return ratio ? `Text contrast ${ratio}:1 is too low` : 'Text is hard to read (low contrast)';
    }
    
    // Image issues  
    if (desc.includes('alt') || type.includes('alt') || id.includes('alt')) {
      const count = desc.match(/(\d+)/)?.[1] || 'Some';
      return `${count} images are missing descriptions`;
    }
    
    // Form issues
    if (desc.includes('label') || type.includes('label') || id.includes('label')) {
      const count = desc.match(/(\d+)/)?.[1] || 'Some';
      return `${count} form fields confuse customers`;
    }
    
    // Touch target issues
    if (desc.includes('touch target') || desc.includes('target size')) {
      const count = desc.match(/(\d+)/)?.[1] || 'Some';
      return `${count} buttons are too small for mobile`;
    }
    
    // Heading issues
    if (desc.includes('heading') || type.includes('heading') || id.includes('heading')) {
      return 'Page structure confuses visitors';
    }
    
    // Navigation issues
    if (desc.includes('skip link') || id.includes('skip-link')) {
      return 'Keyboard users can\'t skip navigation';
    }
    
    if (desc.includes('navigation') || type.includes('nav')) {
      return 'Navigation is unclear for some users';
    }
    
    // Keyboard issues
    if (desc.includes('keyboard') || type.includes('keyboard')) {
      return 'Some customers can\'t navigate properly';
    }
    
    if (desc.includes('focus') || type.includes('focus')) {
      return 'Visitors can\'t see where they are';
    }
    
    // ARIA issues
    if (desc.includes('aria') || type.includes('aria')) {
      return 'Interactive elements are unclear';
    }
    
    // Page structure
    if (desc.includes('page title') || id.includes('page-title')) {
      return 'Page titles need improvement';
    }
    
    if (desc.includes('language') || desc.includes('lang')) {
      return 'Page language isn\'t declared';
    }
    
    // Generic mapping for common WCAG violations
    const titleMap = {
      'color-contrast': 'Text is hard to read',
      'image-alt': 'Images are missing descriptions', 
      'heading-order': 'Page structure is confusing',
      'form-label': 'Forms are difficult to fill out',
      'link-name': 'Links are unclear',
      'keyboard-trap': 'Keyboard users get stuck',
      'focus-order': 'Navigation order is confusing'
    };
    
    const mappedTitle = titleMap[id] || titleMap[type];
    if (mappedTitle) return mappedTitle;
    
    // Extract and clean up title from description  
    if (issue.title) return issue.title;
    if (issue.description) {
      // Clean up technical jargon
      return issue.description
        .replace(/WCAG \d+\.\d+\.\d+/g, '')
        .replace(/Level A{1,3}/g, '')
        .trim() || 'Website accessibility needs attention';
    }
    
    return 'Website accessibility needs attention';
  };

  const getBusinessDescription = (issue) => {
    const desc = issue.description?.toLowerCase() || '';
    const type = issue.type?.toLowerCase() || '';
    const id = issue.id?.toLowerCase() || '';
    
    // Content structure specific descriptions
    if (desc.includes('content chunks') || desc.includes('content exceed') || desc.includes('word count')) {
      return 'Large blocks of text overwhelm customers, making it hard to find key information quickly. This especially affects customers with reading difficulties or cognitive disabilities.';
    }
    
    if (desc.includes('line height') || type.includes('line-height')) {
      return 'Text that\'s cramped together makes it difficult for customers to read your content, especially those with dyslexia or visual processing issues.';
    }
    
    if (desc.includes('white space') || desc.includes('whitespace')) {
      return 'Cramped layouts without enough breathing room make your website look unprofessional and are harder for customers to scan and understand.';
    }
    
    // Color contrast issues
    if (desc.includes('contrast') || type.includes('contrast') || id.includes('contrast')) {
      return 'When text doesn\'t have enough contrast with its background, customers - especially older customers or those with vision difficulties - can\'t read your content and may abandon your site.';
    }
    
    // Image issues  
    if (desc.includes('alt') || type.includes('alt') || id.includes('alt')) {
      return 'Images without descriptions are invisible to customers using screen readers. These customers can\'t understand your product photos, diagrams, or important visual information.';
    }
    
    // Form issues
    if (desc.includes('label') || type.includes('label') || id.includes('label')) {
      return 'Forms without clear labels confuse customers about what information to enter, leading to incomplete forms and lost sales opportunities.';
    }
    
    // Touch target issues
    if (desc.includes('touch target') || desc.includes('target size')) {
      return 'Buttons and links that are too small make it difficult for customers to tap them on mobile devices, especially for users with motor difficulties.';
    }
    
    // Heading issues
    if (desc.includes('heading') || type.includes('heading') || id.includes('heading')) {
      return 'Poor heading structure makes it hard for customers to scan your content and find what they\'re looking for quickly.';
    }
    
    // Navigation issues
    if (desc.includes('skip link') || id.includes('skip-link')) {
      return 'Without skip links, keyboard users must tab through your entire navigation menu to reach your main content, causing frustration.';
    }
    
    if (desc.includes('navigation') || type.includes('nav')) {
      return 'Inconsistent or unclear navigation confuses customers and makes it hard to find products or information.';
    }
    
    // Keyboard issues
    if (desc.includes('keyboard') || type.includes('keyboard')) {
      return 'Many customers navigate websites using only a keyboard. If your site doesn\'t support this, you\'re excluding potential customers with motor disabilities.';
    }
    
    if (desc.includes('focus') || type.includes('focus')) {
      return 'Invisible focus indicators make it impossible for keyboard users to know where they are on your page, leading to confusion.';
    }
    
    // ARIA issues
    if (desc.includes('aria') || type.includes('aria')) {
      return 'Missing ARIA labels make interactive elements unclear to assistive technology users, preventing them from understanding what buttons or controls do.';
    }
    
    // Page structure
    if (desc.includes('page title') || id.includes('page-title')) {
      return 'Missing or poor page titles make it hard for customers to understand what page they\'re on and hurt your search engine rankings.';
    }
    
    if (desc.includes('language') || desc.includes('lang')) {
      return 'Missing language declarations prevent screen readers from pronouncing your content correctly, making it incomprehensible to customers using assistive technology.';
    }
    
    // Generic mapping for common WCAG violations  
    const descriptionMap = {
      'color-contrast': 'Some text on your website is too light or doesn\'t have enough contrast, making it hard for customers to read.',
      'image-alt': 'Your images don\'t have descriptions, so customers using screen readers can\'t understand what they show.',
      'heading-order': 'Your page headings skip around, making it confusing for customers to follow your content.',
      'form-label': 'Your contact forms and other forms don\'t clearly label what information customers need to enter.',
      'link-name': 'Some of your links just say "click here" instead of explaining where they go.',
      'keyboard-trap': 'Customers who can\'t use a mouse get trapped and can\'t navigate away from certain parts of your site.',
      'focus-order': 'When customers navigate with a keyboard, the order doesn\'t make logical sense.'
    };
    
    const mappedDesc = descriptionMap[id] || descriptionMap[type];
    if (mappedDesc) return mappedDesc;
    
    return 'This accessibility issue may prevent some customers from using your website effectively, potentially resulting in lost business.';
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

  const getBusinessBenefit = (issue) => {
    const desc = issue.description?.toLowerCase() || '';
    const type = issue.type?.toLowerCase() || '';
    const id = issue.id?.toLowerCase() || '';
    
    // Content structure benefits
    if (desc.includes('content chunks') || desc.includes('content exceed') || desc.includes('word count')) {
      return 'Higher engagement and lower bounce rates';
    }
    if (desc.includes('line height') || type.includes('line-height')) {
      return 'Better readability leads to longer time on site';
    }
    if (desc.includes('white space') || desc.includes('whitespace')) {
      return 'More professional appearance increases trust';
    }
    
    // Pattern matching for specific issues
    if (desc.includes('contrast') || type.includes('contrast') || id.includes('contrast')) {
      return 'More customers can read your content clearly';
    }
    if (desc.includes('alt') || type.includes('alt') || id.includes('alt')) {
      return 'Better search engine rankings and accessibility';
    }
    if (desc.includes('label') || type.includes('label') || id.includes('label')) {
      return 'More customers complete your forms';
    }
    if (desc.includes('touch target') || desc.includes('target size')) {
      return 'Better mobile conversion rates';
    }
    if (desc.includes('heading') || type.includes('heading') || id.includes('heading')) {
      return 'Customers find information faster';
    }
    if (desc.includes('keyboard') || type.includes('keyboard')) {
      return 'All customers can navigate your entire site';
    }
    if (desc.includes('focus') || type.includes('focus')) {
      return 'Keyboard users have a smooth experience';
    }
    
    const benefitMap = {
      'color-contrast': 'More customers can read your content clearly',
      'image-alt': 'Better search engine rankings and accessibility',
      'heading-order': 'Customers find information faster',
      'form-label': 'More customers complete your forms',
      'link-name': 'Customers know where links will take them',
      'keyboard-trap': 'All customers can navigate your entire site',
      'focus-order': 'Keyboard users have a smooth experience'
    };
    
    return benefitMap[id] || benefitMap[type] || 'Improved customer experience';
  };

  const getCustomerBenefit = (issue) => {
    const desc = issue.description?.toLowerCase() || '';
    const type = issue.type?.toLowerCase() || '';
    const id = issue.id?.toLowerCase() || '';
    
    // Content structure benefits
    if (desc.includes('content chunks') || desc.includes('content exceed') || desc.includes('word count')) {
      return 'Easier to scan and find specific information';
    }
    if (desc.includes('line height') || type.includes('line-height')) {
      return 'More comfortable reading experience';
    }
    if (desc.includes('white space') || desc.includes('whitespace')) {
      return 'Less visual stress and clearer focus';
    }
    
    // Pattern matching for specific issues
    if (desc.includes('contrast') || type.includes('contrast') || id.includes('contrast')) {
      return 'Easier to read, especially for older customers';
    }
    if (desc.includes('alt') || type.includes('alt') || id.includes('alt')) {
      return 'Screen reader users understand all content';
    }
    if (desc.includes('label') || type.includes('label') || id.includes('label')) {
      return 'Clear guidance on what to enter';
    }
    if (desc.includes('touch target') || desc.includes('target size')) {
      return 'Easy tapping without accidental clicks';
    }
    if (desc.includes('heading') || type.includes('heading') || id.includes('heading')) {
      return 'Logical flow through your information';
    }
    if (desc.includes('keyboard') || type.includes('keyboard')) {
      return 'Freedom to navigate anywhere';
    }
    if (desc.includes('focus') || type.includes('focus')) {
      return 'Always knowing where you are on the page';
    }
    
    const benefitMap = {
      'color-contrast': 'Easier to read, especially for older customers',
      'image-alt': 'Screen reader users understand all content',
      'heading-order': 'Logical flow through your information',
      'form-label': 'Clear guidance on what to enter',
      'link-name': 'Confidence about where links lead',
      'keyboard-trap': 'Freedom to navigate anywhere',
      'focus-order': 'Predictable navigation experience'
    };
    
    return benefitMap[id] || benefitMap[type] || 'Better accessibility for all customers';
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