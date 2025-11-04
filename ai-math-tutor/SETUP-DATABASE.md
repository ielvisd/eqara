# 🗄️ Database Setup Guide

## Quick Setup

The app will work without the database tables, but to enable persistence (chat history and XP), you need to create the tables in Supabase.

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run This SQL

Copy and paste this entire SQL script into the editor and click **Run**:

```sql
-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  message TEXT NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create gamestate table
CREATE TABLE IF NOT EXISTS gamestate (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges TEXT[] DEFAULT '{}',
  current_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_gamestate_session_id ON gamestate(session_id);
CREATE INDEX IF NOT EXISTS idx_gamestate_user_id ON gamestate(user_id);
```

### Step 3: Enable Row Level Security (Optional but Recommended)

If you want to enable RLS for security:

```sql
-- Enable RLS
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamestate ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read/write their own session data
CREATE POLICY "Allow anonymous session access" ON chat_history
  FOR ALL USING (session_id = current_setting('app.session_id', true));

CREATE POLICY "Allow anonymous session access" ON gamestate
  FOR ALL USING (session_id = current_setting('app.session_id', true));

-- Allow authenticated users to access their own data
CREATE POLICY "Users can access own chat history" ON chat_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own gamestate" ON gamestate
  FOR ALL USING (auth.uid() = user_id);
```

**Note:** For simplicity, you can skip RLS for now if you want to test quickly. The app will work with or without it.

### Step 4: Verify Tables Created

1. Go to **Table Editor** in Supabase
2. You should see both `chat_history` and `gamestate` tables
3. Refresh your app - the 404 errors should be gone!

## Troubleshooting

### Still getting 404 errors?

1. **Check table names**: Make sure they're exactly `chat_history` and `gamestate` (lowercase, with underscore)
2. **Check Supabase URL**: Verify your `SUPABASE_URL` in `.env` is correct
3. **Check API Key**: Verify your `SUPABASE_ANON_KEY` is correct
4. **Browser Console**: Check for any other errors that might give clues

### Want to test without database?

The app will work fine without the tables! You just won't have:
- Chat history persistence (messages won't save)
- XP persistence (XP resets on refresh)

But you can still:
- Chat with the AI
- Upload images
- Earn XP (just won't persist)

## What Each Table Does

### `chat_history`
Stores all chat messages for persistence across sessions.

### `gamestate`
Stores XP, level, badges, and streaks for gamification.

Both tables support:
- **Authenticated users**: Data tied to `user_id`
- **Anonymous users**: Data tied to `session_id` (stored in localStorage)

---

**Ready?** After running the SQL, refresh your app and the 404 errors should disappear! 🎉

