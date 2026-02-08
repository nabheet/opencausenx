/**
 * Economic Data Fetcher
 * 
 * WHY: Ingests public economic indicators. For MVP, this is mocked/sample data.
 * In production, integrate with APIs like FRED, World Bank, OECD, etc.
 */

import { AffectedEntity } from '@/domain/models/types';

export interface EconomicIndicator {
    indicator: string;
    value: number;
    previousValue?: number;
    unit: string;
    region: string;
    timestamp: Date;
    source: string;
}

/**
 * Fetch economic indicators
 * 
 * WHY: For MVP, return mocked data. In production, fetch from:
 * - FRED (Federal Reserve Economic Data)
 * - World Bank API
 * - OECD Data API
 * - Trading Economics API
 */
export async function fetchEconomicIndicators(
    region: string = 'US'
): Promise<EconomicIndicator[]> {
    console.log(`[MVP Mock] Fetching economic indicators for ${region}`);

    // MOCK DATA for demonstration
    // WHY: Avoid API dependencies in MVP, but structure is production-ready
    return [
        {
            indicator: 'GDP Growth Rate',
            value: 2.4,
            previousValue: 2.1,
            unit: 'percent',
            region,
            timestamp: new Date(),
            source: 'Mock Data (use FRED in production)',
        },
        {
            indicator: 'Inflation Rate',
            value: 3.2,
            previousValue: 3.7,
            unit: 'percent',
            region,
            timestamp: new Date(),
            source: 'Mock Data (use FRED in production)',
        },
        {
            indicator: 'Unemployment Rate',
            value: 3.8,
            previousValue: 3.9,
            unit: 'percent',
            region,
            timestamp: new Date(),
            source: 'Mock Data (use FRED in production)',
        },
        {
            indicator: 'Interest Rate',
            value: 5.25,
            previousValue: 5.50,
            unit: 'percent',
            region,
            timestamp: new Date(),
            source: 'Mock Data (use FRED in production)',
        },
    ];
}

/**
 * Convert economic indicator to event summary
 * WHY: Translate structured data into natural language for consistency
 */
export function economicIndicatorToSummary(indicator: EconomicIndicator): string {
    const change =
        indicator.previousValue !== undefined
            ? indicator.value > indicator.previousValue
                ? 'increased'
                : indicator.value < indicator.previousValue
                    ? 'decreased'
                    : 'remained stable'
            : 'reported';

    const changeAmount =
        indicator.previousValue !== undefined
            ? ` from ${indicator.previousValue}% to ${indicator.value}%`
            : ` at ${indicator.value}%`;

    return `${indicator.indicator} ${change}${changeAmount} in ${indicator.region}.`;
}

/**
 * Determine affected entities for economic indicator
 * WHY: Different indicators affect different parts of the economy
 */
export function getAffectedEntitiesForIndicator(indicatorName: string): AffectedEntity[] {
    const name = indicatorName.toLowerCase();

    if (name.includes('unemployment') || name.includes('wage')) {
        return [AffectedEntity.LABOR_FORCE, AffectedEntity.TECH_COMPANIES];
    }

    if (name.includes('interest rate')) {
        return [AffectedEntity.FINANCIAL_SECTOR, AffectedEntity.ALL];
    }

    if (name.includes('inflation') || name.includes('gdp')) {
        return [AffectedEntity.ALL];
    }

    return [AffectedEntity.ALL];
}

/**
 * Calculate indicator change magnitude
 * WHY: Used for confidence scoring
 */
export function getIndicatorChangeMagnitude(indicator: EconomicIndicator): number {
    if (indicator.previousValue === undefined) {
        return 0;
    }

    const change = Math.abs(indicator.value - indicator.previousValue);
    const percentChange = (change / indicator.previousValue) * 100;

    return percentChange;
}

/**
 * Integration instructions for production
 * WHY: Document how to replace mocks with real APIs
 */
export const ECONOMIC_DATA_INTEGRATION_GUIDE = `
To integrate real economic data in production:

1. **FRED API (US Federal Reserve)**
   - URL: https://fred.stlouisfed.org/docs/api/
   - Free API with comprehensive US economic data
   - Indicators: GDP, inflation, unemployment, interest rates, etc.
   - Usage: npm install fred-api

2. **World Bank API**
   - URL: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
   - Free API with global economic indicators
   - Covers 200+ countries
   - Usage: REST API, no auth required

3. **OECD Data API**
   - URL: https://data.oecd.org/api/
   - Free API for OECD member countries
   - High-quality economic statistics
   - Usage: REST API with SDMX format

4. **Trading Economics**
   - URL: https://tradingeconomics.com/api
   - Paid API with real-time data
   - Covers 196 countries, 20+ million indicators
   - Usage: REST API with authentication

Implementation steps:
- Add API keys to .env
- Create adapter functions for each API
- Implement rate limiting and caching
- Store raw API responses in metadata field
- Schedule periodic fetches via background jobs
`.trim();
