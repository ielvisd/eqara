// https://nuxt.com/docs/api/configuration/nuxt-config
// @ts-ignore - vite-plugin-vue-mcp may not have type definitions
import { VueMcp } from 'vite-plugin-vue-mcp'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  app: {
    head: {
      title: 'Eqara',
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
        }
      ],
      meta: [
        { name: 'description', content: 'Eqara - Your AI-powered math tutor that helps you learn through Socratic questioning and gamification' }
      ]
    }
  },
  css: [
    '~/assets/css/main.css',
    '@vue-flow/core/dist/style.css',
    '@vue-flow/core/dist/theme-default.css'
  ],

  // Disable SSR temporarily to test
  ssr: false,
  // Runtime config for Supabase and API keys
  runtimeConfig: {
    // Private keys (server-side only)
    grokApiKey: process.env.GROK_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // Service role key for server-side queries
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
