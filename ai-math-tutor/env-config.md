# Environment Variables Configuration

Create a `.env` file in the root of this project with the following variables:

```bash
# Supabase Configuration
# Get these from your Supabase project dashboard at https://supabase.com/dashboard
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# LLM Configuration (Grok API)
# Get from xAI API dashboard at https://console.x.ai/
GROK_API_KEY=your-grok-api-key-here

# Fallback LLM Configuration (Claude/Sonnet)
# Get from Anthropic API dashboard at https://console.anthropic.com/
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# App Configuration
NUXT_PUBLIC_APP_NAME=AI Math Tutor
NUXT_PUBLIC_APP_VERSION=1.0.0

# Environment
NODE_ENV=development
```

## Setup Instructions

1. **Supabase Setup:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Copy the Project URL and anon/service_role keys from Settings > API

2. **Grok API Setup:**
   - Visit [console.x.ai](https://console.x.ai/) to get your API key
   - This will be our primary LLM for fun, engaging responses

3. **Anthropic API Setup (Optional):**
   - Visit [console.anthropic.com](https://console.anthropic.com/) for Claude API access
   - Used as fallback for complex mathematical reasoning

## Security Notes

- Never commit `.env` files to version control
- The `SUPABASE_SERVICE_ROLE_KEY` has admin privileges - keep it secure
- Use environment-specific keys for production deployments
