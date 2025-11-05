# 🧪 Testing Guide - Knowledge Graph Integration

This guide will help you test all the features we've built for PR #4: Wisdom Quest - Socratic Logic & Problem Solving (KG-Integrated).

## Prerequisites Checklist

Before testing, make sure you have:

- [ ] Supabase project created
- [ ] Environment variables configured (`.env` file)
- [ ] Database tables created
- [ ] CCAT topics seeded
- [ ] LLM API key configured (GROK_API_KEY or OPENAI_API_KEY)

---

## Step 1: Database Setup

### 1.1 Create Database Tables

1. Go to your Supabase project dashboard
2. Click **SQL Editor** → **New Query**
3. Copy and paste the SQL from `SETUP-DATABASE.md` (lines 17-137)
4. Click **Run**

This creates:
- `chat_history` - Chat message persistence
- `gamestate` - XP and gamification tracking
- `topics` - Knowledge Graph topics
- `topic_prerequisites` - Prerequisite relationships
- `topic_encompassings` - Encompassing relationships (for FIRe)
- `student_mastery` - Mastery tracking per topic
- `diagnostic_results` - Diagnostic test results
- `quiz_sessions` - Quiz session data

### 1.2 Seed CCAT Topics

1. In Supabase SQL Editor, open a new query
2. Copy the entire contents of `server/utils/seed-ccat-topics.sql`
3. Click **Run**

This creates:
- 30+ CCAT math topics
- Prerequisite relationships
- Encompassing relationships

**Verify seeding:**
```sql
SELECT COUNT(*) FROM topics; -- Should be ~30 topics
SELECT COUNT(*) FROM topic_prerequisites; -- Should have many prerequisite relationships
```

---

## Step 2: Environment Variables

Make sure your `.env` file has:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Important for server-side KG queries!

# LLM (at least one)
GROK_API_KEY=your-grok-key
# OR
OPENAI_API_KEY=your-openai-key
```

---

## Step 3: Test Features

### Test 1: Topic Detection & KG Context

**What to test:** Enhanced topic detection with pattern matching

1. **Start the app:**
   ```bash
   cd ai-math-tutor
   npm run dev
   ```

2. **Test Algebra Detection:**
   - Type: `2x + 5 = 13`
   - Expected: Should detect "Linear Equations: One Variable" topic
   - Check browser console for logs (if any)

3. **Test Arithmetic Detection:**
   - Type: `15 + 23`
   - Expected: Should detect "Basic Addition" topic

4. **Test Proportions Detection:**
   - Type: `What is 25% of 80?`
   - Expected: Should detect "Percentage Problems" topic

5. **Test Word Problem Detection:**
   - Type: `If Sarah has 15 apples and gives away 7, how many does she have left?`
   - Expected: Should detect a word problem topic

**How to verify:** The AI should respond with topic-aware guidance. Check that the system prompt includes KG context (you can add console.log in chat.post.ts temporarily).

---

### Test 2: Prerequisite-Aware Hints

**What to test:** Hints based on prerequisite knowledge gaps

1. **Create a scenario:**
   - Ask about a topic you haven't mastered prerequisites for
   - Example: Try solving `2x + 5 = 13` without mastering "Variables and Expressions"

2. **Get stuck:**
   - Give wrong answers or say "I don't know" multiple times
   - Wait for 2+ stuck turns (consecutive assistant messages)

3. **Verify hint:**
   - AI should provide hints referencing prerequisite topics
   - Check that weak prerequisites are identified

**Expected behavior:** After 2 stuck turns, AI mentions prerequisite topics that need review.

---

### Test 3: Mastery-Adaptive Difficulty

**What to test:** Scaffolding adjusts based on mastery level

1. **Low Mastery (0-39%):**
   - Start a new topic (no mastery yet)
   - Expected: AI breaks problems into 4-5 small steps, provides explicit guidance

2. **Medium Mastery (40-79%):**
   - If you have some mastery, AI should provide 2-3 step guidance

3. **High Mastery (80-100%):**
   - After achieving high mastery, AI should challenge with complex questions, minimal hints

**How to simulate:** You can manually set mastery in Supabase:
```sql
-- Set low mastery (20%)
INSERT INTO student_mastery (session_id, topic_id, mastery_level)
SELECT 'your-session-id', id, 20
FROM topics WHERE name = 'Linear Equations: One Variable';

