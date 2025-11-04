# 🧪 PR #3: Chat Quest - Testing Guide

## ✅ What Should Be Working Right Now

### Core Chat Functionality
1. **Multi-turn Conversations**
   - ✅ Start a chat by typing a math question
   - ✅ AI responds with Socratic questions (not direct answers)
   - ✅ Continue the conversation - AI remembers context
   - ✅ Each response should award XP (+5, +10, or +15 XP)

### Image Upload & OCR
1. **Image Processing**
   - ✅ Upload an image of a math problem
   - ✅ Image is processed via OCR/Vision API
   - ✅ Extracted problem appears in chat
   - ✅ XP reward (+10) for successful extraction

### Data Persistence
1. **Chat History**
   - ✅ Messages are saved to Supabase
   - ✅ Chat history loads when you refresh the page
   - ✅ Anonymous session ID stored in localStorage

2. **XP & Gamification**
   - ✅ XP is displayed in header and stats card
   - ✅ XP is saved to Supabase gamestate table
   - ✅ Level calculation (Level = floor(XP / 100) + 1)
   - ✅ XP persists across page refreshes

### Realtime Features
1. **Supabase Realtime** (if enabled)
   - ✅ Messages sync across devices/browsers
   - ✅ Real-time updates when new messages arrive

## 🧪 Testing Checklist

### Test 1: Basic Chat Flow
- [ ] Type a math question: "Solve 2x + 3 = 7"
- [ ] Verify AI responds with a question (not direct answer)
- [ ] Verify XP is awarded (check toast notification)
- [ ] Continue conversation with follow-up
- [ ] Verify AI remembers context from previous messages

### Test 2: Image Upload & OCR
- [ ] Upload a clear image of a math problem
- [ ] Verify "Analyzing image..." message appears
- [ ] Verify extracted problem appears in chat
- [ ] Verify +10 XP is awarded
- [ ] Verify you can continue chatting about the extracted problem

### Test 3: Chat History Persistence
- [ ] Have a conversation with multiple messages
- [ ] Refresh the page (F5)
- [ ] Verify all messages are still there
- [ ] Verify XP and level are preserved

### Test 4: XP System
- [ ] Check initial XP (should be 0 or loaded from DB)
- [ ] Have a conversation and earn XP
- [ ] Verify XP counter updates in header
- [ ] Verify XP counter updates in stats card
- [ ] Verify level calculation (XP/100 + 1)
- [ ] Refresh page and verify XP persists

### Test 5: Anonymous Sessions
- [ ] Open app in incognito/private window
- [ ] Verify session ID is created (check localStorage: `math_tutor_session_id`)
- [ ] Have a conversation
- [ ] Verify messages are saved with session ID
- [ ] Close and reopen - verify session persists

### Test 6: Error Handling
- [ ] Try uploading an invalid file type
- [ ] Verify error message appears
- [ ] Try chatting without API keys configured
- [ ] Verify helpful error message
- [ ] Try uploading a very large file (>5MB)
- [ ] Verify file size error

## 🔧 Prerequisites for Testing

### Required Environment Variables
```bash
# At minimum, you need ONE of these:
GROK_API_KEY=your-key-here        # Primary LLM
# OR
OPENAI_API_KEY=your-key-here      # Fallback LLM

# For vision/OCR:
OPENAI_API_KEY=your-key-here      # For image processing

# For data persistence:
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
```

### Required Supabase Setup
1. **Database Tables** (run in Supabase SQL Editor):
   ```sql
   CREATE TABLE chat_history (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     session_id TEXT,
     message TEXT,
     role TEXT CHECK (role IN ('user', 'assistant')),
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE gamestate (
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
   ```

2. **Enable Realtime** (optional but recommended):
   - Go to Supabase Dashboard → Database → Replication
   - Enable replication for `chat_history` table

## 🐛 Known Issues / Limitations

1. **Realtime subscriptions** may not work if Supabase Realtime is not enabled
2. **XP extraction** from AI responses relies on pattern matching - may not always work perfectly
3. **Anonymous sessions** are browser-specific (localStorage)
4. **No authentication required** - everything works anonymously

## 📊 Expected Behavior

### Socratic Responses
The AI should:
- ✅ Ask questions instead of giving direct answers
- ✅ Provide hints after 2+ stuck turns
- ✅ Be encouraging and playful
- ✅ Include XP mentions in responses

### XP Rewards
- ✅ +5 XP for basic participation
- ✅ +10 XP for good attempts
- ✅ +15 XP for insights/progress
- ✅ XP displayed immediately after each message

## 🎯 Success Criteria

PR #3 is successful if:
- ✅ You can have multi-turn conversations
- ✅ Chat history persists across refreshes
- ✅ XP is earned and displayed correctly
- ✅ Images can be uploaded and processed
- ✅ Anonymous sessions work without login
- ✅ All data saves to Supabase

## 🚨 Common Issues & Solutions

### Issue: "No LLM API configured"
**Solution:** Add `GROK_API_KEY` or `OPENAI_API_KEY` to `.env` file

### Issue: Messages not persisting
**Solution:** 
- Check Supabase tables are created
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Check browser console for errors

### Issue: XP not updating
**Solution:**
- Check browser console for errors
- Verify `gamestate` table exists in Supabase
- Check if XP is being saved (check Supabase table)

### Issue: Image upload fails
**Solution:**
- Verify `OPENAI_API_KEY` is set for vision API
- Check image is under 5MB
- Verify image format is supported (JPG, PNG, GIF, WebP)

---

**Ready to test?** Start with Test 1 (Basic Chat Flow) and work through each test systematically! 🚀

