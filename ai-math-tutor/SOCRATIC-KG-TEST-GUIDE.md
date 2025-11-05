# Socratic KG Integration - Testing Guide

This guide helps you test all the Knowledge Graph-aware Socratic features implemented in PR #4.

## Prerequisites

Before testing, ensure:
1. Database tables are set up (run SQL from `SETUP-DATABASE.md`)
2. CCAT topics are seeded (run `server/utils/seed-ccat-topics.sql`)
3. At least one diagnostic test has been completed to establish mastery levels
4. `GROK_API_KEY` or `OPENAI_API_KEY` is configured in `.env`

## Test Scenarios

### 1. ✅ KG Context Retrieval

**Goal:** Verify the chat API retrieves and uses KG context.

**Steps:**
1. Navigate to the main chat page (`/`)
2. Enter a math problem: `Solve for x: 2x + 5 = 15`
3. Check browser console for KG debug logs:
   ```
   [KG Debug] {
     topicDetected: "Linear Equations" or similar
     topicDomain: "algebra"
     mastery: 0-100 (depending on diagnostic results)
     hasPrerequisites: number
     stuckTurns: 0
   }
   ```

**Expected Result:**
- Console shows topic detection working
- AI response is contextually aware of the topic
- No errors in console

---

### 2. ✅ Stuck Turn Tracking

**Goal:** Verify the system tracks when students are stuck.

**Steps:**
1. Start with a problem: `What is 15% of 80?`
2. When AI asks a question, respond with: `I don't know`
3. Respond again with: `idk`
4. Check console for stuck turn count increasing
5. After 2nd stuck turn, a **hint banner** should appear above chat

**Expected Result:**
- Console shows `stuckTurns: 2` or higher
- Blue hint banner appears: "💡 Hint Available"
- AI response includes prerequisite references (if weak prerequisites exist)

---

### 3. ✅ Prerequisite-Aware Hints

**Goal:** Test that hints reference prerequisite topics when student is stuck.

**Setup:**
- Use a topic with prerequisites (e.g., "Solving Linear Equations" requires "Order of Operations")
- Have low mastery (<80%) on at least one prerequisite

**Steps:**
1. Start problem: `Solve: 3x - 7 = 14`
2. Respond with "I don't know" twice
3. On 3rd response, AI should provide a hint that mentions a prerequisite topic

**Expected Result:**
- AI response includes phrases like:
  - "Remember our foundation with [Prerequisite Topic]?"
  - "Think back to [Prerequisite Topic]"
  - "This builds on [Prerequisite Topic]"
- Hint badge (💡 Hint) appears on the message
- Console shows: `shouldTriggerHint: true` and `weakPrerequisites: [...]`

**Debug Check:**
```javascript
// In console:
[Hint Trigger] {
  stuckTurns: 2+,
  weakPrerequisites: ["Topic Name (XX%)"],
  systemPromptIncludesHint: true
}
```

---

### 4. ✅ Mastery-Based Difficulty Adjustment

**Goal:** Verify scaffolding adjusts based on mastery level.

**Test Cases:**

#### Case A: Low Mastery (0-39%)
1. Work on a new topic (0% mastery)
2. AI should provide:
   - Very small steps (4-5 steps)
   - Explicit guidance
   - Frequent check-ins
   - Worked examples

#### Case B: Medium Mastery (40-79%)
1. Work on a partially learned topic
2. AI should provide:
   - Moderate steps (2-3 steps)
   - Balanced guidance
   - Some discovery encouraged

#### Case C: High Mastery (80-100%)
1. Work on a mastered topic
2. AI should:
   - Challenge with complex questions
   - Provide minimal hints
   - Ask open-ended questions
   - Encourage independent work

**Expected Result:**
- Console shows scaffolding calculation:
  ```
  ADAPTIVE SCAFFOLDING: Minimal/Moderate/Maximum scaffolding
  ```
- AI response tone and complexity matches mastery level

---

### 5. ✅ Remediation Flow

**Goal:** Test the remediation system when student fails a lesson twice.

**Steps:**
1. Work on a challenging topic with weak prerequisites
2. Get stuck (say "I don't know") 5+ times
3. Remediation banner should appear
4. AI should suggest reviewing prerequisite topics

**Expected Result:**
- After 5+ stuck turns, **purple remediation banner** appears:
  - "🎯 Let's Build Stronger Foundations"
- AI response mentions:
  - Taking a consolidation break
  - Reviewing prerequisite topics by name
  - Building stronger foundations
- Remediation badge (🎯 Foundation) appears on messages
- Console shows:
  ```
  🚨 REMEDIATION REQUIRED: Lesson failed X time(s)
  Prerequisites to review: [...]
  ```

---

### 6. ✅ Prompt Engineering with KG Context

