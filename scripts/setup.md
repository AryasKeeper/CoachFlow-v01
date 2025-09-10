# CoachFlow Setup Guide

## Quick Start

1. **Copy Environment File**
   ```bash
   cp env.example .env.local
   ```

2. **Edit Environment Variables**
   Open `.env.local` and replace with your actual Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

3. **Set up Supabase Database**
   - Copy the contents of `supabase/schema.sql`
   - Paste and run in your Supabase SQL Editor
   - (Optional) Copy and run `supabase/seed.sql` for demo data

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## Database Setup

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create new project
- Note your project URL and anon key from Settings > API

### 2. Run Schema Script
Copy and paste the entire contents of `supabase/schema.sql` into your Supabase SQL Editor and run it.

### 3. (Optional) Load Demo Data
Copy and paste the contents of `supabase/seed.sql` into your Supabase SQL Editor and run it.

This will create demo accounts you can use for testing:

**Organizations (password: demo123):**
- bondi.academy@demo.com
- sydney.youth@demo.com  
- north.shore@demo.com

**Coaches (password: demo123):**
- sarah.coach@demo.com
- mike.coach@demo.com
- emma.coach@demo.com
- james.coach@demo.com

**Admin (password: demo123):**
- admin@demo.com

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Format code with Prettier
npm run format
```

## Features Ready to Use

✅ **Landing Page** - Beautiful glassmorphic design with rotating headline
✅ **Authentication** - Role-based signup/signin (org/coach/admin)
✅ **Organization Portal** - Post needs, review applications, manage bookings
✅ **Coach Portal** - Create profile, verify credentials, browse/apply for jobs
✅ **Admin Panel** - User management, analytics, platform oversight
✅ **Messaging** - Direct communication between organizations and coaches
✅ **AI Helper** - Floating help assistant (ready for AI integration)

## TODO for Production

- [ ] Add real Supabase credentials to environment
- [ ] Configure OpenAI API key for AI features
- [ ] Set up custom domain
- [ ] Configure email templates in Supabase
- [ ] Add analytics tracking
- [ ] Set up monitoring and error tracking
- [ ] Add payment integration (Stripe)
- [ ] Calendar sync integration
- [ ] Mobile app development
