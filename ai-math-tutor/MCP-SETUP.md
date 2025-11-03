# 🧠 MCP Tools Setup Guide

*Power up your development with real MCP (Model Context Protocol) servers for instant documentation access!*

## 🎯 What are MCP Tools?

MCP (Model Context Protocol) tools allow AI assistants to access external documentation, APIs, and resources directly through standardized protocols. For our AI Math Tutor project, MCP tools provide instant access to official documentation and component libraries.

## 🚀 Current Setup Status

### ✅ Nuxt UI MCP Server (Active)
- **Status:** Configured and ready
- **Server:** `https://ui.nuxt.com/mcp`
- **Configuration:** `.cursor/mcp.json`
- **Features:** Component docs, examples, templates, migration guides

### ✅ Vue App MCP Server (Active)
- **Status:** Configured and ready
- **Server:** `http://localhost:5173/__mcp/sse` (when dev server runs)
- **Configuration:** Auto-updated by vite-plugin-vue-mcp
- **Features:** Component tree, state inspection, router info, Pinia stores

### ✅ Supabase MCP Server (Active)
- **Status:** Configured and ready
- **Server:** `https://mcp.supabase.com/mcp`
- **Configuration:** Added to `.cursor/mcp.json`
- **Features:** Database queries, table operations, auth management, storage
- **Security:** OAuth authentication, project scoping, read-only mode available

### ✅ Playwright MCP Server (Active)
- **Status:** Installed and configured
- **Command:** `npx @playwright/mcp@latest`
- **Configuration:** Added to `.cursor/mcp.json`
- **Features:** Browser automation, web testing, screenshot capture, form filling
- **Tools:** 20+ browser automation tools including click, type, navigate, screenshot

### 🔄 Vercel MCP Server (Requires Auth)
- **Status:** Available but requires Vercel authentication
- **Server:** `https://vercel.com/mcp` (requires login)
- **Features:** Deployment management, project operations, domain management
- **Note:** Currently requires manual authentication setup

### ✅ Chrome DevTools MCP Server (Active)
- **Status:** Installed and configured
- **Command:** `npx chrome-devtools-mcp@latest`
- **Configuration:** Added to `.cursor/mcp.json`
- **Features:** Browser debugging, performance analysis, DOM inspection
- **Tools:** 18+ debugging and analysis tools


## 🔧 Nuxt UI MCP Setup (Cursor)

The official Nuxt UI MCP server is already configured! Here's what you have:

### Current Configuration
```json
// .cursor/mcp.json
{
  "mcpServers": {
    "nuxt-ui": {
      "type": "http",
      "url": "https://ui.nuxt.com/mcp"
    }
  }
}
```

### Test the Setup
```bash
# Run the MCP connectivity test
node test-mcp.js
```

### Available MCP Tools

Once connected, you can use these tools:

#### Nuxt UI Documentation Tools
- **`list_components`** - Lists all available components
- **`get_component`** - Get specific component documentation
- **`get_component_metadata`** - Detailed props, slots, events
- **`search_components_by_category`** - Find components by category

#### Vue App Development Tools (when dev server runs)
- **`get-component-tree`** - View your app's component hierarchy
- **`get-component-state`** - Inspect component reactive data
- **`edit-component-state`** - Modify component state live
- **`highlight-component`** - Highlight components in browser
- **`get-router-info`** - View routing configuration
- **`get-pinia-tree`** - See Pinia store structure
- **`get-pinia-state`** - Inspect Pinia store data

#### Additional Nuxt UI Tools
- **`list_templates`** - Browse project templates
- **`get_template`** - Get template setup instructions
- **`list_examples`** - Browse code examples
- **`get_example`** - Get example implementations
- **`get_migration_guide`** - Version migration guides

#### Supabase Database Tools (when authenticated)
- **Database queries** - Natural language SQL queries
- **Table operations** - Create, read, update, delete operations
- **Schema inspection** - View table structures and relationships
- **Authentication management** - User and session management
- **Storage operations** - File upload/download operations
- **Realtime subscriptions** - Live data monitoring

#### Chrome DevTools Debugging Tools
- **DOM inspection** - Analyze page structure and elements
- **Console analysis** - View JavaScript console messages and errors
- **Network monitoring** - Inspect HTTP requests and responses
- **Performance tracing** - Analyze page load performance
- **Screenshot capture** - Take full page or element screenshots
- **JavaScript evaluation** - Execute JS code in browser context
- **Page navigation** - Navigate to URLs and manage tabs
- **Device emulation** - Test responsive design on different devices

## 🎮 Using MCP in Development

### Query Examples
Once MCP is active, you can ask your AI assistant:

