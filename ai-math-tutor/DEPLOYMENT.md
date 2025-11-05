# 🚀 Deployment Guide

Complete guide for deploying Eqara AI Math Tutor to production.

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database schema deployed to Supabase
- [ ] CCAT topics seeded
- [ ] API keys tested and working
- [ ] Build completes without errors
- [ ] Tests passing
- [ ] Performance optimized

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides the best experience for Nuxt applications with zero-config deployment.

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Deploy

```bash
# From project root
cd /path/to/ai-math-tutor

# Deploy to production
vercel --prod
```

#### Step 4: Configure Environment Variables

In Vercel Dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all required variables:

```
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROK_API_KEY=your-grok-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-claude-key
```

4. Ensure they're available for Production, Preview, and Development

#### Step 5: Redeploy

After adding environment variables, trigger a new deployment:

```bash
vercel --prod
```

### Option 2: Custom Server (Node.js)

For self-hosting on your own infrastructure.

#### Step 1: Build the Application

```bash
pnpm install
pnpm build
```

#### Step 2: Set Environment Variables

Create `.env` file on your server with all required variables.

#### Step 3: Start the Server

```bash
# Production mode
NODE_ENV=production node .output/server/index.mjs
```

Or use PM2 for process management:

```bash
npm install -g pm2
pm2 start .output/server/index.mjs --name eqara
pm2 save
pm2 startup
```

### Option 3: Docker

Containerized deployment for consistent environments.

#### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# Expose port
EXPOSE 3000

# Start server
CMD ["node", ".output/server/index.mjs"]
```

#### Step 2: Build Image

```bash
docker build -t eqara-math-tutor .
```

#### Step 3: Run Container

```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name eqara \
  eqara-math-tutor
```

## Post-Deployment

### 1. Verify Deployment

Visit your deployed URL and test:

- [ ] Homepage loads
- [ ] Chat interface functional
- [ ] Diagnostic test works
- [ ] Knowledge Graph displays
- [ ] Quiz system operates
- [ ] Reviews accessible
- [ ] Math rendering correct
- [ ] XP tracking functional

### 2. Performance Monitoring

#### Vercel Analytics

Enable in Vercel dashboard for:
- Page load times
- API response times
- Error tracking

#### Supabase Metrics

Monitor in Supabase dashboard:
- Database queries
- API calls
- Storage usage
- Realtime connections

### 3. Configure Custom Domain (Optional)

#### Vercel

1. Go to project settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

### 4. Set Up Monitoring

#### Error Tracking

Consider adding Sentry or similar:

```bash
pnpm add @sentry/nuxt
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@sentry/nuxt/module'],
  sentry: {
    dsn: process.env.SENTRY_DSN
  }
})
```

#### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- Better Uptime

## Performance Optimization

### 1. Bundle Size Optimization

Check bundle size:

```bash
pnpm build
ls -lh .output/public/_nuxt/
```

Target: < 2MB gzipped

Optimize if needed:
- Remove unused dependencies
- Lazy load heavy components
- Enable tree-shaking
- Use dynamic imports

### 2. Image Optimization

Ensure all images are optimized:
- Use WebP format
- Compress with tools like ImageOptim
- Use responsive images
- Lazy load images

### 3. Database Optimization

#### Supabase

- Enable connection pooling
- Add database indexes
- Optimize complex queries
- Use row-level security efficiently

Check slow queries:

```sql
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 4. Caching Strategy

Enable caching in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/api/**': { cache: { maxAge: 60 } }
  }
})
```

### 5. CDN Configuration

Vercel automatically uses their Edge Network.

For custom deployments:
- Use Cloudflare CDN
- Cache static assets
- Enable compression

## Security Checklist

- [ ] Environment variables secured (not in git)
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] RLS policies active in Supabase
- [ ] API keys rotated regularly
- [ ] Input validation on all endpoints
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

## Backup Strategy

### Database Backups

Supabase provides automatic daily backups.

Manual backup:

```bash
# Using Supabase CLI
supabase db dump -f backup.sql
```

### Code Backups

Ensure code is in version control:

```bash
git remote add origin your-repo-url
git push -u origin main
```

## Rollback Procedure

### Vercel

Rollback to previous deployment:

1. Go to Deployments in Vercel dashboard
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Custom Server

```bash
# Using PM2
pm2 stop eqara
# Deploy previous version
pm2 start .output/server/index.mjs --name eqara
```

## Troubleshooting

### Build Failures

**Issue**: Build fails with module errors

**Solution**:
```bash
rm -rf node_modules .nuxt
pnpm install
pnpm build
```

### Runtime Errors

**Issue**: 500 errors in production

**Solution**:
1. Check environment variables are set
2. Review server logs
3. Verify database connectivity
4. Check API key validity

### Database Connection Issues

**Issue**: Can't connect to Supabase

**Solution**:
1. Verify SUPABASE_URL and keys
2. Check IP allowlist in Supabase
3. Test connection with curl:
```bash
curl https://your-project.supabase.co/rest/v1/topics \
  -H "apikey: your-anon-key"
```

### Performance Issues

**Issue**: Slow page loads

**Solution**:
1. Enable compression
2. Optimize images
3. Reduce bundle size
4. Use caching
5. Check database query performance

## Maintenance

### Regular Tasks

**Weekly**:
- Review error logs
- Check performance metrics
- Monitor database size
- Review API usage

**Monthly**:
- Update dependencies
- Rotate API keys (security)
- Review and optimize slow queries
- Check bundle size

**Quarterly**:
- Major dependency updates
- Security audit
- Performance review
- Backup verification

### Updates

To deploy updates:

```bash
# Pull latest code
git pull origin main

# Install dependencies
pnpm install

# Build
pnpm build

# Test locally
pnpm preview

# Deploy
vercel --prod
```

## Cost Estimates

### Vercel
- **Hobby**: Free (personal projects)
- **Pro**: $20/month (production apps)

### Supabase
- **Free**: Up to 500MB database, 1GB file storage
- **Pro**: $25/month (8GB database, 100GB storage)

### LLM APIs (estimated per 1000 users/month)
- **Grok**: ~$50-100
- **OpenAI**: ~$100-200

**Total estimated cost**: $0-350/month depending on scale

## Support

For deployment issues:
- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support
- GitHub Issues: Open an issue on project repository

---

**Deployment complete!** 🎉 Your AI Math Tutor is now live!

