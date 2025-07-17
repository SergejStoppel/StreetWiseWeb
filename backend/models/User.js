const supabase = require('../config/supabase');

class User {
  /**
   * Create a new user profile
   * @param {Object} userData - User data
   * @param {string} userData.id - User ID from auth.users
   * @param {string} userData.email - User email
   * @param {string} userData.firstName - User first name
   * @param {string} userData.lastName - User last name
   * @param {string} userData.company - User company
   * @param {string} userData.planType - User plan type (free, basic, premium)
   * @returns {Promise<Object>} Created user profile
   */
  static async create(userData) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userData.id,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        company: userData.company,
        plan_type: userData.planType || 'free'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating user profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User profile or null if not found
   */
  static async findById(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Error fetching user profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user profile by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User profile or null if not found
   */
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Error fetching user profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user profile
   */
  static async update(userId, updateData) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating user profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete user profile
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(userId) {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      throw new Error(`Error deleting user profile: ${error.message}`);
    }

    return true;
  }

  /**
   * Get user's monthly usage count
   * @param {string} userId - User ID
   * @param {string} action - Action type (e.g., 'analysis')
   * @returns {Promise<number>} Usage count for current month
   */
  static async getMonthlyUsage(userId, action = 'analysis') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('usage_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('action', action)
      .gte('created_at', startOfMonth.toISOString());

    if (error) {
      throw new Error(`Error fetching usage logs: ${error.message}`);
    }

    return data ? data.length : 0;
  }

  /**
   * Log user action
   * @param {string} userId - User ID
   * @param {string} action - Action performed
   * @param {string} resourceId - Resource ID (optional)
   * @param {Object} metadata - Additional metadata (optional)
   * @returns {Promise<Object>} Created usage log
   */
  static async logAction(userId, action, resourceId = null, metadata = {}) {
    const { data, error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: userId,
        action: action,
        resource_id: resourceId,
        metadata: metadata
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error logging user action: ${error.message}`);
    }

    return data;
  }

  /**
   * Get plan limits for a user
   * @param {string} planType - Plan type (free, basic, premium)
   * @returns {Object} Plan limits
   */
  static getPlanLimits(planType) {
    const limits = {
      free: {
        analysesPerMonth: 5,
        projectsMax: 2,
        features: ['basic_analysis', 'pdf_export']
      },
      basic: {
        analysesPerMonth: 50,
        projectsMax: 10,
        features: ['basic_analysis', 'detailed_analysis', 'pdf_export', 'project_management']
      },
      premium: {
        analysesPerMonth: 200,
        projectsMax: 50,
        features: ['basic_analysis', 'detailed_analysis', 'pdf_export', 'project_management', 'team_collaboration', 'api_access']
      }
    };

    return limits[planType] || limits.free;
  }
}

module.exports = User;