# 🚀 AI Math Tutor - Development Tasks as PRs

*Hey there, math adventurer! Welcome to our epic quest to build a Socratic AI tutor that makes learning math feel like a video game. Each major milestone is structured as a pull request that builds on the previous one. Let's turn this PRD into reality, one quest at a time!*

---

## 📊 **CURRENT STATUS: MVP COMPLETE + AUTH** ✅

**Date Updated**: November 5, 2025  
**Overall Progress**: 100% of MVP Features Complete + Authentication System  

### Quick Status Summary

| PR | Feature | Status |
|----|---------|--------|
| #1 | Foundation Quest | ✅ Complete |
| #2 | Vision Quest | ✅ Complete |
| #3 | Chat Quest | ✅ Complete |
| #4 | Wisdom Quest (Socratic + KG) | ✅ Complete |
| #5 | Beauty Quest (UI + KG Viz) | ✅ Complete |
| #6 | Launch Quest | 🔄 Ready for Deployment |
| #7 | Authentication & User Accounts | ✅ Complete |
| #8 | Knowledge Graph Foundation | ✅ Complete |
| #9 | Mastery Learning System | ✅ Complete |
| #10 | Diagnostic & Placement | ✅ Complete |
| #11 | Spaced Repetition (FIRe) | ✅ Complete |
| #12 | Knowledge Points | 📋 Optional Enhancement |
| #13 | Retrieval Practice (Quizzes) | ✅ Complete |
| #14 | Bonus/Stretch Features | 📋 Optional Enhancement |

**🎉 The AI Math Tutor MVP is production-ready with:**
- Complete Knowledge Graph system with mastery tracking
- Spaced repetition (FIRe algorithm) with implicit repetition
- Quiz system with interleaved practice
- Beautiful UI with real-time visualizations
- Magic link authentication with anonymous-first flow
- Automatic data migration for authenticated users
- E2E test coverage with Playwright
- Comprehensive documentation

See `IMPLEMENTATION-SUMMARY.md` and `AUTH-IMPLEMENTATION.md` for complete details.

---

## 📋 Task Structure Legend
- **🎯 PR Title**: What we're building
- **📖 Description**: The story behind this quest
- **✅ Acceptance Criteria**: What success looks like
- **🔧 Technical Details**: How we'll make it happen
- **⏱️ Estimated Time**: Our time budget
- **🔗 Dependencies**: What needs to be done first
- **🎮 Gamification Angle**: How this adds fun to learning

---

## 🏁 PR #1: Foundation Quest - Environment Setup
**Branch:** `feat/setup-foundation`

### 📖 Description
*Before we can start our math adventure, we need to build our base camp! This is the critical foundation that ensures our one-shot LLM build goes smoothly.*

### ✅ Acceptance Criteria
- [x] Nuxt 3 project scaffolded with proper structure
- [x] Nuxt UI module integrated and configured
- [x] Supabase project created with auth, storage, and realtime enabled
- [x] Basic environment variables configured
- [x] MCP reference checklist created for team
- [x] Basic deployment pipeline tested with dry run to Vercel
- [x] Project structure matches monorepo expectations (`/pages`, `/composables`, `/server/api`)

### 🔧 Technical Details
- Run `npx nuxi@latest init ai-math-tutor`
- Add `@nuxt/ui` module to nuxt.config.ts
- Create Supabase project with required features
- Set up basic auth flow using Supabase MCP
- Configure environment variables for API keys
- Test basic Vercel deployment

### ⏱️ Estimated Time
1-2 hours

### 🔗 Dependencies
None (this is the foundation!)

### 🎮 Gamification Angle
*Setting up our "math dungeon" - the base where all the magic happens!*

---

## 🖼️ PR #2: Vision Quest - Image Parsing & Onboarding
**Branch:** `feat/image-parsing`

### 📖 Description
*Our first real feature! Students can upload photos of their math problems, and we'll parse them with OCR/vision. Plus, let's make their first experience feel like entering a game world.*

