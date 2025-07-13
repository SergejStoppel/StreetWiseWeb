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
  FaExternalLinkAlt,
  FaChartLine,
  FaImage,
  FaWpforms,
  FaKeyboard,
  FaMobile,
  FaAccessibleIcon
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

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
  padding: var(--spacing-xl);
  background: var(--color-surface-secondary);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-primary);
`;

const SummaryCard = styled.div`
  text-align: center;
  padding: var(--spacing-lg);
  background: var(--color-surface-elevated);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-secondary);
`;

const SummaryIcon = styled.div`
  font-size: var(--font-size-2xl);
  color: ${props => {
    if (props.type === 'score') return 'var(--color-interactive-primary)';
    if (props.type === 'critical') return 'var(--color-error)';
    if (props.type === 'warning') return 'var(--color-warning)';
    return 'var(--color-success)';
  }};
  margin-bottom: var(--spacing-md);
`;

const SummaryValue = styled.div`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-family-primary);
`;

const SummaryLabel = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
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
    if (props.severity === 'warning') return 'var(--color-warning)';
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
    if (props.severity === 'warning') return 'var(--color-warning)';
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
    if (props.severity === 'warning') return 'var(--color-warning-100)';
    return 'var(--color-info-100)';
  }};
  color: ${props => {
    if (props.severity === 'critical') return 'var(--color-error-700)';
    if (props.severity === 'warning') return 'var(--color-warning-700)';
    return 'var(--color-info-700)';
  }};
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--spacing-sm);
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
  
  h4 {
    margin-top: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-success-700);
  }
  
  p {
    margin-bottom: var(--spacing-sm);
    line-height: var(--line-height-relaxed);
  }
  
  strong {
    color: var(--color-success-800);
    font-weight: var(--font-weight-semibold);
  }
  
  ul, ol {
    margin-left: var(--spacing-lg);
    margin-bottom: var(--spacing-sm);
  }
  
  li {
    margin-bottom: var(--spacing-xs);
    line-height: var(--line-height-relaxed);
  }
  
  code {
    background: var(--color-success-100);
    padding: var(--spacing-xs);
    border-radius: var(--border-radius-sm);
    font-family: monospace;
    font-size: var(--font-size-sm);
  }
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

const CodeExampleSection = styled.div`
  background: var(--color-surface-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
`;

const CodeBlock = styled.div`
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-md);
  overflow-x: auto;
  
  pre {
    margin: 0;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: var(--font-size-sm);
    line-height: 1.5;
    color: var(--color-text-primary);
  }
`;

const MockupSection = styled.div`
  background: var(--color-surface-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
`;

const MockupGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MockupCard = styled.div`
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
`;

const MockupLabel = styled.div`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-family-primary);
`;

const MockupDescription = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-family-secondary);
  white-space: pre-line;
`;


const ComplianceSection = styled.div`
  background: var(--color-info-50);
  border: 1px solid var(--color-info-200);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
`;

const ComplianceContent = styled.div`
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-family-secondary);
`;

const InstancesSection = styled.div`
  background: var(--color-surface-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
`;

const InstancesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
`;

const InstanceCard = styled.div`
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-md);
`;

const InstanceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
`;

const InstanceNumber = styled.div`
  background: var(--color-interactive-primary);
  color: var(--color-text-on-brand);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
`;

const InstanceLocation = styled.div`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  word-break: break-all;
`;

const InstanceCode = styled.div`
  background: var(--color-neutral-100);
  border: 1px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  overflow-x: auto;
  
  pre {
    margin: 0;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: var(--font-size-xs);
    line-height: 1.4;
    color: var(--color-text-secondary);
  }
`;

const InstanceMessage = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-style: italic;
  line-height: var(--line-height-relaxed);
`;

const DetailedAnalysisSection = ({ analysisData, isPremium = false }) => {
  const { t } = useTranslation(['results']);
  const [activeCategory, setActiveCategory] = useState('structure');
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

  const getBusinessExplanation = (recommendation) => {
    const explanationMap = {
      // Content Structure Specific Issues
      'content chunks': 'Large blocks of text overwhelm customers and make it hard to find key information quickly. Customers with reading difficulties or cognitive disabilities may abandon your site if content feels too dense.',
      'content exceed': 'Large blocks of text overwhelm customers and make it hard to find key information quickly. Customers with reading difficulties or cognitive disabilities may abandon your site if content feels too dense.',
      'word count': 'Large blocks of text overwhelm customers and make it hard to find key information quickly. Customers with reading difficulties or cognitive disabilities may abandon your site if content feels too dense.',
      'content length': 'Large blocks of text overwhelm customers and make it hard to find key information quickly. Customers with reading difficulties or cognitive disabilities may abandon your site if content feels too dense.',
      'line height': 'Text that\'s cramped together makes it difficult for customers to read your content, especially those with dyslexia or visual processing issues. Poor line spacing causes customers to lose their place while reading.',
      'white space': 'Cramped layouts without enough breathing room make your website look unprofessional and are harder for customers to scan and understand quickly.',
      
      // Structure & Navigation
      'heading': 'Poor heading structure makes it hard for customers to scan your content and find what they\'re looking for quickly. Screen reader users rely on headings to navigate, so poor structure creates confusion and may cause customers to leave.',
      'landmark': 'Missing page landmarks make it difficult for screen reader users to quickly navigate to different sections of your website, leading to frustration and potential customer loss.',
      'navigation': 'Inconsistent or unclear navigation confuses customers and makes it hard to find products or information, directly impacting sales and customer satisfaction.',
      'aria': 'Missing ARIA labels make interactive elements unclear to assistive technology users, preventing them from understanding what buttons or controls do.',
      
      // Content & Text  
      'color-contrast': 'When text doesn\'t have enough contrast with its background, customers - especially older customers or those with vision difficulties - can\'t read your content. This means they might miss important information about your products or services, or abandon your site entirely.',
      'contrast': 'When text doesn\'t have enough contrast with its background, customers - especially older customers or those with vision difficulties - can\'t read your content. This means they might miss important information about your products or services, or abandon your site entirely.',
      'text': 'Poor text formatting makes content hard to read for all customers, but especially impacts those with dyslexia or reading difficulties, potentially losing you customers.',
      'font': 'Decorative or hard-to-read fonts can make your content inaccessible to customers with reading difficulties, reducing engagement and conversions.',
      
      // Images & Media
      'image-alt': 'Images without descriptions are invisible to customers using screen readers (software that reads websites aloud). This means these customers can\'t understand your product photos, diagrams, or important visual information.',
      'alt': 'Missing image descriptions prevent screen reader users from understanding your visual content, potentially missing key product information or calls-to-action.',
      'images': 'Images without proper accessibility features prevent some customers from understanding your visual content, potentially missing key product information.',
      
      // Forms & Input
      'form': 'Forms without clear labels confuse customers about what information to enter. This leads to incomplete forms, frustrated customers, and lost sales opportunities.',
      'label': 'Input fields without proper labels make it unclear what information customers should enter, leading to form abandonment and lost leads.',
      'input': 'Poorly designed form inputs can prevent customers from successfully submitting contact forms, orders, or sign-ups, directly impacting your business.',
      
      // Keyboard & Focus
      'keyboard': 'Many customers navigate websites using only a keyboard. If your site doesn\'t support this, you\'re excluding potential customers with motor disabilities.',
      'focus': 'Invisible or unclear focus indicators make it impossible for keyboard users to know where they are on your page, leading to confusion and site abandonment.',
      'tab': 'Illogical tab order confuses keyboard users about how to navigate your site, making it difficult to complete purchases or contact you.',
      
      // Touch Targets
      'touch target': 'Touch targets that are too small make it difficult for customers to tap buttons or links on mobile devices, especially for users with motor difficulties or larger fingers.',
      'touch': 'Touch targets that are too small make it difficult for customers to tap buttons or links on mobile devices, especially for users with motor difficulties or larger fingers.',
      'target size': 'Buttons and links that are too small are hard to tap on mobile devices, frustrating customers and potentially losing mobile sales.',
      
      // Mobile & Responsive
      'mobile': 'Mobile accessibility issues prevent smartphone users from effectively using your website, potentially losing a significant portion of your customer base.',
      'responsive': 'Non-responsive design makes your website unusable on mobile devices, losing customers who primarily browse on phones and tablets.',
      
      // Specific WCAG violations
      'skip link': 'Without skip links, keyboard users (especially those using screen readers) must tab through your entire navigation menu to reach your main content, causing frustration and potential site abandonment.',
      'page title': 'Missing or poor page titles make it hard for customers to understand what page they\'re on and hurt your search engine rankings.',
      'language': 'Missing language declarations prevent screen readers from pronouncing your content correctly, making it incomprehensible to customers using assistive technology.',
      
      // General violations
      'violation': 'This accessibility barrier prevents some customers from fully using your website, potentially resulting in lost sales and increased legal risk.',
      'wcag': 'This WCAG compliance issue creates barriers for customers with disabilities and increases your risk of accessibility lawsuits.',
    };
    
    // Try to match by recommendation type, description, or ID
    const searchTerms = [
      recommendation.type?.toLowerCase(),
      recommendation.description?.toLowerCase(), 
      recommendation.id?.toLowerCase(),
      recommendation.title?.toLowerCase()
    ].filter(Boolean);
    
    for (const term of searchTerms) {
      const key = Object.keys(explanationMap).find(k => term.includes(k));
      if (key) return explanationMap[key];
    }
    
    return 'This accessibility issue may prevent some customers from using your website effectively, potentially resulting in lost business and legal risks.';
  };

  const getFixInstructions = (recommendation) => {
    const instructionMap = {
      // Content Structure Specific Issues
      'content chunks': `**Step-by-step fix:**
