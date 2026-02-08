/**
 * Causal Mapping Rules
 * 
 * WHY: Deterministic rules that map event types to business driver impacts.
 * These are NOT learned from data - they are explicitly encoded business logic
 * based on economic principles and domain expertise.
 * 
 * CRITICAL: Every rule must be explainable and auditable.
 */

import {
    EventType,
    BusinessDriverType,
    SensitivityFactor,
    ImpactDirection,
    TimeHorizon,
    CausalStep,
} from '../models/types';

/**
 * Causal rule: maps event type to affected business drivers
 */
export interface CausalRule {
    eventType: EventType;
    affectedDrivers: BusinessDriverType[];
    sensitivityFactor: SensitivityFactor;
    defaultDirection: ImpactDirection; // Can be overridden by event details
    timeHorizon: TimeHorizon;
    getCausalPath: (eventSummary: string, businessContext: string) => CausalStep[];
}

/**
 * Deterministic causal rules for each event type
 * WHY: Explicit mapping ensures transparency and reproducibility
 */
export const CAUSAL_RULES: Record<EventType, CausalRule> = {
    // LABOR MARKET EVENTS
    [EventType.LABOR_MARKET]: {
        eventType: EventType.LABOR_MARKET,
        affectedDrivers: [
            BusinessDriverType.LABOR_COSTS,
            BusinessDriverType.R_AND_D,
            BusinessDriverType.SALES_MARKETING,
        ],
        sensitivityFactor: SensitivityFactor.LABOR,
        defaultDirection: ImpactDirection.INCREASE, // Wage increases are most common
        timeHorizon: TimeHorizon.MEDIUM,
        getCausalPath: (event, context) => [
            {
                step: 1,
                description: 'Labor market event occurs',
                mechanism: event,
                confidence: 0.9,
            },
            {
                step: 2,
                description: 'Wage pressure affects hiring and retention costs',
                mechanism:
                    'Competitive labor market forces businesses to raise wages to attract and retain talent.',
                confidence: 0.85,
            },
            {
                step: 3,
                description: 'Increased labor costs flow through to P&L',
                mechanism: `Labor costs represent a significant portion of expenses. ${context}`,
                confidence: 0.8,
            },
        ],
    },

    // INFRASTRUCTURE EVENTS
    [EventType.INFRASTRUCTURE]: {
        eventType: EventType.INFRASTRUCTURE,
        affectedDrivers: [BusinessDriverType.INFRASTRUCTURE_COSTS],
        sensitivityFactor: SensitivityFactor.INFRASTRUCTURE,
        defaultDirection: ImpactDirection.INCREASE,
        timeHorizon: TimeHorizon.SHORT,
        getCausalPath: (event, context) => [
            {
                step: 1,
                description: 'Infrastructure event occurs',
                mechanism: event,
                confidence: 0.9,
            },
            {
                step: 2,
                description: 'Cloud or infrastructure pricing changes',
                mechanism:
                    'Cloud providers adjust pricing based on energy costs, capacity, and market conditions.',
                confidence: 0.85,
            },
            {
                step: 3,
                description: 'Changed costs flow through to next billing cycle',
                mechanism: `SaaS companies use cloud infrastructure on a pay-as-you-go basis. ${context}`,
                confidence: 0.9,
            },
        ],
    },

    // REGULATION CHANGES
    [EventType.REGULATION_CHANGE]: {
        eventType: EventType.REGULATION_CHANGE,
        affectedDrivers: [
            BusinessDriverType.LABOR_COSTS,
            BusinessDriverType.INFRASTRUCTURE_COSTS,
            BusinessDriverType.ADMINISTRATIVE,
        ],
        sensitivityFactor: SensitivityFactor.REGULATION,
        defaultDirection: ImpactDirection.INCREASE,
        timeHorizon: TimeHorizon.MEDIUM,
        getCausalPath: (event, context) => [
            {
                step: 1,
                description: 'Regulatory change announced or enacted',
                mechanism: event,
                confidence: 0.9,
            },
            {
                step: 2,
                description: 'Business must invest in compliance',
                mechanism:
                    'New regulations require legal review, technical implementation, process changes, and ongoing monitoring.',
                confidence: 0.8,
            },
            {
                step: 3,
                description: 'Compliance costs increase operating expenses',
                mechanism: `Regulatory compliance adds permanent overhead. ${context}`,
                confidence: 0.75,
            },
        ],
    },

    // ECONOMIC INDICATORS
    [EventType.ECONOMIC_INDICATOR]: {
        eventType: EventType.ECONOMIC_INDICATOR,
        affectedDrivers: [
            BusinessDriverType.SUBSCRIPTION_REVENUE,
            BusinessDriverType.LABOR_COSTS,
            BusinessDriverType.INFRASTRUCTURE_COSTS,
        ],
        sensitivityFactor: SensitivityFactor.MARKET_DEMAND,
        defaultDirection: ImpactDirection.NEUTRAL, // Depends on indicator
        timeHorizon: TimeHorizon.MEDIUM,
        getCausalPath: (event, context) => [
            {
                step: 1,
                description: 'Economic indicator changes',
                mechanism: event,
                confidence: 0.95, // Economic data is highly reliable
            },
            {
                step: 2,
                description: 'Affects customer spending and business investment',
                mechanism:
                    'Macroeconomic conditions influence customer budgets and willingness to spend on software.',
                confidence: 0.7,
            },
            {
                step: 3,
                description: 'Revenue and cost pressures adjust',
                mechanism: `Economic conditions affect both demand (revenue) and input costs. ${context}`,
                confidence: 0.65,
            },
        ],
    },

    // CURRENCY CHANGES
    [EventType.CURRENCY]: {
        eventType: EventType.CURRENCY,
        affectedDrivers: [
            BusinessDriverType.SUBSCRIPTION_REVENUE,
            BusinessDriverType.LABOR_COSTS,
            BusinessDriverType.INFRASTRUCTURE_COSTS,
        ],
        sensitivityFactor: SensitivityFactor.FX,
        defaultDirection: ImpactDirection.NEUTRAL, // Depends on currency direction
        timeHorizon: TimeHorizon.SHORT,
        getCausalPath: (event, context) => [
            {
                step: 1,
                description: 'Foreign exchange rate changes',
                mechanism: event,
                confidence: 0.95,
            },
            {
                step: 2,
                description: 'Translation effects on international operations',
                mechanism:
                    'Foreign currency revenue and costs are translated to reporting currency at new rates.',
                confidence: 0.9,
            },
            {
                step: 3,
                description: 'Net FX impact on financial results',
                mechanism: `FX affects both revenue (international customers) and costs (international operations). ${context}`,
                confidence: 0.85,
            },
        ],
    },

    // GEOPOLITICAL EVENTS
    [EventType.GEOPOLITICAL]: {
        eventType: EventType.GEOPOLITICAL,
        affectedDrivers: [
            BusinessDriverType.SUBSCRIPTION_REVENUE,
            BusinessDriverType.SALES_MARKETING,
        ],
        sensitivityFactor: SensitivityFactor.MARKET_DEMAND,
        defaultDirection: ImpactDirection.DECREASE,
        timeHorizon: TimeHorizon.SHORT,
        getCausalPath: (event, context) => [
            {
                step: 1,
                description: 'Geopolitical event creates uncertainty',
                mechanism: event,
                confidence: 0.8,
            },
            {
                step: 2,
                description: 'Market uncertainty reduces customer spending',
                mechanism:
                    'Businesses delay purchases and reduce budgets during periods of geopolitical instability.',
                confidence: 0.6,
            },
            {
                step: 3,
                description: 'Revenue growth slows',
                mechanism: `Reduced customer acquisition and potential churn. ${context}`,
                confidence: 0.5,
            },
        ],
    },

    // MARKET SHIFTS
    [EventType.MARKET_SHIFT]: {
        eventType: EventType.MARKET_SHIFT,
        affectedDrivers: [
            BusinessDriverType.SUBSCRIPTION_REVENUE,
            BusinessDriverType.SALES_MARKETING,
        ],
        sensitivityFactor: SensitivityFactor.MARKET_DEMAND,
        defaultDirection: ImpactDirection.NEUTRAL,
        timeHorizon: TimeHorizon.MEDIUM,
        getCausalPath: (event, context) => [
            {
                step: 1,
                description: 'Market dynamics change',
                mechanism: event,
                confidence: 0.7,
            },
            {
                step: 2,
                description: 'Customer demand patterns shift',
                mechanism:
                    'Market shifts affect customer needs, competitive landscape, and pricing power.',
                confidence: 0.6,
            },
            {
                step: 3,
                description: 'Revenue and customer acquisition costs affected',
                mechanism: `Changed market conditions require business adaptation. ${context}`,
                confidence: 0.55,
            },
        ],
    },

    // TECHNOLOGY EVENTS
    [EventType.TECHNOLOGY]: {
        eventType: EventType.TECHNOLOGY,
        affectedDrivers: [
            BusinessDriverType.R_AND_D,
            BusinessDriverType.INFRASTRUCTURE_COSTS,
        ],
        sensitivityFactor: SensitivityFactor.INFRASTRUCTURE,
        defaultDirection: ImpactDirection.NEUTRAL,
        timeHorizon: TimeHorizon.LONG,
        getCausalPath: (event, context) => [
            {
                step: 1,
                description: 'Technology change occurs',
                mechanism: event,
                confidence: 0.7,
            },
            {
                step: 2,
                description: 'May require technology stack adaptation',
                mechanism:
                    'New technologies can create opportunities (efficiency) or threats (competitive pressure).',
                confidence: 0.5,
            },
            {
                step: 3,
                description: 'R&D and infrastructure investments adjust',
                mechanism: `Technology evolution affects development priorities and infrastructure choices. ${context}`,
                confidence: 0.45,
            },
        ],
    },

    // DISASTER EVENTS
    [EventType.DISASTER]: {
        eventType: EventType.DISASTER,
        affectedDrivers: [
            BusinessDriverType.INFRASTRUCTURE_COSTS,
            BusinessDriverType.SUBSCRIPTION_REVENUE,
        ],
        sensitivityFactor: SensitivityFactor.MARKET_DEMAND,
        defaultDirection: ImpactDirection.NEUTRAL,
        timeHorizon: TimeHorizon.SHORT,
        getCausalPath: (event, context) => [
            {
                step: 1,
                description: 'Disaster event occurs',
                mechanism: event,
                confidence: 0.9,
            },
            {
                step: 2,
                description: 'Regional disruption affects operations',
                mechanism:
                    'Natural disasters disrupt infrastructure, workforce, and customer operations in affected regions.',
                confidence: 0.7,
            },
            {
                step: 3,
                description: 'Business continuity and recovery costs',
                mechanism: `Impact depends on regional exposure. ${context}`,
                confidence: 0.6,
            },
        ],
    },
};

/**
 * Get causal rule for an event type
 * WHY: Centralized access to mapping rules
 */
export function getCausalRule(eventType: EventType): CausalRule {
    return CAUSAL_RULES[eventType];
}

/**
 * Check if event type has a high-confidence rule
 * WHY: Some mappings are more certain than others
 */
export function isHighConfidenceRule(eventType: EventType): boolean {
    const highConfidenceTypes = [
        EventType.LABOR_MARKET,
        EventType.INFRASTRUCTURE,
        EventType.ECONOMIC_INDICATOR,
        EventType.CURRENCY,
    ];

    return highConfidenceTypes.includes(eventType);
}
