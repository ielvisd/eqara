# 🧠 MCP References - Build Bible

*This is your sacred scroll! Reference these MCPs (Modular Component Prompts) for every implementation to ensure error-free, one-shot LLM builds. Treat this as your "build bible" - no component should be built without consulting the relevant MCP.*

## 📚 Core Framework MCPs

### Nuxt 3 Official Documentation
**URL:** [nuxt.com/docs/getting-started](https://nuxt.com/docs/getting-started)
**Usage:** Reference for all Nuxt fundamentals, project structure, and best practices
**Key Sections:**
- Project Structure (`/pages`, `/composables`, `/server/api`)
- Configuration (`nuxt.config.ts`)
- Server API routes
- Auto-imports and modules

### Vue 3 Official Guide
**URL:** [vuejs.org/guide](https://vuejs.org/guide)
**Usage:** Reference for Vue 3 Composition API, reactivity, and component patterns
**Key Sections:**
- Composition API
- Reactivity Fundamentals
- Component Basics
- Transitions and Animations

## 🎨 UI & Components MCPs

### Nuxt UI Component Library
**URL:** [ui.nuxt.com/components](https://ui.nuxt.com/components)
**Usage:** Primary reference for all UI components - always paste relevant excerpts in prompts
**Essential Components for Our App:**
- `UChatBubble` - For conversation messages
- `UCard` - For message containers
- `UTextarea` - For text input
- `UUpload` - For file/image uploads
- `UButton` - For all interactive elements
- `USidebar` - For history/achievements panel
- `UModal` - For auth and feedback forms
- `UAlert` - For error messages and notifications

### Nuxt UI Forms & Inputs
**URL:** [ui.nuxt.com/forms](https://ui.nuxt.com/forms)
**Usage:** Reference for form validation, input handling, and file uploads
**Key Sections:**
- Form validation patterns
- File upload configurations
- Input props and events

## 🗄️ Backend & Database MCPs

### Supabase Auth
**URL:** [supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)
**Usage:** Reference for authentication setup, email/magic link, and user management
**Key Sections:**
- Email/Magic Link Auth
- Row Level Security (RLS)
- Anonymous sessions
- Auth helpers and composables

### Supabase Realtime
**URL:** [supabase.com/docs/guides/realtime](https://supabase.com/docs/guides/realtime)
**Usage:** Reference for real-time chat and gamestate synchronization
**Key Sections:**
- Realtime subscriptions
- Broadcast channels
- Presence features
- Database changes

### Supabase Storage
**URL:** [supabase.com/docs/guides/storage](https://supabase.com/docs/guides/storage)
**Usage:** Reference for image uploads and file management
**Key Sections:**
- File uploads
- Public/private buckets
- File transformations
- Security policies

## 🤖 AI & LLM Integration MCPs

### Grok API Documentation
**URL:** [console.x.ai/docs](https://console.x.ai/docs) (or equivalent)
**Usage:** Reference for integrating Grok's fun, engaging personality for math tutoring
**Key Patterns:**
- System prompt engineering for Socratic method
- Context management for multi-turn conversations
- Vision API for image processing
- Token optimization strategies

### Claude/Sonnet API (Fallback)
**URL:** [docs.anthropic.com](https://docs.anthropic.com/)
**Usage:** Fallback reference for complex mathematical reasoning
**Key Sections:**
- Message formatting
- System prompts
- Tool use and function calling

## 🧪 Testing & Quality MCPs

### Playwright E2E Testing
**URL:** [playwright.dev/docs/intro](https://playwright.dev/docs/intro)
**Usage:** Reference for end-to-end testing of chat flows and user interactions
**Key Sections:**
- Test structure and patterns
- Chat interface testing
- File upload testing
- Auth flow testing

## 🚀 Deployment & DevOps MCPs

### Chrome DevTools
**URL:** [developer.chrome.com/docs/devtools](https://developer.chrome.com/docs/devtools/overview)
**Usage:** Reference for performance profiling and debugging
**Key Sections:**
- Performance monitoring
- Network analysis
- Memory profiling
- Bundle size optimization

### Vercel Nuxt Deployment
**URL:** [vercel.com/docs/frameworks/nuxt](https://vercel.com/docs/frameworks/nuxt)
**Usage:** Reference for deploying Nuxt apps to Vercel
**Key Sections:**
- Build configuration
- Environment variables
- Custom domains
- Preview deployments

## 📋 Implementation Checklist

### Pre-Build Verification
- [ ] **MANDATORY:** Include relevant MCP URL in every component prompt
- [ ] **MANDATORY:** Paste MCP excerpts when implementing components
- [ ] **MANDATORY:** Reference framework docs for architecture decisions
- [ ] **MANDATORY:** Check compatibility between Nuxt UI and Supabase versions

### Component Implementation Pattern
```typescript
// Example: Always include MCP reference in comments
// Reference: ui.nuxt.com/components/chat-bubble
// Implementation based on Nuxt UI UChatBubble component

<template>
  <UChatBubble
    :messages="messages"
    :ui="{ wrapper: 'space-y-4' }"
  />
</template>
```

### Common MCP Lookup Commands
- **UI Component:** "Using Nuxt UI MCP: [paste ui.nuxt.com/components excerpt]"
- **Auth Setup:** "Following Supabase auth MCP: [paste supabase.com/docs/guides/auth excerpt]"
- **Database:** "Using Supabase realtime MCP: [paste realtime guide excerpt]"
- **Deployment:** "Following Vercel Nuxt MCP: [paste vercel.com/docs/frameworks/nuxt excerpt]"

## 🎯 Critical Success Factors

### Error Prevention
1. **Always reference MCPs** - No guessing, no assumptions
2. **Version compatibility** - Check Nuxt UI + Supabase compatibility
3. **Security patterns** - Follow Supabase RLS and auth patterns exactly
4. **Performance** - Reference Chrome DevTools MCP for optimization

### Quality Assurance
1. **Test patterns** - Use Playwright MCP examples for E2E tests
2. **Code structure** - Follow Nuxt 3 project structure guidelines
3. **Type safety** - Leverage TypeScript as per Vue 3 guide
4. **Accessibility** - Reference Nuxt UI accessibility patterns

## 🚨 Emergency MCP Lookups

When stuck, immediately reference:
- **UI Issues:** `ui.nuxt.com/components` + component name
- **Auth Problems:** `supabase.com/docs/guides/auth`
- **Database Issues:** `supabase.com/docs/guides/realtime`
- **Build Errors:** `nuxt.com/docs/getting-started`
- **Performance:** `developer.chrome.com/docs/devtools`

---

*Remember: MCPs are your secret weapon! They transform "I think this might work" into "This is guaranteed to work." Use them liberally and reference them in every prompt. Let's build something amazing! 🚀*
