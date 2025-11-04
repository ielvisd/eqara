# Verification Guide - Knowledge Graph & Mastery System

This guide walks you through verifying that all critical functionality works correctly before moving to the next PRs.

## Prerequisites

Before starting, make sure:
- ✅ Database tables are created (`SETUP-DATABASE.md`)
- ✅ Topics are seeded (`server/utils/seed-ccat-topics.sql`)
- ✅ API endpoints are working (no 500 errors)

---

## Verification Flow

### Step 1: Verify Root Topics Have No Prerequisites

**Goal:** Confirm that root topics (starting points in the knowledge graph) have no prerequisites.

**Test:**
```javascript
// Get all topics
const topics = await fetch('/api/knowledge-graph/topics').then(r => r.json())

// Find root topics (topics with no prerequisites)
const rootTopics = []
for (const topic of topics.topics) {
  const prereqs = await fetch(`/api/knowledge-graph/prerequisites?topicId=${topic.id}`).then(r => r.json())
  if (prereqs.prerequisites.length === 0) {
    rootTopics.push({ id: topic.id, name: topic.name, domain: topic.domain })
  }
}

console.log('Root topics (no prerequisites):', rootTopics)
```

**Expected Result:**
- ✅ Should find several root topics (typically 4-8 topics)
- ✅ All root topics should have `prerequisites.length === 0`
- ✅ Common root topics might include: "Basic Addition", "Basic Subtraction", "Variables and Expressions", etc.

**If it fails:**
- Check that topics are seeded correctly
- Verify prerequisite relationships in database: `SELECT * FROM topic_prerequisites`

---

### Step 2: Verify Mastering a Root Topic Adds New Topics to Frontier

**Goal:** Confirm that when you master a root topic, the frontier updates to include topics that depend on it.

**Test:**
```javascript
const sessionId = 'verification_test_' + Date.now()

// Step 2a: Get initial frontier (should show root topics)
const frontierBefore = await fetch(`/api/knowledge-graph/frontier?sessionId=${sessionId}`).then(r => r.json())
console.log('📊 Frontier BEFORE mastering:', {
  count: frontierBefore.count,
  topics: frontierBefore.frontierTopics.map(t => t.name)
})

// Step 2b: Pick a root topic and master it (100%)
const rootTopic = frontierBefore.frontierTopics[0] // Pick first root topic
console.log(`\n🎯 Mastering root topic: "${rootTopic.name}"`)

const masteryResult = await fetch('/api/mastery/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topicId: rootTopic.id,
    masteryLevel: 100,
    sessionId
  })
}).then(r => r.json())

console.log('✅ Mastery updated:', masteryResult.success)

// Step 2c: Get frontier AFTER mastering
const frontierAfter = await fetch(`/api/knowledge-graph/frontier?sessionId=${sessionId}`).then(r => r.json())
console.log('\n📊 Frontier AFTER mastering:', {
  count: frontierAfter.count,
  topics: frontierAfter.frontierTopics.map(t => t.name)
})

// Step 2d: Verify the mastered topic is NOT in frontier (it's completed)
const masteredStillInFrontier = frontierAfter.frontierTopics.some(t => t.id === rootTopic.id)
console.log('\n✅ Verification:', {
  masteredTopicRemoved: !masteredStillInFrontier,
  frontierIncreased: frontierAfter.count >= frontierBefore.count,
  newTopicsAdded: frontierAfter.frontierTopics.length > 0
})
```

**Expected Result:**
- ✅ The mastered root topic should NOT appear in the frontier anymore
- ✅ The frontier should now include NEW topics that require this root topic as a prerequisite
- ✅ Frontier count should increase or stay the same (never decrease)

**If it fails:**
- Check that prerequisite relationships exist: `SELECT * FROM topic_prerequisites WHERE prerequisite_id = '<root_topic_id>'`
- Verify mastery was saved: `SELECT * FROM student_mastery WHERE topic_id = '<root_topic_id>'`

---

### Step 3: Verify canAdvance Returns False for Mastered Topics

