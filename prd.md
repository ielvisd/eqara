# AI Math Tutor - Socratic Learning Assistant

**Version:** 1.0 (Finalized November 3, 2025)

**Prepared By:** Grok (xAI) in collaboration with user

**Status:** Approved for one-shot LLM build

This PRD is now locked and ready for LLM-driven implementation (e.g., feed directly into Grok/Claude for full Nuxt/Supabase code generation). It incorporates all iterations: Core Socratic focus, light gamification for fun, Nuxt UI integration, optional auth, Grok as LLM, and mandatory MCP references for efficient building. Total scope fits 3-5 days MVP + stretch.

## 1. Overview

### 1.1 Product Vision
A web-based AI tutor that empowers students to solve math problems independently through Socratic questioning, mimicking a patient human teacher—supercharged with light videogame-like engagement to make learning addictive and fun. Inspired by the Khan Academy/OpenAI "Khanmigo" demo, it parses problems from text or screenshots, engages in multi-turn dialogues to guide discovery (never spoon-feeding answers), and adapts to the learner's pace. Gamification elements (e.g., simple XP rewards, badges, and quick animations) add playful hooks without overwhelming the educational core, turning sessions into light-hearted "quests" for joy and retention.

### 1.2 Objectives
**Primary:** Deliver guided, context-aware math tutoring for K-12+ students via a simple, immersive chat interface.

**Secondary:** Demonstrate rapid prototyping with Nuxt + Supabase for a deployable MVP in 3-5 days, emphasizing fun, game-like interactions while referencing stack-specific MCPs (Modular Component Prompts/docs/templates) throughout for efficient, error-free builds.

**Inspiration Reference:** Khanmigo demo (YouTube: https://www.youtube.com/watch?v=IvXZCocyU_M) – Focus on empathetic, question-led interactions, now lightly gamified like a casual math adventure for hooks like quick wins and cheers.

### 1.3 Success Criteria
**Pedagogical:** Successfully guides users through 5+ problem types without direct answers; 80%+ user sessions reach solution via student-led steps; light gamification boosts engagement (e.g., +15% session time via analytics).

**Technical:** Accurate problem parsing (90%+ OCR/Vision success on printed text); maintains conversation context across 10+ turns; renders math equations flawlessly.

**User:** <5% drop-off in sessions; intuitive, engaging UI with <2 clicks to start tutoring; NPS >8/10 for "fun factor."

**Business/Dev:** Deployed app live (Vercel for Nuxt + Supabase); clean repo with 100% test coverage on core flows; MCP references ensure smooth component integration.

### 1.4 Target Audience & Personas
**Primary Users:** Students (ages 8-18) tackling homework; parents/teachers monitoring progress.

**Persona Example:**
- **Alex (12yo Middle Schooler):** Struggles with algebra but loves games; uploads phone pics of worksheets; thrives on light rewards like a quick "XP ping!" and badge pop-up for motivation.
- **Jordan (HS Teacher):** Uses for classroom demos; values exportable session logs with gamified progress summaries for assessment.

**Assumptions:** English-only; web access (desktop/mobile); optional auth for personalized progress tracking.

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
- **Supabase:** Auth (email/magic link, optional anonymous), Storage (image uploads), Realtime DB (chat history + gamestate like XP/badges), Edge Functions (LLM proxy).
- **LLM:** Grok (recommended for this task—its witty, engaging personality is perfect for kids, blending helpful guidance with light humor to keep things fun and relatable without overwhelming; excels in creative, adaptive Socratic responses; low token use for iterative chats. Fallback to Sonnet for deeper reasoning if needed).
- **OCR/Vision:** LLM's built-in (e.g., Grok's multimodal if available, or proxy via OpenAI Vision).
- **Math Rendering:** KaTeX (client-side, via Nuxt UI's UMarkdown—per MCP).

**Deployment:** Vercel (Nuxt) + Supabase (hosted); GitHub repo for version control.

**Other Libs:** UI/Gamification: Nuxt UI + lightweight animations (e.g., Vue transitions per Vue MCP).

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
- **Multi-turn chat:** LLM maintains context; Nuxt UI UCard-based bubbles (MCP for layout variants).
- **Guidance Rules:** Ask open questions; validate with light game hooks (e.g., "+5 XP for that spark!").
- **Hints:** After 2 stuck turns, concrete nudge; frame as "quick boost."
- **Encouragement:** Positive, playful ("Nice move—you're questing like a pro!").
- **Adaptation:** Track understanding; adjust like casual game pacing.
- **Persistence:** Supabase sessions w/ auth-optional profiles; save light gamestate (XP, badges).

**Light Gamification Layer:** Simple XP per step (10-50); 3-5 badges (e.g., "Equation Explorer"); subtle animations (e.g., glow on rewards); no deep progression—just feel-good ticks.

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

**Supported Problem Types (Test with 5+):** Arithmetic, algebra, geometry, word problems, multi-step—with subtle themes (e.g., "algebra quest").

## 4. Non-Functional Requirements
**Performance:** <2s responses; smooth anims (60fps via Nuxt UI/Vue MCP).

**Security:** Supabase RLS; auth for profiles; no PII in prompts.

**Scalability:** 100 concurrent; Supabase covers.

**Accessibility:** WCAG 2.1 AA; optional audio/effects.

**Analytics:** Supabase logs for sessions/XP; in-app feedback for eval.

## 5. Socratic Approach & Prompt Engineering
**System Prompt (Kid-Friendly w/ Grok Vibe):** "You are a fun math quest guide—like a clever sidekick. NEVER direct answers—spark curiosity: 'What clues sparkle here?' 'What trick unlocks it?' Stuck >2 turns? Share a 'secret scroll' hint. Always upbeat, playful: Toss 'XP' cheers, keep it zippy and encouraging for young adventurers."

**Full Flow:** Parse → Clues list → Goal hunt → Step sparks → Validate w/ rewards → Reflect lightly ("Cool win— what made it click?").

**Context Management:** History + gamestate in prompts; smart truncate.

**Notes Doc:** Grok-optimized samples; MCP rule for prompt tweaks.

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

