/**
 * Performance Examples Service
 * Provides detailed, actionable examples for performance optimization issues
 */

interface PerformanceExample {
  badExample: string;
  goodExample: string;
  explanation: string;
}

interface EnhancedPerformanceFixSuggestion {
  fix_suggestion: string;
  example?: PerformanceExample;
}

export class PerformanceExamplesService {
  
  static getLCPExamples(lcpValue: number): EnhancedPerformanceFixSuggestion {
    if (lcpValue > 4) {
      return {
        fix_suggestion: 'LCP is critically slow and needs immediate optimization. Focus on reducing server response times and optimizing your largest content element.',
        example: {
          badExample: `❌ Poor LCP (${lcpValue.toFixed(1)}s):
• Large unoptimized hero image (2MB)
• Blocking JavaScript prevents rendering
• Slow server response time (2s+)
• No image preloading
• Heavy CSS blocking render`,
          goodExample: `✅ Optimized LCP (under 2.5s):
• Hero image: WebP format, 200KB max
• Preload critical resources:
  <link rel="preload" as="image" href="hero.webp">
• Optimize Critical Rendering Path:
  - Inline critical CSS
  - Defer non-critical JavaScript
• Use CDN for fast delivery
• Optimize server response time (< 200ms)`,
          explanation: 'LCP measures how quickly the main content loads. Poor LCP (over 4s) severely impacts user experience and SEO rankings. Users typically abandon sites that take longer than 3 seconds to load.'
        }
      };
    } else if (lcpValue > 2.5) {
      return {
        fix_suggestion: 'LCP needs improvement. Focus on optimizing your largest content element and critical resource loading.',
        example: {
          badExample: `❌ Slow LCP (${lcpValue.toFixed(1)}s):
• Large images without optimization
• No resource preloading
• Render-blocking resources`,
          goodExample: `✅ Improved LCP strategies:
• Compress images (WebP/AVIF)
• Preload largest contentful paint element
• Remove render-blocking resources
• Use aspect-ratio CSS to prevent layout shifts
• Implement lazy loading for below-fold images`,
          explanation: 'LCP between 2.5-4s needs improvement for optimal user experience. Focus on optimizing the largest visible element.'
        }
      };
    }
    
    return {
      fix_suggestion: 'Great LCP performance! Maintain optimization by monitoring for regressions.'
    };
  }

  static getCLSExamples(clsValue: number): EnhancedPerformanceFixSuggestion {
    if (clsValue > 0.25) {
      return {
        fix_suggestion: 'CLS is poor and causing significant layout instability. Users experience jarring content shifts that hurt usability.',
        example: {
          badExample: `❌ Poor CLS (${clsValue.toFixed(2)}):
• Images without dimensions cause layout shifts
• Ads inserted without reserved space
• Fonts loading cause text reflow
• Dynamic content injection
• Missing aspect ratios`,
          goodExample: `✅ Stable Layout (CLS < 0.1):
<!-- Reserve space for images -->
<img src="hero.jpg" width="800" height="600" alt="Hero">

<!-- Use aspect-ratio for responsive images -->
.hero-img {
  aspect-ratio: 16/9;
  width: 100%;
}

<!-- Reserve space for ads -->
.ad-container {
  min-height: 250px;
  background: #f5f5f5;
}

<!-- Optimize font loading -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>
.text { font-display: swap; }`,
          explanation: 'CLS over 0.25 creates a poor user experience. Users may click wrong elements due to unexpected layout shifts. This impacts conversions and SEO rankings.'
        }
      };
    } else if (clsValue > 0.1) {
      return {
        fix_suggestion: 'CLS needs improvement. Reduce layout instability by reserving space for dynamic content.',
        example: {
          badExample: `❌ Layout Shifts (${clsValue.toFixed(2)}):
• Some images lack dimensions
• Late-loading fonts cause reflow
• Dynamic content without space reservation`,
          goodExample: `✅ Stability Improvements:
• Add width/height to all images
• Use font-display: swap
• Reserve space for dynamic content
• Use CSS aspect-ratio property
• Preload critical fonts`,
          explanation: 'CLS between 0.1-0.25 needs improvement. Small layout shifts still impact user experience and should be minimized.'
        }
      };
    }
    
    return {
      fix_suggestion: 'Excellent CLS performance! Your layout is stable and provides great user experience.'
    };
  }

