# Testing Guide - Knowledge Graph & Mastery System

## What's Currently Working

### ✅ Database Setup
- Knowledge Graph tables created (`topics`, `topic_prerequisites`, `topic_encompassings`)
- Mastery tracking table created (`student_mastery`)
- CCAT topics seeded (30+ topics across 4 domains)

### ✅ Knowledge Graph System
- Topic queries and hierarchy
- Prerequisite relationships
- Encompassing relationships (for FIRe algorithm)
- Knowledge frontier calculation

### ✅ Mastery Learning System
- Mastery tracking per topic (0-100%)
- Prerequisite validation
- Advancement checks
- Domain mastery calculation

## How to Test

### 1. Test Knowledge Graph API Endpoints

#### Get All Topics
```bash
# In browser console or API client
fetch('/api/knowledge-graph/topics')
  .then(r => r.json())
  .then(console.log)
```

**Expected**: Array of ~30 topics with names, descriptions, difficulty, XP values, domains

#### Get Topics by Domain
```bash
fetch('/api/knowledge-graph/topics?domain=algebra')
  .then(r => r.json())
  .then(console.log)
```

**Expected**: Only algebra topics (Variables and Expressions, Linear Equations, etc.)

#### Get Prerequisites for a Topic
```bash
# First, get a topic ID from the topics list
# Then use it to get prerequisites
fetch('/api/knowledge-graph/prerequisites?topicId=<topic-id-from-above>')
  .then(r => r.json())
  .then(console.log)
```

**Expected**: Array of prerequisite topics (e.g., "Linear Equations: One Variable" has prerequisites)

#### Get Knowledge Frontier
```bash
# Use a test session ID
fetch('/api/knowledge-graph/frontier?sessionId=test_session_123')
  .then(r => r.json())
  .then(console.log)
```

**Expected**: Root topics (topics with no prerequisites) since no mastery exists yet

### 2. Test Mastery API Endpoints

#### Update Mastery for a Topic
```bash
# First get a topic ID
fetch('/api/knowledge-graph/topics?domain=arithmetic')
  .then(r => r.json())
  .then(data => {
    const topicId = data.topics[0].id // Get first topic
    return fetch('/api/mastery/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicId: topicId,
        masteryLevel: 75,
        sessionId: 'test_session_123'
      })
    })
  })
  .then(r => r.json())
  .then(console.log)
```

**Expected**: Success response with mastery object showing 75% mastery

#### Get Mastery
```bash
# Get mastery for specific topic
fetch('/api/mastery/get?topicId=<topic-id>&sessionId=test_session_123')
  .then(r => r.json())
  .then(console.log)

# Get all mastery records
fetch('/api/mastery/get?sessionId=test_session_123')
  .then(r => r.json())
  .then(console.log)
```

**Expected**: Mastery records with mastery_level, last_practiced, etc.

#### Check if Can Advance
```bash
# Check if student can advance to a topic
fetch('/api/mastery/can-advance?topicId=<topic-id>&sessionId=test_session_123')
  .then(r => r.json())
  .then(console.log)
```

**Expected**: 
- `canAdvance: true` if prerequisites are mastered and topic not mastered
- `canAdvance: false` if prerequisites not mastered or topic already mastered

#### Get Domain Mastery Progress
```bash
fetch('/api/mastery/domain?domain=algebra&sessionId=test_session_123')
  .then(r => r.json())
  .then(console.log)
```

**Expected**: Object with `{ total, mastered, inProgress, notStarted, percentage }`

### 3. Test Knowledge Frontier After Setting Mastery

```bash
// Step 1: Master a root topic (one with no prerequisites)
// Get "Basic Addition" topic ID
fetch('/api/knowledge-graph/topics?domain=arithmetic')
  .then(r => r.json())
  .then(data => {
    const basicAddition = data.topics.find(t => t.name === 'Basic Addition')
    return basicAddition.id
  })
  .then(topicId => {
    // Set to 100% mastery
    return fetch('/api/mastery/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicId: topicId,
        masteryLevel: 100,
        sessionId: 'test_session_123'
      })
    })
  })
  .then(() => {
    // Step 2: Check frontier again
    return fetch('/api/knowledge-graph/frontier?sessionId=test_session_123')
  })
  .then(r => r.json())
  .then(console.log)
```

