import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Job } from 'bullmq';
import { processAriaAnalysis } from '../aria.worker';
import { supabase } from '@/config/supabase';

// Mock dependencies
jest.mock('@/config/supabase');
jest.mock('@/config/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn(),
      addScriptTag: jest.fn(),
      waitForFunction: jest.fn(),
      evaluate: jest.fn().mockResolvedValue({
        violations: [
          {
            id: 'aria-roles',
            impact: 'serious',
            description: 'ARIA roles must be valid',
            help: 'Elements with ARIA roles must use valid values',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/aria-roles',
            nodes: [
              {
                html: '<div role="invalid-role">Content</div>',
                target: ['div[role="invalid-role"]'],
                failureSummary: 'Fix the following: Role must be one of the valid ARIA roles',
                any: [],
              },
            ],
          },
          {
            id: 'aria-required-attr',
            impact: 'critical',
            description: 'Required ARIA attributes must be provided',
            help: 'Elements with ARIA roles must have all required attributes',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/aria-required-attr',
            nodes: [
              {
                html: '<button role="checkbox">Checkbox</button>',
                target: ['button[role="checkbox"]'],
                failureSummary: 'Fix the following: Required ARIA attribute not present: aria-checked',
                any: [],
              },
            ],
          },
        ],
        passes: [],
      }),
    }),
    close: jest.fn(),
  }),
}));

jest.mock('@/core/workers/master.worker', () => ({
  checkAndUpdateAnalysisCompletion: jest.fn(),
}));

describe('ARIA Worker', () => {
  let mockJob;
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJob = {
      data: {
        analysisId: 'test-analysis-id',
        workspaceId: 'test-workspace-id',
        websiteId: 'test-website-id',
        userId: 'test-user-id',
        assetPath: 'test/path',
        metadata: {
          url: 'https://example.com',
        },
      },
      id: 'test-job-id',
    } as Job<any>;

    // Mock Supabase responses
    mockSupabase.from = jest.fn().mockImplementation((table) => {
      if (table === 'analysis_jobs') {
        return {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'test-job-id' },
            error: null,
          }),
        };
      }
      if (table === 'rules') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'test-rule-id' },
            error: null,
          }),
        };
      }
      if (table === 'accessibility_issues') {
        return {
          insert: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };
      }
      return {};
    });

    mockSupabase.storage = {
      from: jest.fn().mockReturnValue({
        download: jest.fn().mockResolvedValue({
          data: new Blob(['<html><body><div role="invalid-role">Test</div></body></html>']),
          error: null,
        }),
      }),
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should process ARIA analysis successfully', async () => {
    await processAriaAnalysis(mockJob);

    // Verify job status was updated
    const analysisJobsTable = mockSupabase.from('analysis_jobs');
    expect(analysisJobsTable.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'running',
      })
    );
    expect(analysisJobsTable.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
      })
    );

    // Verify issues were inserted
    const issuesTable = mockSupabase.from('accessibility_issues');
    expect(issuesTable.insert).toHaveBeenCalledTimes(2); // Two violations
  });

  it('should handle storage errors gracefully', async () => {
    mockSupabase.storage.from = jest.fn().mockReturnValue({
      download: jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Storage error'),
      }),
    });

    await expect(processAriaAnalysis(mockJob)).rejects.toThrow('Failed to retrieve HTML from storage');

    // Verify job status was updated to failed
    const analysisJobsTable = mockSupabase.from('analysis_jobs');
    expect(analysisJobsTable.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
      })
    );
  });

  it('should map axe violations to database rules correctly', async () => {
    await processAriaAnalysis(mockJob);

    const rulesTable = mockSupabase.from('rules');
    expect(rulesTable.select).toHaveBeenCalled();
    expect(rulesTable.eq).toHaveBeenCalledWith('rule_key', 'ACC_ARIA_01_ROLE_INVALID');
    expect(rulesTable.eq).toHaveBeenCalledWith('rule_key', 'ACC_ARIA_02_REQUIRED_ATTR_MISSING');
  });

  it('should filter out non-ARIA violations', async () => {
    const puppeteer = require('puppeteer');
    puppeteer.launch.mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        setContent: jest.fn(),
        addScriptTag: jest.fn(),
        waitForFunction: jest.fn(),
        evaluate: jest.fn().mockResolvedValue({
          violations: [
            {
              id: 'color-contrast',
              impact: 'serious',
              description: 'Color contrast issue',
              help: 'Elements must have sufficient color contrast',
              helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
              nodes: [],
            },
            {
              id: 'aria-roles',
              impact: 'serious',
              description: 'ARIA roles must be valid',
              help: 'Elements with ARIA roles must use valid values',
              helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/aria-roles',
              nodes: [
                {
                  html: '<div role="invalid-role">Content</div>',
                  target: ['div[role="invalid-role"]'],
                  failureSummary: 'Fix the following: Role must be one of the valid ARIA roles',
                  any: [],
                },
              ],
            },
          ],
          passes: [],
        }),
      }),
      close: jest.fn(),
    });

    await processAriaAnalysis(mockJob);

    // Should only insert ARIA-related issues
    const issuesTable = mockSupabase.from('accessibility_issues');
    expect(issuesTable.insert).toHaveBeenCalledTimes(1);
  });
});