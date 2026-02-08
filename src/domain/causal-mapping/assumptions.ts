/**
 * Causal Mapping Assumptions
 * 
 * WHY: All causal reasoning depends on assumptions. We document them explicitly
 * so users understand the basis of our insights and can judge their applicability.
 * 
 * PRINCIPLE: No hidden logic. Every assumption is traceable and auditable.
 */

import { EventType, SensitivityFactor, BusinessDriverType, Assumption } from '../models/types';

/**
 * Core assumptions about how world events affect businesses
 * WHY: These are the foundation of our causal logic
 */
export const CORE_ASSUMPTIONS: Record<string, Assumption> = {
    // LABOR MARKET ASSUMPTIONS
    LABOR_WAGES_AFFECT_COSTS: {
        id: 'LABOR_WAGES_AFFECT_COSTS',
        description:
            'Wage increases in the labor market directly increase labor costs for businesses.',
        impact: 'HIGH',
        source: 'Economic principle: labor as a cost component',
    },

    LABOR_COSTS_PROPORTIONAL: {
        id: 'LABOR_COSTS_PROPORTIONAL',
        description:
            'Labor cost changes are roughly proportional to the weight of labor in total costs.',
        impact: 'HIGH',
        source: 'Basic accounting: cost structure drives impact magnitude',
    },

    LABOR_CHANGES_GRADUAL: {
        id: 'LABOR_CHANGES_GRADUAL',
        description: 'Labor market changes take 3-12 months to fully impact business costs.',
        impact: 'MEDIUM',
        source: 'Typical employment contract and hiring cycles',
    },

    // INFRASTRUCTURE ASSUMPTIONS
    INFRASTRUCTURE_COSTS_VARIABLE: {
        id: 'INFRASTRUCTURE_COSTS_VARIABLE',
        description:
            'Cloud and infrastructure costs are variable and adjust with usage and pricing.',
        impact: 'HIGH',
        source: 'SaaS industry standard: pay-as-you-go pricing models',
    },

    INFRASTRUCTURE_IMPACT_IMMEDIATE: {
        id: 'INFRASTRUCTURE_IMPACT_IMMEDIATE',
        description: 'Infrastructure price changes affect costs within 0-3 months.',
        impact: 'MEDIUM',
        source: 'Cloud provider pricing updates apply to next billing cycle',
    },

    // REGULATION ASSUMPTIONS
    REGULATION_REQUIRES_COMPLIANCE: {
        id: 'REGULATION_REQUIRES_COMPLIANCE',
        description: 'New regulations require businesses to invest in compliance measures.',
        impact: 'HIGH',
        source: 'Legal requirement: non-compliance risks fines and operations',
    },

    REGULATION_MEDIUM_TERM: {
        id: 'REGULATION_MEDIUM_TERM',
        description: 'Regulatory impacts typically materialize over 3-12 months.',
        impact: 'MEDIUM',
        source: 'Typical grace periods and implementation timelines',
    },

    // ECONOMIC INDICATOR ASSUMPTIONS
    GDP_AFFECTS_DEMAND: {
        id: 'GDP_AFFECTS_DEMAND',
        description: 'GDP growth/decline affects customer spending and demand for services.',
        impact: 'HIGH',
        source: 'Macroeconomic principle: GDP correlates with business activity',
    },

    INFLATION_AFFECTS_COSTS: {
        id: 'INFLATION_AFFECTS_COSTS',
        description: 'Inflation increases costs across all categories (labor, infrastructure, etc.).',
        impact: 'HIGH',
        source: 'Monetary principle: purchasing power affects all prices',
    },

    INTEREST_RATES_AFFECT_GROWTH: {
        id: 'INTEREST_RATES_AFFECT_GROWTH',
        description: 'Higher interest rates reduce customer spending and business investment.',
        impact: 'MEDIUM',
        source: 'Monetary policy: cost of capital affects growth',
    },

    // CURRENCY ASSUMPTIONS
    FX_AFFECTS_INTERNATIONAL: {
        id: 'FX_AFFECTS_INTERNATIONAL',
        description:
            'Currency changes only affect businesses with international operations or customers.',
        impact: 'HIGH',
        source: 'Basic FX exposure: requires cross-border transactions',
    },

    FX_REVENUE_AND_COSTS: {
        id: 'FX_REVENUE_AND_COSTS',
        description: 'Foreign exchange affects both revenue (if international customers) and costs (if international operations).',
        impact: 'MEDIUM',
        source: 'Accounting standard: FX translation affects both sides of P&L',
    },

    // GEOPOLITICAL ASSUMPTIONS
    GEOPOLITICAL_CREATES_UNCERTAINTY: {
        id: 'GEOPOLITICAL_CREATES_UNCERTAINTY',
        description: 'Geopolitical events create market uncertainty and reduce customer spending.',
        impact: 'MEDIUM',
        source: 'Behavioral economics: uncertainty reduces risk-taking',
    },

    // DISASTER ASSUMPTIONS
    DISASTER_REGIONAL_IMPACT: {
        id: 'DISASTER_REGIONAL_IMPACT',
        description: 'Natural disasters primarily affect businesses in or dependent on the affected region.',
        impact: 'HIGH',
        source: 'Geographic constraint: physical disruption is localized',
    },
};

