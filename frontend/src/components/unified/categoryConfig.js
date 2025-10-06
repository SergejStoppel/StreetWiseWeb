import { 
  FaCode, 
  FaFileAlt, 
  FaSearch, 
  FaCogs, 
  FaBrain,
  FaWpforms,
  FaCompass,
  FaImage,
  FaKeyboard,
  FaUniversalAccess,
  FaHandPointer,
  FaMobileAlt,
  FaGlobe,
  FaTachometerAlt,
  FaCompressAlt,
  FaCloudDownloadAlt,
  FaLightbulb,
  FaBolt
} from 'react-icons/fa';

// Configuration for all category types across SEO and Accessibility
export const CATEGORY_CONFIG = {
  // SEO Categories
  technical: { 
    icon: FaCode, 
    color: '#6366f1', 
    label: 'Technical SEO',
    description: 'Technical infrastructure and crawlability issues'
  },
  content: { 
    icon: FaFileAlt, 
    color: '#8b5cf6', 
    label: 'Content Optimization',
    description: 'Content quality and optimization opportunities'
  },
  structure: { 
    icon: FaSearch, 
    color: '#06b6d4', 
    label: 'Content Structure',
    description: 'HTML structure and semantic markup issues'
  },
  schema: { 
    icon: FaCogs, 
    color: '#10b981', 
    label: 'Structured Data',
    description: 'Schema markup and rich snippet opportunities'
  },
  ai: { 
    icon: FaBrain, 
    color: '#f59e0b', 
    label: 'AI Content Analysis',
    description: 'AI-powered content insights and recommendations'
  },
  
  // Accessibility Categories  
  forms: { 
    icon: FaWpforms, 
    color: '#ef4444', 
    label: 'Forms & Input',
    description: 'Form accessibility and input field issues'
  },
  navigation: { 
    icon: FaCompass, 
    color: '#3b82f6', 
    label: 'Navigation',
    description: 'Navigation and wayfinding accessibility'
  },
  images: { 
    icon: FaImage, 
    color: '#10b981', 
    label: 'Images & Media',
    description: 'Image alt text and media accessibility'
  },
  keyboard: { 
    icon: FaKeyboard, 
    color: '#f59e0b', 
    label: 'Keyboard Access',
    description: 'Keyboard navigation and focus management'
  },
  aria: {
    icon: FaUniversalAccess,
    color: '#8b5cf6',
    label: 'ARIA & Semantics',
    description: 'ARIA attributes and semantic HTML issues'
  },
  touch: {
    icon: FaHandPointer,
    color: '#06b6d4',
    label: 'Touch Targets',
    description: 'Touch target size and spacing issues'
  },
  mobile: {
    icon: FaMobileAlt,
    color: '#ec4899',
    label: 'Mobile Accessibility',
    description: 'Mobile-specific accessibility issues'
  },
  
  // Performance Categories
  coreWebVitals: {
    icon: FaTachometerAlt,
    color: '#dc2626',
    label: 'Core Web Vitals',
    description: 'Google Core Web Vitals metrics and optimization'
  },
  imageOptimization: {
    icon: FaImage,
    color: '#059669',
    label: 'Image Optimization',
    description: 'Image format, sizing, and loading optimizations'
  },
  resourceOptimization: {
    icon: FaCompressAlt,
    color: '#7c3aed',
    label: 'Resource Optimization',
    description: 'CSS, JavaScript, and resource loading optimization'
  },
  caching: {
    icon: FaCloudDownloadAlt,
    color: '#0891b2',
    label: 'Caching & Delivery',
    description: 'Browser caching and content delivery optimization'
  },
  performanceGeneral: {
    icon: FaBolt,
    color: '#ea580c',
    label: 'Performance Optimization',
    description: 'General performance improvements and best practices'
  },
  
  // General/Fallback
  general: {
    icon: FaGlobe,
    color: '#6b7280',
    label: 'General Issues',
    description: 'Miscellaneous issues and improvements'
  }
};

// Helper function to get category config with fallback
export const getCategoryConfig = (categoryKey) => {
  return CATEGORY_CONFIG[categoryKey] || CATEGORY_CONFIG.general;
};

// Helper to determine category from rule key or issue data
export const determineCategoryFromIssue = (issue) => {
  const ruleKey = issue.rule?.rule_key || issue.rule_key || '';
  const ruleName = issue.rule?.name || '';
  const ruleDescription = issue.rule?.description || issue.message || '';
  
  // SEO rule key patterns
  if (ruleKey.startsWith('SEO_TEC_')) return 'technical';
  if (ruleKey.startsWith('SEO_CON_')) return 'content';
  if (ruleKey.startsWith('SEO_STR_')) return 'structure';
  if (ruleKey.startsWith('SEO_SCHEMA_')) return 'schema';
  if (ruleKey.startsWith('SEO_AI_')) return 'ai';
  
  // Performance rule key patterns
  if (ruleKey.startsWith('PERF_CWV_')) return 'coreWebVitals';
  if (ruleKey.startsWith('PERF_IMG_')) return 'imageOptimization';
  if (ruleKey.startsWith('PERF_RES_')) return 'resourceOptimization';
  if (ruleKey.startsWith('PERF_CACHE_')) return 'caching';
  if (ruleKey.startsWith('PERF_JS_')) return 'resourceOptimization';
  
  // Accessibility patterns based on rule keys
  if (ruleKey.includes('alt-text') || ruleKey.includes('image')) return 'images';
  if (ruleKey.includes('form') || ruleKey.includes('input') || ruleKey.includes('label')) return 'forms';
  if (ruleKey.includes('aria') || ruleKey.includes('role')) return 'aria';
  if (ruleKey.includes('keyboard') || ruleKey.includes('focus') || ruleKey.includes('tabindex')) return 'keyboard';
  if (ruleKey.includes('heading') || ruleKey.includes('landmark') || ruleKey.includes('nav')) return 'navigation';
  if (ruleKey.includes('color') || ruleKey.includes('contrast')) return 'navigation';
  
  // Accessibility patterns based on rule name or description
  const combinedText = (ruleName + ' ' + ruleDescription).toLowerCase();
  if (combinedText.includes('image') || combinedText.includes('alt text') || combinedText.includes('img')) return 'images';
  if (combinedText.includes('form') || combinedText.includes('input') || combinedText.includes('label') || combinedText.includes('button')) return 'forms';
  if (combinedText.includes('aria') || combinedText.includes('role') || combinedText.includes('screen reader')) return 'aria';
  if (combinedText.includes('keyboard') || combinedText.includes('focus') || combinedText.includes('tab')) return 'keyboard';
  if (combinedText.includes('heading') || combinedText.includes('navigation') || combinedText.includes('landmark') || combinedText.includes('structure')) return 'navigation';
  if (combinedText.includes('color') || combinedText.includes('contrast') || combinedText.includes('visual')) return 'navigation';
  
  // Check existing category field
  if (issue.category) {
    // Direct category mapping
    if (CATEGORY_CONFIG[issue.category]) {
      return issue.category;
    }
    
    // Category name variations
    const categoryLower = issue.category.toLowerCase();
    if (categoryLower.includes('form')) return 'forms';
    if (categoryLower.includes('nav')) return 'navigation';
    if (categoryLower.includes('image') || categoryLower.includes('img')) return 'images';
    if (categoryLower.includes('keyboard')) return 'keyboard';
    if (categoryLower.includes('aria')) return 'aria';
    if (categoryLower.includes('touch')) return 'touch';
    if (categoryLower.includes('mobile')) return 'mobile';
  }
  
  // Fallback to general
  return 'general';
};