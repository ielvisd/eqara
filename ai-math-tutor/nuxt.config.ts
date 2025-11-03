// https://nuxt.com/docs/api/configuration/nuxt-config
import { VueMcp } from 'vite-plugin-vue-mcp'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/supabase'],
  // Nuxt UI configuration per MCP guidelines
  ui: {
    // Enable auto-imports for better DX
    global: true,
    // Configure theme and icons
    icons: ['heroicons', 'lucide']
  },
  // Supabase configuration per MCP guidelines
  supabase: {
    // Service key for server-side operations
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    // Redirect options for auth
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/callback',
      exclude: ['/']
    }
  },
  // Vite configuration with Vue MCP plugin
  vite: {
    plugins: [
      VueMcp({
        // Auto-update Cursor MCP config
        updateCursorMcpJson: {
          enabled: true,
          serverName: 'vue-app-mcp'
        },
        // Print MCP server URL in console
        printUrl: true
      })
    ]
  }
})