/**
 * Get assumptions for a specific event type
 * WHY: Different events rely on different assumptions
 */
export function getAssumptionsForEventType(eventType: EventType): Assumption[] {
    const assumptionMap: Record<EventType, string[]> = {
        [EventType.LABOR_MARKET]: [
            'LABOR_WAGES_AFFECT_COSTS',
            'LABOR_COSTS_PROPORTIONAL',
            'LABOR_CHANGES_GRADUAL',
        ],
        [EventType.INFRASTRUCTURE]: [
            'INFRASTRUCTURE_COSTS_VARIABLE',
            'INFRASTRUCTURE_IMPACT_IMMEDIATE',
        ],
        [EventType.REGULATION_CHANGE]: [
            'REGULATION_REQUIRES_COMPLIANCE',
            'REGULATION_MEDIUM_TERM',
        ],
        [EventType.ECONOMIC_INDICATOR]: [
            'GDP_AFFECTS_DEMAND',
            'INFLATION_AFFECTS_COSTS',
            'INTEREST_RATES_AFFECT_GROWTH',
        ],
        [EventType.CURRENCY]: ['FX_AFFECTS_INTERNATIONAL', 'FX_REVENUE_AND_COSTS'],
        [EventType.GEOPOLITICAL]: ['GEOPOLITICAL_CREATES_UNCERTAINTY'],
        [EventType.DISASTER]: ['DISASTER_REGIONAL_IMPACT'],
        [EventType.MARKET_SHIFT]: ['GDP_AFFECTS_DEMAND'],
        [EventType.TECHNOLOGY]: [],
    };

    const assumptionKeys = assumptionMap[eventType] || [];
    return assumptionKeys.map((key) => CORE_ASSUMPTIONS[key]).filter(Boolean);
}

/**
 * Business model assumptions for SaaS companies
 * WHY: Industry-specific assumptions about how SaaS businesses work
 */
export const SAAS_ASSUMPTIONS: Assumption[] = [
    {
        id: 'SAAS_SUBSCRIPTION_MODEL',
        description: 'Revenue is primarily subscription-based with predictable recurring patterns.',
        impact: 'HIGH',
        source: 'SaaS business model definition',
    },
    {
        id: 'SAAS_CAC_MATTERS',
        description: 'Customer acquisition cost (CAC) significantly affects profitability.',
        impact: 'HIGH',
        source: 'SaaS unit economics: CAC payback period is critical metric',
    },
    {
        id: 'SAAS_CHURN_SENSITIVE',
        description: 'Revenue is highly sensitive to customer churn rate.',
        impact: 'HIGH',
        source: 'SaaS economics: MRR depends on retention',
    },
    {
        id: 'SAAS_LABOR_INTENSIVE',
        description: 'SaaS businesses are labor-intensive (engineering, sales, support).',
        impact: 'HIGH',
        source: 'SaaS industry benchmark: labor typically 40-50% of costs',
    },
    {
        id: 'SAAS_CLOUD_DEPENDENT',
        description: 'SaaS companies depend heavily on cloud infrastructure providers.',
        impact: 'HIGH',
        source: 'Technical requirement: SaaS products run on cloud infrastructure',
    },
];

/**
 * Validate if assumptions hold for a specific business
 * WHY: Some assumptions may not apply to all businesses
 */
export function validateAssumptionsForBusiness(
    assumptions: Assumption[],
    businessContext: {
        hasInternationalOperations: boolean;
        hasInternationalCustomers: boolean;
        operatesInRegion: boolean;
    }
): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    for (const assumption of assumptions) {
        // Check FX assumptions
        if (
            assumption.id === 'FX_AFFECTS_INTERNATIONAL' &&
            !businessContext.hasInternationalOperations &&
            !businessContext.hasInternationalCustomers
        ) {
            warnings.push(
                'FX impact may be minimal: business operates only domestically.'
            );
        }

        // Check regional assumptions
        if (
            assumption.id === 'DISASTER_REGIONAL_IMPACT' &&
            !businessContext.operatesInRegion
        ) {
            warnings.push(
                'Regional event may not affect business: no presence in affected region.'
            );
        }
    }

    return {
        valid: true, // Warnings don't invalidate, just inform
        warnings,
    };
}
