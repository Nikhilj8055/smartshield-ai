# SmartShield AI - Deployment Guide

## Production Deployment Checklist

### 1. Database Configuration (Supabase / Managed PostgreSQL)
1. Create a PostgreSQL 15+ database or Supabase project.
2. Apply migrations in order:
   - `psql $DATABASE_URL -f database/migrations/001_initial_schema.sql`
   - `psql $DATABASE_URL -f database/policies/001_rls_policies.sql`
   - `psql $DATABASE_URL -f database/seeds/001_seed_scam_patterns.sql`

### 2. Backend Environment Variables
Configure the following in your container / host environment:
- `PORT=5000`
- `NODE_ENV=production`
- `CORS_ORIGIN=https://smartshield.yourdomain.com`
- `JWT_SECRET=<secure_random_string_min_32_chars>`
- `DATABASE_URL=postgresql://user:password@host:5432/dbname`
- `OPENAI_API_KEY=<optional_key_for_llm_orchestration>`

### 3. Backend Build & Launch
```bash
cd backend
npm run build
npm start
```
Health Check: `GET http://localhost:5000/api/v1/health` returns `200 OK`.

### 4. Frontend Build & Static Serving
```bash
cd frontend
npm run build
# Deploy 'dist' directory to Netlify, Vercel, Cloudflare Pages, or Nginx
```

### 5. Automated CI / Verification
Run backend unit and integration test suite:
```bash
cd backend
npm test
```
