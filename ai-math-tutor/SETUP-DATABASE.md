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

-- ============================================
-- KNOWLEDGE GRAPH TABLES (PR #8)
-- ============================================

-- Topics table: Core math topics in the Knowledge Graph
CREATE TABLE IF NOT EXISTS topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 10),
  xp_value INTEGER DEFAULT 10, -- XP earned for mastering this topic
  domain TEXT NOT NULL, -- e.g., 'arithmetic', 'algebra', 'proportions', 'word_problems'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name)
);

-- Topic prerequisites: What topics must be mastered before this one
CREATE TABLE IF NOT EXISTS topic_prerequisites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  prerequisite_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(topic_id, prerequisite_id),
  CHECK (topic_id != prerequisite_id) -- Prevent self-referential prerequisites
);

-- Topic encompassings: Advanced topics that encompass simpler ones
-- When you master an advanced topic, it implicitly reviews simpler topics
CREATE TABLE IF NOT EXISTS topic_encompassings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE, -- Advanced topic
  encompassed_id UUID REFERENCES topics(id) ON DELETE CASCADE, -- Simpler topic
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(topic_id, encompassed_id),
  CHECK (topic_id != encompassed_id) -- Prevent self-referential encompassings
);

-- Student mastery tracking: Per-topic mastery level
CREATE TABLE IF NOT EXISTS student_mastery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT, -- For anonymous users
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  last_practiced TIMESTAMP,
  next_review TIMESTAMP, -- When spaced repetition should review this topic
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, session_id, topic_id)
);

-- Diagnostic results: Initial placement test results
CREATE TABLE IF NOT EXISTS diagnostic_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT, -- For anonymous users
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  performance_data JSONB, -- Store question-by-question results
  accuracy DECIMAL(5,2), -- Percentage accuracy on diagnostic
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, session_id, topic_id)
);

-- Quiz sessions: Retrieval practice quizzes
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT, -- For anonymous users
  topics UUID[] DEFAULT '{}', -- Array of topic IDs covered in this quiz
  questions JSONB NOT NULL, -- Question data
  results JSONB, -- Answer results
  accuracy DECIMAL(5,2), -- Overall quiz accuracy
  is_timed BOOLEAN DEFAULT false,
  time_taken_seconds INTEGER,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for Knowledge Graph tables
CREATE INDEX IF NOT EXISTS idx_topics_domain ON topics(domain);
CREATE INDEX IF NOT EXISTS idx_topics_difficulty ON topics(difficulty);
CREATE INDEX IF NOT EXISTS idx_topic_prerequisites_topic ON topic_prerequisites(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_prerequisites_prereq ON topic_prerequisites(prerequisite_id);
CREATE INDEX IF NOT EXISTS idx_topic_encompassings_topic ON topic_encompassings(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_encompassings_encompassed ON topic_encompassings(encompassed_id);
CREATE INDEX IF NOT EXISTS idx_student_mastery_user_topic ON student_mastery(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_student_mastery_session_topic ON student_mastery(session_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_student_mastery_next_review ON student_mastery(next_review);
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_user ON diagnostic_results(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON quiz_sessions(user_id, session_id);
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

### `topics`
Core math topics organized in a Knowledge Graph structure. Each topic has a difficulty level, XP value, and domain classification.

### `topic_prerequisites`
Defines prerequisite relationships between topics. A topic cannot be mastered until all its prerequisites are mastered.

### `topic_encompassings`
Defines encompassing relationships (advanced topics that include simpler ones). Mastering an advanced topic provides implicit repetition for simpler topics.

### `student_mastery`
Tracks mastery level (0-100%) per topic per student. Includes last practiced timestamp and next review schedule for spaced repetition.

### `diagnostic_results`
Stores initial placement test results to identify each student's knowledge frontier.

### `quiz_sessions`
Stores retrieval practice quiz sessions with questions, answers, and accuracy metrics.

All tables support:
- **Authenticated users**: Data tied to `user_id`
- **Anonymous users**: Data tied to `session_id` (stored in localStorage)

---

**Ready?** After running the SQL, refresh your app and the 404 errors should disappear! 🎉

