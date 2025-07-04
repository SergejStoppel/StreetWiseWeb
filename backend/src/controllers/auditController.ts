import { Request, Response } from 'express';
import websiteScanner from '../services/websiteScanner';
import accessibilityAnalyzer from '../services/accessibilityAnalyzer';
import { UrlValidator } from '../utils/urlValidator';
import prisma from '../utils/database';

export interface AuditRequest {
  url: string;
  auditType?: 'QUICK_SCAN' | 'FULL_AUDIT' | 'ACCESSIBILITY_FOCUS';
}

export interface AuditResponse {
  success: boolean;
  auditId: string;
  url: string;
  scanResult?: any;
  accessibilityAnalysis?: any;
  overallScore?: number;
  error?: string;
  message?: string;
}

export class AuditController {
  async scanWebsite(req: Request, res: Response): Promise<void> {
    try {
      const { url, auditType = 'ACCESSIBILITY_FOCUS' }: AuditRequest = req.body;

      // Validate input
      if (!url) {
        res.status(400).json({
          success: false,
          error: 'URL is required',
          message: 'Please provide a valid URL to scan'
        });
        return;
      }

      // Validate URL format
      const urlValidation = UrlValidator.validate(url);
      if (!urlValidation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Invalid URL',
          message: urlValidation.error
        });
        return;
      }

      const normalizedUrl = urlValidation.normalizedUrl!;

      // Check if we have a recent scan of this URL (cache for 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const existingAudit = await prisma.audit.findFirst({
        where: {
          website: {
            url: normalizedUrl
          },
          auditType: auditType,
          createdAt: {
            gte: oneHourAgo
          }
        },
        include: {
          website: true
        }
      });

      if (existingAudit) {
        res.status(200).json({
          success: true,
          auditId: existingAudit.id,
          url: normalizedUrl,
          scanResult: existingAudit.auditData,
          accessibilityAnalysis: existingAudit.issues,
          overallScore: existingAudit.overallScore,
          message: 'Returning cached audit results (scanned within the last hour)'
        });
        return;
      }

      // Create website record if it doesn't exist
      let website = await prisma.website.findFirst({
        where: { url: normalizedUrl }
      });

      if (!website) {
        website = await prisma.website.create({
          data: {
            url: normalizedUrl,
            userId: null // Anonymous for now
          }
        });
      }

      // Create initial audit record
      const audit = await prisma.audit.create({
        data: {
          websiteId: website.id,
          auditType: auditType,
          status: 'RUNNING'
        }
      });

      // Start the audit process (don't await - run in background)
      this.performAudit(audit.id, normalizedUrl, auditType)
        .catch(error => {
          console.error('Audit failed:', error);
          // Update audit with error
          prisma.audit.update({
            where: { id: audit.id },
            data: {
              status: 'FAILED',
              errorMessage: error.message
            }
          }).catch(console.error);
        });

      // Return immediately with audit ID
      res.status(202).json({
        success: true,
        auditId: audit.id,
        url: normalizedUrl,
        message: 'Audit started. Use the audit ID to check progress and results.',
        statusUrl: `/api/audit/results/${audit.id}`
      });

    } catch (error) {
      console.error('Scan website error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while starting the audit'
      });
    }
  }

  async getAuditResults(req: Request, res: Response): Promise<void> {
    try {
      const { auditId } = req.params;

      if (!auditId) {
        res.status(400).json({
          success: false,
          error: 'Audit ID is required',
          message: 'Please provide a valid audit ID'
        });
        return;
      }

      const audit = await prisma.audit.findUnique({
        where: { id: auditId },
        include: {
          website: true
        }
      });

      if (!audit) {
        res.status(404).json({
          success: false,
          error: 'Audit not found',
          message: 'No audit found with the provided ID'
        });
        return;
      }

      // Check audit status
      if (audit.status === 'RUNNING' || audit.status === 'PENDING') {
        res.status(202).json({
          success: false,
          auditId: audit.id,
          status: audit.status,
          message: 'Audit is still in progress. Please check again in a few moments.'
        });
        return;
      }

      if (audit.status === 'FAILED') {
        res.status(422).json({
          success: false,
          auditId: audit.id,
          status: audit.status,
          error: 'Audit failed',
          message: audit.errorMessage || 'The audit failed to complete'
        });
        return;
      }

      // Return completed audit results
      res.status(200).json({
        success: true,
        auditId: audit.id,
        url: audit.website.url,
        status: audit.status,
        scanResult: audit.auditData,
        accessibilityAnalysis: audit.issues,
        suggestions: audit.suggestions,
        overallScore: audit.overallScore,
        accessibilityScore: audit.accessibilityScore,
        createdAt: audit.createdAt,
        message: 'Audit completed successfully'
      });

    } catch (error) {
      console.error('Get audit results error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving audit results'
      });
    }
  }

  async listRecentAudits(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const audits = await prisma.audit.findMany({
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          website: true
        },
        where: {
          status: 'COMPLETED'
        }
      });

      const total = await prisma.audit.count({
        where: {
          status: 'COMPLETED'
        }
      });

      res.status(200).json({
        success: true,
        audits: audits.map(audit => ({
          auditId: audit.id,
          url: audit.website.url,
          auditType: audit.auditType,
          overallScore: audit.overallScore,
          accessibilityScore: audit.accessibilityScore,
          createdAt: audit.createdAt
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });

    } catch (error) {
      console.error('List recent audits error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred while retrieving recent audits'
      });
    }
  }

  private async performAudit(auditId: string, url: string, auditType: string): Promise<void> {
    try {
      console.log(`🔍 Starting audit ${auditId} for ${url}`);

      // Scan the website
      const scanResult = await websiteScanner.scanWebsite(url);

      if (!scanResult.success) {
        throw new Error(scanResult.error || 'Website scan failed');
      }

      console.log(`✅ Scan completed for ${url}`);

      // Perform accessibility analysis
      const accessibilityAnalysis = await accessibilityAnalyzer.analyze(scanResult);

      console.log(`✅ Accessibility analysis completed for ${url}`);

      // Calculate overall score (for now, just use accessibility score)
      const overallScore = accessibilityAnalysis.score;

      // Update website with scan information
      await prisma.website.update({
        where: { 
          url: url 
        },
        data: {
          title: scanResult.title,
          description: scanResult.description
        }
      });

      // Update audit with results
      await prisma.audit.update({
        where: { id: auditId },
        data: {
          status: 'COMPLETED',
          overallScore: overallScore,
          accessibilityScore: accessibilityAnalysis.score,
          auditData: scanResult as any,
          issues: accessibilityAnalysis as any,
          suggestions: {
            accessibility: accessibilityAnalysis.recommendations
          } as any
        }
      });

      console.log(`✅ Audit ${auditId} completed successfully`);

    } catch (error) {
      console.error(`❌ Audit ${auditId} failed:`, error);
      
      await prisma.audit.update({
        where: { id: auditId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      throw error;
    }
  }

  // Health check method for the audit service
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;

      res.status(200).json({
        success: true,
        service: 'audit',
        status: 'healthy',
        message: 'Audit service is operational'
      });

    } catch (error) {
      res.status(503).json({
        success: false,
        service: 'audit',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new AuditController();