  static getTBTExamples(tbtValue: number): EnhancedPerformanceFixSuggestion {
    if (tbtValue > 600) {
      return {
        fix_suggestion: 'TBT is critically high, severely impacting page interactivity. Users will experience long delays when clicking buttons or interacting with the page.',
        example: {
          badExample: `❌ Poor TBT (${Math.round(tbtValue)}ms):
• Heavy JavaScript execution blocks main thread
• Large third-party scripts (analytics, ads)
• Unoptimized React/Vue.js bundles
• Synchronous operations
• No code splitting`,
          goodExample: `✅ Optimized Interactivity (TBT < 200ms):
// Code splitting for better performance
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// Break up long tasks
function processLargeArray(items) {
  return new Promise(resolve => {
    function processChunk(startIndex) {
      const endIndex = Math.min(startIndex + 100, items.length);
      
      // Process chunk
      for (let i = startIndex; i < endIndex; i++) {
        processItem(items[i]);
      }
      
      if (endIndex < items.length) {
        // Continue processing after yielding to browser
        setTimeout(() => processChunk(endIndex), 0);
      } else {
        resolve();
      }
    }
    processChunk(0);
  });
}

// Optimize third-party scripts
<script async src="analytics.js"></script>
<script defer src="non-critical.js"></script>`,
          explanation: 'TBT over 600ms creates an unresponsive page. Users experience delays when clicking buttons, forms become sluggish, and overall interactivity suffers significantly.'
        }
      };
    } else if (tbtValue > 200) {
      return {
        fix_suggestion: 'TBT needs improvement. Optimize JavaScript execution to improve page responsiveness.',
        example: {
          badExample: `❌ Slow Interactivity (${Math.round(tbtValue)}ms):
• Some long-running JavaScript tasks
• Third-party scripts impacting performance
• Unoptimized code execution`,
          goodExample: `✅ Better Interactivity:
• Implement code splitting
• Use web workers for heavy computations
• Optimize third-party script loading
• Break up long tasks with setTimeout
• Use React.memo() or Vue.js optimizations
• Defer non-critical JavaScript`,
          explanation: 'TBT between 200-600ms impacts user experience. While not critical, users may notice slight delays in interactions.'
        }
      };
    }
    
    return {
      fix_suggestion: 'Excellent TBT performance! Your page is highly interactive and responsive.'
    };
  }

  static getImageFormatExamples(images: string[]): EnhancedPerformanceFixSuggestion {
    const imageList = images.slice(0, 3).join(', ');
    
    return {
      fix_suggestion: 'Convert images to modern formats (WebP/AVIF) for significant file size reductions and faster loading.',
      example: {
        badExample: `❌ Unoptimized Image Formats:
${images.map(img => `• ${img} (JPEG/PNG format)`).slice(0, 3).join('\n')}

<img src="hero-image.jpg" alt="Hero"> <!-- 800KB -->
<img src="product.png" alt="Product"> <!-- 1.2MB -->`,
        goodExample: `✅ Optimized Modern Formats:
<!-- Use picture element for format fallbacks -->
<picture>
  <source srcset="hero-image.avif" type="image/avif">
  <source srcset="hero-image.webp" type="image/webp">
  <img src="hero-image.jpg" alt="Hero" loading="lazy">
</picture>

<!-- Or use WebP directly with fallback -->
<img src="hero-image.webp" alt="Hero" loading="lazy">

File size comparison:
• hero-image.jpg: 800KB → hero-image.webp: 240KB (70% smaller)
• product.png: 1.2MB → product.avif: 180KB (85% smaller)`,
        explanation: 'Modern image formats (WebP/AVIF) provide 25-85% better compression than JPEG/PNG while maintaining quality. This significantly reduces load times and bandwidth usage.'
      }
    };
  }

  static getImageSizeExamples(oversizedImages: Array<{url: string, actualSize: string, renderedSize: string, wastedBytes: number}>): EnhancedPerformanceFixSuggestion {
    const firstImage = oversizedImages[0];
    const totalWasted = oversizedImages.reduce((sum, img) => sum + img.wastedBytes, 0);
    const wastedMB = (totalWasted / 1024 / 1024).toFixed(1);
    
    return {
      fix_suggestion: `Images are oversized, wasting ${wastedMB}MB of bandwidth. Serve appropriately sized images for better performance.`,
      example: {
        badExample: `❌ Oversized Images (wasting ${wastedMB}MB):
• ${firstImage?.url}
  Actual: ${firstImage?.actualSize} → Rendered: ${firstImage?.renderedSize}
• Images served at full resolution regardless of display size
• No responsive image strategy`,
        goodExample: `✅ Appropriately Sized Images:
<!-- Responsive images with srcset -->
<img 
  srcset="image-320w.webp 320w,
          image-640w.webp 640w,
          image-1200w.webp 1200w"
  sizes="(max-width: 320px) 280px,
         (max-width: 640px) 600px,
         1200px"
  src="image-640w.webp"
  alt="Description"
  loading="lazy"
>

<!-- CSS for responsive containers -->
.image-container {
  width: 100%;
  max-width: 600px;
}

.image-container img {
  width: 100%;
  height: auto;
}`,
        explanation: 'Serving oversized images wastes bandwidth and slows loading. Users on mobile devices download unnecessarily large files, increasing load times and data usage.'
      }
    };
  }

