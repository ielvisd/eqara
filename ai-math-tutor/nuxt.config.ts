// https://nuxt.com/docs/api/configuration/nuxt-config
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
  }
})
