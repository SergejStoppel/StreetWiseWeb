import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/config';
import { authenticateToken, AuthRequest } from '../../middleware/auth';
import { requireSuperAdmin, logAdminAction } from '../../middleware/adminAuth';

const router = Router();
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

// All routes require authentication and super admin access
router.use(authenticateToken);
router.use(requireSuperAdmin);

/**
 * GET /api/admin/analytics/overview
 * Get platform-wide overview statistics
 */
router.get('/overview', async (req: AuthRequest, res) => {
  try {
    // Get total user count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get active users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentAnalyses } = await supabase
      .from('analyses')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const activeUsers = new Set(recentAnalyses?.map(a => a.user_id)).size;

    // Get total analyses count
    const { count: totalAnalyses } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true });

    // Get analyses this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { count: analysesThisMonth } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString());

    // Get completed analyses
    const { count: completedAnalyses } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Get failed analyses
    const { count: failedAnalyses } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');

    // Get new users this month
    const { count: newUsersThisMonth } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString());

    // Get subscription counts (if billing exists)
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('status, plan_id');

    const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;
    const trialingSubscriptions = subscriptions?.filter(s => s.status === 'trialing').length || 0;

    // Calculate success rate
    const successRate = totalAnalyses && totalAnalyses > 0
      ? Math.round(((completedAnalyses || 0) / totalAnalyses) * 100)
      : 0;

    // Log the action
    await logAdminAction({
      admin_user_id: req.user!.id,
      action_type: 'view_analytics_overview',
      action_category: 'analytics',
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: {
        users: {
          total: totalUsers || 0,
          active_last_30_days: activeUsers,
          new_this_month: newUsersThisMonth || 0,
        },
        analyses: {
          total: totalAnalyses || 0,
          this_month: analysesThisMonth || 0,
          completed: completedAnalyses || 0,
          failed: failedAnalyses || 0,
          success_rate: successRate,
        },
        subscriptions: {
          active: activeSubscriptions,
          trialing: trialingSubscriptions,
          total: (subscriptions?.length || 0),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching overview analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch overview analytics',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/admin/analytics/growth
 * Get user growth data over time
 */
router.get('/growth', async (req: AuthRequest, res) => {
  try {
    const { period = '30d' } = req.query;

    let daysBack = 30;
    if (period === '7d') daysBack = 7;
    else if (period === '90d') daysBack = 90;
    else if (period === '1y') daysBack = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get user signups by day
    const { data: users } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Group by date
    const signupsByDate: Record<string, number> = {};
    users?.forEach(user => {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      signupsByDate[date] = (signupsByDate[date] || 0) + 1;
    });

    // Get analyses by day
    const { data: analyses } = await supabase
      .from('analyses')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    const analysesByDate: Record<string, number> = {};
    analyses?.forEach(analysis => {
      const date = new Date(analysis.created_at).toISOString().split('T')[0];
      analysesByDate[date] = (analysesByDate[date] || 0) + 1;
    });

    // Fill in missing dates with 0
    const allDates: string[] = [];
    for (let i = daysBack; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      allDates.push(dateStr);
      if (!signupsByDate[dateStr]) signupsByDate[dateStr] = 0;
      if (!analysesByDate[dateStr]) analysesByDate[dateStr] = 0;
    }

    const growthData = allDates.map(date => ({
      date,
      signups: signupsByDate[date],
      analyses: analysesByDate[date],
    }));

    // Log the action
    await logAdminAction({
      admin_user_id: req.user!.id,
      action_type: 'view_growth_analytics',
      action_category: 'analytics',
      action_details: { period },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: {
        period,
        data: growthData,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching growth analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch growth analytics',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/admin/analytics/top-websites
 * Get most analyzed websites
 */
router.get('/top-websites', async (req: AuthRequest, res) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string);

    const { data: analyses } = await supabase
      .from('analyses')
      .select('website_id, websites(url, name)');

    // Count analyses per website
    const websiteCounts: Record<string, { url: string; name: string | null; count: number }> = {};

    analyses?.forEach(analysis => {
      if (analysis.website_id && analysis.websites) {
        const websiteData = analysis.websites as any;
        const key = analysis.website_id;
        if (!websiteCounts[key]) {
          websiteCounts[key] = {
            url: websiteData.url,
            name: websiteData.name,
            count: 0,
          };
        }
        websiteCounts[key].count++;
      }
    });

    // Convert to array and sort
    const topWebsites = Object.entries(websiteCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limitNum);

    // Log the action
    await logAdminAction({
      admin_user_id: req.user!.id,
      action_type: 'view_top_websites',
      action_category: 'analytics',
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: topWebsites,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching top websites:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch top websites',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/admin/analytics/feature-usage
 * Get feature interaction analytics
 */
router.get('/feature-usage', async (req: AuthRequest, res) => {
  try {
    const { period = '30d' } = req.query;

    let daysBack = 30;
    if (period === '7d') daysBack = 7;
    else if (period === '90d') daysBack = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data: interactions } = await supabase
      .from('user_feature_interactions')
      .select('feature_name, interaction_type')
      .gte('created_at', startDate.toISOString());

    // Count by feature
    const featureCounts: Record<string, number> = {};
    const interactionTypes: Record<string, Record<string, number>> = {};

    interactions?.forEach(interaction => {
      // Count total
      featureCounts[interaction.feature_name] = (featureCounts[interaction.feature_name] || 0) + 1;

      // Count by type
      if (!interactionTypes[interaction.feature_name]) {
        interactionTypes[interaction.feature_name] = {};
      }
      interactionTypes[interaction.feature_name][interaction.interaction_type] =
        (interactionTypes[interaction.feature_name][interaction.interaction_type] || 0) + 1;
    });

    const featureData = Object.entries(featureCounts)
      .map(([feature, count]) => ({
        feature,
        total: count,
        by_type: interactionTypes[feature],
      }))
      .sort((a, b) => b.total - a.total);

    // Log the action
    await logAdminAction({
      admin_user_id: req.user!.id,
      action_type: 'view_feature_usage',
      action_category: 'analytics',
      action_details: { period },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: {
        period,
        features: featureData,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching feature usage:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch feature usage analytics',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/admin/analytics/onboarding
 * Get onboarding completion analytics
 */
router.get('/onboarding', async (req: AuthRequest, res) => {
  try {
    // Get onboarding stats
    const { data: users } = await supabase
      .from('users')
      .select('onboarding_completed, onboarding_skipped, onboarding_step, product_tour_completed');

    if (!users) {
      return res.json({
        success: true,
        data: {
          total_users: 0,
          completed: 0,
          skipped: 0,
          in_progress: 0,
          completion_rate: 0,
          skip_rate: 0,
          average_step: 0,
          tour_completion_rate: 0,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const totalUsers = users.length;
    const completed = users.filter(u => u.onboarding_completed && !u.onboarding_skipped).length;
    const skipped = users.filter(u => u.onboarding_skipped).length;
    const inProgress = users.filter(u => !u.onboarding_completed && !u.onboarding_skipped).length;
    const tourCompleted = users.filter(u => u.product_tour_completed).length;

    const averageStep = users.reduce((sum, u) => sum + (u.onboarding_step || 0), 0) / totalUsers;

    // Step distribution
    const stepDistribution = [0, 1, 2, 3, 4, 5].map(step => ({
      step,
      count: users.filter(u => u.onboarding_step === step).length,
    }));

    // Log the action
    await logAdminAction({
      admin_user_id: req.user!.id,
      action_type: 'view_onboarding_analytics',
      action_category: 'analytics',
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: {
        total_users: totalUsers,
        completed,
        skipped,
        in_progress: inProgress,
        completion_rate: Math.round((completed / totalUsers) * 100),
        skip_rate: Math.round((skipped / totalUsers) * 100),
        average_step: Math.round(averageStep * 10) / 10,
        tour_completion_rate: Math.round((tourCompleted / totalUsers) * 100),
        step_distribution: stepDistribution,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching onboarding analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch onboarding analytics',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/admin/analytics/audit-logs
 * Get admin audit log entries
 */
router.get('/audit-logs', async (req: AuthRequest, res) => {
  try {
    const {
      page = '1',
      limit = '50',
      action_category,
      action_type,
      admin_user_id,
      start_date,
      end_date,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('admin_audit_log')
      .select('*, admin_user:admin_user_id(email, full_name), target_user:target_user_id(email, full_name)', { count: 'exact' });

    // Apply filters
    if (action_category) {
      query = query.eq('action_category', action_category);
    }
    if (action_type) {
      query = query.eq('action_type', action_type);
    }
    if (admin_user_id) {
      query = query.eq('admin_user_id', admin_user_id);
    }
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: {
        logs: logs || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          pages: Math.ceil((count || 0) / limitNum),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