**Goal:** Confirm that students cannot "advance" to topics they've already mastered.

**Test:**
```javascript
const sessionId = 'verification_test_' + Date.now()

// Step 3a: Get a topic and master it
const topics = await fetch('/api/knowledge-graph/topics').then(r => r.json())
const testTopic = topics.topics[0]

console.log(`🎯 Testing topic: "${testTopic.name}"`)

// Master it to 100%
await fetch('/api/mastery/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topicId: testTopic.id,
    masteryLevel: 100,
    sessionId
  })
})

// Step 3b: Check canAdvance for the mastered topic
const canAdvance = await fetch(`/api/mastery/can-advance?topicId=${testTopic.id}&sessionId=${sessionId}`).then(r => r.json())

console.log('📊 canAdvance result:', {
  canAdvance: canAdvance.canAdvance,
  isAlreadyMastered: canAdvance.isAlreadyMastered,
  prerequisitesMastered: canAdvance.prerequisitesMastered
})

// Step 3c: Verify
console.log('\n✅ Verification:', {
  canAdvanceIsFalse: canAdvance.canAdvance === false,
  isAlreadyMasteredIsTrue: canAdvance.isAlreadyMastered === true,
  testPassed: canAdvance.canAdvance === false && canAdvance.isAlreadyMastered === true
})
```

**Expected Result:**
- ✅ `canAdvance` should be `false`
- ✅ `isAlreadyMastered` should be `true`
- ✅ `prerequisitesMastered` should be `true` (if it had prerequisites)

**If it fails:**
- Check mastery record exists: `SELECT * FROM student_mastery WHERE topic_id = '<topic_id>' AND mastery_level = 100`
- Verify the `isMastered` function in `useMastery.ts` is checking `mastery_level >= 100`

---

### Step 4: Verify Domain Mastery Percentages Are Correct

**Goal:** Confirm that domain mastery calculations are accurate.

**Test:**
```javascript
const sessionId = 'verification_test_' + Date.now()
const domain = 'arithmetic' // or 'algebra', 'proportions', 'word_problems'

// Step 4a: Get all topics in the domain
const domainTopics = await fetch(`/api/knowledge-graph/topics?domain=${domain}`).then(r => r.json())
console.log(`📚 ${domain} topics:`, domainTopics.topics.length)

// Step 4b: Master some topics (not all)
const topicsToMaster = domainTopics.topics.slice(0, 3) // Master first 3
console.log(`\n🎯 Mastering ${topicsToMaster.length} topics:`)

for (const topic of topicsToMaster) {
  await fetch('/api/mastery/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topicId: topic.id,
      masteryLevel: 100,
      sessionId
    })
  })
  console.log(`  ✅ Mastered: ${topic.name}`)
}

// Step 4c: Set partial mastery on one more topic
const partialTopic = domainTopics.topics[3]
await fetch('/api/mastery/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topicId: partialTopic.id,
    masteryLevel: 75,
    sessionId
  })
})
console.log(`  📊 Partial mastery (75%): ${partialTopic.name}`)

// Step 4d: Get domain mastery
const domainMastery = await fetch(`/api/mastery/domain?domain=${domain}&sessionId=${sessionId}`).then(r => r.json())

console.log('\n📊 Domain Mastery Results:', domainMastery.mastery)

// Step 4e: Manual calculation to verify
const total = domainTopics.topics.length
const mastered = topicsToMaster.length // 3 topics at 100%
const inProgress = 1 // 1 topic at 75%
const notStarted = total - mastered - inProgress
const expectedPercentage = Math.round((mastered / total) * 100)

console.log('\n✅ Verification:', {
  totalMatches: domainMastery.mastery.total === total,
  masteredMatches: domainMastery.mastery.mastered === mastered,
  inProgressMatches: domainMastery.mastery.inProgress === inProgress,
  notStartedMatches: domainMastery.mastery.notStarted === notStarted,
  percentageMatches: domainMastery.mastery.percentage === expectedPercentage,
  testPassed: domainMastery.mastery.percentage === expectedPercentage
})
```

