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
      // Structure & Navigation
      'heading': 'Poor heading structure makes it hard for customers to scan your content and find what they\'re looking for quickly. Screen reader users rely on headings to navigate, so poor structure creates confusion and may cause customers to leave.',
      'landmark': 'Missing page landmarks make it difficult for screen reader users to quickly navigate to different sections of your website, leading to frustration and potential customer loss.',
      'navigation': 'Inconsistent or unclear navigation confuses customers and makes it hard to find products or information, directly impacting sales and customer satisfaction.',
      'aria': 'Missing ARIA labels make interactive elements unclear to assistive technology users, preventing them from understanding what buttons or controls do.',
      
      // Content & Text  
      'color-contrast': 'When text doesn\'t have enough contrast with its background, customers - especially older customers or those with vision difficulties - can\'t read your content. This means they might miss important information about your products or services, or abandon your site entirely.',
      'text': 'Poor text formatting makes content hard to read for all customers, but especially impacts those with dyslexia or reading difficulties, potentially losing you customers.',
      'font': 'Decorative or hard-to-read fonts can make your content inaccessible to customers with reading difficulties, reducing engagement and conversions.',
      
      // Images & Media
      'image-alt': 'Images without descriptions are invisible to customers using screen readers (software that reads websites aloud). This means these customers can\'t understand your product photos, diagrams, or important visual information.',
      'alt': 'Missing image descriptions prevent screen reader users from understanding your visual content, potentially missing key product information or calls-to-action.',
      
      // Forms & Input
      'form': 'Forms without clear labels confuse customers about what information to enter. This leads to incomplete forms, frustrated customers, and lost sales opportunities.',
      'label': 'Input fields without proper labels make it unclear what information customers should enter, leading to form abandonment and lost leads.',
      'input': 'Poorly designed form inputs can prevent customers from successfully submitting contact forms, orders, or sign-ups, directly impacting your business.',
      
      // Keyboard & Focus
      'keyboard': 'Many customers navigate websites using only a keyboard. If your site doesn\'t support this, you\'re excluding potential customers with motor disabilities.',
      'focus': 'Invisible or unclear focus indicators make it impossible for keyboard users to know where they are on your page, leading to confusion and site abandonment.',
      'tab': 'Illogical tab order confuses keyboard users about how to navigate your site, making it difficult to complete purchases or contact you.',
      
      // Mobile & Touch
      'touch': 'Touch targets that are too small make it difficult for customers to tap buttons or links on mobile devices, especially for users with motor difficulties or larger fingers.',
      'mobile': 'Mobile accessibility issues prevent smartphone users from effectively using your website, potentially losing a significant portion of your customer base.',
      'responsive': 'Non-responsive design makes your website unusable on mobile devices, losing customers who primarily browse on phones and tablets.',
      
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
      'heading': 'Better SEO rankings and easier content navigation',
      'landmark': 'Improved user experience and accessibility compliance',
      'navigation': 'Higher customer satisfaction and reduced bounce rate',
      'aria': 'Legal compliance and expanded customer base',
      'color-contrast': 'More readable content for all customers',
      'text': 'Better engagement and readability scores',
      'font': 'Professional appearance and improved readability',
      'image-alt': 'Better search engine rankings and accessibility',
      'alt': 'Improved SEO and legal compliance',
      'form': 'Higher conversion rates and fewer abandoned forms',
      'label': 'More successful form submissions',
      'input': 'Reduced customer support requests',
      'keyboard': 'Expanded customer base and legal compliance',
      'focus': 'Better user experience for all customers',
      'tab': 'More efficient customer interactions',
      'touch': 'Better mobile conversion rates',
      'mobile': 'Larger mobile customer base',
      'responsive': 'Higher mobile sales and engagement'
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
      'heading': 'Easier to find and understand content organization',
      'landmark': 'Faster navigation with assistive technology',
      'navigation': 'Clear path to find desired information',
      'aria': 'Better understanding of interactive elements',
      'color-contrast': 'Easier reading, especially in bright light',
      'text': 'More comfortable reading experience',
      'font': 'Clearer, easier-to-read content',
      'image-alt': 'Understanding of visual content for all users',
      'alt': 'Access to important visual information',
      'form': 'Clear guidance on how to complete forms',
      'label': 'Confidence about what information to provide',
      'input': 'Successful form completion every time',
      'keyboard': 'Full site access without needing a mouse',
      'focus': 'Always knowing where you are on the page',
      'tab': 'Logical flow through interactive elements',
      'touch': 'Easy tapping without accidental clicks',
      'mobile': 'Seamless experience on any device',
      'responsive': 'Comfortable browsing on phones and tablets'
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
                  <IssueTitle>{issue.title || issue.description || 'Accessibility Issue'}</IssueTitle>
                  <IssueCount>{issue.count || 1} instance(s) found</IssueCount>
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