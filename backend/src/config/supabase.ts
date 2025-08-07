import { createClient } from '@supabase/supabase-js';
import { config } from '@/config';
import { createLogger } from '@/config/logger';

const logger = createLogger('supabase');

// Create Supabase client with service role key for backend operations
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'sitecraft-backend'
      }
    }
  }
);

// Test the connection
(async () => {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
      
    if (error) {
      logger.error('Failed to connect to Supabase', { error: error.message });
    } else {
      logger.info('Successfully connected to Supabase', { tableCount: count });
    }
  } catch (err: any) {
    logger.error('Supabase connection test failed', { error: err?.message || 'Unknown error' });
  }
})();

export default supabase;