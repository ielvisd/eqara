# ⚡ Quick Start Testing Checklist

Use this checklist to quickly verify everything is set up correctly before testing.

## 🔍 Pre-Flight Checks (5 minutes)

### 1. Environment Variables
```bash
# Check your .env file has:
✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY  
✅ SUPABASE_SERVICE_ROLE_KEY  # Critical for KG queries!
✅ GROK_API_KEY or OPENAI_API_KEY
```

### 2. Database Tables Exist
Run in Supabase SQL Editor:
```sql
-- Should return 8 tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'chat_history', 'gamestate', 'topics', 'topic_prerequisites',
  'topic_encompassings', 'student_mastery', 'diagnostic_results', 'quiz_sessions'
);
```

### 3. Topics Seeded
```sql
-- Should return ~30 topics
SELECT COUNT(*) as topic_count FROM topics;

-- Should see topics like:
SELECT name, domain FROM topics LIMIT 10;
```

### 4. Prerequisites Exist
```sql
-- Should return many relationships
SELECT COUNT(*) as prereq_count FROM topic_prerequisites;
```

---

## 🚀 Quick Test (2 minutes)

### Test 1: Basic Chat Works
1. Start app: `npm run dev`
2. Go to http://localhost:3000
3. Type: `2x + 5 = 13`
4. ✅ Should get AI response (even without KG, chat should work)

### Test 2: KG Detection Works
1. Type: `solve for x: 3x - 7 = 14`
2. Check browser console (F12) for any errors
3. ✅ Should detect "Linear Equations: One Variable" topic
4. ✅ AI response should be topic-aware

### Test 3: Mastery Tracking Works
1. After solving a problem, check Supabase:
```sql
SELECT * FROM student_mastery 
WHERE session_id = 'your-session-id' 
ORDER BY updated_at DESC 
LIMIT 5;
```
2. ✅ Should see mastery records being created/updated

---

## 🐛 If Something's Not Working

### Chat works but no KG context?
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Check server console for "Supabase not configured" warnings
- Verify topics exist: `SELECT COUNT(*) FROM topics;`

### Topics not detected?
- Check topic names in database match patterns
- Try more explicit problem text
- Check browser console for detection logs

### No mastery tracking?
- Verify `student_mastery` table exists
- Check session_id is being generated
- Look for errors in browser console

---

## ✅ Ready to Test Full Features?

Once these quick checks pass, follow the detailed `TESTING-GUIDE.md` for comprehensive testing!