-- Set high mastery (85%)
INSERT INTO student_mastery (session_id, topic_id, mastery_level)
SELECT 'your-session-id', id, 85
FROM topics WHERE name = 'Basic Addition';
```

---

### Test 4: Remediation Flow

**What to test:** Lesson fails twice → prerequisite review triggered

1. **Trigger failure:**
   - Get stuck on a problem (6+ consecutive assistant turns)
   - Give multiple wrong answers
   - System should detect 2 failures

2. **Verify remediation:**
   - AI should mention remediation is needed
   - Should suggest prerequisite topics to review
   - Should suggest a consolidation break

3. **Check system prompt:**
   - The KG context should include remediation status
   - Should list prerequisite topics to focus on

**Expected behavior:** After 6+ stuck turns, you'll see remediation guidance in the AI's response.

---

### Test 5: Knowledge Frontier

**What to test:** Only serve lessons at knowledge frontier

1. **Check frontier calculation:**
   - Topics where all prerequisites are mastered
   - Topic itself is not yet mastered

2. **Test with diagnostic:**
   - Go to `/diagnostic` page
   - Complete diagnostic
   - System should identify your knowledge frontier

3. **Verify in chat:**
   - AI should only serve lessons at frontier topics
   - System prompt should include frontier topic list

**How to verify:** Check the system prompt includes frontier topics in KG context.

---

## Step 4: Debugging Tips

### Check KG Context in Chat API

Add temporary logging to see what KG context is being generated:

```typescript
// In server/api/chat.post.ts, after kgContextString is built:
console.log('KG Context String:', kgContextString)
console.log('Remediation Status:', remediationStatus)
console.log('Scaffolding Level:', scaffolding)
```

### Check Topic Detection

Add logging to see topic detection scores:

```typescript
// In getKGContext function:
console.log('Topic detection:', { detectedTopicId, bestMatchScore, problemText })
```

### Check Mastery Data

Query mastery directly in Supabase:

```sql
SELECT 
  t.name as topic_name,
  sm.mastery_level,
  sm.last_practiced
FROM student_mastery sm
JOIN topics t ON t.id = sm.topic_id
WHERE sm.session_id = 'your-session-id'
ORDER BY sm.updated_at DESC;
```

---

## Step 5: Manual Testing Scenarios

### Scenario 1: New Student Learning Algebra

1. Start fresh (no mastery)
2. Type: `2x + 5 = 13`
3. **Expected:**
   - Topic detected: "Linear Equations: One Variable"
   - Mastery: 0% (new topic)
   - Scaffolding: Maximum (4-5 steps)
   - AI breaks down into tiny steps

### Scenario 2: Student with Some Mastery

1. Set mastery to 50% for "Linear Equations: One Variable"
2. Type: `3x - 7 = 14`
3. **Expected:**
   - Moderate scaffolding (2-3 steps)
   - Balanced guidance and discovery

### Scenario 3: Advanced Student

1. Set mastery to 90% for "Basic Addition"
2. Type: `15 + 23`
3. **Expected:**
   - Minimal scaffolding
   - Complex, challenging questions
   - Minimal hints

### Scenario 4: Remediation Trigger

1. Start with a topic that has prerequisites
2. Get stuck 6+ times
3. **Expected:**
   - Remediation message appears
   - Prerequisite topics listed
   - Consolidation break suggested

---

## Common Issues & Solutions

### Issue: "Supabase not configured, skipping KG context"

**Solution:** Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env` file.

### Issue: Topics not detected

**Solution:** 
1. Verify topics are seeded: `SELECT COUNT(*) FROM topics;`
2. Check topic names match patterns in detection code
3. Try more explicit problem text (e.g., "solve for x: 2x + 5 = 13")

### Issue: Mastery not updating

**Solution:**
1. Check `student_mastery` table exists
2. Verify session_id is being used correctly
3. Check browser console for errors

### Issue: Remediation not triggering

**Solution:**
1. Need 6+ consecutive assistant messages (stuck turns)
2. Check `checkRemediationStatus` function is being called
3. Verify topic has prerequisites

---

## Success Criteria

✅ **Topic Detection:** Accurately identifies math problem types  
✅ **KG Context:** System prompt includes mastery, prerequisites, frontier  
✅ **Prerequisite Hints:** Provides hints based on weak prerequisites after 2 stuck turns  
✅ **Adaptive Difficulty:** Scaffolding adjusts based on mastery level  
✅ **Remediation Flow:** Triggers prerequisite review after 2 lesson failures  
✅ **Frontier Awareness:** Only serves lessons at knowledge frontier  

---

## Next Steps After Testing

Once testing is complete:

1. **Fix any bugs** found during testing
2. **Optimize topic detection** if needed
3. **Tune scaffolding levels** based on feedback
4. **Move to PR #5:** UI Polish & Knowledge Graph Visualization

---

**Ready to test?** Start with Step 1 and work through each test systematically! 🚀