1. **Break up long content** - Find text sections longer than 3-4 paragraphs
2. **Add subheadings** - Use H2, H3 headings to break content into digestible sections
3. **Use bullet points** - Convert long sentences into bulleted lists where possible
4. **Add white space** - Leave blank lines between sections for visual breathing room
5. **Keep paragraphs short** - Aim for 2-3 sentences per paragraph maximum

**Target:** Keep each content section under 500 words, with clear headings and plenty of white space.`,

      'content exceed': `**Step-by-step fix:**
1. **Break up long content** - Find text sections longer than 3-4 paragraphs
2. **Add subheadings** - Use H2, H3 headings to break content into digestible sections  
3. **Use bullet points** - Convert long sentences into bulleted lists where possible
4. **Add white space** - Leave blank lines between sections for visual breathing room
5. **Keep paragraphs short** - Aim for 2-3 sentences per paragraph maximum

**Target:** Keep each content section under 500 words, with clear headings and plenty of white space.`,

      'word count': `**Step-by-step fix:**
1. **Break up long content** - Find text sections longer than 3-4 paragraphs
2. **Add subheadings** - Use H2, H3 headings to break content into digestible sections
3. **Use bullet points** - Convert long sentences into bulleted lists where possible  
4. **Add white space** - Leave blank lines between sections for visual breathing room
5. **Keep paragraphs short** - Aim for 2-3 sentences per paragraph maximum

**Target:** Keep each content section under 500 words, with clear headings and plenty of white space.`,

      'content length': `**Step-by-step fix:**
1. **Break up long content** - Find text sections longer than 3-4 paragraphs
2. **Add subheadings** - Use H2, H3 headings to break content into digestible sections
3. **Use bullet points** - Convert long sentences into bulleted lists where possible
4. **Add white space** - Leave blank lines between sections for visual breathing room  
5. **Keep paragraphs short** - Aim for 2-3 sentences per paragraph maximum

**Target:** Keep each content section under 500 words, with clear headings and plenty of white space.`,

      'line height': `**Step-by-step fix:**
1. **Access your website editor** - Go to your theme customization or CSS settings
2. **Find text/typography settings** - Look for "Line Height," "Line Spacing," or "Typography"
3. **Increase line height to 1.5 or higher:**
   - **WordPress:** Customizer → Typography → Line Height = 1.5
   - **Wix:** Design → Fonts → Advanced → Line Spacing
   - **Squarespace:** Design → Fonts → Body Text → Line Height
4. **Test readability** - Preview your site and check that text is easier to read
5. **Apply to all text elements** - Make sure headings, paragraphs, and lists all have proper spacing

**Target:** Line height should be at least 1.5 times the font size (150%).`,

      'white space': `**Step-by-step fix:**
1. **Add space between sections** - Leave blank lines between different content areas
2. **Increase paragraph spacing** - Add extra space between paragraphs in your editor
3. **Pad around content blocks** - Add margins/padding to text sections, images, and buttons
4. **Don't crowd elements** - Ensure buttons, links, and form fields have space around them
5. **Use your website builder's spacing tools:**
   - **WordPress:** Add spacing blocks between content
   - **Wix:** Use the spacing controls in the design panel
   - **Squarespace:** Adjust spacing in section settings