**Expected Result:**
- ✅ `total` should match the number of topics in the domain
- ✅ `mastered` should count only topics at 100%
- ✅ `inProgress` should count topics > 0% but < 100%
- ✅ `notStarted` should count topics at 0% (or no mastery record)
- ✅ `percentage` should be `Math.round((mastered / total) * 100)`

**If it fails:**
- Check mastery records: `SELECT * FROM student_mastery WHERE session_id = '<session_id>'`
- Verify the calculation logic in `getDomainMastery` function

---

### Step 5: Verify Prerequisite Chains Work Correctly

**Goal:** Confirm that prerequisite relationships are enforced - you can't advance without mastering prerequisites.

**Test:**
```javascript
const sessionId = 'verification_test_' + Date.now()

// Step 5a: Find a topic with prerequisites
const topics = await fetch('/api/knowledge-graph/topics').then(r => r.json())

let topicWithPrereqs = null
for (const topic of topics.topics) {
  const prereqs = await fetch(`/api/knowledge-graph/prerequisites?topicId=${topic.id}`).then(r => r.json())
  if (prereqs.prerequisites.length > 0) {
    topicWithPrereqs = {
      topic,
      prerequisites: prereqs.prerequisites
    }
    break
  }
}

if (!topicWithPrereqs) {
  console.log('❌ No topics with prerequisites found!')
} else {
  console.log(`🎯 Testing topic: "${topicWithPrereqs.topic.name}"`)
  console.log(`📋 Has ${topicWithPrereqs.prerequisites.length} prerequisites:`, 
    topicWithPrereqs.prerequisites.map(p => p.name))

  // Step 5b: Check canAdvance BEFORE mastering prerequisites
  const canAdvanceBefore = await fetch(
    `/api/mastery/can-advance?topicId=${topicWithPrereqs.topic.id}&sessionId=${sessionId}`
  ).then(r => r.json())

  console.log('\n📊 BEFORE mastering prerequisites:', {
    canAdvance: canAdvanceBefore.canAdvance,
    prerequisitesMastered: canAdvanceBefore.prerequisitesMastered
  })

  // Step 5c: Master ALL prerequisites
  console.log('\n🎯 Mastering all prerequisites...')
  for (const prereq of topicWithPrereqs.prerequisites) {
    await fetch('/api/mastery/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicId: prereq.id,
        masteryLevel: 100,
        sessionId
      })
    })
    console.log(`  ✅ Mastered: ${prereq.name}`)
  }

  // Step 5d: Check canAdvance AFTER mastering prerequisites
  const canAdvanceAfter = await fetch(
    `/api/mastery/can-advance?topicId=${topicWithPrereqs.topic.id}&sessionId=${sessionId}`
  ).then(r => r.json())

  console.log('\n📊 AFTER mastering prerequisites:', {
    canAdvance: canAdvanceAfter.canAdvance,
    prerequisitesMastered: canAdvanceAfter.prerequisitesMastered
  })

  // Step 5e: Verify
  console.log('\n✅ Verification:', {
    blockedBeforeMastery: canAdvanceBefore.canAdvance === false,
    allowedAfterMastery: canAdvanceAfter.canAdvance === true,
    prerequisitesCheckWorks: !canAdvanceBefore.prerequisitesMastered && canAdvanceAfter.prerequisitesMastered,
    testPassed: canAdvanceBefore.canAdvance === false && canAdvanceAfter.canAdvance === true
  })

  // Step 5f: Verify the topic appears in frontier after mastering prerequisites
  const frontier = await fetch(`/api/knowledge-graph/frontier?sessionId=${sessionId}`).then(r => r.json())
  const topicInFrontier = frontier.frontierTopics.some(t => t.id === topicWithPrereqs.topic.id)
  
  console.log('\n✅ Frontier Verification:', {
    topicAppearsInFrontier: topicInFrontier,
    testPassed: topicInFrontier === true
  })
}
```

