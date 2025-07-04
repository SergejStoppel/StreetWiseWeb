import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { UrlValidator } from '../utils/urlValidator';

export interface ScanResult {
  success: boolean;
  url: string;
  title?: string;
  description?: string;
  headings?: {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
  };
  images?: {
    total: number;
    withAlt: number;
    withoutAlt: number;
    details: Array<{
      src: string;
      alt: string | null;
      hasAlt: boolean;
    }>;
  };
  links?: {
    internal: number;
    external: number;
    total: number;
  };
  forms?: {
    total: number;
    withLabels: number;
    withoutLabels: number;
    details: Array<{
      inputs: number;
      labelsPresent: boolean;
      hasFieldset: boolean;
    }>;
  };
  performance?: {
    loadTime: number;
    htmlSize: number;
  };
  error?: string;
  scannedAt: string;
}

export class WebsiteScanner {
  private browser: Browser | null = null;
  private readonly timeout = 30000; // 30 seconds

  async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scanWebsite(url: string): Promise<ScanResult> {
    const startTime = Date.now();

    try {
      // Validate URL
      const validation = UrlValidator.validate(url);
      if (!validation.isValid) {
        return {
          success: false,
          url,
          error: validation.error,
          scannedAt: new Date().toISOString()
        };
      }

      const normalizedUrl = validation.normalizedUrl!;

      // Initialize browser
      await this.initializeBrowser();
      const page = await this.browser!.newPage();

      // Set user agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to page with timeout
      const response = await page.goto(normalizedUrl, {
        waitUntil: 'networkidle0',
        timeout: this.timeout
      });

      if (!response || !response.ok()) {
        throw new Error(`HTTP ${response?.status()}: Failed to load page`);
      }

      // Get page content
      const content = await page.content();
      const loadTime = Date.now() - startTime;

      // Close page
      await page.close();

      // Parse with Cheerio
      const $ = cheerio.load(content);

      // Extract page information
      const result: ScanResult = {
        success: true,
        url: normalizedUrl,
        title: this.extractTitle($),
        description: this.extractDescription($),
        headings: this.extractHeadings($),
        images: this.extractImages($, normalizedUrl),
        links: this.extractLinks($, normalizedUrl),
        forms: this.extractForms($),
        performance: {
          loadTime,
          htmlSize: content.length
        },
        scannedAt: new Date().toISOString()
      };

      return result;

    } catch (error) {
      return {
        success: false,
        url,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        performance: {
          loadTime: Date.now() - startTime,
          htmlSize: 0
        },
        scannedAt: new Date().toISOString()
      };
    }
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    return $('title').first().text().trim() || '';
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    const metaDesc = $('meta[name="description"]').attr('content');
    const ogDesc = $('meta[property="og:description"]').attr('content');
    return (metaDesc || ogDesc || '').trim();
  }

  private extractHeadings($: cheerio.CheerioAPI) {
    return {
      h1: $('h1').map((_, el) => $(el).text().trim()).get(),
      h2: $('h2').map((_, el) => $(el).text().trim()).get(),
      h3: $('h3').map((_, el) => $(el).text().trim()).get(),
      h4: $('h4').map((_, el) => $(el).text().trim()).get(),
      h5: $('h5').map((_, el) => $(el).text().trim()).get(),
      h6: $('h6').map((_, el) => $(el).text().trim()).get()
    };
  }

  private extractImages($: cheerio.CheerioAPI, baseUrl: string) {
    const images: Array<{ src: string; alt: string | null; hasAlt: boolean }> = [];
    
    $('img').each((_, el) => {
      const $img = $(el);
      const src = $img.attr('src') || '';
      const alt = $img.attr('alt') || null;
      
      if (src) {
        images.push({
          src: this.resolveUrl(src, baseUrl),
          alt,
          hasAlt: alt !== null && alt.trim() !== ''
        });
      }
    });

    const withAlt = images.filter(img => img.hasAlt).length;

    return {
      total: images.length,
      withAlt,
      withoutAlt: images.length - withAlt,
      details: images
    };
  }

  private extractLinks($: cheerio.CheerioAPI, baseUrl: string) {
    const links: string[] = [];
    const baseDomain = new URL(baseUrl).hostname;

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        links.push(this.resolveUrl(href, baseUrl));
      }
    });

    const internal = links.filter(link => {
      try {
        const linkDomain = new URL(link).hostname;
        return linkDomain === baseDomain;
      } catch {
        return false;
      }
    }).length;

    return {
      internal,
      external: links.length - internal,
      total: links.length
    };
  }

  private extractForms($: cheerio.CheerioAPI) {
    const forms: Array<{
      inputs: number;
      labelsPresent: boolean;
      hasFieldset: boolean;
    }> = [];

    $('form').each((_, form) => {
      const $form = $(form);
      const inputs = $form.find('input, textarea, select').length;
      const labels = $form.find('label').length;
      const fieldsets = $form.find('fieldset').length > 0;

      forms.push({
        inputs,
        labelsPresent: labels > 0,
        hasFieldset: fieldsets
      });
    });

    const withLabels = forms.filter(form => form.labelsPresent).length;

    return {
      total: forms.length,
      withLabels,
      withoutLabels: forms.length - withLabels,
      details: forms
    };
  }

  private resolveUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    await this.closeBrowser();
  }
}

export default new WebsiteScanner();