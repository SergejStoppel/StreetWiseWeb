import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Configuration Check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
  keyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING'
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
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