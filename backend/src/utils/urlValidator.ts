import parse from 'url-parse';

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
}

export class UrlValidator {
  private static readonly ALLOWED_PROTOCOLS = ['http:', 'https:'];
  private static readonly BLOCKED_DOMAINS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '192.168.',
    '10.',
    '172.16.',
    '172.17.',
    '172.18.',
    '172.19.',
    '172.20.',
    '172.21.',
    '172.22.',
    '172.23.',
    '172.24.',
    '172.25.',
    '172.26.',
    '172.27.',
    '172.28.',
    '172.29.',
    '172.30.',
    '172.31.'
  ];

  static validate(url: string): UrlValidationResult {
    try {
      // Basic validation
      if (!url || typeof url !== 'string') {
        return {
          isValid: false,
          error: 'URL is required and must be a string'
        };
      }

      // Trim whitespace
      url = url.trim();

      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Parse URL
      const parsed = parse(url, true);

      // Check protocol
      if (!this.ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
        return {
          isValid: false,
          error: 'Only HTTP and HTTPS protocols are allowed'
        };
      }

      // Check hostname
      if (!parsed.hostname) {
        return {
          isValid: false,
          error: 'Invalid hostname'
        };
      }

      // Check for blocked domains (localhost, private IPs)
      const hostname = parsed.hostname.toLowerCase();
      for (const blocked of this.BLOCKED_DOMAINS) {
        if (hostname.includes(blocked)) {
          return {
            isValid: false,
            error: 'Private or local addresses are not allowed'
          };
        }
      }

      // Check for valid domain format
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!domainRegex.test(hostname)) {
        return {
          isValid: false,
          error: 'Invalid domain format'
        };
      }

      // Reconstruct normalized URL
      const normalizedUrl = `${parsed.protocol}//${parsed.hostname}${parsed.port ? ':' + parsed.port : ''}${parsed.pathname}${parsed.query ? '?' + parsed.query : ''}`;

      return {
        isValid: true,
        normalizedUrl
      };

    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid URL format'
      };
    }
  }

  static isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain.toLowerCase());
  }

  static normalizeUrl(url: string): string {
    const validation = this.validate(url);
    return validation.normalizedUrl || url;
  }
}