**For Nuxt UI components:**
```
"List all available Nuxt UI components"
"Get Button component documentation"
"What props does Input accept?"
"Find form-related components"
"Show me a chat bubble example"
"Get migration guide for v4"
```

**For your Vue app (when dev server runs):**
```
"Show me the component tree"
"Get router information"
"What components are mounted?"
"Show Pinia store state"
"Highlight the navbar component"
```

**For Supabase database (when authenticated):**
```
"Show me all tables in my database"
"Create a users table with email and name"
"Query all chat history records"
"Add a new column to the gamestate table"
"Show me the database schema"
```

**For Chrome DevTools debugging:**
```
"Take a screenshot of the current page"
"Show me console errors and warnings"
"Analyze the page performance"
"Inspect network requests"
"Emulate mobile device viewport"
"Execute JavaScript in the browser"
```

### In Code Comments
```typescript
// Reference: Nuxt UI MCP - get_component("UChatBubble")
// Implementation based on official UChatBubble component docs

<template>
  <UChatBubble
    :messages="messages"
    :ui="{ wrapper: 'space-y-4' }"
  />
</template>
```

## 🧪 Testing MCP Connectivity

Run the test script to verify everything is working:

```bash
cd ai-math-tutor
node test-mcp.js
```

Expected output:
```
🚀 Testing MCP server connectivity for AI Math Tutor

🧪 Testing Nuxt UI MCP server at https://ui.nuxt.com/mcp...
✅ Nuxt UI MCP server is responding
   Status: 200
   Protocol: Server-Sent Events (SSE)
   Available tools: 13
   Sample tools: list_components, list_composables, get_component, get_component_metadata, list_templates

📊 Test Results Summary:
========================================
✅ Working - Nuxt UI MCP: https://ui.nuxt.com/mcp

🎉 Nuxt UI MCP server is ready!
💡 Your Cursor IDE should now have access to Nuxt UI documentation.
💡 Try asking: "List all Nuxt UI components" or "Get Button component docs"
```

## 📚 MCP Servers Configuration

### Nuxt Framework (`nuxt-docs`)
```json
{
  "command": "npx",
  "args": ["@modelcontextprotocol/server-everything", "https://nuxt.com/docs/**"],
  "env": {
    "ALLOWED_URLS": "https://nuxt.com/docs/**"
  }
}
```
**Key Resources:**
- `/docs/getting-started/introduction`
- `/docs/api/configuration/nuxt-config`
- `/docs/guide/directory-structure`

### Nuxt UI Components (`nuxt-ui-docs`)
```json
{
  "command": "npx",
  "args": ["@modelcontextprotocol/server-everything", "https://ui.nuxt.com/**"],
  "env": {
    "ALLOWED_URLS": "https://ui.nuxt.com/**"
  }
}
```
**Essential Components:**
- `/components/chat-bubble` - For conversation UI
- `/components/upload` - For image uploads
- `/components/card` - For message containers
- `/components/button` - For all interactions

### Vue.js Framework (`vue-docs`)
```json
{
  "command": "npx",
  "args": ["@modelcontextprotocol/server-everything", "https://vuejs.org/**"],
  "env": {
    "ALLOWED_URLS": "https://vuejs.org/**"
  }
}
```
**Key Topics:**
- `/guide/essentials/application` - App structure
- `/guide/reusability/composables` - Composition API
- `/guide/built-ins/transition` - Animations

### Supabase Backend (`supabase-docs`)
```json
{
  "command": "npx",
  "args": ["@modelcontextprotocol/server-everything", "https://supabase.com/docs/**"],
  "env": {
    "ALLOWED_URLS": "https://supabase.com/docs/**"
  }
}
```
**Core Services:**
- `/docs/guides/auth` - Authentication setup
- `/docs/guides/realtime` - Live chat features
- `/docs/guides/storage` - File uploads

## 🛠️ Development Workflow with MCP

### Before Starting a Feature
1. **Check MCP References:** `MCP-REFERENCES.md` for required docs
2. **Query Documentation:**
```typescript
// Example: Get UChatBubble component docs
// Reference: ui.nuxt.com/components/chat-bubble
// [MCP query would go here]
```

### During Implementation
```typescript
// Always include MCP reference in comments
// Reference: ui.nuxt.com/components/chat-bubble
// Implementation based on Nuxt UI UChatBubble component

<template>
  <UChatBubble
    :messages="messages"
    :ui="{ wrapper: 'space-y-4' }"
  />
</template>
```

### Testing & Validation
```bash
# Test MCP server connectivity
mcp-cli test-server nuxt-ui-server.json

# Query specific documentation
mcp-cli query nuxt-ui-docs "UChatBubble props"
```

## 🔧 Troubleshooting

### Common Issues