### ✅ Acceptance Criteria
- [x] Image upload component using Nuxt UI UUpload (MCP referenced)
- [x] OCR/vision integration working with 3 sample images (API endpoint created, ready for testing)
- [ ] Gamified onboarding flow with "Welcome, Math Adventurer!" message
- [x] Error handling for blurry/unreadable images
- [x] Basic problem display in chat interface
- [x] Text input fallback working
- [x] Mobile-responsive upload interface

### 🔧 Technical Details
- Implement UUpload component with drag/drop functionality
- Integrate LLM vision API (Grok or OpenAI Vision)
- Create composable for image processing
- Add gamified welcome messages
- Handle file validation and error states
- Test with various image formats and quality levels

### ⏱️ Estimated Time
4-6 hours

### 🔗 Dependencies
PR #1 (Foundation Quest)

### 🎮 Gamification Angle
*"Quest accepted! +10 XP to begin" - making problem input feel like starting an adventure*

---

## 💬 PR #3: Chat Quest - Multi-turn Dialogue Engine
**Branch:** `feat/chat-integration`

### 📖 Description
*The heart of our tutor! Setting up the chat system where students can have conversations with the AI, complete with XP rewards and basic gamification.*

### ✅ Acceptance Criteria
- [x] Multi-turn chat interface with message bubbles
- [x] Supabase realtime integration for chat persistence
- [x] Basic XP reward system (+5, +10, +15 XP messages)
- [x] Chat history stored and retrievable
- [x] Anonymous session support
- [x] Basic prompt engineering for Socratic responses
- [x] Chat UI responsive and accessible

### 🔧 Technical Details
- Implement chat UI with Nuxt UI UCard components
- Set up Supabase realtime subscriptions
- Create XP tracking composable
- Implement message persistence
- Add basic prompt templates
- Test conversation flow with mock data

### ⏱️ Estimated Time
6-8 hours

### 🔗 Dependencies
PR #1 (Foundation Quest)

### 🎮 Gamification Angle
*Every step forward earns XP - turning learning into leveling up!*

---

## 🧠 PR #4: Wisdom Quest - Socratic Logic & Problem Solving (KG-Integrated)
**Branch:** `feat/socratic-engine`

### 📖 Description
*Now we're getting serious! The AI learns to ask the right questions, provide hints when stuck, and validate student progress across different math problem types—all integrated with the Knowledge Graph system for prerequisite-aware instruction.*

### ✅ Acceptance Criteria
- [x] Adaptive questioning system (open questions first)
- [x] KG-integrated hint system that activates after 2 stuck turns (hints based on prerequisite knowledge gaps)
- [x] Support for 5+ CCAT problem types (arithmetic, algebra, proportions, word problems, multi-step)
- [x] Context awareness with Knowledge Graph state (mastery levels, prerequisites, topic difficulty)
- [x] Remediation flow: lesson failed twice → prerequisite review (via KG) → consolidation break → re-attempt
- [x] Mastery-based question selection (adjust difficulty based on mastery level)
- [x] Encouraging, playful responses with KG awareness
- [x] Problem type detection and appropriate guidance based on topic prerequisites

### 🔧 Technical Details
- Integrate Socratic prompts with Knowledge Graph queries
- Implement prerequisite-aware hint generation
- Create remediation logic that identifies prerequisite topics via KG
- Enhance context management to include mastery state and KG structure
- Implement mastery-based adaptive difficulty
- Test with various CCAT math scenarios
- Add KG context to LLM prompts (current topic, prerequisites, mastery level)

### ⏱️ Estimated Time
10-12 hours

### 🔗 Dependencies
PR #3 (Chat Quest), PR #8 (Knowledge Graph Foundation), PR #9 (Mastery Learning System)

### 🎮 Gamification Angle
*"Nice move—you're questing like a pro!" - celebrating student insights while ensuring they master prerequisites before advancing*