**Expected Result:**
- ✅ `canAdvance` should be `false` BEFORE mastering prerequisites
- ✅ `canAdvance` should be `true` AFTER mastering all prerequisites
- ✅ The topic should appear in the frontier after prerequisites are mastered
- ✅ `prerequisitesMastered` should reflect the correct state

**If it fails:**
- Check prerequisite relationships: `SELECT * FROM topic_prerequisites WHERE topic_id = '<topic_id>'`
- Verify mastery records exist for prerequisites
- Check the `arePrerequisitesMastered` function logic

---

## Complete Verification Script

Run this all-in-one script to verify everything:

```javascript
(async () => {
  const sessionId = 'complete_verification_' + Date.now()
  console.log('🚀 Starting Complete Verification Suite\n')
  
  // Helper
  const test = async (name, testFn) => {
    try {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`TEST: ${name}`)
      console.log('='.repeat(60))
      const result = await testFn()
      console.log(`✅ ${name}: PASSED`)
      return { name, passed: true, result }
    } catch (error) {
      console.error(`❌ ${name}: FAILED`, error)
      return { name, passed: false, error: error.message }
    }
  }

  const results = []

  // Test 1: Root Topics
  results.push(await test('Root Topics Have No Prerequisites', async () => {
    const topics = await fetch('/api/knowledge-graph/topics').then(r => r.json())
    const rootTopics = []
    for (const topic of topics.topics.slice(0, 10)) {
      const prereqs = await fetch(`/api/knowledge-graph/prerequisites?topicId=${topic.id}`).then(r => r.json())
      if (prereqs.prerequisites.length === 0) rootTopics.push(topic)
    }
    if (rootTopics.length === 0) throw new Error('No root topics found')
    return { count: rootTopics.length, topics: rootTopics.map(t => t.name) }
  }))

  // Test 2: Frontier Updates
  results.push(await test('Frontier Updates After Mastering Root Topic', async () => {
    const frontierBefore = await fetch(`/api/knowledge-graph/frontier?sessionId=${sessionId}`).then(r => r.json())
    const rootTopic = frontierBefore.frontierTopics[0]
    await fetch('/api/mastery/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId: rootTopic.id, masteryLevel: 100, sessionId })
    })
    const frontierAfter = await fetch(`/api/knowledge-graph/frontier?sessionId=${sessionId}`).then(r => r.json())
    const stillInFrontier = frontierAfter.frontierTopics.some(t => t.id === rootTopic.id)
    if (stillInFrontier) throw new Error('Mastered topic still in frontier')
    return { before: frontierBefore.count, after: frontierAfter.count }
  }))

  // Test 3: canAdvance for Mastered Topics
  results.push(await test('canAdvance Returns False for Mastered Topics', async () => {
    const topics = await fetch('/api/knowledge-graph/topics').then(r => r.json())
    const testTopic = topics.topics[0]
    await fetch('/api/mastery/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId: testTopic.id, masteryLevel: 100, sessionId })
    })
    const canAdvance = await fetch(`/api/mastery/can-advance?topicId=${testTopic.id}&sessionId=${sessionId}`).then(r => r.json())
    if (canAdvance.canAdvance !== false) throw new Error('canAdvance should be false for mastered topic')
    if (canAdvance.isAlreadyMastered !== true) throw new Error('isAlreadyMastered should be true')
    return canAdvance
  }))

  // Test 4: Domain Mastery
  results.push(await test('Domain Mastery Calculations', async () => {
    const domain = 'arithmetic'
    const domainTopics = await fetch(`/api/knowledge-graph/topics?domain=${domain}`).then(r => r.json())
    const topicsToMaster = domainTopics.topics.slice(0, 2)
    for (const topic of topicsToMaster) {
      await fetch('/api/mastery/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic.id, masteryLevel: 100, sessionId })
      })
    }
    const domainMastery = await fetch(`/api/mastery/domain?domain=${domain}&sessionId=${sessionId}`).then(r => r.json())
    const expectedPercentage = Math.round((topicsToMaster.length / domainTopics.topics.length) * 100)
    if (domainMastery.mastery.percentage !== expectedPercentage) {
      throw new Error(`Percentage mismatch: expected ${expectedPercentage}, got ${domainMastery.mastery.percentage}`)
    }
    return domainMastery.mastery
  }))

  // Test 5: Prerequisite Chains
  results.push(await test('Prerequisite Chain Enforcement', async () => {
    const topics = await fetch('/api/knowledge-graph/topics').then(r => r.json())
    let topicWithPrereqs = null
    for (const topic of topics.topics) {
      const prereqs = await fetch(`/api/knowledge-graph/prerequisites?topicId=${topic.id}`).then(r => r.json())
      if (prereqs.prerequisites.length > 0) {
        topicWithPrereqs = { topic, prerequisites: prereqs.prerequisites }
        break
      }
    }
    if (!topicWithPrereqs) throw new Error('No topics with prerequisites found')
    
    const canAdvanceBefore = await fetch(
      `/api/mastery/can-advance?topicId=${topicWithPrereqs.topic.id}&sessionId=${sessionId}`
    ).then(r => r.json())
    
    for (const prereq of topicWithPrereqs.prerequisites) {
      await fetch('/api/mastery/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: prereq.id, masteryLevel: 100, sessionId })
      })
    }
    
    const canAdvanceAfter = await fetch(
      `/api/mastery/can-advance?topicId=${topicWithPrereqs.topic.id}&sessionId=${sessionId}`
    ).then(r => r.json())
    
    if (canAdvanceBefore.canAdvance !== false) throw new Error('Should be blocked before prerequisites')
    if (canAdvanceAfter.canAdvance !== true) throw new Error('Should be allowed after prerequisites')
    return { before: canAdvanceBefore.canAdvance, after: canAdvanceAfter.canAdvance }
  }))

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('VERIFICATION SUMMARY')
  console.log('='.repeat(60))
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  results.forEach(r => {
    console.log(`${r.passed ? '✅' : '❌'} ${r.name}`)
    if (!r.passed) console.log(`   Error: ${r.error}`)
  })
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${results.length} tests`)
  
  if (failed === 0) {
    console.log('\n🎉 ALL VERIFICATIONS PASSED! Ready to move to next PRs.')
  } else {
    console.log('\n⚠️  Some verifications failed. Fix issues before proceeding.')
  }
})()
```

---

## Quick Database Verification

If you want to verify data directly in Supabase SQL Editor:

```sql
-- Check topics exist
SELECT COUNT(*) as topic_count FROM topics;
-- Should return ~26-30

