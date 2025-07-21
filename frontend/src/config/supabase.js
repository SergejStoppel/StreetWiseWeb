import { createClient } from '@supabase/supabase-js';
import envConfig from './environment';

// Use the environment configuration for Supabase
const supabaseUrl = envConfig.SUPABASE_URL;
const supabaseAnonKey = envConfig.SUPABASE_ANON_KEY;

console.log('🔧 Supabase Configuration Check:', {
  environment: envConfig.APP_ENV,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
  keyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING'
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing Supabase configuration for environment: ${envConfig.APP_ENV}. Please check your environment variables.`);
}

// Create Supabase client with anon key for frontend operations
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test Supabase client connectivity (bypasses CORS)
setTimeout(async () => {
  try {
    console.log('🧪 Testing Supabase client connectivity...');
    
    // Test with a simple Supabase client call
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase client test failed:', error.message);
    } else {
      console.log('✅ Supabase client connectivity works!');
    }
  } catch (error) {
    console.error('❌ Supabase client test error:', error.message);
  }
}, 2000);

export default supabase;