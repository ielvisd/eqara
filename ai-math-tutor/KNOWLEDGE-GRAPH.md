# Knowledge Graph System Documentation

## Overview

The Knowledge Graph system organizes math topics with prerequisite and encompassing relationships, enabling mastery-based learning where students only work at their knowledge frontier.

## Setup

### 1. Database Setup

Run the SQL from `SETUP-DATABASE.md` in your Supabase SQL Editor to create the Knowledge Graph tables.

### 2. Seed CCAT Topics

Run the seeding script to populate initial CCAT topics:

```sql
-- Copy and paste the contents of server/utils/seed-ccat-topics.sql
-- into Supabase SQL Editor and run
```

This will create:
- **Arithmetic Foundations**: Basic operations, order of operations, mental math
- **Algebra Fundamentals**: Variables, linear equations, equation solving
- **Proportions & Ratios**: Fractions, ratios, proportions, percentages
- **Word Problems**: Problem decomposition, equation setup, multi-step problems

## Usage

### Composable: `useKnowledgeGraph`

```typescript
import { useKnowledgeGraph } from '~/composables/useKnowledgeGraph'

const kg = useKnowledgeGraph()

// Get all topics
const topics = await kg.getAllTopics()

// Get topics by domain
const algebraTopics = await kg.getTopicsByDomain('algebra')

// Get prerequisites for a topic
const prerequisites = await kg.getPrerequisites(topicId)

// Get encompassed topics (simpler topics that this advanced topic includes)
const encompassed = await kg.getEncompassedTopics(topicId)

// Calculate knowledge frontier (topics ready to learn)
const frontier = await kg.getKnowledgeFrontier(userId, sessionId)

// Get student mastery for a topic
const mastery = await kg.getStudentMastery(topicId, userId, sessionId)
```

### API Endpoints

#### Get Topics
```
GET /api/knowledge-graph/topics?domain=algebra
```

#### Get Prerequisites
```
GET /api/knowledge-graph/prerequisites?topicId=<uuid>
```

#### Get Encompassings
```
GET /api/knowledge-graph/encompassings?topicId=<uuid>
```

#### Get Knowledge Frontier
```
GET /api/knowledge-graph/frontier?userId=<uuid>&sessionId=<string>
```

## Knowledge Frontier Algorithm

The knowledge frontier is calculated as:
- Topics where **all prerequisites are mastered** (or topic has no prerequisites)
- AND the topic itself is **not yet mastered** (< 100% mastery)

This ensures students only work at the boundary between what they know and don't know.

## Prerequisites vs Encompassings

### Prerequisites
- **Direction**: Must be mastered **before** the topic
- **Purpose**: Ensures foundational knowledge
- **Example**: "Basic Addition" is a prerequisite for "Order of Operations"

### Encompassings
- **Direction**: Advanced topic **includes** simpler topics
- **Purpose**: Enables FIRe algorithm (implicit repetition)
- **Example**: "Multi-Step Word Problems" encompasses "Problem Decomposition"

## Next Steps

- **PR #9**: Mastery Learning System (track mastery per topic)
- **PR #10**: Diagnostic & Placement (identify initial frontier)
- **PR #11**: Spaced Repetition (FIRe algorithm using encompassings)
- **PR #12**: Knowledge Points (micro-scaffolding within topics)
- **PR #13**: Retrieval Practice (quizzes for mastery validation)

## CCAT Topic Structure

The seeded topics are organized for CCAT preparation:

```
Arithmetic Foundations
├── Basic Operations (Addition, Subtraction, Multiplication, Division)
├── Order of Operations
├── Mental Math Strategies
├── Working with Integers
└── Number Properties

Algebra Fundamentals
├── Variables and Expressions
├── Linear Equations: One Variable
├── Linear Equations: Two Variables
├── Equation Solving Strategies
├── Simplifying Expressions
└── Word Problems to Equations

Proportions & Ratios
├── Understanding Fractions
├── Fraction Operations
├── Ratios and Rates
├── Proportions
├── Percentages
└── Percentage Problems

Word Problems
├── Problem Decomposition
├── Identifying Key Information
├── Setting Up Equations from Words
├── Solving Word Problems
├── Multi-Step Word Problems
└── Verification and Checking
```

