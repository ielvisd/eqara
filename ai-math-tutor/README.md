# 🎓 Eqara - Socratic Learning Assistant

*Transforming math homework into epic learning quests! 🚀*

Eqara is a web-based AI tutor that empowers students to solve math problems independently through Socratic questioning, supercharged with light videogame-like engagement. Inspired by Khan Academy's Khanmigo, it parses problems from text or screenshots and guides discovery without spoon-feeding answers.

## 🌟 Current Status: Foundation Complete! ✅

**Completed in PR #1:**
- ✅ Nuxt 3 project scaffolded with proper structure
- ✅ Nuxt UI integrated and configured
- ✅ **6 Real MCP Servers configured and tested** (70+ tools available!)
  - Nuxt UI MCP: Component docs & examples (13 tools)
  - Vue App MCP: Component tree & state inspection (7 tools)
  - Supabase MCP: Database operations & queries (15+ tools)
  - Playwright MCP: Browser automation & testing (20+ tools)
  - Chrome DevTools MCP: Browser debugging & performance (18+ tools)
  - Vercel MCP: Deployment management (requires auth)
- ✅ Documentation scrapers removed - only pure MCP servers remain
- ✅ vite-plugin-vue-mcp installed for development insights
- ✅ @playwright/mcp package installed for testing automation
- ✅ Supabase module configured (project setup pending)
- ✅ **Unified MCP documentation** (`MCP-SETUP.md`)
- ✅ Environment configuration documented
- ✅ Build process tested and working
- ✅ Vercel deployment configuration ready
- ✅ Project structure matches monorepo expectations

**Ready for Next Steps:**
- 🔄 Supabase project setup (requires account)
- 🎯 PR #2: Vision Quest - Image parsing & onboarding
- 💬 PR #3: Chat Quest - Multi-turn dialogue engine

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm

### Installation
```bash
# Clone and navigate
cd ai-math-tutor

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the foundation!

### Environment Setup
1. Copy environment template: `cp .env.template .env`
2. Fill in your API keys (see `env-config.md` for details)
3. Set up Supabase project (see Supabase Setup below)

## 🏗️ Architecture Overview

```
Frontend (Nuxt 3 + Vercel)
├── Pages (/pages) - Route-based components
├── Components (Nuxt UI) - UChatBubble, UUpload, etc.
├── Composables (/composables) - Reusable logic
└── Server API (/server/api) - LLM proxy endpoints

Backend (Supabase)
├── Auth - Email/magic link, anonymous sessions
├── Database - Chat history, gamestate, user profiles
├── Storage - Image uploads
└── Realtime - Live chat synchronization

AI Services
├── Grok (Primary) - Fun, engaging Socratic responses
└── Claude Sonnet (Fallback) - Complex reasoning
```

## 🛠️ Development Workflow

### Using MCP References
**MANDATORY:** Reference these docs for all implementations:
- **UI Components:** `MCP-REFERENCES.md` + [ui.nuxt.com/components](https://ui.nuxt.com/components)
- **Supabase:** `MCP-REFERENCES.md` + [supabase.com/docs](https://supabase.com/docs)
- **Nuxt:** `MCP-REFERENCES.md` + [nuxt.com/docs](https://nuxt.com/docs)

### Build & Deploy
```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🔧 Supabase Setup (Required for Full Functionality)

1. **Create Project:**
   - Visit [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and keys

2. **Configure Database:**
   ```sql
   -- Run these in Supabase SQL Editor
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
     session_id TEXT, -- For anonymous sessions
     xp INTEGER DEFAULT 0,
     level INTEGER DEFAULT 1,
     badges TEXT[] DEFAULT '{}',
     current_streak INTEGER DEFAULT 0,
     updated_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(user_id, session_id)
   );
   ```

3. **Enable Features:**
   - Authentication (Email/Magic Link)
   - Storage (for image uploads)
   - Realtime (for live chat)

4. **Update Environment Variables:**
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## 📋 Roadmap (PRs as Tasks)

See `../tasks.md` for detailed breakdown:

- **PR #1 ✅** - Foundation Quest (Environment Setup)
- **PR #2 🔄** - Vision Quest (Image Parsing & Onboarding)
- **PR #3** - Chat Quest (Multi-turn Dialogue Engine)
- **PR #4** - Wisdom Quest (Socratic Logic & Problem Solving)
- **PR #5** - Beauty Quest (UI Polish & Math Rendering)
- **PR #6** - Launch Quest (Deploy & Polish)

## 🎮 Gamification Features (Planned)

- **XP System:** Earn points for participation and correct steps
- **Badge Collection:** Unlock achievements for math milestones
- **Level Progression:** Advance through learning tiers
- **Streak Rewards:** Bonus XP for consecutive sessions
- **Visual Feedback:** Smooth animations and celebratory effects

## 🧪 Testing

```bash
# E2E tests (Playwright)
npm run test:e2e

# Unit tests (when implemented)
npm run test:unit
```

## 📊 Performance Targets

- **Bundle Size:** <2MB (gzipped)
- **Response Time:** <2 seconds
- **Animation FPS:** 60fps
- **Accessibility:** WCAG 2.1 AA compliance

## 🤝 Contributing

1. **Follow MCP References:** Always reference the build bible
2. **PR Structure:** Each major feature is a PR with clear acceptance criteria
3. **Code Quality:** TypeScript, ESLint, and proper component patterns
4. **Testing:** E2E coverage for critical user flows

## 📚 Documentation

- **PRD:** `../prd.md` - Product requirements and vision
- **Tasks:** `../tasks.md` - Development roadmap as PRs
- **Architecture:** `../architecture.md` - System design and diagrams
- **MCP References:** `MCP-REFERENCES.md` - Build bible for error-free development

## 🔑 Environment Variables

See `env-config.md` for complete setup instructions.

## 📞 Support

For questions about:
- **Architecture:** Check `../architecture.md`
- **Implementation:** Reference `MCP-SETUP.md`
- **Next Steps:** See `../tasks.md`

---

*Ready to turn math homework into an adventure? Let's build the future of learning! 🎓✨*