  static getRenderBlockingExamples(resources: string[]): EnhancedPerformanceFixSuggestion {
    const resourceList = resources.slice(0, 3).join(', ');
    
    return {
      fix_suggestion: 'Eliminate render-blocking resources to improve loading performance and Core Web Vitals.',
      example: {
        badExample: `❌ Render-Blocking Resources:
${resources.slice(0, 3).map(resource => `• ${resource}`).join('\n')}

<head>
  <link rel="stylesheet" href="styles.css">
  <script src="analytics.js"></script>
  <script src="heavy-library.js"></script>
</head>`,
        goodExample: `✅ Optimized Resource Loading:
<head>
  <!-- Inline critical CSS -->
  <style>
    /* Critical above-the-fold styles */
    body { font-family: Arial, sans-serif; }
    .header { background: #333; color: white; }
  </style>
  
  <!-- Preload important resources -->
  <link rel="preload" href="main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="main.css"></noscript>
  
  <!-- Async/defer JavaScript -->
  <script async src="analytics.js"></script>
  <script defer src="heavy-library.js"></script>
</head>

<!-- Load non-critical CSS asynchronously -->
<script>
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'non-critical.css';
  document.head.appendChild(link);
</script>`,
        explanation: 'Render-blocking resources prevent the browser from painting content, significantly increasing perceived load time. Optimizing these resources improves Core Web Vitals scores.'
      }
    };
  }

  static getUnusedCodeExamples(unusedPercent: number, unusedBytes: number): EnhancedPerformanceFixSuggestion {
    const unusedMB = (unusedBytes / 1024 / 1024).toFixed(1);
    
    return {
      fix_suggestion: `Remove unused code to reduce bundle size. ${unusedPercent}% of your code is unused, wasting ${unusedMB}MB.`,
      example: {
        badExample: `❌ Unused Code (${unusedPercent}% unused, ${unusedMB}MB):
• Large JavaScript libraries loaded but not used
• CSS frameworks with unused styles
• Multiple jQuery versions
• Unused React components in bundle`,
        goodExample: `✅ Optimized Code Loading:
// Tree shaking with ES6 modules
import { debounce } from 'lodash-es'; // Only import what you need
// instead of: import _ from 'lodash';

// Code splitting for routes
const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

// Remove unused CSS with tools like PurgeCSS
// webpack.config.js
module.exports = {
  plugins: [
    new PurgeCSSPlugin({
      paths: glob.sync('./src/**/*', { nodir: true }),
    })
  ]
};

// Dynamic imports for conditional features
async function loadChartLibrary() {
  if (needsCharts) {
    const { Chart } = await import('./ChartLibrary');
    return Chart;
  }
}`,
        explanation: 'Unused code increases bundle size, slowing downloads and JavaScript parsing. Removing unused code improves loading performance and reduces bandwidth costs.'
      }
    };
  }

  static getCacheExamples(resources: string[]): EnhancedPerformanceFixSuggestion {
    return {
      fix_suggestion: 'Implement proper caching strategies to improve repeat visit performance and reduce server load.',
      example: {
        badExample: `❌ Poor Caching Strategy:
• No cache headers on static assets
• Short cache times for unchanging content
• No cache busting for updated files
• Missing CDN implementation`,
        goodExample: `✅ Optimized Caching Strategy:
<!-- Server configuration (Express.js example) -->
app.use('/static', express.static('public', {
  maxAge: '1y', // Cache static assets for 1 year
  etag: true,
  lastModified: true
}));

<!-- HTML meta tags -->
<meta http-equiv="Cache-Control" content="public, max-age=86400">

<!-- Nginx configuration -->
location ~* \\.(jpg|jpeg|png|gif|ico|css|js|webp|avif)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location ~* \\.(html|htm)$ {
  expires 1d;
  add_header Cache-Control "public, must-revalidate";
}

<!-- Versioned assets for cache busting -->
<link rel="stylesheet" href="styles.css?v=2024.1.1">
<script src="app.js?v=2024.1.1"></script>`,
        explanation: 'Proper caching reduces server load, improves repeat visit performance, and enhances user experience. Users load pages faster on subsequent visits.'
      }
    };
  }
}