const { createClient } = require('@supabase/supabase-js');
const envConfig = require('./environment');

// Use the environment configuration for Supabase
const supabaseUrl = envConfig.SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(`Missing Supabase configuration for environment: ${envConfig.APP_ENV}. Please check your environment variables.`);
}

// Create Supabase client with service role key for backend operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'sitecraft-backend'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper function for database operations with retry logic
const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on authentication errors or client errors
      if (error.code === 'PGRST301' || error.code === 'PGRST116' ||
          (error.status && error.status >= 400 && error.status < 500)) {
        throw error;
      }

      if (attempt < maxRetries) {
        console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
};

// Export the original supabase client with helper functions
module.exports = supabase;

// Export the retry helper function for manual use when needed
module.exports.withRetry = withRetry;