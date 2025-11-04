// https://nuxt.com/docs/api/configuration/nuxt-config
import { VueMcp } from 'vite-plugin-vue-mcp'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  app: {
    head: {
      title: 'Eqara',
      meta: [
        { name: 'description', content: 'Eqara - Your AI-powered math tutor that helps you learn through Socratic questioning and gamification' }
      ]
    }
  },
  // Nuxt UI configuration
  ui: {
    global: true,
    icons: ['heroicons', 'lucide']
  },
  css: ['~/assets/css/main.css'],

  // Disable SSR temporarily to test
  ssr: false,
  // Runtime config for Supabase and API keys
  runtimeConfig: {
    // Private keys (server-side only)
    grokApiKey: process.env.GROK_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    // Public config (client-side accessible)
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    }
  },
  // Vite configuration with Vue MCP plugin
  vite: {
    plugins: [
      VueMcp({
        // Disable auto-update to avoid permission issues
        updateCursorMcpJson: false,
        // Print MCP server URL in console
        printUrl: true
      })
    ]
  }
})