**Goal:** Create visual breathing room so content doesn't feel cramped or overwhelming.`,

      // Structure & Navigation
      'heading': `**Step-by-step fix:**
1. **Review your page structure** - Your main page title should be H1, major sections should be H2, subsections should be H3, etc.
2. **Edit your content** - In your website editor (WordPress, Wix, Squarespace, etc.), find the heading options
3. **Set proper hierarchy** - Change headings so they follow logical order: H1 → H2 → H3 (never skip from H1 to H3)
4. **Test the result** - Use your browser's accessibility tools or ask someone with a screen reader to test navigation

**Example:** If you have "About Us" as H1 and "Our History" under it, make "Our History" an H2, not H3.`,

      'landmark': `**Step-by-step fix:**
1. **Contact your web developer or designer** - This requires HTML changes that most website builders don't support directly
2. **If you use WordPress** - Install an accessibility plugin like "WP Accessibility" that can add landmarks automatically
3. **For website builders** - Check if your platform (Wix, Squarespace) has accessibility settings in the design panel
4. **DIY option** - If you edit HTML directly, wrap your navigation in <nav>, main content in <main>, etc.

**What to tell your developer:** "Please add HTML5 semantic elements like header, nav, main, and footer to structure our pages properly."`,

      'navigation': `**Step-by-step fix:**
1. **Make navigation consistent** - Ensure your main menu appears in the same place and order on every page
2. **Add breadcrumbs** - In your website builder, look for "breadcrumb" widgets or plugins (WordPress: Yoast SEO includes this)
3. **Create a skip link** - Add a "Skip to main content" link at the top of each page (may require developer help)
4. **Test navigation** - Try navigating your site using only the Tab key - it should make logical sense

**For WordPress users:** Install the "Accessible Navigation" plugin to automatically improve your menu accessibility.`,

      'aria': `**Step-by-step fix:**
1. **For buttons** - Add descriptive text: Instead of "Click here," use "Download our pricing guide"
2. **For form fields** - Ensure every input has a clear label explaining what to enter
3. **For images** - Add alt text that describes what the image shows and why it's important
4. **For complex elements** - This often requires developer help to add proper ARIA labels

**What to tell your developer:** "Please add ARIA labels to our interactive elements like buttons, forms, and custom widgets to make them accessible to screen readers."`,
      
      // Content & Text  
      'color-contrast': `**Step-by-step fix:**
1. **Use a contrast checker** - Go to webaim.org/resources/contrastchecker/ and test your colors
2. **Fix low contrast text** - Make text darker or backgrounds lighter until you get at least 4.5:1 ratio
3. **Common fixes:**
   - Change light gray text (#999) to dark gray (#333) or black (#000)
   - Add a semi-transparent dark overlay behind text on images
   - Use white text on dark backgrounds instead of light gray
4. **Update your website** - Change colors in your theme settings or CSS

**Quick test:** Can you easily read your text when squinting or in bright sunlight? If not, the contrast is too low.`,

      'text': `**Step-by-step fix:**
1. **Increase line spacing** - In your website editor, set line height to 1.5 or higher (150% in most builders)
2. **Break up long paragraphs** - Keep paragraphs to 3-4 sentences maximum
3. **Use bullet points** - Convert long lists of information into bullet points
4. **Choose readable fonts** - Stick to simple fonts like Arial, Helvetica, or your platform's default fonts
5. **Increase font size** - Make body text at least 16px (1rem)

**Test:** Ask someone over 50 to read your content - if they struggle, your text formatting needs improvement.`,

      'font': `**Step-by-step fix:**
1. **Review your fonts** - Look at all text on your website
2. **Replace decorative fonts** - Change any fancy, script, or decorative fonts used for paragraphs to simple fonts
3. **Keep decorative fonts for headings only** - It's okay to use fancy fonts for titles, but not body text
4. **Choose web-safe fonts:**
   - **Good choices:** Arial, Helvetica, Georgia, Times New Roman, Verdana
   - **Avoid for body text:** Script fonts, handwriting fonts, very thin fonts
5. **Update in your builder** - Change fonts in your theme/design settings

**Rule of thumb:** If you have to look closely to read it, it's not accessible.`,
      
      // Images & Media
      'image-alt': `**Step-by-step fix:**
1. **Find all images on your site** - Go through each page and identify images without descriptions
2. **Add alt text to each image:**
   - **Product photos:** "Blue cotton t-shirt with company logo"
   - **Team photos:** "Sarah Johnson, Marketing Director, smiling at desk"
   - **Decorative images:** Leave alt text empty (alt="") if purely decorative
3. **In your website builder:**
   - **WordPress:** Click image → Alt text field
   - **Wix:** Click image → Settings → Alt text
   - **Squarespace:** Click image → Options → Alt text
4. **Write good descriptions** - Describe what's in the image and why it matters to your content

**Don't write:** "Image of..." or "Photo of..." - just describe what's shown.`,

      'alt': `**Step-by-step fix:**
1. **Edit each image** - Click on the image in your website editor
2. **Find the alt text field** - Look for "Alt text," "Alternative text," or "Description"
3. **Write meaningful descriptions:**
   - **Before:** "DSC_1234.jpg" or "image"
   - **After:** "Customer testimonial from happy client holding our product"
4. **Be specific and helpful** - Describe what someone would need to know if they couldn't see the image
5. **Keep it concise** - Aim for 1-2 sentences maximum

**Pro tip:** Read your alt text out loud - would someone understand what the image shows just from your description?`,
      
      // Forms & Input
      'form': `**Step-by-step fix:**
1. **Review all your forms** - Contact forms, newsletter signups, order forms, etc.
2. **Add clear labels to every field:**
   - Instead of just placeholder text, add visible labels above or next to each field
   - **Good:** "Email Address" (label) + "Enter your email" (placeholder)
   - **Bad:** Only "Enter your email" as placeholder
3. **Group related fields** - Use sections like "Contact Information" and "Message Details"
4. **Add helpful instructions** - Tell people what format you want (phone numbers, dates, etc.)
5. **Improve error messages** - Instead of "Error," use "Please enter a valid email address"

**Test your forms:** Have someone else try to fill them out - if they're confused, add more labels and instructions.`,

      'label': `**Step-by-step fix:**
1. **Check every form field** - Look at contact forms, search boxes, newsletter signups
2. **Add visible labels** - Don't rely only on placeholder text that disappears when typing
3. **Make labels clear:**
   - **Good:** "Your Email Address" or "Phone Number"
   - **Bad:** "Info" or just an icon
4. **In your form builder:**
   - **WordPress/Contact Form 7:** Add label text before [email] shortcode
   - **Wix Forms:** Click field → Add label in settings
   - **Squarespace:** Form block → Field → Label option
5. **Test accessibility** - Tab through your form - each field should be clearly labeled

**Quick check:** Can you understand what each field wants without clicking on it? If not, add clearer labels.`,

      'input': `**Step-by-step fix:**
1. **Set proper input types** for each field:
   - Email fields: Set type to "email"
   - Phone fields: Set type to "tel"
   - Number fields: Set type to "number"
2. **Add required field indicators** - Mark required fields with an asterisk (*) or "Required"
3. **Improve button text:**
   - **Good:** "Send Message," "Subscribe to Newsletter," "Download Guide"
   - **Bad:** "Submit," "Click Here," "Go"
4. **Add helpful validation** - Show clear error messages when fields are filled incorrectly
5. **Test on mobile** - Make sure all fields work well on phones and tablets

**For most website builders:** These options are in your form settings under "Field Type" or "Validation."`,
      
      // Keyboard & Focus
      'keyboard': `**Step-by-step fix:**
1. **Test your site with keyboard only** - Put away your mouse and try to navigate using only the Tab key
2. **Check all interactive elements:**
   - Can you reach every button, link, and form field with Tab?
   - Can you activate buttons with Enter or Space?
   - Can you escape from pop-ups with Escape key?
3. **Fix common issues:**
   - **Dropdown menus:** Ensure they open with Enter key, not just mouse hover
   - **Image galleries:** Add keyboard controls for next/previous
   - **Pop-ups:** Make sure they can be closed with Escape key
4. **For website builders:** Check accessibility settings in your theme options
5. **If you find issues:** Contact your web developer - this often requires custom code changes

**Priority fix:** Make sure your main navigation menu works with keyboard - this is most important for customers.`,

      'focus': `**Step-by-step fix:**
1. **Test focus visibility** - Press Tab key while on your website - you should always see which element is selected
2. **If focus is invisible:**
   - **WordPress:** Try switching to a more accessible theme
   - **Custom sites:** Ask your developer to add focus styles
   - **Website builders:** Look for "Accessibility" or "Focus" settings in design options
3. **Good focus indicators:**
   - **Blue outline** around the current element
   - **Color change** when an element is selected
   - **Bold border** that's easy to see
4. **Test with different backgrounds** - Focus should be visible on both light and dark sections

**What to tell your developer:** "Please add visible focus indicators (like blue outlines) to all clickable elements on our website."`,

      'tab': `**Step-by-step fix:**
1. **Test your tab order** - Press Tab repeatedly and note the order elements are selected
2. **The order should match visual layout** - Left to right, top to bottom
3. **Common problems:**
   - Tab jumps around randomly
   - Important elements can't be reached with Tab
   - Tab order goes through hidden elements
4. **For most issues:** Contact your web developer - fixing tab order usually requires HTML changes
5. **Quick DIY check:** In WordPress, try a different, more accessible theme to see if that fixes the issue

**What to tell your developer:** "Please fix our tab order so keyboard users can navigate logically through our website, following the visual layout."`,
      
      // Mobile & Touch
      'touch': `**Step-by-step fix:**
1. **Test on your phone** - Try tapping all buttons and links on your mobile device
2. **Make touch targets bigger:**
   - **Minimum size:** 44x44 pixels (about the size of your fingertip)
   - **Good spacing:** At least 8 pixels between clickable elements
3. **In your website builder:**
   - **WordPress:** Use themes with mobile-friendly buttons
   - **Wix/Squarespace:** Adjust button sizes in mobile view editor
4. **Common fixes:**
   - Make phone numbers clickable links
   - Increase button padding/size
   - Space out menu items more
   - Make social media icons bigger
5. **Test with different finger sizes** - Ask people with larger hands to try your mobile site

**Quick test:** Can you easily tap your buttons without accidentally hitting nearby elements?`,

      'mobile': `**Step-by-step fix:**
1. **Test your website on mobile** - Check it on both phones and tablets
2. **Common mobile accessibility issues to fix:**
   - **Text too small:** Increase font size to at least 16px
   - **Buttons too small:** Make them finger-friendly (44px minimum)
   - **Forms hard to fill:** Simplify and make fields larger
   - **Navigation confusing:** Use hamburger menu or simplified nav
3. **In your website builder:**
   - Use mobile preview mode to edit
   - Most builders have separate mobile settings
4. **Test mobile forms** - Make sure customers can easily contact you or make purchases on mobile
5. **Check loading speed** - Mobile users abandon slow sites quickly

**Priority:** Focus on your contact forms and main navigation - these are most important for mobile customers.`,

      'responsive': `**Step-by-step fix:**
1. **Check responsiveness** - View your site at different screen sizes (phone, tablet, desktop)
2. **Common responsive issues:**
   - **Text overlaps images** - Adjust layouts in mobile view
   - **Horizontal scrolling** - Content should fit screen width
   - **Tiny text** - Increase minimum font sizes
   - **Crowded layouts** - Stack elements vertically on mobile
3. **In your website builder:**
   - **WordPress:** Use responsive themes only
   - **Wix/Squarespace:** Use mobile editor to fix layout issues
4. **Test at 200% zoom** - Your site should still be usable when zoomed in
5. **Use browser tools** - Chrome DevTools can simulate different screen sizes

**Quick check:** Does your website look good and work properly on your phone? If not, it needs responsive design fixes.`,
      
      // General cases with better fallbacks
      'violation': `**Step-by-step approach:**
1. **Identify the specific issue** - Look at the error description for details
2. **Check our documentation** - Look for similar issues in this report for specific instructions
3. **Try simple fixes first:**
   - Add missing alt text to images
   - Improve color contrast
   - Add labels to form fields
   - Test keyboard navigation
4. **For complex issues:** Contact a web accessibility specialist or your web developer
5. **Verify the fix** - Test the specific area mentioned in the error

**Resources:** WebAIM.org has great tutorials for common accessibility fixes you can do yourself.`,

      'wcag': `**Step-by-step approach:**
1. **Understand the WCAG guideline** - Each error mentions a specific WCAG criterion
2. **Look up the guideline** - Visit webaim.org or w3.org/WAI for detailed explanations
3. **Common WCAG fixes:**
   - **1.4.3 (Contrast):** Improve text color contrast
   - **2.4.6 (Headings):** Add descriptive page headings
   - **1.1.1 (Alt text):** Add image descriptions
   - **2.1.1 (Keyboard):** Ensure keyboard accessibility
4. **Test your changes** - Use the same tools that found the original issue
5. **For technical guidelines:** Work with a developer familiar with WCAG standards

**Priority:** Focus on Level AA guidelines first - these are legally required in most jurisdictions.`,
    };
    
    // Try to match by recommendation type, description, or ID
    const searchTerms = [
      recommendation.type?.toLowerCase(),
      recommendation.description?.toLowerCase(), 
      recommendation.id?.toLowerCase(),
      recommendation.title?.toLowerCase()
    ].filter(Boolean);
    
    for (const term of searchTerms) {
      const key = Object.keys(instructionMap).find(k => term.includes(k));
      if (key) return instructionMap[key];
    }
    
    // Enhanced fallback with more helpful guidance
    return `**General accessibility fix guidance:**

1. **For text issues:** Improve color contrast, increase font size, or add clear labels
2. **For images:** Add descriptive alt text explaining what the image shows
3. **For forms:** Add clear labels and instructions to every field
4. **For navigation:** Test that everything works with keyboard (Tab key)
5. **For mobile:** Make sure buttons are large enough to tap easily

**Need help?** Many accessibility issues can be fixed in your website builder's settings. For complex issues, consider hiring a web accessibility consultant.

**Immediate action:** Focus on the highest-impact fixes first - contrast, alt text, and form labels make the biggest difference for your customers.`;
  };

  const getBusinessBenefit = (recommendation) => {
    if (recommendation.businessImpact) return recommendation.businessImpact;
    
    const benefitMap = {
      // Content Structure Benefits
      'content chunks': 'Higher engagement and lower bounce rates as customers can easily scan and find information',
      'content exceed': 'Higher engagement and lower bounce rates as customers can easily scan and find information', 
      'word count': 'Higher engagement and lower bounce rates as customers can easily scan and find information',
      'content length': 'Higher engagement and lower bounce rates as customers can easily scan and find information',
      'line height': 'Better readability leads to longer time on site and improved customer satisfaction',
      'white space': 'More professional appearance and easier content consumption increases trust and conversions',
      
      // Structure & Navigation
      'heading': 'Better SEO rankings and easier content navigation',
      'landmark': 'Improved user experience and accessibility compliance',
      'navigation': 'Higher customer satisfaction and reduced bounce rate',
      'aria': 'Legal compliance and expanded customer base',
      
      // Content & Text
      'color-contrast': 'More readable content for all customers',
      'contrast': 'More readable content for all customers',
      'text': 'Better engagement and readability scores',
      'font': 'Professional appearance and improved readability',
      
      // Images & Media
      'image-alt': 'Better search engine rankings and accessibility',
      'alt': 'Improved SEO and legal compliance',
      'images': 'Better search engine rankings and accessibility',
      
      // Forms & Input  
      'form': 'Higher conversion rates and fewer abandoned forms',
      'label': 'More successful form submissions',
      'input': 'Reduced customer support requests',
      
      // Keyboard & Focus
      'keyboard': 'Expanded customer base and legal compliance',
      'focus': 'Better user experience for all customers',
      'tab': 'More efficient customer interactions',
      
      // Touch & Mobile
      'touch target': 'Better mobile conversion rates and fewer frustrated customers',
      'touch': 'Better mobile conversion rates and fewer frustrated customers',
      'target size': 'Better mobile conversion rates and fewer frustrated customers',
      'mobile': 'Larger mobile customer base',
      'responsive': 'Higher mobile sales and engagement',
      
      // Specific Issues
      'skip link': 'Better accessibility compliance and improved user experience for keyboard users',
      'page title': 'Better search engine rankings and clearer site navigation',
      'language': 'Improved accessibility for international customers and screen reader users'
    };
    
    const searchTerms = [
      recommendation.type?.toLowerCase(),
      recommendation.description?.toLowerCase(), 
      recommendation.id?.toLowerCase(),
      recommendation.title?.toLowerCase()
    ].filter(Boolean);
    
    for (const term of searchTerms) {
      const key = Object.keys(benefitMap).find(k => term.includes(k));
      if (key) return benefitMap[key];
    }
    
    return 'Improved customer experience and reduced legal risk';
  };

  const getCustomerBenefit = (recommendation) => {
    if (recommendation.userImpact) return recommendation.userImpact;
    
    const benefitMap = {
      // Content Structure Benefits
      'content chunks': 'Easier to scan and find specific information without feeling overwhelmed',
      'content exceed': 'Easier to scan and find specific information without feeling overwhelmed',
      'word count': 'Easier to scan and find specific information without feeling overwhelmed', 
      'content length': 'Easier to scan and find specific information without feeling overwhelmed',
      'line height': 'More comfortable reading without losing your place in the text',
      'white space': 'Less visual stress and easier focus on what matters most',
      
      // Structure & Navigation
      'heading': 'Easier to find and understand content organization',
      'landmark': 'Faster navigation with assistive technology',
      'navigation': 'Clear path to find desired information',
      'aria': 'Better understanding of interactive elements',
      
      // Content & Text
      'color-contrast': 'Easier reading, especially in bright light or with vision difficulties',
      'contrast': 'Easier reading, especially in bright light or with vision difficulties',
      'text': 'More comfortable reading experience',
      'font': 'Clearer, easier-to-read content',
      
      // Images & Media
      'image-alt': 'Understanding of visual content for all users, including screen reader users',
      'alt': 'Access to important visual information even when images can\'t be seen',
      'images': 'Better understanding of visual content for all users',
      
      // Forms & Input
      'form': 'Clear guidance on how to complete forms without confusion',
      'label': 'Confidence about what information to provide in each field',
      'input': 'Successful form completion every time',
      
      // Keyboard & Focus
      'keyboard': 'Full site access without needing a mouse or touchpad',
      'focus': 'Always knowing where you are on the page when navigating',
      'tab': 'Logical flow through interactive elements',
      
      // Touch & Mobile
      'touch target': 'Easy tapping on mobile devices without accidental clicks',
      'touch': 'Easy tapping on mobile devices without accidental clicks',
      'target size': 'Comfortable interaction on touchscreens',
      'mobile': 'Seamless experience on any device',
      'responsive': 'Comfortable browsing on phones and tablets',
      
      // Specific Issues
      'skip link': 'Faster access to main content when using keyboard navigation',
      'page title': 'Clear understanding of what page you\'re currently viewing',
      'language': 'Proper pronunciation by screen readers for better comprehension'
    };
    
    const searchTerms = [
      recommendation.type?.toLowerCase(),
      recommendation.description?.toLowerCase(), 
      recommendation.id?.toLowerCase(),
      recommendation.title?.toLowerCase()
    ].filter(Boolean);
    
    for (const term of searchTerms) {
      const key = Object.keys(benefitMap).find(k => term.includes(k));
      if (key) return benefitMap[key];
    }
    
    return 'Better accessibility for all customers, including those with disabilities';
  };

  const getSeverity = (recommendation) => {
    if (recommendation.severity) return recommendation.severity;
    if (recommendation.priority === 'high' || recommendation.impact === 'high') return 'critical';
    if (recommendation.priority === 'medium' || recommendation.impact === 'medium') return 'warning';
    return 'info';
  };

  const getIssueTitle = (issue) => {
    // If we have a specific title, use it
    if (issue.title) return issue.title;
    
    // Extract meaningful titles from descriptions
    const desc = issue.description?.toLowerCase() || '';
    const type = issue.type?.toLowerCase() || '';
    const id = issue.id?.toLowerCase() || '';
    
    // Content structure specific titles
    if (desc.includes('content chunks') || desc.includes('content exceed') || desc.includes('word count')) {
      const count = desc.match(/(\d+)/)?.[1] || 'Some';
      return `${count} content sections exceed 500 words`;
    }
    
    if (desc.includes('line height') || type.includes('line-height')) {
      return 'Text line spacing is too tight';
    }
    
    if (desc.includes('white space') || desc.includes('whitespace')) {
      return 'Insufficient white space between content';
    }
    
    // Color contrast issues
    if (desc.includes('contrast') || type.includes('contrast') || id.includes('contrast')) {
      const ratio = desc.match(/(\d+\.?\d*):1/)?.[1];
      return ratio ? `Text contrast ratio ${ratio}:1 is too low` : 'Text contrast is too low';
    }
    
    // Image issues  
    if (desc.includes('alt') || type.includes('alt') || id.includes('alt')) {
      const count = desc.match(/(\d+)/)?.[1] || 'Some';
      return `${count} images missing alt text`;
    }
    
    // Form issues
    if (desc.includes('label') || type.includes('label') || id.includes('label')) {
      const count = desc.match(/(\d+)/)?.[1] || 'Some';
      return `${count} form fields missing labels`;
    }
    
    // Touch target issues
    if (desc.includes('touch target') || desc.includes('target size')) {
      const count = desc.match(/(\d+)/)?.[1] || 'Some';
      return `${count} touch targets are too small`;
    }
    
    // Heading issues
    if (desc.includes('heading') || type.includes('heading') || id.includes('heading')) {
      return 'Heading structure needs improvement';
    }
    
    // Navigation issues
    if (desc.includes('skip link') || id.includes('skip-link')) {
      return 'Missing skip navigation link';
    }
    
    if (desc.includes('navigation') || type.includes('nav')) {
      return 'Navigation accessibility issues';
    }
    
    // Keyboard issues
    if (desc.includes('keyboard') || type.includes('keyboard')) {
      return 'Keyboard navigation problems';
    }
    
    if (desc.includes('focus') || type.includes('focus')) {
      return 'Focus indicators are not visible';
    }
    
    // ARIA issues
    if (desc.includes('aria') || type.includes('aria')) {
      return 'ARIA labels or roles missing';
    }
    
    // Page structure
    if (desc.includes('page title') || id.includes('page-title')) {
      return 'Page title missing or inadequate';
    }
    
    if (desc.includes('language') || desc.includes('lang')) {
      return 'Page language not declared';
    }
    
    // Use description or fallback
    return issue.description || issue.message || issue.id || 'Accessibility issue needs attention';
  };

  const getInstanceCount = (issue) => {
    // Try to extract count from description
    const desc = issue.description?.toLowerCase() || '';
    const countMatch = desc.match(/(\d+)/);
    
    if (countMatch) {
      const count = parseInt(countMatch[1]);
      return `${count} instance${count === 1 ? '' : 's'}`;
    }
    
    // Check if we have a count property
    if (issue.count) {
      return `${issue.count} instance${issue.count === 1 ? '' : 's'}`;
    }
    
    // Check if we have nodes array (common in axe results)
    if (issue.nodes?.length) {
      return `${issue.nodes.length} instance${issue.nodes.length === 1 ? '' : 's'}`;
    }
    
    // Check if we have elements array
    if (issue.elements?.length) {
      return `${issue.elements.length} instance${issue.elements.length === 1 ? '' : 's'}`;
    }
    
    // Default to 1 instance
    return '1 instance';
  };

  const categories = [
    { id: 'structure', label: 'Page Structure & Navigation' },
    { id: 'content', label: 'Text & Content' },
    { id: 'images', label: 'Images & Media' },
    { id: 'forms', label: 'Forms & Input' },
    { id: 'keyboard', label: 'Keyboard & Focus' },
    { id: 'mobile', label: 'Mobile & Touch' }
  ];

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
            category: getCategoryFromSource(analyzerKey),
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
            category: getCategoryFromSource(analyzerKey),
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
            category: getCategoryFromSource(analyzerKey),
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
          category: getCategoryFromContent(rec),
          title: rec.description || rec.message || rec.type || 'Accessibility Issue',
          severity: rec.severity || rec.impact || 'info'
        });
      });
    }
    
    return allResults;
  };
  
  const getCategoryFromSource = (source) => {
    const categoryMap = {
      'structureData': 'structure',
      'ariaData': 'structure', 
      'navigationData': 'structure',
      'textReadabilityData': 'content',
      'contentStructureData': 'content',
      'colorContrastData': 'content',
      'enhancedImageData': 'images',
      'formData': 'forms',
      'tableData': 'forms',
      'keyboardData': 'keyboard',
      'focusManagementData': 'keyboard',
      'keyboardShortcutData': 'keyboard',
      'touchTargetData': 'mobile',
      'mobileAccessibilityData': 'mobile',
      'axeResults': 'structure' // Default to structure for axe
    };
    return categoryMap[source] || 'structure';
  };
  
  const getCategoryFromContent = (item) => {
    const type = item.type?.toLowerCase() || '';
    const desc = item.description?.toLowerCase() || '';
    
    // Structure & Navigation
    if (type.includes('heading') || type.includes('landmark') || type.includes('navigation') || 
        type.includes('aria') || desc.includes('structure') || desc.includes('semantic')) {
      return 'structure';
    }
    
    // Content & Text
    if (type.includes('contrast') || type.includes('text') || type.includes('readability') ||
        desc.includes('contrast') || desc.includes('color') || desc.includes('font')) {
      return 'content';
    }
    
    // Images & Media
    if (type.includes('image') || type.includes('alt') || type.includes('media') ||
        desc.includes('image') || desc.includes('alt text')) {
      return 'images';
    }
    
    // Forms & Input
    if (type.includes('form') || type.includes('label') || type.includes('input') ||
        desc.includes('form') || desc.includes('label')) {
      return 'forms';
    }
    
    // Keyboard & Focus
    if (type.includes('keyboard') || type.includes('focus') || type.includes('tab') ||
        desc.includes('keyboard') || desc.includes('focus')) {
      return 'keyboard';
    }
    
    // Mobile & Touch
    if (type.includes('mobile') || type.includes('touch') || type.includes('responsive') ||
        desc.includes('mobile') || desc.includes('touch')) {
      return 'mobile';
    }
    
    return 'structure'; // Default
  };

  const getIssuesForCategory = (category) => {
    const allResults = getAllAnalysisResults();
    
    return allResults
      .filter(result => result.category === category)
      .slice(0, 25); // Show up to 25 issues per category
  };

  const getCodeExample = (issue) => {
    const desc = issue.description?.toLowerCase() || '';
    const type = issue.type?.toLowerCase() || '';
    const id = issue.id?.toLowerCase() || '';
    
    // Get actual code location from issue data
    const instances = getIssueInstances(issue);
    const firstInstance = instances[0];
    const actualHTML = firstInstance?.html || issue.html || issue.node?.html || '';
    const selector = firstInstance?.selector || issue.selector || issue.target || '';
    
    // Content Structure Issues
    if (desc.includes('content chunks') || desc.includes('content exceed') || desc.includes('word count')) {
      return `<!-- Problem: Content block is too long -->
<div class="content-section">
  <p>This is a very long paragraph with lots of text that goes on and on without any breaks and makes it hard for customers to scan and find what they're looking for quickly especially customers with reading difficulties...</p>
</div>

<!-- Fixed: Broken into digestible chunks -->
<div class="content-section">
  <h2>Our Services</h2>
  <p>We provide professional consulting to help your business grow.</p>
  
  <h3>What We Offer</h3>
  <ul>
    <li>Strategic planning</li>
    <li>Market analysis</li>
    <li>Implementation support</li>
  </ul>
  
  <p>Ready to get started? Contact us today.</p>
</div>

/* Keep each content section under 500 words with clear headings */`;
    }
    
    if (desc.includes('line height') || type.includes('line-height')) {
      return `/* Problem: Text is cramped and hard to read */
.content {
  line-height: 1.2;  /* Too tight */
  font-size: 16px;
}

/* Fixed: Comfortable reading spacing */
.content {
  line-height: 1.5;  /* WCAG minimum */
  font-size: 16px;
}

/* For even better readability */
.content {
  line-height: 1.6;
  font-size: 18px;
}`;
    }
    
    if (desc.includes('white space') || desc.includes('whitespace')) {
      return `<!-- Problem: Cramped layout -->
<div class="section">
<h2>Services</h2>
<p>Description</p>
<button>Contact</button>
</div>

<!-- Fixed: Proper spacing -->
<div class="section">
  <h2>Services</h2>
  
  <p>Description of our services with proper spacing around elements.</p>
  
  <button>Contact Us</button>
</div>

/* CSS for proper spacing */
.section {
  padding: 2rem;
  margin-bottom: 2rem;
}
.section h2 { margin-bottom: 1rem; }
.section p { margin-bottom: 1.5rem; }`;
    }
    
    // Color Contrast Issues
    if (desc.includes('contrast') || type.includes('contrast')) {
      return `/* Problem: Text is hard to read */
.text {
  color: #999999;        /* Light gray - too low contrast */
  background: #ffffff;
}

/* Fixed: High contrast for readability */
.text {
  color: #333333;        /* Dark gray - 4.5:1 ratio */
  background: #ffffff;
}

/* Alternative dark theme */
.text-dark {
  color: #ffffff;        /* White text */
  background: #333333;   /* Dark background */
}

/* Test your colors at: webaim.org/resources/contrastchecker/ */`;
    }
    
    // Image Issues
    if (desc.includes('alt') || type.includes('alt')) {
      return `<!-- Problem: Screen readers can't understand images -->
<img src="product-photo.jpg">
<img src="team-photo.jpg" alt="">
<img src="logo.png" alt="image">

<!-- Fixed: Descriptive alt text -->
<img src="product-photo.jpg" alt="Blue cotton t-shirt with company logo">
<img src="team-photo.jpg" alt="Marketing team of 5 people in office">
<img src="logo.png" alt="ABC Company logo">

<!-- For purely decorative images -->
<img src="decorative-border.png" alt="">

Location found: ${selector || 'Various image elements'}`;
    }
    
    // Form Issues  
    if (desc.includes('label') || type.includes('label')) {
      return `<!-- Problem: Customers don't know what to enter -->
<input type="email" placeholder="Email">
<input type="tel" placeholder="Phone">

<!-- Fixed: Clear labels for every field -->
<label for="customer-email">Your Email Address</label>
<input type="email" id="customer-email" placeholder="example@email.com">

<label for="customer-phone">Phone Number</label>
<input type="tel" id="customer-phone" placeholder="(555) 123-4567">

<!-- Alternative: Using aria-label -->
<input type="email" aria-label="Your email address">

Location: ${selector || 'Form fields throughout site'}`;
    }
    
    // Heading Structure Issues
    if (desc.includes('heading') || type.includes('heading')) {
      return `<!-- Problem: Confusing structure for screen readers -->
<h1>About Us</h1>
<h3>Our History</h3>    <!-- Skipped H2! -->
<h4>Founded in 2010</h4>

<!-- Fixed: Logical heading order -->
<h1>About Us</h1>
<h2>Our History</h2>    <!-- Proper order -->
<h3>Founded in 2010</h3>
<h3>Our Growth</h3>
<h2>Our Team</h2>
<h3>Leadership</h3>

/* Rule: Always go H1 → H2 → H3, never skip levels */
Location: ${selector || 'Page headings'}`;
    }
    
    // Navigation Issues
    if (desc.includes('skip link') || id.includes('skip-link')) {
      return `<!-- Problem: Keyboard users must tab through entire menu -->
<header>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/services">Services</a>
    <a href="/contact">Contact</a>
  </nav>
</header>
<main>Content...</main>

<!-- Fixed: Skip link for keyboard users -->
<header>
  <a href="#main" class="skip-link">Skip to main content</a>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/services">Services</a>
    <a href="/contact">Contact</a>
  </nav>
</header>
<main id="main">Content...</main>

/* Hide skip link until focused */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
}
.skip-link:focus { top: 6px; }`;
    }
    
    // Keyboard & Focus Issues
    if (desc.includes('keyboard') || type.includes('keyboard')) {
      return `<!-- Problem: Can't navigate with keyboard -->
<div onclick="doSomething()">Click me</div>
<div class="menu-item">Menu</div>

<!-- Fixed: Proper keyboard support -->
<button onclick="doSomething()">Click me</button>
<a href="/menu" class="menu-item">Menu</a>

/* Or make div keyboard accessible */
<div tabindex="0" onclick="doSomething()" onkeydown="if(event.key==='Enter')doSomething()">
  Click me
</div>

/* Always test: Can you reach everything with Tab key? */
Location: ${selector || 'Interactive elements'}`;
    }
    
    if (desc.includes('focus') || type.includes('focus')) {
      return `/* Problem: Can't see where you are when using keyboard */
button:focus {
  outline: none;  /* DON'T DO THIS */
}

/* Fixed: Clear focus indicators */
button:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Alternative: Custom focus styles */
.my-button:focus {
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.5);
  border-color: #0066cc;
}

/* Test: Tab through your site - can you always see where you are? */
Location: ${selector || 'All interactive elements'}`;
    }
    
    // Touch Target Issues
    if (desc.includes('touch target') || desc.includes('target size')) {
      return `/* Problem: Buttons too small for mobile users */
.small-button {
  width: 28px;
  height: 20px;    /* Too small! */
  padding: 4px;
}

/* Fixed: Proper touch target size */
.mobile-button {
  min-width: 44px;   /* WCAG minimum */
  min-height: 44px;
  padding: 12px 16px;
  margin: 8px;       /* Space between targets */
}

/* For text links */
.mobile-link {
  display: inline-block;
  padding: 12px 8px;
  min-height: 44px;
}

/* Test on your phone: Can you easily tap without mistakes? */
Location: ${selector || 'Buttons and links'}`;
    }
    
    // Mobile Issues
    if (desc.includes('mobile') || type.includes('responsive')) {
      return `/* Problem: Fixed sizes break on mobile */
.container {
  width: 1200px;        /* Fixed width */
  font-size: 14px;      /* Too small for mobile */
}

/* Fixed: Responsive design */
.container {
  width: 100%;
  max-width: 1200px;
  font-size: 16px;      /* Readable on mobile */
  padding: 1rem;
}

/* Mobile-first approach */
@media (min-width: 768px) {
  .container {
    font-size: 18px;
    padding: 2rem;
  }
}

/* Test: Does your site work well on phones? */
Location: ${selector || 'Layout elements'}`;
    }
    
    // ARIA Issues
    if (desc.includes('aria') || type.includes('aria')) {
      return `<!-- Problem: Screen readers don't understand purpose -->
<div class="search-button">🔍</div>
<span class="close-button">×</span>

<!-- Fixed: Clear labels for screen readers -->
<button class="search-button" aria-label="Search products">🔍</button>
<button class="close-button" aria-label="Close dialog">×</button>

<!-- For icons without text -->
<button aria-label="Add to cart">
  <svg>...</svg>
</button>

<!-- For expandable sections -->
<button aria-expanded="false" aria-controls="menu">Menu</button>
<div id="menu">...</div>

Location: ${selector || 'Interactive elements with icons'}`;
    }
    
    // Page Structure Issues
    if (desc.includes('page title') || id.includes('page-title')) {
      return `<!-- Problem: Unclear what page customer is on -->
<title>Home</title>
<title>Page 1</title>
<title>Untitled Document</title>

<!-- Fixed: Descriptive page titles -->
<title>ABC Plumbing - Emergency Repairs | Seattle</title>
<title>Our Services - ABC Plumbing | 24/7 Emergency</title>
<title>Contact ABC Plumbing | Free Quotes Seattle</title>

<!-- Format: Page Name - Company Name | Location/Keywords -->
Location: ${selector || 'Page title element'}`;
    }
    
    if (desc.includes('language') || desc.includes('lang')) {
      return `<!-- Problem: Screen readers don't know how to pronounce content -->
<html>
<head>
  <title>Welcome to our store</title>
</head>

<!-- Fixed: Declare page language -->
<html lang="en">
<head>
  <title>Welcome to our store</title>
</head>

<!-- For multilingual content -->
<html lang="en">
  <p>Welcome to our store</p>
  <p lang="es">Bienvenido a nuestra tienda</p>
</html>

Location: ${selector || 'HTML element'}`;
    }
    
    // Generic fallback for any other violation type
    return `<!-- Problem: Accessibility barrier found -->
${actualHTML ? actualHTML.substring(0, 200) + (actualHTML.length > 200 ? '...' : '') : '<!-- Specific code location -->'}

<!-- General Fix Guidelines -->
1. For text: Improve contrast, increase size, add clear labels
2. For images: Add descriptive alt text
3. For forms: Label every input field clearly
4. For buttons: Make them keyboard accessible
5. For mobile: Ensure 44px minimum touch targets

Location: ${selector || 'Multiple elements'}

/* Consult the fix instructions above for specific steps */`;
  };

  const getBeforeMockup = (issue) => {
    const desc = issue.description?.toLowerCase() || '';
    const type = issue.type?.toLowerCase() || '';
    
    if (desc.includes('zoom') || desc.includes('relative units') || desc.includes('fixed pixels')) {
      return `🔍 Customer zooms to 200%
📱 Text stays tiny at 14px
📐 Layout breaks, horizontal scrolling appears
❌ Customer can't read content, leaves site`;
    }
    
    if (desc.includes('contrast') || type.includes('contrast')) {
      return `🔲 Light gray #999 text on white background
📖 "Important information about our services..."
👁️ Hard to read, especially in sunlight
❌ Customers squint or skip the content`;
    }
    
    if (desc.includes('alt') || type.includes('alt')) {
      return `🖼️ <img src="product.jpg"> (no alt attribute)
🔇 Screen reader says: "Image"
❓ Customer doesn't know what product this is
❌ Lost sale opportunity`;
    }
    
    if (desc.includes('label') || type.includes('label')) {
      return `📝 <input type="email" placeholder="Email">
❓ Customer wonders: "What goes here?"
🤔 Placeholder disappears when typing
❌ Form abandoned in confusion`;
    }
    
    if (desc.includes('touch target') || desc.includes('target size')) {
      return `📱 Button: 28px × 20px (too small)
👆 Customer tries to tap
❌ Accidentally hits wrong button
😤 Frustration leads to cart abandonment`;
    }
    
    if (desc.includes('heading') || type.includes('heading')) {
      return `📄 <h1>Title</h1><h3>Section</h3> (skipped H2)
🔍 Customer can't scan quickly
⏭️ Screen reader users get lost
❌ Information is hard to find`;
    }
    
    if (desc.includes('focus') || type.includes('focus')) {
      return `⌨️ button:focus { outline: none; }
❓ "Where am I?" - no visual indicator
🔍 Tab navigation is invisible
❌ Gets lost and gives up`;
    }
    
    return `⚠️ Current code has accessibility barriers
❌ Some customers can't use this feature
📉 Potential lost business`;
  };

  const getAfterMockup = (issue) => {
    const desc = issue.description?.toLowerCase() || '';
    const type = issue.type?.toLowerCase() || '';
    
    if (desc.includes('zoom') || desc.includes('relative units') || desc.includes('fixed pixels')) {
      return `🔍 Customer zooms to 200%
📱 Text scales properly with 1rem units
📐 Layout stays intact, no scrolling
✓ Customer can read content comfortably`;
    }
    
    if (desc.includes('contrast') || type.includes('contrast')) {
      return `✅ Dark #333 text on white background
📖 "Important information about our services..."
👁️ Easy to read in any lighting
✓ All customers can read your content`;
    }
    
    if (desc.includes('alt') || type.includes('alt')) {
      return `🖼️ <img src="product.jpg" alt="Blue cotton t-shirt">
🔊 Screen reader: "Blue cotton t-shirt with logo"
💡 Customer understands the product
✓ Can make informed purchase decision`;
    }
    
    if (desc.includes('label') || type.includes('label')) {
      return `📝 <label for="email">Email Address</label>
   <input type="email" id="email">
✓ Clear what information to enter
✓ Form completed successfully`;
    }
    
    if (desc.includes('touch target') || desc.includes('target size')) {
      return `📱 Button: 44px × 44px (proper size)
👆 Comfortable tap target
✓ No accidental clicks
😊 Smooth mobile experience`;
    }
    
    if (desc.includes('heading') || type.includes('heading')) {
      return `📄 <h1>Title</h1><h2>Main</h2><h3>Sub</h3>
🔍 Easy to scan and find info
⏭️ Screen readers navigate smoothly
✓ Information found quickly`;
    }
    
    if (desc.includes('focus') || type.includes('focus')) {
      return `⌨️ button:focus { outline: 2px solid #0066cc; }
🔵 Clear blue outline shows location
✓ Always knows where they are
✓ Completes task successfully`;
    }
    
    return `✅ Accessible code implementation
✓ No barriers to usage
✓ Better user experience`;
  };


  const getLegalCompliance = (issue) => {
    const desc = issue.description?.toLowerCase() || '';
    const type = issue.type?.toLowerCase() || '';
    const id = issue.id?.toLowerCase() || '';
    
    // Content Structure Issues
    if (desc.includes('content chunks') || desc.includes('content exceed') || desc.includes('word count')) {
      return `⚖️ **WCAG 2.1 Level AA - Success Criterion 2.4.6 (Headings and Labels)**
Content must be organized for easy scanning and comprehension.

🚨 **Risk Level: MEDIUM** - Cognitive accessibility requirement
📊 **Business impact:** Affects customers with reading difficulties, ADHD, dyslexia

**For Small Businesses:** Long content blocks make it hard for customers to find key information like prices, services, or contact details. This can lead to lost sales and frustrated customers.

⚖️ **Legal Reality:** While less commonly sued, increasingly recognized as accessibility barrier.`;
    }
    
    if (desc.includes('line height') || type.includes('line-height')) {
      return `⚖️ **WCAG 2.1 Level AA - Success Criterion 1.4.12 (Text Spacing)**
Line height must be at least 1.5 times the font size.

🚨 **Risk Level: MEDIUM** - Text readability requirement
📊 **User impact:** Affects 10-15% of users with reading difficulties

**For Small Businesses:** Cramped text makes it hard for older customers and those with dyslexia to read your content, potentially losing customers who can't comfortably read your services or prices.

⚖️ **Legal Reality:** Text spacing violations are being cited more frequently in recent lawsuits.`;
    }
    
    if (desc.includes('white space') || desc.includes('whitespace')) {
      return `⚖️ **WCAG 2.1 Level AA - Success Criterion 1.4.8 (Visual Presentation)**
Content must have adequate white space for readability.

🚨 **Risk Level: LOW** - Visual design accessibility requirement
📊 **User impact:** Affects users with cognitive disabilities and visual processing issues

**For Small Businesses:** Cramped layouts look unprofessional and make it harder for customers to focus on your key messages, reducing trust and conversion rates.

⚖️ **Legal Reality:** Rarely the primary lawsuit focus, but part of overall accessibility compliance.`;
    }
    
    // Zoom/scaling issues
    if (desc.includes('zoom') || desc.includes('relative units') || desc.includes('fixed pixels')) {
      return `⚖️ **WCAG 2.1 Level AA - Success Criterion 1.4.4 (Resize Text)**
Text must be resizable up to 200% without assistive technology.

🚨 **Risk Level: HIGH** - Affects 15-20% of users with vision difficulties
📊 **Lawsuit precedent:** Target Corp. paid $6M settlement partly due to text scaling issues

**For Small Businesses:** Many older customers zoom their browser to read better. If your site breaks when zoomed, you lose these customers immediately.

⚖️ **Legal Reality:** Essential for users with low vision who rely on browser zoom.`;
    }
    
    // Color Contrast Issues
    if (desc.includes('contrast') || type.includes('contrast')) {
      return `⚖️ **WCAG 2.1 Level AA - Success Criterion 1.4.3 (Contrast Minimum)**
Normal text: 4.5:1 ratio | Large text (18pt+): 3:1 ratio

🚨 **Risk Level: VERY HIGH** - #2 most cited in lawsuits after alt text
📊 **Recent cases:** Domino's, Netflix, Southwest Airlines all cited contrast

**For Small Businesses:** Poor contrast means customers can't read your prices, services, or contact info. This directly costs you sales, especially from older customers.

⚖️ **Legal Reality:** Easily detected by automated tools used in lawsuits - low-hanging fruit for lawyers.`;
    }
    
    // Image Issues
    if (desc.includes('alt') || type.includes('alt') || id.includes('image')) {
      return `⚖️ **WCAG 2.1 Level A - Success Criterion 1.1.1 (Non-text Content)**
All images conveying information must have text alternatives.

🚨 **Risk Level: CRITICAL** - #1 cited issue in accessibility lawsuits  
📊 **Legal precedent:** 76% of lawsuits cite missing alt text

**For Small Businesses:** Screen reader users can't see your product photos, team pictures, or infographics. They miss key visual information that could lead to sales.

⚖️ **Legal Reality:** Easiest violation to prove - automated scans find 100% of missing alt text.`;
    }
    
    // Form Issues
    if (desc.includes('label') || type.includes('label') || desc.includes('form')) {
      return `⚖️ **WCAG 2.1 Level A - Success Criteria:**
• 3.3.2 (Labels or Instructions) • 1.3.1 (Info and Relationships)

🚨 **Risk Level: HIGH** - Forms are essential business functions
📊 **Business impact:** Unlabeled forms directly prevent transactions

**For Small Businesses:** If customers can't fill out your contact form, quote request, or order form, you lose business directly. This affects your bottom line immediately.

⚖️ **Legal Reality:** Forms are "places of public accommodation" - core ADA requirement for any business.`;
    }
    
    // Heading Structure Issues
    if (desc.includes('heading') || type.includes('heading') || desc.includes('structure')) {
      return `⚖️ **WCAG 2.1 Level A - Success Criteria:**
• 1.3.1 (Info and Relationships) • 2.4.6 (Headings and Labels)

🚨 **Risk Level: MEDIUM** - Affects navigation efficiency
📊 **User impact:** Screen reader users navigate by headings to find information quickly

**For Small Businesses:** Poor heading structure makes it hard for customers to scan your content and find what they need (services, prices, contact info).

⚖️ **Legal Reality:** Required for programmatic page structure - screen readers depend on this.`;
    }
    
    // Navigation Issues
    if (desc.includes('skip link') || id.includes('skip-link')) {
      return `⚖️ **WCAG 2.1 Level A - Success Criterion 2.4.1 (Bypass Blocks)**
Provide mechanism to skip repetitive navigation content.

🚨 **Risk Level: MEDIUM** - Keyboard navigation efficiency
📊 **User impact:** Keyboard users must tab through entire menu to reach content

**For Small Businesses:** Without skip links, keyboard users get frustrated trying to reach your main content and may leave your site.

⚖️ **Legal Reality:** Standard accessibility requirement - shows you understand accessibility basics.`;
    }
    
    if (desc.includes('navigation') || type.includes('nav')) {
      return `⚖️ **WCAG 2.1 Level AA - Success Criterion 2.4.3 (Focus Order)**
Navigation must be logical and consistent.

🚨 **Risk Level: MEDIUM** - Navigation usability requirement  
📊 **User impact:** Confusing navigation affects all users, especially those with cognitive disabilities

**For Small Businesses:** If customers can't navigate your site easily, they can't find your services or contact you, leading to lost business.

⚖️ **Legal Reality:** Part of overall site accessibility - contributes to ADA compliance.`;
    }
    
    // Keyboard & Focus Issues
    if (desc.includes('keyboard') || type.includes('keyboard')) {
      return `⚖️ **WCAG 2.1 Level A - Success Criterion 2.1.1 (Keyboard)**
All functionality must be available via keyboard.

🚨 **Risk Level: CRITICAL** - Fundamental access requirement
📊 **User impact:** 8% of users rely primarily on keyboard navigation

**For Small Businesses:** If keyboard users can't navigate your site, contact you, or make purchases, you lose these customers entirely.

⚖️ **Legal Reality:** Core ADA requirement - must provide keyboard access to all functionality.`;
    }
    
    if (desc.includes('focus') || type.includes('focus')) {
      return `⚖️ **WCAG 2.1 Level AA - Success Criterion 2.4.7 (Focus Visible)**
Keyboard focus must be clearly visible at all times.

🚨 **Risk Level: HIGH** - Keyboard navigation visibility
📊 **User impact:** Keyboard users get lost without visible focus indicators

**For Small Businesses:** Invisible focus means keyboard users can't see where they are on your site, leading to frustration and abandonment.

⚖️ **Legal Reality:** Essential for keyboard accessibility compliance - easy to test and verify.`;
    }
    
    // Touch Target Issues
    if (desc.includes('touch target') || desc.includes('target size')) {
      return `⚖️ **WCAG 2.1 Level AA - Success Criterion 2.5.5 (Target Size)**
Interactive elements must be at least 44×44 CSS pixels.

🚨 **Risk Level: MEDIUM** - Mobile accessibility requirement
📊 **User impact:** 60% of traffic is mobile, affects users with motor disabilities

**For Small Businesses:** Small buttons frustrate mobile customers and prevent them from contacting you or making purchases on their phones.

⚖️ **Legal Reality:** Mobile accessibility increasingly scrutinized as most traffic is now mobile.`;
    }
    
    // Mobile Issues
    if (desc.includes('mobile') || type.includes('responsive')) {
      return `⚖️ **WCAG 2.1 Level AA - Success Criterion 1.4.10 (Reflow)**
Content must work on mobile devices without horizontal scrolling.

🚨 **Risk Level: MEDIUM** - Mobile usability requirement
📊 **User impact:** 60% of web traffic is mobile

**For Small Businesses:** If your site doesn't work on phones, you lose over half your potential customers immediately.

⚖️ **Legal Reality:** Mobile accessibility is increasingly important as mobile usage dominates.`;
    }
    
    // ARIA Issues
    if (desc.includes('aria') || type.includes('aria')) {
      return `⚖️ **WCAG 2.1 Level A - Success Criterion 4.1.2 (Name, Role, Value)**
Interactive elements must have accessible names and roles.

🚨 **Risk Level: MEDIUM** - Screen reader compatibility
📊 **User impact:** Screen reader users can't understand what buttons and controls do

**For Small Businesses:** Without ARIA labels, screen reader users don't know what your buttons do (like "Add to Cart" or "Contact Us").

⚖️ **Legal Reality:** Required for screen reader accessibility - part of basic compliance.`;
    }
    
    // Page Structure Issues
    if (desc.includes('page title') || id.includes('page-title')) {
      return `⚖️ **WCAG 2.1 Level A - Success Criterion 2.4.2 (Page Titled)**
Every page must have a descriptive title.

🚨 **Risk Level: LOW** - Basic page structure requirement
📊 **Impact:** Affects SEO and user orientation

**For Small Businesses:** Poor page titles hurt your search rankings and make it hard for customers to understand what page they're on.

⚖️ **Legal Reality:** Basic requirement that's easy to fix and shows attention to accessibility.`;
    }
    
    if (desc.includes('language') || desc.includes('lang')) {
      return `⚖️ **WCAG 2.1 Level A - Success Criterion 3.1.1 (Language of Page)**
Page language must be declared for screen readers.

🚨 **Risk Level: LOW** - Screen reader pronunciation requirement
📊 **User impact:** Screen readers mispronounce content without language declaration

**For Small Businesses:** Screen readers can't pronounce your content correctly, making it incomprehensible to blind customers.

⚖️ **Legal Reality:** Simple technical fix that demonstrates basic accessibility awareness.`;
    }
    
    // Generic fallback for any other violation type
    return `⚖️ **WCAG 2.1 Level AA Compliance**
This accessibility issue may violate ADA requirements.

🚨 **Risk Level: MEDIUM** - General accessibility barrier
📊 **User impact:** May prevent some customers from using your website effectively

**For Small Businesses:** Accessibility barriers can cost you customers and increase legal risk. Even if not directly sued, fixing these issues improves customer experience and reduces liability.

⚖️ **Legal Reality:** The ADA applies to all businesses serving the public. While lawsuits vary, maintaining accessibility shows good faith effort.`;
  };

  const extractWCAGCriteria = (issue) => {
    // Extract WCAG criteria from issue data
    if (issue.wcagCriteria) return issue.wcagCriteria;
    if (issue.tags) {
      const wcagTag = issue.tags.find(tag => tag.includes('wcag'));
      if (wcagTag) return wcagTag;
    }
    return 'WCAG 2.1 Level AA';
  };

  const getIssueInstances = (issue) => {
    const instances = [];
    
    // Extract instances from various data structures
    if (issue.nodes && Array.isArray(issue.nodes)) {
      issue.nodes.forEach((node, idx) => {
        instances.push({
          selector: node.target || node.selector || `element-${idx}`,
          html: node.html || node.outerHTML,
          message: node.failureSummary || node.message,
          target: node.target
        });
      });
    }
    
    if (issue.elements && Array.isArray(issue.elements)) {
      issue.elements.forEach((element, idx) => {
        instances.push({
          selector: element.selector || element.target || `element-${idx}`,
          html: element.html || element.outerHTML,
          message: element.message,
          target: element.target
        });
      });
    }
    
    // If no structured instances, create one from the main issue data
    if (instances.length === 0 && (issue.selector || issue.target || issue.html)) {
      instances.push({
        selector: issue.selector || issue.target || 'Unknown location',
        html: issue.html || issue.outerHTML,
        message: issue.failureSummary || issue.message || issue.description,
        target: issue.target
      });
    }
    
    return instances;
  };

  const issues = getIssuesForCategory(activeCategory);

  return (
    <DetailedContainer>
      <SectionTitle>{t('results:detailed.title')}</SectionTitle>
      <SectionSubtitle>{t('results:detailed.subtitle')}</SectionSubtitle>

      {/* Summary Statistics */}
      <SummaryGrid>
        <SummaryCard>
          <SummaryIcon type="score">
            <FaChartLine />
          </SummaryIcon>
          <SummaryValue>{analysisData.overallScore || 0}%</SummaryValue>
          <SummaryLabel>Overall Score</SummaryLabel>
        </SummaryCard>
        
        <SummaryCard>
          <SummaryIcon type="critical">
            <FaExclamationTriangle />
          </SummaryIcon>
          <SummaryValue>{getAllAnalysisResults().filter(r => getSeverity(r) === 'critical').length}</SummaryValue>
          <SummaryLabel>Critical Issues</SummaryLabel>
        </SummaryCard>
        
        <SummaryCard>
          <SummaryIcon type="warning">
            <FaInfoCircle />
          </SummaryIcon>
          <SummaryValue>{getAllAnalysisResults().filter(r => getSeverity(r) === 'warning').length}</SummaryValue>
          <SummaryLabel>Warning Issues</SummaryLabel>
        </SummaryCard>
        
        <SummaryCard>
          <SummaryIcon type="total">
            <FaAccessibleIcon />
          </SummaryIcon>
          <SummaryValue>{getAllAnalysisResults().length}</SummaryValue>
          <SummaryLabel>Total Issues Found</SummaryLabel>
        </SummaryCard>
      </SummaryGrid>

      <CategoryTabs>
        {categories.map(category => (
          <CategoryTab
            key={category.id}
            active={activeCategory === category.id}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.label} ({getIssuesForCategory(category.id).length})
          </CategoryTab>
        ))}
      </CategoryTabs>

      <IssuesList>
        {issues.map((issue, index) => (
          <IssueCard key={index} severity={getSeverity(issue)}>
            <IssueHeader onClick={() => toggleIssue(index)}>
              <IssueHeaderLeft>
                <IssueIcon severity={getSeverity(issue)}>
                  {getSeverity(issue) === 'critical' ? <FaExclamationTriangle /> : 
                   getSeverity(issue) === 'warning' ? <FaInfoCircle /> : <FaCheckCircle />}
                </IssueIcon>
                <IssueTitleSection>
                  <IssueTitle>{getIssueTitle(issue)}</IssueTitle>
                  <IssueCount>{getInstanceCount(issue)} found</IssueCount>
                  {issue.nodes && issue.nodes.length > 0 && (
                    <IssueCount style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--spacing-xs)' }}>
                      {issue.nodes.map((node, idx) => node.target || node.selector).filter(Boolean).slice(0, 3).join(', ')}
                      {issue.nodes.length > 3 && ` + ${issue.nodes.length - 3} more`}
                    </IssueCount>
                  )}
                </IssueTitleSection>
              </IssueHeaderLeft>
              <SeverityBadge severity={getSeverity(issue)}>
                {getSeverity(issue)}
              </SeverityBadge>
              <ExpandIcon expanded={expandedIssues.has(index)}>
                <FaChevronDown />
              </ExpandIcon>
            </IssueHeader>

            <IssueDetails expanded={expandedIssues.has(index)}>
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
                <SectionContent 
                  dangerouslySetInnerHTML={{
                    __html: getFixInstructions(issue)
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              </FixInstructions>

              {/* Code Examples - Always show helpful examples */}
              <CodeExampleSection>
                <SectionHeader>
                  <FaCode />
                  Code Example
                </SectionHeader>
                <CodeBlock>
                  <pre>{getCodeExample(issue)}</pre>
                </CodeBlock>
              </CodeExampleSection>

              {/* Before/After Mockup */}
              <MockupSection>
                <SectionHeader>
                  <FaExternalLinkAlt />
                  Before & After
                </SectionHeader>
                <MockupGrid>
                  <MockupCard>
                    <MockupLabel>Before (Problem)</MockupLabel>
                    <MockupDescription>{getBeforeMockup(issue)}</MockupDescription>
                  </MockupCard>
                  <MockupCard>
                    <MockupLabel>After (Fixed)</MockupLabel>
                    <MockupDescription>{getAfterMockup(issue)}</MockupDescription>
                  </MockupCard>
                </MockupGrid>
              </MockupSection>


              {/* Legal Compliance - Always show helpful legal context */}
              <ComplianceSection>
                <SectionHeader>
                  <FaCheckCircle />
                  Legal Compliance
                </SectionHeader>
                <ComplianceContent>{getLegalCompliance(issue)}</ComplianceContent>
              </ComplianceSection>

              {/* Individual Instances */}
              {getIssueInstances(issue).length > 0 && (
                <InstancesSection>
                  <SectionHeader>
                    <FaCode />
                    Individual Instances Found ({getIssueInstances(issue).length})
                  </SectionHeader>
                  <InstancesList>
                    {getIssueInstances(issue).slice(0, 10).map((instance, idx) => (
                      <InstanceCard key={idx}>
                        <InstanceHeader>
                          <InstanceNumber>{idx + 1}</InstanceNumber>
                          <InstanceLocation>{instance.selector || instance.target || `Element ${idx + 1}`}</InstanceLocation>
                        </InstanceHeader>
                        {instance.html && (
                          <InstanceCode>
                            <pre>{instance.html.substring(0, 200)}{instance.html.length > 200 ? '...' : ''}</pre>
                          </InstanceCode>
                        )}
                        {instance.message && (
                          <InstanceMessage>{instance.message}</InstanceMessage>
                        )}
                      </InstanceCard>
                    ))}
                    {getIssueInstances(issue).length > 10 && (
                      <InstanceCard>
                        <InstanceMessage>
                          + {getIssueInstances(issue).length - 10} more instances found
                        </InstanceMessage>
                      </InstanceCard>
                    )}
                  </InstancesList>
                </InstancesSection>
              )}

              <BenefitsGrid>
                <BenefitCard>
                  <BenefitTitle>
                    <FaDollarSign />
                    Business Impact
                  </BenefitTitle>
                  <BenefitText>
                    {getBusinessBenefit(issue)}
                  </BenefitText>
                </BenefitCard>
                
                <BenefitCard>
                  <BenefitTitle>
                    <FaUsers />
                    Customer Benefit
                  </BenefitTitle>
                  <BenefitText>
                    {getCustomerBenefit(issue)}
                  </BenefitText>
                </BenefitCard>
              </BenefitsGrid>
            </IssueDetails>
          </IssueCard>
        ))}
        
        {issues.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: 'var(--spacing-2xl)', 
            color: 'var(--color-text-secondary)' 
          }}>
            <FaCheckCircle style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--spacing-md)', color: 'var(--color-success)' }} />
            <p>No issues found in this category. Great work!</p>
          </div>
        )}
      </IssuesList>
    </DetailedContainer>
  );
};

export default DetailedAnalysisSection;