**MCP Server Not Found:**
```bash
# Reinstall MCP CLI
npm install -g @modelcontextprotocol/cli

# Check server status
mcp-cli list-servers
```

**Documentation Access Failed:**
```bash
# Test URL accessibility
curl -I https://ui.nuxt.com/components

# Check network connectivity
ping nuxt.com
```

**Configuration Errors:**
```bash
# Validate JSON syntax
cat mcp.json | jq .

# Test configuration
mcp-cli validate-config mcp.json
```

### Alternative Access Methods

If MCP servers aren't working, use these alternatives:

1. **Direct Browser Access:**
   - [Nuxt Docs](https://nuxt.com/docs)
   - [Nuxt UI](https://ui.nuxt.com)
   - [Vue.js](https://vuejs.org)

2. **Bookmark Key Pages:**
   - Save frequently used component docs
   - Use browser bookmarks for quick access

3. **Offline Documentation:**
   ```bash
   # Download docs for offline use
   wget --mirror --convert-links --adjust-extension --page-requisites \
        --no-parent https://ui.nuxt.com/components/
   ```

## 📋 MCP Checklist for PRs

Before submitting any PR, ensure:

- [ ] **MCP Reference Included:** Component implementations reference MCP docs
- [ ] **Server Connectivity:** Required MCP servers are accessible
- [ ] **Documentation Queries:** Used MCP to verify implementation details
- [ ] **Fallback Access:** Alternative access methods available if MCP fails

## 🎯 MCP Integration Benefits

### For Developers
- **Instant Documentation:** No need to leave IDE for docs
- **Verified Implementations:** Always use official patterns
- **Faster Development:** Reduce guesswork and errors
- **Consistent Code:** Standardized component usage

### For AI-Assisted Development
- **Context-Aware Help:** AI can access relevant documentation
- **Error Prevention:** Catch implementation mistakes early
- **Best Practices:** Always follow official guidelines
- **Quality Assurance:** Automated documentation compliance

## 🚀 Getting Started

1. **Run Setup:**
```bash
./setup-mcp.sh
```

2. **Verify Installation:**
```bash
mcp-cli list-servers
```

3. **Test a Query:**
```bash
mcp-cli query nuxt-ui-docs "UButton variants"
```

4. **Start Developing:** Use MCP references in all implementations!

## 🛠️ Development Best Practices

### Implementation Checklist
Before implementing any feature:
- [ ] **MANDATORY:** Include relevant MCP URL in every component prompt
- [ ] **MANDATORY:** Reference MCP tools for component implementation details
- [ ] **MANDATORY:** Check compatibility between Nuxt UI and Supabase versions
- [ ] **MANDATORY:** Follow framework docs for architecture decisions

### Component Implementation Pattern
```typescript
// Always include MCP reference in comments
// Reference: Nuxt UI MCP - get_component("UChatBubble")
// Implementation based on official UChatBubble component docs

<template>
  <UChatBubble
    :messages="messages"
    :ui="{ wrapper: 'space-y-4' }"
  />
</template>
```

### Common MCP Lookup Commands
- **UI Component:** Ask AI: "Get [ComponentName] component documentation"
- **Auth Setup:** Ask AI: "Show Supabase authentication setup"
- **Database:** Ask AI: "Show Supabase table creation examples"
- **Testing:** Ask AI: "Show Playwright test examples"
- **Debugging:** Ask AI: "Analyze performance with Chrome DevTools"

## 🎯 Critical Success Factors

### Error Prevention
1. **Always reference MCPs** - No guessing, no assumptions
2. **Version compatibility** - Check Nuxt UI + Supabase compatibility
3. **Security patterns** - Follow Supabase RLS and auth patterns exactly
4. **Performance** - Use Chrome DevTools MCP for optimization

### Quality Assurance
1. **Test patterns** - Use Playwright MCP examples for E2E tests
2. **Code structure** - Follow Nuxt 3 project structure guidelines
3. **Type safety** - Leverage TypeScript as per Vue 3 guide
4. **Accessibility** - Reference Nuxt UI accessibility patterns

## 🚨 Emergency MCP Lookups

When stuck, immediately ask your AI assistant:
- **UI Issues:** "Get [ComponentName] component details"
- **Auth Problems:** "Show Supabase authentication examples"
- **Database Issues:** "Show Supabase query examples"
- **Build Errors:** "Check Nuxt configuration"
- **Performance:** "Analyze with Chrome DevTools"

---

*Remember: MCPs are your secret weapon! They transform "I think this might work" into "This is guaranteed to work." Use them liberally and reference them in every implementation. Let's build something amazing! 🚀*

*Ready to supercharge your development with instant documentation access? Let's set up those MCP tools! 🚀📚*
