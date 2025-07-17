const supabase = require('../config/supabase');

class Project {
  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @param {string} projectData.userId - User ID
   * @param {string} projectData.name - Project name
   * @param {string} projectData.description - Project description
   * @param {string} projectData.websiteUrl - Website URL
   * @param {Object} projectData.settings - Project settings
   * @returns {Promise<Object>} Created project
   */
  static async create(projectData) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: projectData.userId,
        name: projectData.name,
        description: projectData.description,
        website_url: projectData.websiteUrl,
        settings: projectData.settings || {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating project: ${error.message}`);
    }

    return data;
  }

  /**
   * Get project by ID
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Project or null if not found
   */
  static async findById(projectId, userId) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Project not found
      }
      throw new Error(`Error fetching project: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all projects for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {boolean} options.includeArchived - Include archived projects
   * @param {number} options.limit - Limit results
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Array>} Array of projects
   */
  static async findByUserId(userId, options = {}) {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!options.includeArchived) {
      query = query.eq('is_archived', false);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching projects: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update project
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated project
   */
  static async update(projectId, userId, updateData) {
    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating project: ${error.message}`);
    }

    return data;
  }

  /**
   * Archive project
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Updated project
   */
  static async archive(projectId, userId) {
    return this.update(projectId, userId, { is_archived: true });
  }

  /**
   * Delete project
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success status
   */
  static async delete(projectId, userId) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error deleting project: ${error.message}`);
    }

    return true;
  }

  /**
   * Get project with analytics
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Project with analytics
   */
  static async getWithAnalytics(projectId, userId) {
    const { data, error } = await supabase
      .from('project_analytics')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Project not found
      }
      throw new Error(`Error fetching project analytics: ${error.message}`);
    }

    return data;
  }

  /**
   * Get project count for user
   * @param {string} userId - User ID
   * @param {boolean} includeArchived - Include archived projects
   * @returns {Promise<number>} Project count
   */
  static async getCountByUserId(userId, includeArchived = false) {
    let query = supabase
      .from('projects')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Error counting projects: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Search projects by name
   * @param {string} userId - User ID
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of matching projects
   */
  static async search(userId, searchTerm, options = {}) {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (!options.includeArchived) {
      query = query.eq('is_archived', false);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error searching projects: ${error.message}`);
    }

    return data || [];
  }
}

module.exports = Project;