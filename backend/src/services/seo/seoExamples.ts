/**
 * SEO Examples Service
 * Provides context-aware examples and fix suggestions for SEO issues
 */

interface SeoExample {
  badExample: string;
  goodExample: string;
  explanation: string;
}

interface EnhancedFixSuggestion {
  fix_suggestion: string;
  example?: SeoExample;
}

interface ContentAnalysisData {
  keyword?: string;
  density?: number;
  readabilityScore?: number;
  suggestions?: string[];
  title?: string;
  contentSample?: string;
}

export class SeoExamplesService {
  
  static getContentReadabilityExamples(currentReadabilityScore?: number): EnhancedFixSuggestion {
    return {
      fix_suggestion: 'Improve content readability to make it more accessible to your audience and search engines.',
      example: {
        badExample: `❌ Poor Readability Example:
"Our comprehensive methodology utilizes sophisticated algorithms to facilitate optimization of your organization's digital infrastructure through implementation of cutting-edge technological solutions."

• 25+ word sentence
• Complex vocabulary
• Passive voice
• No paragraph breaks`,
        goodExample: `✅ Good Readability Example:
"We help businesses improve their websites using proven strategies.

Our simple process includes:
• Website analysis
• Clear recommendations 
• Easy implementation

Most clients see results within 30 days."

• Short sentences (under 20 words)
• Simple vocabulary
• Active voice
• Clear structure with bullets`,
        explanation: `Readable content keeps visitors engaged longer, reduces bounce rate, and helps search engines understand your content better. Aim for a Flesch Reading Score of 60+ (8th grade level or below).`
      }
    };
  }
  
  static getContentTitleMismatchExamples(title?: string, contentSample?: string): EnhancedFixSuggestion {
    return {
      fix_suggestion: 'Ensure your page content directly matches and supports your title tag and meta description.',
      example: {
        badExample: `❌ Content-Title Mismatch:
Title: "Best Pizza Delivery in NYC"
Content: "Welcome to our restaurant! We offer fine dining experiences with carefully crafted dishes..."

→ Title promises pizza delivery
→ Content talks about fine dining
→ User expectations not met`,
        goodExample: `✅ Well-Matched Content:
Title: "Best Pizza Delivery in NYC - Order Online"
Content: "Get NYC's best pizza delivered to your door in 30 minutes or less. 

Our menu includes:
• Classic New York style pizza
• Gourmet specialty pizzas  
• Fast delivery to all 5 boroughs
• Order online for pickup or delivery"

→ Content immediately supports title
→ Mentions key terms: pizza, delivery, NYC
→ Meets user expectations`,
        explanation: 'When content matches the title, users stay longer, bounce rate decreases, and search engines see your page as more relevant for the target keywords.'
      }
    };
  }
  
  static getKeywordOptimizationExamples(overusedKeyword?: string, density?: number): EnhancedFixSuggestion {
    return {
      fix_suggestion: 'Use keywords naturally throughout your content without overstuffing.',
      example: {
        badExample: `❌ Keyword Stuffing Example (${density?.toFixed(1)}% density):
"Our web design services offer the best web design solutions. As a web design company, we provide professional web design for all web design needs. Contact our web design team for web design quotes."

• "web design" used 8 times in 2 sentences
• Unnatural repetition
• Poor user experience
• Search engines may penalize this`,
        goodExample: `✅ Natural Keyword Usage (1.5% density):
"Our design services create professional websites that drive results. We specialize in responsive layouts, user-friendly interfaces, and conversion optimization.

Our process includes:
• Custom website development
• Mobile-responsive design
• SEO-friendly architecture
• Ongoing support and maintenance"

• Primary keyword used naturally
• Semantic variations included
• Focus on user value
• Better search engine ranking potential`,
        explanation: 'Natural keyword usage (1-2% density) ranks better than keyword stuffing. Use synonyms and related terms to create comprehensive, valuable content.'
      }
    };
  }
  
