# AI Math Tutor - Socratic Learning Assistant

**Version:** 1.0 (Finalized November 3, 2025)

**Prepared By:** Grok (xAI) in collaboration with user

**Status:** Approved for one-shot LLM build

This PRD is now locked and ready for LLM-driven implementation (e.g., feed directly into Grok/Claude for full Nuxt/Supabase code generation). It incorporates all iterations: Core Socratic focus, light gamification for fun, Nuxt UI integration, optional auth, Grok as LLM, and mandatory MCP references for efficient building. Total scope fits 3-5 days MVP + stretch.

## 1. Overview

### 1.1 Product Vision
A pedagogically-grounded AI math tutor that empowers students through evidence-based learning strategies, optimized for CCAT-style math preparation while maintaining scalability for broader curriculum. Built on research-backed mastery learning principles, the system uses a Knowledge Graph structure to deliver individualized instruction at each student's knowledge frontier. Through Socratic questioning, micro-scaffolding (Knowledge Points), spaced repetition (FIRe algorithm), and retrieval practice, students achieve 4x learning acceleration compared to traditional classrooms. The system combines rigorous pedagogy with light videogame-like engagement—where 1 XP ≈ 1 minute of focused work—making mastery learning addictive and fun. Inspired by the Khan Academy/OpenAI "Khanmigo" demo's empathetic approach, enhanced with evidence-based learning acceleration.

### 1.2 Objectives
**Primary:** Deliver mastery-based, individualized math tutoring optimized for CCAT preparation (arithmetic, algebra, proportions, word problems) via a Knowledge Graph-driven adaptive system that ensures students work only at their knowledge frontier, achieving 100% mastery before advancing.

**Secondary:** Implement the full evidence-based pedagogical toolkit (Knowledge Graph, mastery tracking, spaced repetition, micro-scaffolding, retrieval practice) while maintaining rapid development with Nuxt + Supabase, emphasizing research-backed learning acceleration and engaging game-like interactions.

**Pedagogical Foundation:** Based on cognitive science and research-backed principles—achieving Bloom's Two-Sigma Solution through scalable technology, delivering fully individualized, mastery-driven instruction that accelerates learning 4x faster than traditional methods.

