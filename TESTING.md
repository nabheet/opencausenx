# Testing Guide

This project uses Jest and React Testing Library for unit testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests directly with Jest (if npm scripts don't work)
npx jest
```

## Test Structure

Tests are organized using the `__tests__` directory pattern, colocated with the code they test:

```
src/
  domain/
    models/
      BusinessModel.ts
      __tests__/
        BusinessModel.test.ts
  services/
    event-ingestion/
      normalizer.ts
      __tests__/
        normalizer.test.ts
  components/
    insights/
      InsightCard.tsx
      __tests__/
        InsightCard.test.tsx
```

## Test Coverage

The project includes comprehensive unit tests for:

- **Domain Models** (`src/domain/models/__tests__/`)
  - `BusinessModel.test.ts` - Business model validation and methods
  - `Event.test.ts` - Event processing and confidence calculation
  - `Insight.test.ts` - Insight generation and confidence scoring

- **Business Logic** (`src/domain/`)
  - `saas.test.ts` - SaaS business template defaults
  - `rules.test.ts` - Causal mapping rules

- **Services** (`src/services/`)
  - `normalizer.test.ts` - Event normalization from various sources
  - `generator.test.ts` - Insight generation pipeline

- **React Components** (`src/components/`)
  - `InsightCard.test.tsx` - Insight card display
  - `ConfidenceIndicator.test.tsx` - Confidence visualization
  - `RiskSummary.test.tsx` - Dashboard risk summary

## Writing Tests

### Domain Model Tests

```typescript
import { BusinessModel } from '../BusinessModel';
import { Industry, BusinessDriverType } from '../types';

describe('BusinessModel', () => {
  it('should validate correct model', () => {
    const model = new BusinessModel({ /* ... */ });
    const result = model.validate();
    expect(result.valid).toBe(true);
  });
});
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { InsightCard } from '../InsightCard';

describe('InsightCard', () => {
  it('should render insight summary', () => {
    render(<InsightCard insight={mockInsight} />);
    expect(screen.getByText(/labor costs/)).toBeInTheDocument();
  });
});
```

### Service Tests with Mocks

```typescript
// Mock external dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findMany: jest.fn() }
  }
}));

describe('EventService', () => {
  it('should fetch events', async () => {
    const { prisma } = require('@/lib/prisma');
    prisma.event.findMany.mockResolvedValue([/* ... */]);
    // ... test logic
  });
});
```

## Configuration

### jest.config.ts

The Jest configuration uses `next/jest` for seamless Next.js integration:

- **Test Environment**: jsdom (for React component testing)
- **Module Path Mapping**: `@/*` → `src/*` (matches tsconfig)
- **Setup**: `jest.setup.ts` for global test configuration
- **Coverage**: Configured to cover all `src/**` files except app routes

### jest.setup.ts

Global test setup includes:

- `@testing-library/jest-dom` for additional matchers
- Environment variable mocks for DATABASE_URL

## Best Practices

1. **Test Naming**: Use descriptive names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests in three clear phases
3. **Mock External Dependencies**: Mock database, APIs, and external services
4. **Test Behavior, Not Implementation**: Focus on what the code does, not how
5. **Keep Tests Isolated**: Each test should be independent
6. **Use Descriptive Assertions**: Prefer specific matchers like `toBeInTheDocument()` over `toBeTruthy()`

## Continuous Integration

Tests run automatically in CI/CD pipelines. All tests must pass before merging to main.

## Troubleshooting

### Tests not found

- Ensure test files end with `.test.ts` or `.test.tsx`
- Check that test files are in `__tests__` directories

### Module not found errors

- Run `npm install` to ensure all dependencies are installed
- Check that `@/*` imports are configured in both `tsconfig.json` and `jest.config.ts`

### React component tests failing

- Ensure `jest-environment-jsdom` is installed
- Check that `testEnvironment: 'jsdom'` is set in jest.config.ts

### Type errors in tests

- Install `@types/jest` for Jest type definitions
- Ensure TypeScript is properly configured