  static getSemanticKeywordExamples(suggestedKeywords: string[] = []): EnhancedFixSuggestion {
    const keywords = suggestedKeywords.length > 0 ? suggestedKeywords.join(', ') : 'related, relevant, quality, professional';
    
    return {
      fix_suggestion: 'Include related semantic keywords to improve content relevance and search visibility.',
      example: {
        badExample: `❌ Limited Keyword Scope:
"We provide web design. Our web design is good. Choose our web design services."

• Only uses exact keyword
• Missed opportunities for related terms
• Limited topical coverage`,
        goodExample: `✅ Rich Semantic Keyword Usage:
Primary: "web design"
Semantic keywords: ${keywords}

"We provide professional web design services that deliver quality results. Our team creates responsive websites with excellent user experience. Choose our recommended approach for top-performing sites."

• Natural integration of related terms
• Broader topical relevance
• Better search visibility for related queries`,
        explanation: `Semantic keywords help search engines understand your content context better. Include related terms like "${keywords}" to capture more search queries and improve rankings.`
      }
    };
  }
  
  static getContentImprovementExamples(suggestions: string[] = []): EnhancedFixSuggestion {
    const defaultSuggestions = suggestions.length > 0 ? suggestions : ['benefits', 'value propositions', 'customer testimonials', 'specific examples'];
    
    return {
      fix_suggestion: 'Enhance your content with valuable information that addresses user needs and search intent.',
      example: {
        badExample: `❌ Weak Content:
"We are a company. We do things. Contact us."

• Vague descriptions
• No clear value proposition
• Missing user benefits
• No call-to-action`,
        goodExample: `✅ Enhanced Content:
"We help small businesses increase online sales by 40% through proven digital marketing strategies.

✅ What you get:
• Detailed website analysis
• Custom marketing plan
• 24/7 support team
• 90-day money-back guarantee

🎯 Results: Over 500 businesses served
💬 "Increased our leads by 65% in 3 months" - Sarah, Local Retailer

📞 Get your free consultation today"

• Clear value proposition (40% increase)
• Specific benefits listed
• Social proof with testimonials
• Strong call-to-action`,
        explanation: `Adding ${defaultSuggestions.join(', ')} makes your content more compelling for users and more relevant for search engines. This increases engagement and conversion rates.`
      }
    };
  }
  
