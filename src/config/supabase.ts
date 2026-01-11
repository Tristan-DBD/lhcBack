import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient> | null = null

export const supabase = () => {
  // Initialiser le client uniquement en production
  if (process.env.NODE_ENV === 'prod' && !supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

export const getBucketName = () => {
  return 'data'
}