**Goal:** Verify LLM prompts include comprehensive KG context.

**Steps:**
1. Start a problem with a topic that has prerequisites
2. Check the system prompt sent to the LLM (view network request in DevTools)
3. Inspect the prompt for KG context sections

**Expected Prompt Content:**
```
KNOWLEDGE GRAPH CONTEXT (Mastery Learning System):
- Current Topic: "Topic Name" (Domain: algebra, Difficulty: 5/10)
- Current Topic Mastery: XX% [status]
- Prerequisites for this topic:
  • Prerequisite 1: XX% [status]
  • Prerequisite 2: XX% [status]

PEDAGOGICAL GUIDANCE:
- ADAPTIVE SCAFFOLDING: [level] scaffolding
  [guidance text]
- If student struggles, identify prerequisite gaps
```

**Expected Result:**
- System prompt is comprehensive and contextual
- KG state is clearly communicated to LLM
- Mastery levels are included
- Scaffolding guidance is present

---

## UI Visual Indicators

### Hint Banner (Blue)
- **Trigger:** 2+ stuck turns
- **Location:** Above chat messages
- **Icon:** 💡
- **Message:** "Feeling stuck? I can help by reminding you of the foundations..."

### Remediation Banner (Purple)
- **Trigger:** 5+ stuck turns OR explicit remediation detected
- **Location:** Above chat messages  
- **Icon:** 🎯
- **Message:** "This topic is challenging right now. Let's review prerequisite topics..."

### Message Badges
- **💡 Hint:** Appears on messages containing hint keywords
- **🎯 Foundation:** Appears on messages mentioning prerequisite review

---

## Integration Test Flow

**Complete end-to-end test:**

1. ✅ **Start Fresh**
   - Complete diagnostic test
   - Establish mastery levels for topics

2. ✅ **Test Normal Flow**
   - Solve a problem at your knowledge frontier
   - Verify appropriate scaffolding
   - Confirm XP and mastery updates

3. ✅ **Test Stuck Detection**
   - Start a harder problem
   - Say "I don't know" 2 times
   - Verify hint banner appears
   - Verify AI provides prerequisite-aware hint

4. ✅ **Test Remediation**
   - Continue being stuck (5+ turns)
   - Verify remediation banner appears
   - Verify AI suggests prerequisite review
   - Verify mastery system tracks this

5. ✅ **Test Recovery**
   - Reset conversation
   - Solve a simpler (prerequisite) problem
   - Verify mastery increases
   - Return to original problem
   - Verify scaffolding adjusts

---

## Console Debug Commands

Use these in the browser console for debugging:

```javascript
// Check current session mastery
const sessionId = localStorage.getItem('chat-session-id')
console.log('Session ID:', sessionId)

// View all messages
console.log('Messages:', messages.value)

// Check stuck turn count
console.log('Stuck Turns:', stuckTurnCount.value)

// Check banner states
console.log('Show Hint Banner:', showHintBanner.value)
console.log('Show Remediation Banner:', showRemediationBanner.value)
```

---

## Success Criteria

All features working correctly when:

- ✅ KG context is retrieved and included in prompts
- ✅ Stuck turns are accurately counted
- ✅ Hints trigger after 2 stuck turns
- ✅ Hints reference prerequisite topics by name
- ✅ Remediation triggers after 5+ stuck turns or 2 failures
- ✅ Scaffolding adjusts based on mastery level
- ✅ UI banners appear at correct times
- ✅ Message badges display on relevant messages
- ✅ No console errors during normal flow
- ✅ System feels adaptive and personalized

---

## Known Limitations

1. **Remediation persistence:** Currently uses in-memory tracking; resets on page refresh
2. **Topic detection:** Pattern-based; may not detect all problem types perfectly
3. **LLM adherence:** Hints depend on LLM following prompt instructions
4. **Prerequisite data:** Requires CCAT topics to be seeded with proper relationships

---

## Troubleshooting

### KG context not appearing
- Verify Supabase connection
- Check that CCAT topics are seeded
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

### Hints not triggering
- Check console for `stuckTurns` count
- Verify weak prerequisites exist (< 80% mastery)
- Check system prompt includes hint instructions

### Remediation not working
- Verify stuck turn count reaches 5+
- Check console for remediation status logs
- Ensure prerequisite relationships are in database

### No topic detection
- Problem text may not match patterns
- Add more specific math notation to problem
- Check console for `topicDetected: 'none'`

---

## Next Steps After Testing

Once all tests pass:
1. Mark PR #4 complete ✅
2. Move to PR #5 (UI Polish & Quiz Interface)
3. Consider adding E2E Playwright tests for critical flows
4. Document any edge cases discovered
5. Plan for persistent remediation tracking in future PR

---

**Testing completed? Mark the TODO as done and celebrate! 🎉**

