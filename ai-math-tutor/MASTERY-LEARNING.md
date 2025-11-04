# Mastery Learning System Documentation

## Overview

The Mastery Learning System enforces 100% mastery before advancement, ensuring students truly understand each topic before moving to the next. This is a core principle of Math Academy's pedagogy.

## Key Concepts

### Mastery Level
- **Range**: 0-100%
- **100% = Mastered**: Student has fully mastered the topic and can advance
- **< 100% = In Progress**: Student is learning but not yet ready to advance
- **0% = Not Started**: Student hasn't attempted this topic yet

### Advancement Rules
1. **Prerequisites Must Be Mastered**: All prerequisite topics must be at 100% mastery
2. **Topic Must Not Be Mastered**: Student cannot advance to a topic they've already mastered
3. **Frontier Only**: System only serves lessons at the knowledge frontier

## Usage

### Composable: `useMastery`

```typescript
import { useMastery } from '~/composables/useMastery'

const mastery = useMastery()

// Get mastery for a specific topic
const topicMastery = await mastery.getTopicMastery(topicId, userId, sessionId)

// Update mastery level
await mastery.updateMastery(topicId, 75, userId, sessionId) // 75% mastery

// Set to 100% (mastered)
await mastery.setMastered(topicId, userId, sessionId)

// Increment mastery (add to current)
await mastery.incrementMastery(topicId, 10, userId, sessionId) // +10%

// Check if topic is mastered
const isMastered = await mastery.isMastered(topicId, userId, sessionId)

// Check if can advance to topic (prerequisites mastered, topic not mastered)
const canAdvance = await mastery.canAdvanceToTopic(topicId, userId, sessionId)

// Get mastery progress for a domain
const domainProgress = await mastery.getDomainMastery('algebra', userId, sessionId)
// Returns: { total, mastered, inProgress, notStarted, percentage }
```

### API Endpoints

#### Update Mastery
```
POST /api/mastery/update
Body: { topicId, masteryLevel (0-100), userId?, sessionId? }
```

#### Get Mastery
```
GET /api/mastery/get?topicId=<uuid>&userId=<uuid>&sessionId=<string>
GET /api/mastery/get?userId=<uuid>&sessionId=<string> (all topics)
```

#### Check Advancement
```
GET /api/mastery/can-advance?topicId=<uuid>&userId=<uuid>&sessionId=<string>
Returns: { canAdvance, prerequisitesMastered, isAlreadyMastered }
```

#### Get Domain Progress
```
GET /api/mastery/domain?domain=algebra&userId=<uuid>&sessionId=<string>
Returns: { total, mastered, inProgress, notStarted, percentage }
```

## Mastery Calculation

Mastery can be calculated based on:
- **Quiz Performance**: Accuracy on retrieval practice quizzes
- **Lesson Completion**: Successfully completing Knowledge Points
- **Problem Solving**: Correctly solving practice problems
- **Timed Assessments**: Performance on automaticity checks

Example calculation:
```typescript
// After quiz: 80% accuracy = 80% mastery
await mastery.updateMastery(topicId, 80, userId, sessionId)

// After more practice: increment to 85%
await mastery.incrementMastery(topicId, 5, userId, sessionId)

// After final assessment: set to 100% (mastered)
await mastery.setMastered(topicId, userId, sessionId)
```

## Knowledge Frontier

The frontier is calculated as:
1. Topics where **all prerequisites are mastered** (or topic has no prerequisites)
2. AND the topic itself is **not yet mastered** (< 100%)

This ensures students only work at the boundary between known and unknown.

## Integration with Other Systems

### Knowledge Graph
- Frontier calculation uses mastery data
- Prerequisite checks use mastery levels

### Spaced Repetition (Future)
- `next_review` field tracks when to review
- Mastery level affects review scheduling

### Diagnostic System (Future)
- Initial mastery levels set from diagnostic results
- Placement identifies starting frontier

## Next Steps

- **PR #10**: Diagnostic & Placement (set initial mastery)
- **PR #11**: Spaced Repetition (use `next_review` field)
- **PR #12**: Knowledge Points (update mastery on completion)
- **PR #13**: Retrieval Practice (update mastery from quiz results)

