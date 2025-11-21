/**
 * Quota Service
 * Manages user scan quotas and tier limits
 */

import { supabase } from '@/config/supabase';
import { createLogger } from '@/config/logger';

const logger = createLogger('quota-service');

export type UserTier = 'free' | 'paid' | 'tester';

export interface UserQuota {
  id: string;
  user_id: string;
  tier: UserTier;
  instant_scans_used: number;
  instant_scans_limit: number;
  quota_reset_at: string;
  total_instant_scans: number;
  total_deep_analyses: number;
  created_at: string;
  updated_at: string;
}

export interface QuotaCheckResult {
  canScan: boolean;
  quota: UserQuota | null;
  reason?: string;
  scansRemaining?: number;
  resetsAt?: string;
}

export interface CachedAnalysis {
  id: string;
  url: string;
  status: string;
  created_at: string;
  analysis_type: string;
}

class QuotaService {
  /**
   * Get or create quota record for a user
   */
  async getQuota(userId: string): Promise<UserQuota | null> {
    try {
      // First try to get existing quota
      let { data: quota, error } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No quota record exists, create one
        const { data: newQuota, error: createError } = await supabase
          .from('user_quotas')
          .insert({ user_id: userId })
          .select()
          .single();

        if (createError) {
          logger.error('Failed to create quota record', { userId, error: createError });
          return null;
        }
        quota = newQuota;
      } else if (error) {
        logger.error('Failed to get quota', { userId, error });
        return null;
      }

      // Check if quota needs reset
      if (quota && new Date(quota.quota_reset_at) <= new Date()) {
        const { data: resetQuota, error: resetError } = await supabase
          .from('user_quotas')
          .update({
            instant_scans_used: 0,
            quota_reset_at: this.getNextResetDate()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (resetError) {
          logger.error('Failed to reset quota', { userId, error: resetError });
        } else {
          quota = resetQuota;
          logger.info('Quota reset for user', { userId });
        }
      }

      return quota;
    } catch (error) {
      logger.error('Error getting quota', { userId, error });
      return null;
    }
  }

  /**
   * Check if user can perform an instant scan
   */
  async canPerformInstantScan(userId: string | null, url: string): Promise<QuotaCheckResult> {
    // Guest users can always scan (but results aren't saved)
    if (!userId) {
      return {
        canScan: true,
        quota: null,
        reason: 'guest'
      };
    }

    // Check for cached result first
    const cached = await this.getCachedAnalysis(userId, url);
    if (cached) {
      return {
        canScan: true,
        quota: null,
        reason: 'cached',
      };
    }

    // Get user quota
    const quota = await this.getQuota(userId);
    if (!quota) {
      return {
        canScan: false,
        quota: null,
        reason: 'quota_error'
      };
    }

    // Testers have unlimited scans
    if (quota.tier === 'tester') {
      return {
        canScan: true,
        quota,
        reason: 'tester',
        scansRemaining: 999999
      };
    }

    // Check against limit
    if (quota.instant_scans_used >= quota.instant_scans_limit) {
      return {
        canScan: false,
        quota,
        reason: 'limit_reached',
        scansRemaining: 0,
        resetsAt: quota.quota_reset_at
      };
    }

    return {
      canScan: true,
      quota,
      scansRemaining: quota.instant_scans_limit - quota.instant_scans_used,
      resetsAt: quota.quota_reset_at
    };
  }

  /**
   * Check if there's a cached analysis for this URL
   */
  async getCachedAnalysis(userId: string, url: string): Promise<CachedAnalysis | null> {
    try {
      // Normalize URL for comparison
      const normalizedUrl = this.normalizeUrl(url);

      const { data, error } = await supabase
        .from('analyses')
        .select('id, url, status, created_at, analysis_type')
        .eq('user_id', userId)
        .eq('url', normalizedUrl)
        .in('status', ['completed', 'completed_with_errors'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if analysis is recent enough (e.g., within 24 hours)
      const analysisDate = new Date(data.created_at);
      const now = new Date();
      const hoursSinceAnalysis = (now.getTime() - analysisDate.getTime()) / (1000 * 60 * 60);

      // Return cached if less than 24 hours old
      if (hoursSinceAnalysis < 24) {
        logger.info('Found cached analysis', { userId, url: normalizedUrl, analysisId: data.id });
        return data;
      }

      return null;
    } catch (error) {
      logger.error('Error checking cached analysis', { userId, url, error });
      return null;
    }
  }

  /**
   * Increment scan usage after successful scan
   */
  async incrementScanUsage(userId: string): Promise<UserQuota | null> {
    try {
      const { data, error } = await supabase
        .from('user_quotas')
        .update({
          instant_scans_used: supabase.rpc('increment', { x: 1 }),
          total_instant_scans: supabase.rpc('increment', { x: 1 })
        })
        .eq('user_id', userId)
        .select()
        .single();

      // Fallback: manual increment if rpc doesn't work
      if (error) {
        const quota = await this.getQuota(userId);
        if (quota) {
          const { data: updated, error: updateError } = await supabase
            .from('user_quotas')
            .update({
              instant_scans_used: quota.instant_scans_used + 1,
              total_instant_scans: quota.total_instant_scans + 1
            })
            .eq('user_id', userId)
            .select()
            .single();

          if (updateError) {
            logger.error('Failed to increment scan usage', { userId, error: updateError });
            return null;
          }
          return updated;
        }
      }

      return data;
    } catch (error) {
      logger.error('Error incrementing scan usage', { userId, error });
      return null;
    }
  }

  /**
   * Upgrade user to paid tier after successful payment
   */
  async upgradeToPaidTier(userId: string): Promise<UserQuota | null> {
    try {
      const { data, error } = await supabase
        .from('user_quotas')
        .upsert({
          user_id: userId,
          tier: 'paid',
          instant_scans_limit: 10
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to upgrade to paid tier', { userId, error });
        return null;
      }

      // Also increment deep analysis count
      await supabase
        .from('user_quotas')
        .update({
          total_deep_analyses: supabase.rpc('increment', { x: 1 })
        })
        .eq('user_id', userId);

      logger.info('User upgraded to paid tier', { userId });
      return data;
    } catch (error) {
      logger.error('Error upgrading to paid tier', { userId, error });
      return null;
    }
  }

  /**
   * Set user as tester (unlimited access)
   */
  async setAsTester(userId: string): Promise<UserQuota | null> {
    try {
      const { data, error } = await supabase
        .from('user_quotas')
        .upsert({
          user_id: userId,
          tier: 'tester',
          instant_scans_limit: 999999
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to set user as tester', { userId, error });
        return null;
      }

      logger.info('User set as tester', { userId });
      return data;
    } catch (error) {
      logger.error('Error setting user as tester', { userId, error });
      return null;
    }
  }

  /**
   * Get quota summary for display
   */
  async getQuotaSummary(userId: string): Promise<{
    tier: UserTier;
    scansUsed: number;
    scansLimit: number;
    scansRemaining: number;
    resetsAt: string;
    totalInstantScans: number;
    totalDeepAnalyses: number;
  } | null> {
    const quota = await this.getQuota(userId);
    if (!quota) return null;

    return {
      tier: quota.tier,
      scansUsed: quota.instant_scans_used,
      scansLimit: quota.instant_scans_limit,
      scansRemaining: quota.tier === 'tester'
        ? 999999
        : Math.max(0, quota.instant_scans_limit - quota.instant_scans_used),
      resetsAt: quota.quota_reset_at,
      totalInstantScans: quota.total_instant_scans,
      totalDeepAnalyses: quota.total_deep_analyses
    };
  }

  /**
   * Helper: Get next month reset date
   */
  private getNextResetDate(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
  }

  /**
   * Helper: Normalize URL for comparison
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove trailing slash, lowercase hostname
      let normalized = `${parsed.protocol}//${parsed.hostname.toLowerCase()}`;
      if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
        normalized += `:${parsed.port}`;
      }
      normalized += parsed.pathname.replace(/\/$/, '') || '/';
      return normalized;
    } catch {
      return url.toLowerCase().replace(/\/$/, '');
    }
  }
}

export const quotaService = new QuotaService();
export default quotaService;
