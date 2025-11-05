# 🎓 Eqara - AI Math Tutor

**Master Math. At Your Frontier.**

Eqara is an AI-powered math tutoring platform that combines evidence-based pedagogy with modern AI technology to deliver individualized, mastery-focused instruction. Built on principles of spaced repetition, retrieval practice, and adaptive learning, Eqara accelerates learning 4x faster than traditional methods.

## 🌟 What Makes Eqara Different

### Individualized Instruction
- **Knowledge Graph**: Organizes math topics by prerequisite relationships
- **Knowledge Frontier**: Teaches only at the boundary between what you know and don't know
- **Adaptive Scaffolding**: Questions adjust to your current mastery level
- **Diagnostic Placement**: Finds your exact starting point through adaptive testing

### Mastery-Based Learning
- **100% Mastery Required**: Can't advance until prerequisites are fully mastered
- **No Busywork**: Skip topics you've already mastered
- **Targeted Remediation**: Automatic prerequisite review when struggling
- **Real Understanding**: No shortcuts, no fake learning

### Evidence-Based Pedagogy
- **Socratic Method**: AI guides through questions, never giving direct answers
- **Spaced Repetition**: FIRe algorithm optimizes review scheduling
  - Implicit repetition: Advanced topic reviews update prerequisites automatically
  - Repetition compression: One review covers multiple simpler topics
- **Retrieval Practice**: Frequent quizzes targeting 80-85% accuracy (the learning sweet spot)
- **Cognitive Load Management**: Lessons broken into micro-steps that never exceed working memory

### Engaging Experience
- **XP System**: 1 XP ≈ 1 minute of focused work
- **Visual Progress**: Interactive knowledge graph shows your journey
- **Smart Reviews**: Review only what needs reinforcement, when memory is "fuzzy"
- **Beautiful Math**: KaTeX rendering for perfect equation display

## 🚀 Quick Start

```bash
cd ai-math-tutor
pnpm install
cp .env.template .env
# Configure environment variables
pnpm dev
```

Visit `http://localhost:3000` to start learning!

See [`ai-math-tutor/README.md`](./ai-math-tutor/README.md) for detailed setup instructions.

## 🏗️ Tech Stack

### Frontend
- **Nuxt 3** - Full-stack Vue framework with SSR
- **Vue 3** - Composition API with TypeScript
- **Nuxt UI** - Tailwind CSS component library
- **Vue Flow** - Interactive knowledge graph visualization
- **KaTeX** - Client-side math rendering

### Backend
- **Supabase** - PostgreSQL database, Auth, Realtime, Storage
- **Edge Functions** - Serverless API endpoints
- **Custom Knowledge Graph** - SQL-based topic hierarchy and prerequisite tracking

### AI/ML
- **Grok** - Primary LLM (kid-friendly, engaging tone)
- **OpenAI** - Fallback/alternative LLM, vision API for OCR
- **Claude** - Optional for deep reasoning tasks

### Testing & Deployment
- **Playwright** - E2E testing framework
- **Vercel** - Frontend deployment platform
- **pnpm** - Fast, efficient package manager

## 📊 Project Structure

```
eqara/
├── ai-math-tutor/          # Main application
│   ├── pages/              # Nuxt pages (index, diagnostic)
│   ├── components/         # Vue components (Quiz, Review, KG)
│   ├── composables/        # Vue composables (mastery, quiz, spaced-repetition)
│   ├── server/             # API endpoints and utilities
│   └── tests/              # E2E tests
├── prd.md                  # Product Requirements Document
├── tasks.md                # Development tasks and progress
├── pedagogy.md             # Educational philosophy and science
├── architecture.md         # System architecture diagram
└── DEMO-SCRIPT.md          # Demo video script
```

## 🎯 Key Features

### 1. Diagnostic & Placement
Adaptive assessment identifies your knowledge frontier through honest, efficient testing. "I Don't Know" button encouraged for accurate placement.

### 2. Socratic Chat Tutoring
AI guides you through problems using questions, building real understanding without giving answers. Earn XP for engagement and progress.

### 3. Knowledge Graph
Visual map of math topics with prerequisite relationships. See what you've mastered, where you are now, and what's coming next.

### 4. Spaced Repetition (FIRe Algorithm)
Smart review scheduling that leverages topic relationships. Reviewing advanced topics automatically updates simpler prerequisites.

### 5. Practice Quizzes
Generate custom quizzes with interleaved questions. Timed mode available after proficiency to build fluency.

### 6. Mastery Tracking
Track progress per topic with visual indicators. Clear view of your knowledge frontier and mastery levels.

## 🧪 Testing

```bash
cd ai-math-tutor
pnpm test          # Run E2E tests
pnpm test:ui       # Run with UI
pnpm test:debug    # Debug mode
```

## 📚 Documentation

- **[Setup Guide](./ai-math-tutor/README.md)** - Detailed installation and configuration
- **[Database Setup](./ai-math-tutor/SETUP-DATABASE.md)** - Schema and seeding instructions
- **[Testing Guide](./ai-math-tutor/TESTING-GUIDE.md)** - E2E testing documentation
- **[Environment Config](./ai-math-tutor/env-config.md)** - API keys and configuration
- **[PRD](./prd.md)** - Complete product requirements
- **[Architecture](./architecture.md)** - System design and data flow
- **[Pedagogy](./pedagogy.md)** - Educational philosophy and cognitive science
- **[Demo Script](./DEMO-SCRIPT.md)** - Video demonstration guide

## 🎓 Educational Philosophy

> "The best way to learn is through guided discovery, working at the perfect difficulty level, with just enough challenge to grow but not enough to overwhelm."

Eqara implements this through:
- **Mastery Learning**: 100% understanding before moving forward
- **Socratic Method**: Questions, not answers
- **Knowledge Frontier**: Always teaching at the boundary
- **Spaced Repetition**: Review when memory is fuzzy, not fresh
- **Retrieval Practice**: Testing as learning, not just assessment
- **Micro-Scaffolding**: Tiny steps that never exceed working memory

The result: **4x learning acceleration** compared to traditional classroom instruction.

## 🎯 Use Cases

### Students
- CCAT test preparation (ages 14-18)
- Accelerated math learning
- Fill knowledge gaps
- Build strong foundations
- Prepare for advanced courses

### Educators
- Supplement classroom instruction
- Track individual student mastery
- Identify knowledge gaps
- Monitor progress at topic level

### Self-Learners
- Learn at your own pace
- Skip what you know
- Master what you don't
- Build genuine understanding

## 📈 Performance Metrics

- **Bundle Size**: ~1.8MB (under 2MB target)
- **Initial Load**: <2s
- **API Response**: <500ms average
- **Math Rendering**: <100ms per equation
- **Knowledge Graph Queries**: <100ms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure no linter errors
5. Update documentation
6. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

---

**Start mastering math today!** 🚀

```bash
cd ai-math-tutor && pnpm dev
```