-- Check prerequisites exist
SELECT COUNT(*) as prereq_count FROM topic_prerequisites;
-- Should return many relationships

-- Check root topics (topics with no prerequisites)
SELECT t.id, t.name, t.domain
FROM topics t
LEFT JOIN topic_prerequisites tp ON t.id = tp.topic_id
WHERE tp.id IS NULL
ORDER BY t.domain, t.name;
-- Should show root topics

-- Check mastery records
SELECT COUNT(*) as mastery_count FROM student_mastery;
-- Should show your test mastery records

-- Check a specific topic's prerequisites
SELECT 
  t.name as topic,
  p.name as prerequisite
FROM topics t
JOIN topic_prerequisites tp ON t.id = tp.topic_id
JOIN topics p ON tp.prerequisite_id = p.id
WHERE t.name = 'Order of Operations';
-- Should show prerequisite topics
```

---

## Next Steps After Verification

Once all verifications pass:

1. ✅ **PR #10**: Diagnostic & Placement (set initial mastery from diagnostic)
2. ✅ **PR #11**: Spaced Repetition (FIRe algorithm)
3. ✅ **PR #12**: Knowledge Points (update mastery on KP completion)
4. ✅ **PR #13**: Retrieval Practice (update mastery from quiz results)

---

**Questions?** Check the error messages in the console and verify your database setup matches the expected structure.