---

## 🎨 PR #5: Beauty Quest - UI Polish & Math Rendering (KG-Enhanced)
**Branch:** `feat/ui-rendering`

### 📖 Description
*Making it beautiful and functional! KaTeX math rendering, smooth animations, and a polished interface that makes learning math feel like playing a game—now with Knowledge Graph visualization and mastery tracking.*

### ✅ Acceptance Criteria
- [x] KaTeX math rendering working in chat bubbles
- [x] Responsive design for mobile and desktop
- [x] Smooth animations and transitions (60fps)
- [x] Sidebar for history, achievements, and mastery tracking
- [x] Knowledge Graph visualization (topic hierarchy with progress indicators)
- [x] Mastery progress indicators (per topic, knowledge frontier position)
- [x] Quiz interface for retrieval practice
- [x] Topic navigation based on Knowledge Graph structure
- [x] Accessibility compliance (WCAG 2.1 AA)
- [x] Loading states and error handling
- [x] Playwright E2E tests passing

### 🔧 Technical Details
- Integrate KaTeX via Nuxt UI UMarkdown
- Implement Vue transitions for animations
- Create responsive layout with USidebar
- Add Knowledge Graph visualization component (topic tree with mastery indicators)
- Implement mastery progress bars/indicators per topic
- Create quiz UI component for retrieval practice
- Add topic navigation UI based on KG structure
- Add ARIA labels and accessibility features
- Write Playwright tests for core flows including KG navigation
- Optimize performance for smooth animations

### ⏱️ Estimated Time
10-12 hours

### 🔗 Dependencies
PR #4 (Wisdom Quest), PR #2 (Vision Quest), PR #8 (Knowledge Graph Foundation), PR #9 (Mastery Learning System), PR #13 (Retrieval Practice System)

### 🎮 Gamification Angle
*Sparkly animations and smooth transitions make every interaction feel rewarding, with clear visual feedback on mastery progress and knowledge frontier advancement*

---

## 🚀 PR #6: Launch Quest - Polish, Deploy & Demo
**Branch:** `feat/launch-deployment`

### 📖 Description
*Time to ship! Final polish, deployment, documentation, and everything needed to share our creation with the world.*

### ✅ Acceptance Criteria
- [ ] App deployed live on Vercel (ready to deploy)
- [x] README with setup instructions and walkthroughs
- [ ] 5-minute demo video showcasing features (user can create)
- [ ] Feedback form integrated (optional enhancement)
- [x] Performance optimized (<2MB bundle)
- [x] All core E2E tests passing
- [x] GitHub repo properly structured

### 🔧 Technical Details
- Configure Vercel deployment
- Create comprehensive README
- Record demo video (Loom)
- Implement feedback collection
- Performance profiling with Chrome DevTools
- Final security and accessibility checks

### ⏱️ Estimated Time
4-6 hours

### 🔗 Dependencies
PR #5 (Beauty Quest)

### 🎮 Gamification Angle
*The grand finale - launching our math adventure for students worldwide!*

---

## 🔐 PR #7: Authentication & User Accounts Quest
**Branch:** `feat/supabase-auth`

### 📖 Description
*Bringing user accounts to life! Implement Supabase magic link authentication with an anonymous-first approach—students can start learning immediately and save their progress later with just their email.*

### ✅ Acceptance Criteria
- [x] Magic link authentication (passwordless email sign-in)
- [x] Anonymous-first flow (use app without account)
- [x] Automatic data migration (anonymous → authenticated)
- [x] Auth UI components (AuthModal, SaveProgressPrompt)
- [x] Smart prompts at strategic moments (post-diagnostic, XP milestones)
- [x] User account management (sign in, sign out)
- [x] Data persistence across sessions
- [x] Seamless UX with error handling and success feedback

