const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    // Check if achievements column exists
    const { data: columns, error: columnsError } = await supabase
      .from('coach_profiles')
      .select('*')
      .limit(0)

    if (columnsError) {
      console.log('Error checking columns:', columnsError)
    }

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250913_contact_information.sql')
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')

    // Extract just the achievements column addition
    const addAchievementsSQL = `
      ALTER TABLE public.coach_profiles
      ADD COLUMN IF NOT EXISTS achievements TEXT;
    `

    console.log('Adding achievements column to coach_profiles table...')

    // Run the migration through raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: addAchievementsSQL
    }).catch(async (err) => {
      // If RPC doesn't exist, try direct approach
      console.log('Direct SQL approach...')
      // This won't work directly, but we can at least verify the issue
      return { error: 'RPC not available, please run migration manually in Supabase dashboard' }
    })

    if (error) {
      console.error('Migration error:', error)
      console.log('\n=================================')
      console.log('MANUAL FIX REQUIRED:')
      console.log('=================================')
      console.log('Please run this SQL in your Supabase SQL Editor:')
      console.log(addAchievementsSQL)
      console.log('=================================')
    } else {
      console.log('Migration completed successfully!')
    }

  } catch (error) {
    console.error('Error:', error)
    console.log('\n=================================')
    console.log('MANUAL FIX REQUIRED:')
    console.log('=================================')
    console.log('Please go to your Supabase dashboard -> SQL Editor')
    console.log('And run this SQL command:')
    console.log('')
    console.log('ALTER TABLE public.coach_profiles')
    console.log('ADD COLUMN IF NOT EXISTS achievements TEXT;')
    console.log('=================================')
  }
}

runMigration()