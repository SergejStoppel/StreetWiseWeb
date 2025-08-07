
import { supabase } from '@/config/supabase';
import { AppError } from '@/types';

export async function createAnalysis(websiteId: string, userId: string) {
  const { data, error } = await supabase
    .from('analyses')
    .insert([
      { website_id: websiteId, user_id: userId, status: 'pending' }
    ])
    .select();

  if (error) {
    throw new AppError('Failed to create analysis in database', 500, true, error.message);
  }

  return data?.[0];
}