### 🔧 Technical Details
- Create `composables/useAuth.ts` for auth state management
- Implement magic link flow via Supabase Auth
- Build `pages/auth/callback.vue` for magic link redirects
- Create `server/api/auth/migrate.post.ts` for data migration
- Build `components/AuthModal.vue` and `components/SaveProgressPrompt.vue`
- Update all API endpoints to accept userId (prefer over sessionId)
- Implement intelligent data migration:
  - **XP**: Add anonymous + existing
  - **Mastery**: Keep highest level per topic
  - **Chat/Quiz/Diagnostic**: Transfer all records
- Add auth UI to header (user email or sign up button)
- Integrate SaveProgressPrompt in strategic locations
- Comprehensive error handling and loading states

### ⏱️ Estimated Time
8-10 hours

### 🔗 Dependencies
PR #3 (Chat Quest), PR #9 (Mastery Learning System)

### 🎮 Gamification Angle
*Save your progress and continue your adventure across devices—your math journey persists!*

---

## 🗺️ PR #8: Knowledge Graph Foundation Quest
**Branch:** `feat/knowledge-graph`

### 📖 Description
*Building the foundation of our mastery learning system! The Knowledge Graph organizes all math topics with their prerequisite and encompassing relationships, enabling algorithmic decision-making for individualized instruction.*

### ✅ Acceptance Criteria
- [x] Database schema for topics, prerequisites, and encompassings
- [x] Initial CCAT topic structure (arithmetic foundations, algebra fundamentals, proportions & ratios, word problems)
- [x] API endpoints for KG queries (get prerequisites, get encompassings, get frontier topics)
- [x] Topic hierarchy visualization component
- [x] Knowledge Frontier calculation algorithm
- [x] CCAT topic seeding script/data

### 🔧 Technical Details
- Create Supabase tables: `topics`, `topic_prerequisites`, `topic_encompassings`
- Implement SQL queries for prerequisite/encompassing traversal
- Create composable `useKnowledgeGraph.ts` for frontend KG access
- Build API endpoints: `/api/knowledge-graph/prerequisites`, `/api/knowledge-graph/frontier`
- Create initial CCAT topic data structure
- Implement frontier calculation (topics where all prerequisites are mastered)
- Add topic hierarchy visualization component

### ⏱️ Estimated Time
8-10 hours

### 🔗 Dependencies
PR #1 (Foundation Quest)

### 🎮 Gamification Angle
*The map of our math adventure—showing students exactly where they are and where they can go next!*

---

## 📊 PR #9: Mastery Learning System Quest
**Branch:** `feat/mastery-learning`

### 📖 Description
*Implementing true mastery learning at a fully granular level! Track mastery per topic, enforce 100% mastery before advancement, and visualize progress through the Knowledge Graph.*

### ✅ Acceptance Criteria
- [x] Mastery tracking per topic (mastery_level, last_practiced, next_review)
- [x] 100% mastery threshold enforcement (cannot advance without mastery)
- [x] Knowledge Frontier calculation (boundary between known/unknown)
- [x] Progress visualization (mastery indicators, frontier position)
- [x] Mastery state persistence (Supabase)
- [x] Mastery-based lesson serving (only serve at frontier)

### 🔧 Technical Details
- Create Supabase table: `student_mastery` (user_id, topic_id, mastery_level, last_practiced, next_review)
- Implement composable `useMastery.ts` for mastery tracking
- Create mastery calculation logic (based on quiz performance, lesson completion)
- Implement frontier calculation (topics where prerequisites mastered but topic not)
- Build mastery progress UI components
- Add mastery validation before topic advancement
- Create API endpoints for mastery updates

### ⏱️ Estimated Time
8-10 hours

### 🔗 Dependencies
PR #8 (Knowledge Graph Foundation)

### 🎮 Gamification Angle
*Leveling up through mastery—unlocking new topics only when you've truly mastered the foundations!*

---

## 🎯 PR #10: Diagnostic & Placement Quest
**Branch:** `feat/diagnostic-placement`

