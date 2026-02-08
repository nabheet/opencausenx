/**
 * SaaS Business Model Template
 * 
 * WHY: Provides sensible defaults for SaaS companies, based on industry averages.
 * Users can customize these values, but this gives them a starting point.
 * 
 * SOURCES:
 * - SaaS Capital benchmarks
 * - OpenView SaaS benchmarks
 * - Industry conventions
 */

import {
    Industry,
    BusinessDriverType,
    SensitivityFactor,
    BusinessModelConfig,
    WeightedDriver,
    SensitivityConfig,
} from '../models/types';

/**
 * Default SaaS revenue structure
 * WHY: Most SaaS companies derive majority from subscriptions
 */
export const DEFAULT_SAAS_REVENUE_DRIVERS: WeightedDriver[] = [
    { driver: BusinessDriverType.SUBSCRIPTION_REVENUE, weight: 0.85 },
    { driver: BusinessDriverType.USAGE_REVENUE, weight: 0.10 },
    { driver: BusinessDriverType.SERVICES_REVENUE, weight: 0.05 },
];

/**
 * Default SaaS cost structure
 * WHY: Based on typical SaaS unit economics (Rule of 40)
 * 
 * Breakdown:
 * - Labor: 40% (engineering, sales, support)
 * - Infrastructure: 15% (hosting, cloud, tools)
 * - Sales & Marketing: 30% (CAC-heavy in growth mode)
 * - R&D: 10% (ongoing product development)
 * - Administrative: 5% (legal, finance, ops)
 */
export const DEFAULT_SAAS_COST_DRIVERS: WeightedDriver[] = [
    { driver: BusinessDriverType.LABOR_COSTS, weight: 0.40 },
    { driver: BusinessDriverType.INFRASTRUCTURE_COSTS, weight: 0.15 },
    { driver: BusinessDriverType.SALES_MARKETING, weight: 0.30 },
    { driver: BusinessDriverType.R_AND_D, weight: 0.10 },
    { driver: BusinessDriverType.ADMINISTRATIVE, weight: 0.05 },
];

/**
 * Default SaaS sensitivities
 * WHY: SaaS companies are particularly sensitive to labor and infrastructure costs
 * 
 * Rationale:
 * - LABOR: 0.8 (high) - Talent wars, remote work trends, wage inflation directly impact
 * - INFRASTRUCTURE: 0.7 (high) - Cloud costs are significant and volatile
 * - FX: 0.4 (moderate) - Many SaaS companies have global operations
 * - REGULATION: 0.6 (moderate-high) - Privacy, data residency, compliance
 * - MARKET_DEMAND: 0.7 (high) - Subscription models rely on sustained demand
 */
export const DEFAULT_SAAS_SENSITIVITIES: SensitivityConfig[] = [
    { factor: SensitivityFactor.LABOR, sensitivity: 0.8 },
    { factor: SensitivityFactor.INFRASTRUCTURE, sensitivity: 0.7 },
    { factor: SensitivityFactor.FX, sensitivity: 0.4 },
    { factor: SensitivityFactor.REGULATION, sensitivity: 0.6 },
    { factor: SensitivityFactor.MARKET_DEMAND, sensitivity: 0.7 },
];

/**
 * Create a default SaaS business model template
 * 
 * @param userId - User ID to associate with this business model
 * @param name - Optional custom name
 * @param operatingRegions - Where the company operates (default: US only)
 * @param customerRegions - Where customers are located (default: US only)
 */
export function createSaaSTemplate(
    userId: string,
    name: string = 'My SaaS Business',
    operatingRegions: string[] = ['US'],
    customerRegions: string[] = ['US']
): Omit<BusinessModelConfig, 'id' | 'createdAt' | 'updatedAt'> {
    return {
        userId,
        name,
        industry: Industry.SAAS,
        revenueDrivers: DEFAULT_SAAS_REVENUE_DRIVERS,
        costDrivers: DEFAULT_SAAS_COST_DRIVERS,
        sensitivities: DEFAULT_SAAS_SENSITIVITIES,
        operatingRegions,
        customerRegions,
        active: true,
    };
}

/**
 * Explain the SaaS template assumptions
 * WHY: Users should understand what they're starting with
 */
export const SAAS_TEMPLATE_EXPLANATION = `
This SaaS template assumes a typical B2B SaaS business model:

**Revenue Structure:**
- 85% from recurring subscriptions
- 10% from usage-based charges
- 5% from professional services

**Cost Structure:**
- 40% labor (engineering, sales, support)
- 30% sales & marketing (customer acquisition)
- 15% infrastructure (cloud hosting, tools)
- 10% R&D (product development)
- 5% administrative overhead

**Sensitivities:**
- HIGH sensitivity to labor market changes (0.8)
- HIGH sensitivity to infrastructure costs (0.7)
- HIGH sensitivity to market demand shifts (0.7)
- MODERATE-HIGH sensitivity to regulation (0.6)
- MODERATE sensitivity to FX rates (0.4)

You can customize these values to match your specific business.
`.trim();

/**
 * Validate SaaS-specific constraints
 * WHY: SaaS businesses have specific characteristics that should be enforced
 */
export function validateSaaSModel(config: Partial<BusinessModelConfig>): {
    valid: boolean;
    warnings: string[];
} {
    const warnings: string[] = [];

    // Check for unusual revenue split
    const subscriptionRevenue = config.revenueDrivers?.find(
        (d) => d.driver === BusinessDriverType.SUBSCRIPTION_REVENUE
    );
    if (subscriptionRevenue && subscriptionRevenue.weight < 0.5) {
        warnings.push(
            'Subscription revenue is less than 50%. This is unusual for a SaaS business.'
        );
    }

    // Check for high infrastructure costs
    const infraCosts = config.costDrivers?.find(
        (d) => d.driver === BusinessDriverType.INFRASTRUCTURE_COSTS
    );
    if (infraCosts && infraCosts.weight > 0.25) {
        warnings.push(
            'Infrastructure costs exceed 25%. Consider if this is accurate for your business.'
        );
    }

    // Check for very high sales & marketing
    const salesCosts = config.costDrivers?.find(
        (d) => d.driver === BusinessDriverType.SALES_MARKETING
    );
    if (salesCosts && salesCosts.weight > 0.5) {
        warnings.push(
            'Sales & marketing exceeds 50%. This may indicate an unsustainable CAC.'
        );
    }

    return {
        valid: true, // Warnings don't invalidate, just inform
        warnings,
    };
}
