# OpenCausenx

**An explainable decision-intelligence platform that helps businesses understand how world events causally affect their operations, costs, risks, and opportunities.**

## Table of Contents

- [Overview](#overview)
- [Core Principles](#core-principles)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [Design Decisions & Tradeoffs](#design-decisions--tradeoffs)
- [Extending OpenCausenx](#extending-opencausenx)
- [Limitations & Future Work](#limitations--future-work)

---

## Overview

OpenCausenx addresses a critical gap: **businesses need to understand HOW external events affect them, not just THAT they might be affected.**

Traditional analytics tools provide correlations or black-box ML predictions. OpenCausenx is different:

- **Causal reasoning over correlation**: Explicit cause-and-effect chains
- **Explainability over prediction**: Every insight shows its reasoning
- **Transparency over black boxes**: All assumptions are documented
- **Confidence over false precision**: Uncertainty is explicit

### MVP Scope

This MVP focuses on:

- **One industry**: SaaS companies
- **One insight type**: External risk and cost pressure
- **Geographic resolution**: Country-level only
- **Data sources**: RSS feeds + mocked economic indicators

---

## Core Principles

### 1. Prioritize Causal Reasoning Over Correlation

**WHY**: Correlation doesn't tell you what to do. Causality does.

OpenCausenx uses deterministic causal rules encoded from economic principles and domain expertise—not learned from data. This means:

- You can audit the logic
- You can challenge the assumptions
- You can trust the reasoning

### 2. Prefer Explainability Over Black-Box Prediction

**WHY**: Executives won't act on insights they don't understand.

Every insight includes:

- **Causal path**: Step-by-step reasoning chain
- **Assumptions**: What we assume to be true
- **Confidence rationale**: Why we're confident (or not)
- **Data provenance**: Where the information comes from

### 3. Surface Uncertainty and Confidence Explicitly

**WHY**: Fake precision is worse than honest uncertainty.

OpenCausenx calculates confidence scores based on:

- Source reliability
- Causal chain complexity
- Assumption impact
- Data quality

### 4. No Hype, No "AI Magic"

**WHY**: Trust is built on honesty, not marketing.

We use LLMs **only** for translating technical reasoning into plain English—never for making predictions or inferring causality. The logic is deterministic and auditable.

---

## Architecture

### High-Level Design

```text
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│  Next.js App Router • Dashboard • Insight Details • Config │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                       Service Layer                          │
│  • Event Ingestion    • Insight Generation                  │
│  • Causal Mapping     • Background Jobs                     │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                      Domain Layer                            │
│  • Event Models       • Business Models      • Causal Rules │
│  • Type Definitions   • SaaS Templates       • Assumptions  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                       Data Layer                             │
│              PostgreSQL + Prisma ORM                         │
└─────────────────────────────────────────────────────────────┘
```

### Folder Structure

```text
opencausenx/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Main dashboard
│   │   ├── insights/[id]/     # Insight detail pages
│   │   ├── business-model/    # Business model configuration
│   │   └── api/               # API routes
│   │
│   ├── domain/                # Core business logic
│   │   ├── models/           # Domain models (Event, BusinessModel, Insight)
│   │   ├── causal-mapping/   # Causal rules and mapping engine
│   │   └── business-templates/ # Industry templates (SaaS)
│   │
│   ├── services/             # Application services
│   │   ├── event-ingestion/  # RSS fetcher, normalizer
│   │   ├── insight-engine/   # Insight generator, LLM explainer
│   │   └── background-jobs/  # Job scheduler and definitions
│   │
│   ├── components/           # React components
│   │   ├── dashboard/        # EventFeed, RiskSummary
│   │   └── insights/         # InsightCard, ConfidenceIndicator
│   │
│   └── lib/                  # Shared utilities
│       ├── prisma.ts         # Database client
│       └── config.ts         # Configuration
│
├── prisma/
│   └── schema.prisma         # Database schema
│
└── README.md
```

---

## Tech Stack

### Frontend

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**

### Backend

- **Node.js** with TypeScript
- **Next.js API Routes** (serverless functions)
- **Prisma ORM**

### Database

- **PostgreSQL** (local or managed)

### Background Jobs

- **Simple in-process scheduler** (setInterval-based, no Redis)

### LLM Integration (Optional)

- **OpenAI** or **Anthropic** for explanation generation

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **PostgreSQL 14+**
- **npm** or **pnpm**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/opencausenx.git
   cd opencausenx
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and configure:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/opencausenx"
   OPENAI_API_KEY="your-key-here"  # Optional
   ```

4. **Set up the database**

   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Initial Setup

1. **Configure your business model**
   - Click "Configure Business Model"
   - Create from SaaS template
   - Customize regions if needed

2. **Ingest events** (for development/testing)

   ```bash
   # In a separate terminal
   node -e "require('./src/services/background-jobs/jobs').fetchAndIngestEvents()"
   ```

3. **Generate insights**
   - Return to dashboard
   - Click "Generate Insights"
   - Wait for processing to complete

---

## How It Works

### 1. Event Ingestion

**Sources**:

- RSS feeds (Reuters, Financial Times, etc.)
- Economic indicators (mocked in MVP)
- Manual input (future)

**Normalization**:
All events are transformed into a unified schema:

```typescript
{
  id, eventType, summary, region, timestamp,
  affectedEntities, source, confidenceScore, metadata
}
```

**Event Types**:

- `REGULATION_CHANGE`
- `ECONOMIC_INDICATOR`
- `LABOR_MARKET`
- `INFRASTRUCTURE`
- `CURRENCY`
- `GEOPOLITICAL`
- `MARKET_SHIFT`
- `TECHNOLOGY`
- `DISASTER`

### 2. Business Model Configuration

Users define their business structure:

- **Revenue drivers**: Subscription, usage, services
- **Cost drivers**: Labor, infrastructure, S&M, R&D
- **Sensitivities**: How reactive to labor, FX, regulation, etc.
- **Geographic exposure**: Operating and customer regions

**SaaS Template Defaults**:

```typescript
Revenue: 85% subscription, 10% usage, 5% services
Costs: 40% labor, 30% S&M, 15% infra, 10% R&D, 5% admin
Sensitivities: High on labor (0.8), infra (0.7), demand (0.7)
```

### 3. Causal Mapping Engine

**Deterministic rules** map event types to business impacts:

Example: `LABOR_MARKET` event

```text
Step 1: Labor market event occurs
Step 2: Wage pressure affects hiring/retention costs
Step 3: Increased labor costs flow through to P&L
```

**Impact magnitude calculation**:

```text
magnitude = driver_weight × sensitivity × event_confidence
```

**Confidence calculation**:

```text
confidence = event_confidence × path_confidence × assumption_penalty
```

### 4. Insight Generation

For each relevant event:

1. Check geographic and temporal relevance
2. Apply causal rules
3. Generate causal path
4. Document assumptions
5. Calculate confidence
6. (Optional) Use LLM to generate plain-English explanation
7. Store insight in database

### 5. Dashboard & Visualization

- **Event feed**: Recent world events
- **Risk summary**: High-impact insights
- **Insight details**: Full explainability with confidence indicators

---

## Design Decisions & Tradeoffs

### Decision: Deterministic Causal Rules (No ML)

**Rationale**: For MVP, we prioritize explainability and auditability over sophisticated modeling.

**Tradeoffs**:

- ✅ **Pro**: Transparent, auditable, explainable
- ✅ **Pro**: No training data required
- ✅ **Pro**: Immediate results
- ❌ **Con**: Doesn't learn from data
- ❌ **Con**: Rules must be manually updated
- ❌ **Con**: Limited to encoded knowledge

**Future**: Hybrid approach using ML to suggest rules, human to approve.

### Decision: LLMs for Explanation Only

**Rationale**: LLMs are great at translating technical content into natural language, but terrible at reliable causal reasoning.

**Tradeoffs**:

- ✅ **Pro**: Better UX (readable explanations)
- ✅ **Pro**: Causal logic remains auditable
- ❌ **Con**: Requires API key and costs money
- ❌ **Con**: Explanations can vary (non-deterministic)

**Mitigation**: System works without LLM; basic explanations are generated from the causal path.

### Decision: In-Process Background Jobs

**Rationale**: MVP shouldn't require Redis, BullMQ, or separate worker processes.

**Tradeoffs**:

- ✅ **Pro**: Simple setup, no external dependencies
- ✅ **Pro**: Easy to debug
- ❌ **Con**: Jobs stop on server restart
- ❌ **Con**: Not horizontally scalable
- ❌ **Con**: No job persistence or retries

**Future**: Migrate to BullMQ + Redis for production.

### Decision: Stubbed Authentication

**Rationale**: Focus MVP on core causal logic, not auth infrastructure.

**Tradeoffs**:

- ✅ **Pro**: Faster MVP development
- ❌ **Con**: Single-user system
- ❌ **Con**: Not production-ready

**Future**: Integrate NextAuth.js or Clerk.

### Decision: Country-Level Geography Only

**Rationale**: City/state-level resolution adds complexity without much MVP value.

**Tradeoffs**:

- ✅ **Pro**: Simpler data model
- ✅ **Pro**: Easier event sourcing (most APIs use countries)
- ❌ **Con**: Misses regional nuances (e.g., California vs Texas)

**Future**: Add sub-national resolution when customers request it.

---

## Extending OpenCausenx

### Adding New Event Types

1. **Define enum** in `src/domain/models/types.ts`:

   ```typescript
   export enum EventType {
     // ... existing
     TAX_POLICY_CHANGE = 'TAX_POLICY_CHANGE',
   }
   ```

2. **Add causal rule** in `src/domain/causal-mapping/rules.ts`:

   ```typescript
   [EventType.TAX_POLICY_CHANGE]: {
     eventType: EventType.TAX_POLICY_CHANGE,
     affectedDrivers: [BusinessDriverType.ADMINISTRATIVE],
     sensitivityFactor: SensitivityFactor.REGULATION,
     defaultDirection: ImpactDirection.INCREASE,
     timeHorizon: TimeHorizon.MEDIUM,
     getCausalPath: (event, context) => [/* ... */],
   }
   ```

3. **Add assumptions** in `src/domain/causal-mapping/assumptions.ts`:

   ```typescript
   TAX_POLICY_AFFECTS_COSTS: {
     id: 'TAX_POLICY_AFFECTS_COSTS',
     description: 'Tax policy changes directly affect operating costs',
     impact: 'HIGH',
     source: 'Tax accounting principles',
   }
   ```

### Adding New Industry Templates

1. **Create template file** `src/domain/business-templates/fintech.ts`:

   ```typescript
   export const DEFAULT_FINTECH_REVENUE_DRIVERS = [/* ... */];
   export const DEFAULT_FINTECH_COST_DRIVERS = [/* ... */];
   export function createFintechTemplate() { /* ... */ }
   ```

2. **Update Industry enum** in `types.ts`:

   ```typescript
   export enum Industry {
     SAAS = 'SAAS',
     FINTECH = 'FINTECH',
   }
   ```

3. **Update business model creation UI** to offer template choice.

### Adding New Data Sources

1. **Create fetcher** in `src/services/event-ingestion/`:

   ```typescript
   export async function fetchFromNewAPI() {
     const response = await fetch('https://api.example.com/data');
     return response.json();
   }
   ```

2. **Create normalizer**:

   ```typescript
   export function normalizeNewAPIData(data: any): NormalizedEventInput {
     return {
       eventType: classifyEvent(data),
       summary: data.description,
       region: data.country_code,
       // ...
     };
   }
   ```

3. **Register in background job** (`src/services/background-jobs/jobs.ts`):

   ```typescript
   const newData = await fetchFromNewAPI();
   const normalized = newData.map(normalizeNewAPIData);
   await batchNormalizeAndSave(normalized);
   ```

### Improving Confidence Scoring

Current confidence formula:

```typescript
confidence = event_confidence × path_confidence × assumption_penalty
```

**Enhancements**:

- Add data recency factor (newer = higher confidence)
- Add source diversity bonus (multiple sources = higher confidence)
- Add business-specific validation (e.g., "does this affect our geography?")

Edit `src/domain/causal-mapping/mapper.ts` → `calculateConfidence()`.

---

## Limitations & Future Work

### Current Limitations

1. **Single industry focus**: Only SaaS is supported
2. **Basic event classification**: Keyword-based, not NLP
3. **Mocked economic data**: No real API integration
4. **No user authentication**: Single-user system
5. **No historical analysis**: Only forward-looking insights
6. **Limited geographic resolution**: Country-level only
7. **Simple job scheduling**: Not production-grade

### Future Enhancements

#### Short Term (Next 3 Months)

- [ ] Real economic data integration (FRED API, World Bank)
- [ ] Multi-user support with authentication
- [ ] Email/Slack notifications for high-impact insights
- [ ] Historical insight tracking ("How did this play out?")
- [ ] More industry templates (Fintech, E-commerce, Manufacturing)

#### Medium Term (3-6 Months)

- [ ] Advanced NLP for event classification
- [ ] ML-assisted confidence scoring
- [ ] Custom causal rule builder (UI for non-engineers)
- [ ] Integration with business intelligence tools (Looker, Tableau)
- [ ] Sub-national geographic resolution

#### Long Term (6-12 Months)

- [ ] Probabilistic causal modeling (Bayesian networks)
- [ ] Scenario planning ("What if X happens?")
- [ ] Automated action recommendations
- [ ] Multi-language support
- [ ] Enterprise features (SSO, audit logs, RBAC)

---

## Contributing

OpenCausenx is designed to be extended. We welcome:

- New causal rules
- Industry templates
- Data source integrations
- UI improvements
- Documentation enhancements

**Guiding principle**: Every new feature must maintain explainability. If users can't understand how it works, it doesn't belong in OpenCausenx.

---

## License

MIT License. See `LICENSE` file for details.

---

## Contact

Built with ❤️ by engineers who believe transparency > hype.

For questions, feedback, or collaboration: [your-email@example.com]

---

## Acknowledgments

- Inspired by causal inference research (Judea Pearl, Gary King)
- Built on the shoulders of open-source giants (Next.js, Prisma, PostgreSQL)
- Designed for decision-makers who deserve better than black boxes

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