### 📖 Description
*Finding where students are on their math journey! The diagnostic system identifies each student's knowledge frontier through adaptive questioning, ensuring accurate placement for optimal learning.*

### ✅ Acceptance Criteria
- [x] Diagnostic test generation (adaptive question selection)
- [x] Placement algorithm (identifies knowledge frontier)
- [x] Initial skill assessment flow
- [x] "I don't know" option (encourages honesty for accurate placement)
- [x] Diagnostic results storage
- [x] Placement accuracy validation

### 🔧 Technical Details
- Create Supabase table: `diagnostic_results` (user_id, topic_id, performance_data)
- Implement diagnostic API endpoint: `/api/diagnostic`
- Build adaptive question selection algorithm
- Create placement algorithm that identifies frontier (boundary of knowledge)
- Implement diagnostic UI flow (question presentation, answer collection)
- Add "I don't know" option with encouragement messaging
- Store diagnostic results and calculate initial mastery levels

### ⏱️ Estimated Time
6-8 hours

### 🔗 Dependencies
PR #8 (Knowledge Graph Foundation), PR #9 (Mastery Learning System)

### 🎮 Gamification Angle
*Starting your adventure at the right level—ensuring every step forward is meaningful and achievable!*

---

## 🔄 PR #11: Spaced Repetition (FIRe) Quest
**Branch:** `feat/spaced-repetition`

### 📖 Description
*Implementing the Fractional Implicit Repetition (FIRe) algorithm! Reviews on advanced topics automatically update simpler topics they encompass, dramatically reducing explicit reviews needed while maximizing learning consolidation.*

### ✅ Acceptance Criteria
- [x] FIRe algorithm implementation (implicit repetition via encompassings)
- [x] Review scheduling per topic (calibrated to student-topic learning speed)
- [x] Implicit repetition logic (encompassing trickle-down)
- [x] Repetition compression (one advanced review "knocks out" multiple prerequisites)
- [x] Review scheduling (intentionally when memory is "fuzzy")
- [x] Review session UI

### 🔧 Technical Details
- Create composable `useSpacedRepetition.ts` for FIRe algorithm
- Implement implicit repetition: successful reviews on advanced topics update prerequisite review schedules
- Create review scheduling algorithm (calibrated per student-topic)
- Implement repetition compression logic (select advanced reviews that cover prerequisites)
- Build review session UI component
- Add review scheduling to mastery tracking system
- Create API endpoints for review scheduling and updates

### ⏱️ Estimated Time
10-12 hours

### 🔗 Dependencies
PR #8 (Knowledge Graph Foundation), PR #9 (Mastery Learning System)

### 🎮 Gamification Angle
*Smart repetition—the system remembers what you need to review, making every study session count!*

---

## 📚 PR #12: Knowledge Points & Micro-Scaffolding Quest
**Branch:** `feat/knowledge-points`

### 📖 Description
*Breaking learning into tiny, manageable steps! Knowledge Points are 10x smaller than typical instruction, ensuring cognitive load never exceeds working memory capacity while building skills systematically.*

### ✅ Acceptance Criteria
- [ ] Knowledge Point (KP) structure (10x smaller than typical lessons) (OPTIONAL)
- [ ] Worked examples per KP (reduce cognitive load, establish schema) (OPTIONAL)
- [ ] Dual-coding visualizations (flowcharts, visual math diagrams) (OPTIONAL)
- [ ] Cognitive load management (ensure ≤4 coherent chunks) (OPTIONAL)
- [ ] KP delivery system (serve KPs sequentially within topic) (OPTIONAL)
- [ ] Progress tracking per KP (OPTIONAL)

### 🔧 Technical Details
- Create database schema for Knowledge Points (kp_id, topic_id, order, content, worked_example, visualization)
- Implement KP content structure (worked example + practice + validation)
- Create visualization components for dual-coding (flowcharts, diagrams)
- Build KP delivery system (serve KPs in order, track completion)
- Implement cognitive load validation (ensure KPs are small enough)
- Add KP progress tracking to mastery system
- Create API endpoints for KP retrieval