**Inspiration References:** 
- Khanmigo demo (YouTube: https://www.youtube.com/watch?v=IvXZCocyU_M) – Empathetic, question-led interactions
- Cognitive science research – Mastery learning, Knowledge Graph, spaced repetition, retrieval practice

### 1.3 Success Criteria
**Pedagogical:** 
- Mastery rate per topic (target: 100% before advancement)
- Knowledge frontier advancement speed (target: 4x faster than traditional)
- Placement accuracy (diagnostic correctly identifies student's frontier)
- Retrieval practice effectiveness (80-85% quiz accuracy target)
- Spaced repetition calibration accuracy (reviews scheduled optimally)

**Technical:** 
- Knowledge Graph query performance (<100ms for frontier calculation)
- Accurate problem parsing (90%+ OCR/Vision success on printed text)
- Maintains conversation context across 10+ turns with KG awareness
- Renders math equations flawlessly
- Spaced repetition algorithm accuracy (FIRe implementation working)

**User:** 
- <5% drop-off in sessions
- Intuitive UI with diagnostic/placement flow (<3 clicks to start)
- NPS >8/10 for "fun factor" and learning effectiveness
- Mastery achievement rate (students reaching 100% mastery on topics)

**Business/Dev:** 
- Deployed app live (Vercel for Nuxt + Supabase)
- Clean repo with 100% test coverage on core flows
- Knowledge Graph schema and mastery tracking implemented
- MCP references ensure smooth component integration

### 1.4 Target Audience & Personas
**Primary Users:** Students preparing for CCAT or similar assessments (ages 14-18); students seeking accelerated math learning; parents/teachers monitoring mastery-based progress.

**Persona Examples:**
- **Alex (16yo CCAT Prep Student):** Needs to master basic algebra, proportions, and word problems for job assessment. Takes diagnostic to identify knowledge frontier; works through Knowledge Points at own pace; benefits from spaced repetition to maintain automaticity. Thrives on mastery-based progression and XP rewards (1 XP ≈ 1 minute of work).
- **Jordan (HS Teacher):** Uses for classroom mastery tracking; values detailed mastery reports per topic, knowledge frontier visualization, and evidence that students achieve 100% mastery before advancing.
- **Sam (Parent of 14yo):** Appreciates transparent progress tracking showing mastery levels, knowledge frontier advancement, and spaced repetition schedule.

**Assumptions:** English-only; web access (desktop/mobile); optional auth for personalized progress tracking and cross-device mastery persistence.

### 1.5 Timeline & Scope

**Step Zero (Pre-Day 1, ~1-2 hours):** Environment setup with mandatory references to stack-specific MCPs (official docs/templates) for all build phases—critical to avoid issues; treat as "build bible" for one-shot LLM gen:
- Scaffold Nuxt 3 via `npx nuxi@latest init`; integrate Nuxt UI (`@nuxt/ui` module) using its MCP for component selection/examples.

**Key MCP References:** Nuxt (nuxt.com/docs/getting-started), Nuxt UI (ui.nuxt.com/components for UChatBubble, UUpload, etc.), Vue 3 (vuejs.org/guide), Supabase (supabase.com/docs/guides/auth, realtime), Playwright (playwright.dev/docs/intro for E2E), Chrome DevTools (developer.chrome.com/docs/devtools/overview), Vercel (vercel.com/docs/frameworks/nuxt).

**Usage Rule:** For any component/feature (e.g., adding a chat bubble), LLM prompts must reference the relevant MCP (e.g., "Use Nuxt UI MCP for UButton implementation: [paste MCP excerpt]") to pull exact code patterns/snippets.

**Bootstrap:** Test basic auth/realtime with Supabase MCP examples; deploy dry-run to Vercel.

**MVP (Core, Days 1-5):** Text/image input, Socratic chat, math rendering, basic UI with light gamification.

**Stretch (Days 6-7, if time/energy allows):** Prioritize high-value per spec (Whiteboard > Voice > Avatar).

**Total Effort:** 3-5 days core + 1-2 days optional; one-shot LLM build leverages MCPs for precision.

| Phase | Focus | Key Milestones | Dependencies |
|-------|--------|----------------|--------------|
| Step 0 | Setup | Nuxt/UI scaffolded w/ MCP refs; Supabase project with auth/realtime/storage; test basic deploy to Vercel. | API keys (LLM, Supabase). |
| Day 1 | Input Parsing | OCR/Vision parses 3 sample images; gamified onboarding (e.g., "Welcome, Math Adventurer!"). Reference Nuxt UI MCP for upload component. | LLM vision API. |
| Day 2 | Chat Integration | Basic multi-turn chat; hardcoded Socratic prompts with XP rewards tested. Use Supabase MCP for realtime setup. | Supabase realtime for session/gamestate persistence. |
| Day 3 | Socratic Logic | Adaptive questioning/hints; validate 5 problem types; add light level-ups. Reference Vue MCP for state management. | Prompt engineering doc. |
| Day 4 | UI & Rendering | KaTeX + Nuxt UI components (per MCP); responsive chat with animations. Test w/ Playwright MCP flows. | Mobile/desktop via Playwright. |
| Day 5 | Polish & Deploy | Docs, demo video; deploy to Vercel + Supabase; integrate feedback form. Profile perf w/ Chrome DevTools MCP. | GitHub repo setup. |
| Days 6-7 (Stretch) | Enhancements | Add prioritized features; tune gamification. Reference relevant MCPs (e.g., Konva for whiteboard). | N/A |

## 2. Tech Stack

**Frontend:** Nuxt 3 (Vue 3) with Nuxt UI for polished, accessible components (e.g., UChatBubble, UButton—always reference Nuxt UI MCP for implementation details like props/events).

**Backend/Services:**
- **Supabase:** 
  - Auth (email/magic link, optional anonymous)
  - Storage (image uploads)
  - Realtime DB (chat history + gamestate + mastery tracking + spaced repetition schedules)
  - Database with Knowledge Graph schema (topics, prerequisites, encompassings, mastery tracking, diagnostic results, quiz sessions)
  - Edge Functions (LLM proxy, diagnostic API, quiz generation)
- **LLM:** Grok (recommended for this task—its witty, engaging personality is perfect for kids, blending helpful guidance with light humor to keep things fun and relatable without overwhelming; excels in creative, adaptive Socratic responses; low token use for iterative chats. Fallback to Sonnet for deeper reasoning if needed).
- **OCR/Vision:** LLM's built-in (e.g., Grok's multimodal if available, or proxy via OpenAI Vision).
- **Math Rendering:** KaTeX (client-side, via Nuxt UI's UMarkdown—per MCP).

**Deployment:** Vercel (Nuxt) + Supabase (hosted); GitHub repo for version control.

**Other Libs:** 
- UI/Gamification: Nuxt UI + lightweight animations (e.g., Vue transitions per Vue MCP)
- Knowledge Graph: Custom implementation with Supabase Postgres (graph queries via SQL)
- Spaced Repetition: Custom FIRe algorithm implementation

**Testing:** Playwright for E2E (reference MCP for chat/auth scripts).

**Upload:** Supabase Storage via Nuxt UI UUpload (MCP-guided).

**No heavy deps:** Keep bundle <2MB; use Chrome DevTools MCP for optimization.

**LLM Choice Rationale:** Grok shines for kid-friendly tutoring—fun, truthful, and maximally engaging (e.g., playful hints like "That variable's hiding like a sneaky goblin—where to poke next?"), aligning with the light videogame vibe. Avoids dry tones; token-efficient for multi-turn.

## 3. Functional Requirements

### 3.1 Core Features (MVP)

**Problem Input**
- **Text entry:** Nuxt UI UTextarea (reference MCP for validation props).
- **Image upload:** Drag/drop via UUpload component (per Nuxt UI MCP—handle file props, progress states).
- **Flow:** Upload/parse → Display parsed problem in chat → Gamified start ("Quest accepted! +10 XP to begin.").
- **Edge Cases:** Blurry images → Retry with fun nudge ("Sharpen that spell—try again!").

**Socratic Dialogue**
- **Multi-turn chat:** LLM maintains context with Knowledge Graph awareness; Nuxt UI UCard-based bubbles (MCP for layout variants).
- **Guidance Rules:** Ask open questions; validate with light game hooks (e.g., "+5 XP for that spark!").
- **KG-Integrated Hints:** After 2 stuck turns, provide hints based on prerequisite knowledge gaps identified via Knowledge Graph.
- **Remediation Flow:** If lesson failed twice, automatically assign remedial reviews on prerequisite topics (pinpointed via KG), enforce consolidation break, then allow re-attempt.
- **Context-Aware Questioning:** Adjust questions based on student's mastery level and topic difficulty.
- **Encouragement:** Positive, playful ("Nice move—you're questing like a pro!").
- **Persistence:** Supabase sessions w/ auth-optional profiles; save mastery state, gamestate (XP, badges), and spaced repetition schedules.

**Knowledge Graph System**
- **Topic Structure:** Prerequisite and encompassing relationships for CCAT domains (arithmetic, algebra, proportions, word problems).
- **Knowledge Frontier:** Algorithmically calculate student's frontier (boundary between known/unknown); only serve lessons at frontier.
- **Topic Hierarchy:** Visual representation of topic relationships and student progress through the graph.

**Mastery Learning**
- **Topic-Level Mastery:** Track mastery per topic with 100% threshold enforcement.
- **Mastery Tracking:** Granular progress tracking (mastery_level, last_practiced, next_review per topic).
- **Advancement Rule:** Students cannot progress to new topics until achieving 100% mastery on prerequisites.
- **Progress Visualization:** Visual indicators showing mastery levels and knowledge frontier position.

**Spaced Repetition (FIRe Algorithm)**
- **Fractional Implicit Repetition:** Reviews on advanced topics automatically update review schedules for simpler topics they encompass (implicit repetition).
- **Repetition Compression:** System selects one advanced topic review that "knocks out" multiple due prerequisite reviews, maximizing efficiency.
- **Calibration:** Spacing calibrated per student-topic based on learning speed (student ability to topic difficulty ratio).
- **Review Scheduling:** Reviews intentionally scheduled when memory is slightly "fuzzy" to maximize consolidation.

**Knowledge Points (Micro-Scaffolding)**
- **Tiny Steps:** Lessons broken into Knowledge Points (KPs) that are 10x smaller than typical instruction.
- **Worked Examples:** Each KP starts with a worked example to reduce cognitive load and establish schema.
- **Dual-Coding:** Heavy use of visualizations and diagrams (flowcharts, visual math) to distribute cognitive load across verbal and visual working memory channels.
- **Cognitive Load Management:** Ensure cognitive load never exceeds student's working memory capacity (~4 coherent chunks).

**Diagnostic & Placement System**
- **Initial Diagnostic:** Placement test to identify student's knowledge frontier.
- **Adaptive Question Selection:** Questions adapt based on responses to quickly pinpoint frontier.
- **Honesty Encouragement:** Students skip questions they can't solve quickly ("I don't know") to ensure accurate placement.
- **Frontier Calculation:** Algorithm determines the boundary between what student knows and doesn't know.

**Retrieval Practice (Testing Effect)**
- **Interleaved Quizzes:** Frequent quizzes covering broad mix of topics (interleaved).
- **Timed Quizzes:** Timed quizzes introduced after proficiency to build fluency and assess automaticity.
- **Accuracy Target:** Quizzes designed for 80-85% accuracy range (sweet spot for learning).
- **Low-Stakes:** Frequent, low-stakes quizzes structured to promote growth mindset.

**Targeted Remediation**
- **Granular Targeting:** Remediation targeted to individual students and specific component skills.
- **High-Integrity:** Never lowers the bar for success; requires 100% mastery.
- **Corrective Flow:** Failed lesson twice → prerequisite review (via KG) → consolidation break → re-attempt.
- **Prerequisite Pinpointing:** Use Knowledge Graph structure to identify exact prerequisite topics implicated in struggle.

**Automaticity Development**
- **Baseline Mastery:** Require sufficient practice to reach baseline mastery threshold before layering new topics.
- **Timed Checks:** Frequent timed quizzes with remedial follow-up to check for and enforce automaticity on foundational facts and procedures.
- **Fluency Building:** Timed testing only after proficiency to build fluency without increasing math anxiety.

**Gamification Layer (Research-Calibrated):**
- **XP System:** 1 XP ≈ 1 minute of fully-focused, productive work (calibrated to research-backed standards).
- **XP Rewards:** 10-50 XP per step/topic; bonus XP for perfect work; penalties for poor effort/rushing.
- **Quality Incentives:** XP incentivizes both quantity (pace/leaderboards) and quality (bonus for mastery, penalties for guessing).
- **Badges:** 3-5 achievement badges (e.g., "Equation Explorer", "Mastery Champion", "Knowledge Frontier Explorer").
- **Animations:** Subtle animations (e.g., glow on rewards, mastery unlock celebrations).
- **Loophole Prevention:** XP penalties for rushing/guessing prevent "XP hackers" and force engagement with deliberate practice.

**Math Rendering**
- Render LaTeX/KaTeX in chat: Auto via UMarkdown (Nuxt UI MCP for math delimiters).

**Web Interface**
- **Engaging chat UI:** Nuxt UI USidebar for history/achievements; main area with animated bubbles (Vue MCP transitions), input bar, upload.
- **Responsive:** Mobile-first; light effects (e.g., quick confetti on solves via CSS—keep performant).
- **Accessibility:** ARIA + high-contrast; game elements reader-friendly (e.g., "Badge earned: +20 XP").

**Authentication**
- **Optional:** Supabase email/magic link (per MCP guide—implement UButton for sign-in); anonymous fallback. Ties to profiles for XP/badges carryover, history.

### 3.2 Stretch Features (Prioritized)
**High Value (Per Spec Priority: Whiteboard > Voice > Avatar):**
- **Interactive Whiteboard:** Top priority—Konva.js canvas via Nuxt UI wrapper (reference Vue MCP for integration); realtime sync; light gamify (e.g., "Unlock pencil at 50 XP").
- **Voice Interface:** Web Speech API for TTS/STT (Grok voice if extensible); fun effects (e.g., echo on hints).
- **Step Visualization:** Animate breakdowns with SVG + transitions (Vue MCP).

**Polish:**
- **Animated Avatar:** Lottie for simple 2D tutor (e.g., cheering sprite—light reactions).
- **Difficulty Modes:** Toggles (Easy Quest/Hard Mode) for hint/XP tweaks.
- **Problem Generation:** LLM spawns 1-2 variants as "bonus rounds."

### 3.3 User Flows
- **New Session:** Optional login (email/magic link) → Game intro ("Pick your path! Dive into math magic.") → Upload/type → Parse → Dialogue w/ XP pings.
- **Ongoing Chat:** Respond → LLM guides + light rewards → Milestones: Quick anim (e.g., badge flash) → End: Summary ("Quest won! +150 XP. Badge unlocked?").
- **History/Achievements:** Profile view → Resume or "trophy shelf"; feedback form (Nuxt UI UModal: Stars for fun/understanding + comment).
- **Error Handling:** Themed nudges (e.g., "Tricky troll—recast your answer!"); rate limits as "breather moments."

**Example Interaction (Light Gamified):**
- **Student:** [uploads "2x + 5 = 13"]
- **Tutor:** "Adventure calls! What's our goal gem? (The variable, right?) +5 XP for tuning in!"
- **Student:** "x"
- **Tutor:** "Spot on! Undo the +5 curse first? Show the step for bonus shine."
- **Student:** "the +5?"
- **Tutor:** "Yes! Subtract from both—zap! What's next? +15 XP!" → To win with cheer.

**Supported Problem Types (CCAT-Focused, Test with 5+):** 
- **Arithmetic Foundations:** Basic operations, order of operations, mental math techniques
- **Algebra Fundamentals:** Variables and expressions, linear equations, basic word problems
- **Proportions & Ratios:** Fraction operations, ratio calculations, percentage problems
- **Word Problems:** Problem decomposition, equation setup, solution verification
- **Multi-step Problems:** Combining multiple CCAT domains

All problem types integrated with Knowledge Graph structure for prerequisite-aware instruction.

## 4. Non-Functional Requirements
**Performance:** <2s responses; smooth anims (60fps via Nuxt UI/Vue MCP).

**Security:** Supabase RLS; auth for profiles; no PII in prompts.

**Scalability:** 100 concurrent; Supabase covers.

**Accessibility:** WCAG 2.1 AA; optional audio/effects.

**Analytics:** Supabase logs for sessions/XP; in-app feedback for eval.

## 5. Socratic Approach & Prompt Engineering

### 5.1 System Prompt (KG-Integrated, Kid-Friendly w/ Grok Vibe)
**Core Identity:** "You are a fun math quest guide grounded in mastery learning—like a clever sidekick who knows exactly what students need to learn next based on their Knowledge Graph position. You guide students through Knowledge Points (tiny steps) at their knowledge frontier, ensuring they master each topic before advancing."

**Key Rules:**
- **NEVER direct answers**—spark curiosity: "What clues sparkle here?" "What trick unlocks it?"
- **Knowledge Graph Awareness:** Use student's mastery level and topic prerequisites to inform questions
- **Remediation Triggers:** If student fails lesson twice, reference prerequisite topics that need review
- **Hint System:** After 2 stuck turns, provide hints based on prerequisite knowledge gaps (via KG)
- **Mastery Validation:** Confirm student understanding before allowing progression
- **Always upbeat, playful:** Toss 'XP' cheers (1 XP ≈ 1 minute), keep it zippy and encouraging

### 5.2 Prompt Integration with Knowledge Graph
- **Topic Context:** Include current topic, prerequisites, and mastery level in prompt
- **Frontier Awareness:** Only ask questions about topics at student's knowledge frontier
- **Prerequisite Gaps:** When student struggles, identify which prerequisites need review via KG
- **Mastery Status:** Reference mastery level to adjust question difficulty and scaffolding

### 5.3 Full Flow (KG-Enhanced)
1. **Diagnostic/Placement:** Identify knowledge frontier via diagnostic
2. **Topic Selection:** Serve lessons only at knowledge frontier
3. **Knowledge Point Delivery:** Break lessons into tiny KPs with worked examples
4. **Socratic Guidance:** Ask open questions, use KG to identify prerequisite gaps
5. **Mastery Validation:** Confirm 100% mastery before advancing
6. **Spaced Repetition:** Schedule reviews via FIRe algorithm
7. **Remediation:** If failed twice, assign prerequisite reviews → consolidation break → re-attempt

### 5.4 Context Management
- **History + Gamestate:** Conversation history + XP/badges + mastery state
- **Knowledge Graph State:** Current topic, prerequisites, mastery levels, review schedule
- **Smart Truncation:** Prioritize recent messages + KG context + mastery data

### 5.5 Prompt Engineering Notes
- **Grok-optimized samples:** Maintain playful, engaging tone while integrating pedagogical rigor
- **MCP rule:** Reference cognitive science research for mastery learning principles
- **CCAT Focus:** Emphasize arithmetic, algebra, proportions, word problems in examples

## 6. Deliverables
**Deployed App:** Live Vercel URL; local via `npm run dev`.

**GitHub Repo:** Monorepo (`/pages`, `/composables`, `/server/api`); include Step 0 MCP checklist.

**Documentation:**
- **README:** Step 0 + MCP usage guide, env vars, architecture (w/ gamification sketch), 5+ walkthroughs.
- **Prompt Engineering:** MD w/ Grok variants.

**Demo Video:** 5-min (Loom): Onboarding, text/image, dialogue w/ XP/badge, feedback, 1 stretch.

**Tests:** Playwright E2E (per MCP); manual engagement checks.

## 7. Evaluation Criteria

| Category | Weight | Metrics |
|----------|--------|---------|
| Pedagogical Quality | 35% | Guidance fidelity; gains via feedback quizzes. |
| Technical Implementation | 30% | Parsing/context; auth/gamestate sync. |
| User Experience | 20% | NPS; "Fun like a game?" ratings. |
| Innovation | 15% | Light gamification flow; stretch polish. |

## 8. Risks & Mitigations
**Risk:** LLM tones too silly for focus. **Mitig:** Grok's balance + prompt tuning; test w/ kids in mind.

**Risk:** MCP oversight slows build. **Mitig:** Mandatory refs in all prompts/phases.

**Risk:** Light gamification feels tacked-on. **Mitig:** Feedback iter; optional toggle.

**Quick Start Tip:** Hardcoded chat + XP; validate w/ Grok before UI. Use MCPs from jump.