**Expected**: Frontier should now include topics that have "Basic Addition" as a prerequisite

### 4. Test Using Composables in Vue Components

```vue
<script setup>
// In a Vue component (e.g., pages/index.vue or a test page)
const kg = useKnowledgeGraph()
const mastery = useMastery()

// Get all topics
const topics = await kg.getAllTopics()
console.log('All topics:', topics)

// Get frontier
const frontier = await kg.getKnowledgeFrontier(undefined, 'test_session_123')
console.log('Knowledge frontier:', frontier)

// Get mastery for a topic
const topicMastery = await mastery.getTopicMastery(
  topics[0].id,
  undefined,
  'test_session_123'
)
console.log('Topic mastery:', topicMastery)

// Update mastery
await mastery.updateMastery(
  topics[0].id,
  80,
  undefined,
  'test_session_123'
)
console.log('Mastery updated!')
</script>
```

## Test Scenarios

### Scenario 1: New Student (No Mastery)
1. Get knowledge frontier → Should return root topics (no prerequisites)
2. Get mastery for any topic → Should return `null` (no mastery record)
3. Check if can advance to root topic → Should return `true` (no prerequisites)

### Scenario 2: Student Masters Root Topic
1. Set "Basic Addition" to 100% mastery
2. Get knowledge frontier → Should include topics that require "Basic Addition"
3. Check if can advance to "Order of Operations" → Should return `true` (prerequisite mastered)

### Scenario 3: Prerequisite Chain
1. Master "Basic Addition" (100%)
2. Master "Basic Subtraction" (100%)
3. Master "Basic Multiplication" (100%)
4. Master "Basic Division" (100%)
5. Check if can advance to "Order of Operations" → Should return `true` (all prerequisites mastered)
6. Get frontier → Should include "Order of Operations"

### Scenario 4: Domain Mastery
1. Set mastery for some algebra topics (various levels)
2. Get domain mastery for "algebra" → Should show progress breakdown
3. Percentage should calculate correctly (mastered/total)

## Common Issues & Solutions

### Issue: "relation topics does not exist"
**Solution**: Run the database setup SQL from `SETUP-DATABASE.md`

### Issue: "No topics found"
**Solution**: Run the seeding script `server/utils/seed-ccat-topics.sql`

### Issue: "Frontier is empty"
**Solution**: This is normal for new students! Root topics (no prerequisites) should be in frontier. Check by getting topics with no prerequisites.

### Issue: API returns 404
**Solution**: 
- Make sure you're running the Nuxt dev server (`npm run dev`)
- Check that the API files are in the correct location
- Verify the route matches the file path

## Quick Verification Queries

Run these in Supabase SQL Editor to verify data:

```sql
-- Check topics were created
SELECT COUNT(*) FROM topics;
-- Should return ~30

-- Check prerequisites exist
SELECT COUNT(*) FROM topic_prerequisites;
-- Should return many relationships

-- Check encompassings exist
SELECT COUNT(*) FROM topic_encompassings;
-- Should return several relationships

-- Check a topic and its prerequisites
SELECT 
  t.name as topic,
  p.name as prerequisite
FROM topics t
JOIN topic_prerequisites tp ON t.id = tp.topic_id
JOIN topics p ON tp.prerequisite_id = p.id
WHERE t.name = 'Order of Operations';
-- Should show Basic Addition, Subtraction, Multiplication, Division
```

## Next Steps After Testing

Once you've verified everything works:
- PR #10: Diagnostic & Placement (set initial mastery from diagnostic)
- PR #11: Spaced Repetition (FIRe algorithm)
- PR #12: Knowledge Points (update mastery on KP completion)
- PR #13: Retrieval Practice (update mastery from quiz results)