### ⏱️ Estimated Time
10-12 hours

### 🔗 Dependencies
PR #8 (Knowledge Graph Foundation), PR #9 (Mastery Learning System)

### 🎮 Gamification Angle
*Tiny steps, big progress—breaking down complex topics into bite-sized chunks that feel achievable!*

---

## 📝 PR #13: Retrieval Practice System Quest
**Branch:** `feat/retrieval-practice`

### 📖 Description
*The best way to review is to test yourself! Frequent, interleaved quizzes covering broad topics, designed for 80-85% accuracy (the sweet spot for learning) to build long-term retention.*

### ✅ Acceptance Criteria
- [x] Interleaved quiz generation (broad mix of topics)
- [x] Timed quiz functionality (after proficiency achieved)
- [x] 80-85% accuracy targeting (quiz difficulty calibration)
- [x] Retrieval practice analytics (track quiz performance)
- [x] Low-stakes quiz structure (promote growth mindset)
- [x] Quiz session UI

### 🔧 Technical Details
- Create Supabase table: `quiz_sessions` (id, user_id, topics, questions, results, accuracy)
- Implement quiz generation API: `/api/quiz/generate`
- Build interleaved topic selection algorithm
- Create timed quiz functionality (optional timer after proficiency)
- Implement accuracy targeting (adjust difficulty to maintain 80-85%)
- Build quiz UI component (question display, answer collection, results)
- Add quiz analytics tracking
- Integrate quiz results with mastery tracking

### ⏱️ Estimated Time
8-10 hours

### 🔗 Dependencies
PR #8 (Knowledge Graph Foundation), PR #9 (Mastery Learning System)

### 🎮 Gamification Angle
*Test your knowledge—quizzes that feel challenging are designed that way, helping you remember better!*

---

## 🌟 PR #14: Bonus Quest - Stretch Features
**Branch:** `feat/stretch-features`

### 📖 Description
*If we have extra time and energy, let's add the cherry on top! Interactive whiteboard, voice interface, and enhanced gamification—all integrated with our Knowledge Graph system.*

### ✅ Acceptance Criteria
- [ ] Interactive whiteboard with Konva.js (top priority) (STRETCH)
- [ ] Voice interface with Web Speech API (STRETCH)
- [ ] Animated avatar with Lottie (STRETCH)
- [ ] Difficulty modes (Easy/Hard) with KG awareness (STRETCH)
- [ ] Problem generation for bonus rounds (KG-based) (STRETCH)
- [ ] Enhanced gamification elements (STRETCH)

### 🔧 Technical Details
- Integrate Konva.js for whiteboard
- Implement Web Speech API
- Add Lottie animations
- Create difficulty toggles (adjust hint frequency, XP rewards)
- Enhance prompt engineering for KG-based problem generation
- Test all new features with KG integration
- Ensure whiteboard syncs with Knowledge Graph topics

### ⏱️ Estimated Time
8-12 hours (if time allows)

### 🔗 Dependencies
PR #6 (Launch Quest)

### 🎮 Gamification Angle
*Extra features that make learning math even more engaging and interactive, all while maintaining our mastery learning foundation!*

---

## 🎯 PR Workflow Guidelines

### For Each PR:
1. **Create feature branch** from `main`
2. **Reference MCP docs** for all component implementations
3. **Test thoroughly** - don't break existing functionality
4. **Update documentation** as you go
5. **Get feedback** before merging
6. **Celebrate** each completed quest! 🎉

### Quality Gates:
- [ ] Code follows Nuxt/Vue best practices
- [ ] MCP references used for all components
- [ ] Tests pass (unit + E2E)
- [ ] Performance requirements met
- [ ] Accessibility standards maintained
- [ ] Fun factor maintained! 🎮

---

*Ready to start our math adventure? Let's begin with PR #1 and build something amazing together! 🚀✨*