  static getArticleSchemaExamples(pageTitle?: string): EnhancedFixSuggestion {
    const title = pageTitle || 'Your Article Title Here';
    
    return {
      fix_suggestion: 'Add Article structured data to help search engines understand your content and enable rich snippets.',
      example: {
        badExample: '<!-- No Article schema markup -->',
        goodExample: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${title}",
  "author": {
    "@type": "Person",
    "name": "Author Name",
    "url": "https://yoursite.com/author"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Your Company",
    "logo": {
      "@type": "ImageObject",
      "url": "https://yoursite.com/logo.png",
      "width": 800,
      "height": 600
    }
  },
  "datePublished": "2024-01-15T08:00:00+00:00",
  "dateModified": "2024-01-20T10:30:00+00:00",
  "description": "Brief description of your article content",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://yoursite.com/this-article"
  },
  "image": {
    "@type": "ImageObject",
    "url": "https://yoursite.com/article-image.jpg",
    "width": 1200,
    "height": 630
  },
  "articleSection": "Category Name",
  "wordCount": 1500
}
</script>`,
        explanation: 'Article schema helps your content appear in Google News, enables rich snippets with author photos and publish dates, and can improve click-through rates from search results by up to 30%.'
      }
    };
  }
  
  static getTitleTagExamples(currentTitle: string | null, titleLength?: number): EnhancedFixSuggestion {
    if (!currentTitle) {
      return {
        fix_suggestion: 'Add a unique, descriptive title tag (50-60 characters) that accurately describes the page content and includes your target keyword.',
        example: {
          badExample: '<title></title>\n<!-- or no title tag at all -->',
          goodExample: '<title>Professional Web Design Services | YourCompany</title>',
          explanation: 'Title tags should be descriptive, include your primary keyword, and be 50-60 characters long to avoid truncation in search results.'
        }
      };
    }

    if (titleLength && titleLength < 30) {
      return {
        fix_suggestion: 'Expand your title tag to be more descriptive and include target keywords. Aim for 50-60 characters.',
        example: {
          badExample: `<title>${currentTitle}</title>`,
          goodExample: `<title>${currentTitle} - Complete Guide | Your Brand</title>`,
          explanation: 'Short titles miss opportunities to include keywords and don\'t fully utilize search result space.'
        }
      };
    }

    if (titleLength && titleLength > 60) {
      return {
        fix_suggestion: 'Shorten your title tag to prevent truncation in search results. Keep it under 60 characters.',
        example: {
          badExample: `<title>${currentTitle}</title>`,
          goodExample: `<title>${currentTitle.substring(0, 50)}...</title>`,
          explanation: 'Long titles get truncated in search results with "..." which reduces click-through rates.'
        }
      };
    }

    return {
      fix_suggestion: 'Consider optimizing your title tag for better search visibility and click-through rates.'
    };
  }

  static getMetaDescriptionExamples(currentDesc: string | null, descLength?: number): EnhancedFixSuggestion {
    if (!currentDesc) {
      return {
        fix_suggestion: 'Add a compelling meta description (150-160 characters) that summarizes the page content and encourages clicks.',
        example: {
          badExample: '<!-- No meta description -->',
          goodExample: '<meta name="description" content="Discover professional web design services that boost your business. Custom websites, SEO optimization, and 24/7 support. Get a free quote today!">',
          explanation: 'Meta descriptions act as advertising copy in search results. Without one, search engines create their own snippet which may not be compelling.'
        }
      };
    }

    if (descLength && descLength < 120) {
      return {
        fix_suggestion: 'Expand your meta description to better describe the page content. Aim for 150-160 characters.',
        example: {
          badExample: `<meta name="description" content="${currentDesc}">`,
          goodExample: `<meta name="description" content="${currentDesc} Learn more about our process, pricing, and how we can help your business grow online.">`,
          explanation: 'Short meta descriptions don\'t fully utilize the space available in search results and miss opportunities to include compelling calls-to-action.'
        }
      };
    }

    if (descLength && descLength > 160) {
      return {
        fix_suggestion: 'Shorten your meta description to prevent truncation. Keep it under 160 characters for best results.',
        example: {
          badExample: `<meta name="description" content="${currentDesc}">`,
          goodExample: `<meta name="description" content="${currentDesc.substring(0, 150)}...">`,
          explanation: 'Long meta descriptions get cut off in search results, potentially hiding important information or calls-to-action.'
        }
      };
    }

    return {
      fix_suggestion: 'Consider optimizing your meta description for better search visibility and click-through rates.'
    };
  }

  static getH1TagExamples(currentH1: string | null, hasMultipleH1s: boolean = false): EnhancedFixSuggestion {
    if (!currentH1) {
      return {
        fix_suggestion: 'Add a clear, descriptive H1 tag that represents the main topic of the page.',
        example: {
          badExample: '<!-- No H1 tag found -->',
          goodExample: '<h1>Professional Web Design Services for Small Businesses</h1>',
          explanation: 'H1 tags help search engines and users understand the main topic of your page. Each page should have exactly one H1 tag.'
        }
      };
    }

    if (hasMultipleH1s) {
      return {
        fix_suggestion: 'Use only one H1 tag per page. Convert additional H1 tags to H2, H3, etc. to maintain proper heading hierarchy.',
        example: {
          badExample: '<h1>Welcome</h1>\n<h1>Our Services</h1>\n<h1>Contact Us</h1>',
          goodExample: '<h1>Professional Web Design Services</h1>\n<h2>Our Services</h2>\n<h2>Contact Us</h2>',
          explanation: 'Multiple H1 tags confuse search engines about the main topic. Use H1 for the page title, then H2-H6 for subsections.'
        }
      };
    }

    return {
      fix_suggestion: 'Consider optimizing your H1 tag to better represent the page\'s main topic and include relevant keywords.'
    };
  }

  static getCanonicalTagExamples(currentUrl: string, hasCanonical: boolean = false, canonicalUrl?: string): EnhancedFixSuggestion {
    if (!hasCanonical) {
      return {
        fix_suggestion: 'Add a canonical tag to prevent duplicate content issues and specify the preferred version of this page.',
        example: {
          badExample: '<!-- No canonical tag -->',
          goodExample: `<link rel="canonical" href="${currentUrl}">`,
          explanation: 'Canonical tags tell search engines which version of a page is the "main" one, preventing duplicate content penalties.'
        }
      };
    }

    if (canonicalUrl && canonicalUrl !== currentUrl) {
      return {
        fix_suggestion: 'The canonical URL should typically point to the current page unless you intentionally want to consolidate multiple pages.',
        example: {
          badExample: `<link rel="canonical" href="${canonicalUrl}">`,
          goodExample: `<link rel="canonical" href="${currentUrl}">`,
          explanation: 'Self-referencing canonical tags confirm this page is the preferred version. Only use different URLs if consolidating duplicate content.'
        }
      };
    }

    return {
      fix_suggestion: 'Your canonical tag looks good. Make sure it points to the preferred version of this page.'
    };
  }

  static getStructuredDataExamples(pageType: 'organization' | 'article' | 'breadcrumb' = 'organization'): EnhancedFixSuggestion {
    const examples = {
      organization: {
        fix_suggestion: 'Add Organization structured data to help search engines understand your business information.',
        example: {
          badExample: '<!-- No structured data -->',
          goodExample: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company Name",
  "url": "https://yourwebsite.com",
  "logo": "https://yourwebsite.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-123-4567",
    "contactType": "customer service"
  }
}
</script>`,
          explanation: 'Organization schema helps search engines display rich snippets with your business information, potentially improving click-through rates.'
        }
      },
      article: {
        fix_suggestion: 'Add Article structured data to help search engines understand your content and potentially show rich snippets.',
        example: {
          badExample: '<!-- No article structured data -->',
          goodExample: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your Article Title",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "datePublished": "2024-01-01",
  "dateModified": "2024-01-15",
  "description": "Brief description of the article"
}
</script>`,
          explanation: 'Article schema can help your content appear in rich search results and news carousels, increasing visibility.'
        }
      },
      breadcrumb: {
        fix_suggestion: 'Add Breadcrumb structured data to help search engines understand your site structure.',
        example: {
          badExample: '<!-- No breadcrumb structured data -->',
          goodExample: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://yoursite.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Category",
      "item": "https://yoursite.com/category"
    }
  ]
}
</script>`,
          explanation: 'Breadcrumb schema can make your search results show the page hierarchy, helping users understand your site structure.'
        }
      }
    };

    return examples[pageType];
  }

  static getRobosTxtExamples(hasRobots: boolean = false, isBlocking: boolean = false): EnhancedFixSuggestion {
    if (!hasRobots) {
      return {
        fix_suggestion: 'Create a robots.txt file to guide search engine crawling and specify your sitemap location.',
        example: {
          badExample: '<!-- No robots.txt file found -->',
          goodExample: `# robots.txt
User-agent: *
Allow: /

# Sitemap location
Sitemap: https://yourwebsite.com/sitemap.xml

# Block sensitive areas (if needed)
Disallow: /admin/
Disallow: /private/`,
          explanation: 'A robots.txt file helps search engines understand which parts of your site to crawl and where to find your sitemap.'
        }
      };
    }

    if (isBlocking) {
      return {
        fix_suggestion: 'Your robots.txt is blocking search engines from crawling your site. This will prevent it from appearing in search results.',
        example: {
          badExample: `User-agent: *
Disallow: /`,
          goodExample: `User-agent: *
Allow: /

Sitemap: https://yourwebsite.com/sitemap.xml`,
          explanation: 'Blocking all crawlers prevents your site from being indexed. Only use "Disallow: /" for development or private sites.'
        }
      };
    }

    return {
      fix_suggestion: 'Your robots.txt looks good. Make sure it\'s not blocking important pages accidentally.'
    };
  }

  static getViewportExamples(hasViewport: boolean = false): EnhancedFixSuggestion {
    if (!hasViewport) {
      return {
        fix_suggestion: 'Add a viewport meta tag to ensure your site displays properly on mobile devices.',
        example: {
          badExample: '<!-- No viewport meta tag -->',
          goodExample: '<meta name="viewport" content="width=device-width, initial-scale=1">',
          explanation: 'The viewport meta tag controls how your page is displayed on mobile devices. Without it, mobile browsers show a desktop-sized page that users must zoom and pan.'
        }
      };
    }

    return {
      fix_suggestion: 'Your viewport meta tag looks good. Make sure your site is responsive and mobile-friendly.'
    };
  }
  
  static getBlogPostSchemaExamples(): EnhancedFixSuggestion {
    return {
      fix_suggestion: 'Add BlogPosting structured data for blog content to enhance search appearance.',
      example: {
        badExample: '<!-- No BlogPosting schema -->',
        goodExample: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "10 Tips for Better SEO",
  "author": {
    "@type": "Person",
    "name": "Marketing Expert"
  },
  "datePublished": "2024-01-15",
  "dateModified": "2024-01-20",
  "description": "Learn proven SEO strategies to improve your website rankings",
  "keywords": ["SEO", "search optimization", "website ranking"],
  "wordCount": 2500,
  "timeRequired": "PT8M",
  "articleBody": "Full article content here..."
}
</script>`,
        explanation: 'BlogPosting schema can make your articles eligible for special search features like estimated reading time, author information, and enhanced article previews.'
      }
    };
  }
}