# OpenCausenx Quick Start Guide

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- **PostgreSQL 14+** running locally or accessible remotely
- **npm** or **pnpm** package manager

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This installs all required packages including Next.js, Prisma, TypeScript, and more.

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` if needed. The defaults work for local development, but you can customize:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/opencausenx"  # If using non-default DB
```

**Optional**: Add an OpenAI or Anthropic API key to enable LLM-generated explanations:

```env
OPENAI_API_KEY="sk-your-key-here"
# OR
ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

### 3. Set Up the Database

Run database migrations and seed sample data:

```bash
npm run db:migrate
npm run db:seed
```

This creates the database schema and loads:

- A demo user account
- Sample event sources
- Sample world events
- A sample SaaS business model

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## First Time Usage

### Step 1: View the Dashboard

Open [http://localhost:3000](http://localhost:3000) in your browser.

You'll see:

- **Recent Global Events** (left column)
- **Active Insights** (right column, empty initially)

### Step 2: Generate Insights

Click the **"Generate Insights"** button in the header.

This will:

1. Analyze all events in the database
2. Apply causal mapping rules
3. Generate insights for your business model
4. (Optionally) Use LLM to create plain-English explanations

Wait a few seconds, then the page will refresh with new insights.

### Step 3: Explore an Insight

Click on any insight card to view:

- **Impact overview** (magnitude, direction, time horizon)
- **Plain-English explanation** (if LLM is configured)
- **Causal reasoning chain** (step-by-step logic)
- **Affected business drivers**
- **Key assumptions**
- **Confidence assessment**
- **Source event details**

### Step 4: Configure Your Business Model (Optional)

Click **"Configure Business Model"** in the header to customize:

- Business name
- Operating regions
- Customer regions
- (Advanced: revenue/cost structure via API)

## Useful Commands

```bash
# Start development server
npm run dev

# View database in Prisma Studio
npm run db:studio

# Run database migrations
npm run db:migrate

# Reseed database
npm run db:seed

# Build for production
npm run build

# Start production server
npm start
```

## Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`

**Solution**: Ensure PostgreSQL is running and the `DATABASE_URL` in `.env.local` is correct.

```bash
# Check if PostgreSQL is running (macOS)
brew services list | grep postgresql

# Start PostgreSQL if needed
brew services start postgresql
```

### No Events Showing Up

**Solution**: Run the seed script to load sample data:

```bash
npm run db:seed
```

### No Insights Generated

**Possible causes**:

1. No business model configured → Go to `/business-model` and create one
2. No events in database → Run `npm run db:seed`
3. Events not relevant to business regions → Check that business model regions match event regions

### LLM Explanations Not Working

**Possible causes**:

1. No API key configured → Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to `.env.local`
2. Invalid API key → Check that the key is correct
3. API quota exceeded → Check your OpenAI/Anthropic account

**Note**: The system works fine without LLM; you'll get basic explanations from the causal path.

## Next Steps

1. **Customize your business model**: Update regions, sensitivities, cost/revenue structure
2. **Add real data sources**: Integrate RSS feeds or economic APIs (see README.md → Extending OpenCausenx)
3. **Create custom causal rules**: Add industry-specific logic (see README.md → Adding New Event Types)
4. **Deploy to production**: Use Vercel, Railway, or your preferred hosting platform

## Getting Help

- **Documentation**: See [README.md](./README.md) for comprehensive docs
- **Architecture**: See "Architecture" section in README
- **Extending**: See "Extending OpenCausenx" section in README
- **Code comments**: Every file has detailed `WHY` comments explaining design decisions

## Production Deployment Checklist

Before deploying to production:

- [ ] Set up proper authentication (NextAuth.js or Clerk)
- [ ] Use a managed PostgreSQL database (Supabase, Neon, Railway)
- [ ] Configure environment variables in hosting platform
- [ ] Set up a real job queue (BullMQ + Redis)
- [ ] Enable error monitoring (Sentry)
- [ ] Set up analytics (PostHog, Mixpanel)
- [ ] Review and harden security (rate limiting, CORS, CSP)
- [ ] Set up CI/CD pipeline
- [ ] Configure logging and observability

---

**Welcome to OpenCausenx!** 🎉

For questions or feedback, open an issue on GitHub.
