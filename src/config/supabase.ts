import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient> | null = null

export const supabase = () => {
  // Initialiser le client en production et développement
  if (
    (process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'dev') &&
    !supabaseClient
  ) {
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
    console.log(
      'SUPABASE_SERVICE_ROLE_KEY:',
      process.env.SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined',
    )

    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

export const getBucketName = () => {
  return process.env.SUPABASE_BUCKET!
}
