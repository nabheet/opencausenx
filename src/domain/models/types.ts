/**
 * Core Types and Enums for OpenCausenx
 * 
 * WHY: Strong typing ensures consistency across the application and makes
 * causal reasoning explicit and type-safe.
 */

// ===== EVENT TYPES =====

/**
 * Event types that can affect business operations
 * WHY: Explicit categorization enables deterministic causal mapping
 */
export enum EventType {
    REGULATION_CHANGE = 'REGULATION_CHANGE',         // New laws, compliance requirements
    ECONOMIC_INDICATOR = 'ECONOMIC_INDICATOR',       // GDP, inflation, interest rates
    LABOR_MARKET = 'LABOR_MARKET',                   // Wage changes, unemployment
    GEOPOLITICAL = 'GEOPOLITICAL',                   // Political instability, trade policy
    INFRASTRUCTURE = 'INFRASTRUCTURE',               // Cloud costs, energy costs
    MARKET_SHIFT = 'MARKET_SHIFT',                   // Demand changes, competition
    TECHNOLOGY = 'TECHNOLOGY',                       // New tech, platform changes
    CURRENCY = 'CURRENCY',                           // FX rate changes
    DISASTER = 'DISASTER',                           // Natural disasters, pandemics
}

/**
 * Source types for events
 */
export enum EventSourceType {
    RSS = 'RSS',
    API = 'API',
    MANUAL = 'MANUAL',
}

/**
 * Entities that can be affected by events
 */
export enum AffectedEntity {
    TECH_COMPANIES = 'TECH_COMPANIES',
    LABOR_FORCE = 'LABOR_FORCE',
    CONSUMERS = 'CONSUMERS',
    INFRASTRUCTURE_PROVIDERS = 'INFRASTRUCTURE_PROVIDERS',
    FINANCIAL_SECTOR = 'FINANCIAL_SECTOR',
    GOVERNMENT = 'GOVERNMENT',
    ALL = 'ALL',
}

// ===== BUSINESS MODEL TYPES =====

/**
 * Industry templates
 * WHY: MVP supports only SaaS, but designed for extensibility
 */
export enum Industry {
    SAAS = 'SAAS',
}

/**
 * Business driver types
 * WHY: Categorizes revenue and cost components for causal mapping
 */
export enum BusinessDriverType {
    // Revenue drivers
    SUBSCRIPTION_REVENUE = 'SUBSCRIPTION_REVENUE',
    USAGE_REVENUE = 'USAGE_REVENUE',
    SERVICES_REVENUE = 'SERVICES_REVENUE',

    // Cost drivers
    LABOR_COSTS = 'LABOR_COSTS',
    INFRASTRUCTURE_COSTS = 'INFRASTRUCTURE_COSTS',
    SALES_MARKETING = 'SALES_MARKETING',
    R_AND_D = 'R_AND_D',
    ADMINISTRATIVE = 'ADMINISTRATIVE',
}

/**
 * Sensitivity factors
 * WHY: Determines how strongly business reacts to external changes
 */
export enum SensitivityFactor {
    LABOR = 'LABOR',
    INFRASTRUCTURE = 'INFRASTRUCTURE',
    FX = 'FX',
    REGULATION = 'REGULATION',
    MARKET_DEMAND = 'MARKET_DEMAND',
}

// ===== INSIGHT TYPES =====

/**
 * Impact direction
 * WHY: Clear directional guidance for business decisions
 */
export enum ImpactDirection {
    INCREASE = 'INCREASE',     // Costs increase or risks increase
    DECREASE = 'DECREASE',     // Costs decrease or opportunities emerge
    NEUTRAL = 'NEUTRAL',       // Minimal or offsetting effects
}

/**
 * Impact magnitude
 * WHY: Helps prioritize which insights need attention
 */
export enum ImpactMagnitude {
    LOW = 'LOW',         // < 2% estimated impact
    MEDIUM = 'MEDIUM',   // 2-5% estimated impact
    HIGH = 'HIGH',       // > 5% estimated impact
}

/**
 * Time horizon for impact
 * WHY: Helps with strategic vs tactical planning
 */
export enum TimeHorizon {
    SHORT = 'SHORT',     // 0-3 months
    MEDIUM = 'MEDIUM',   // 3-12 months
    LONG = 'LONG',       // 12+ months
}

// ===== STRUCTURED DATA TYPES =====

/**
 * Confidence bounds
 * WHY: Explicitly represent uncertainty (no fake precision)
 */
export type ConfidenceBounds = {
    low: number;
    expected: number;
    high: number;
};

/**
 * Causal step in reasoning chain
 * WHY: Makes reasoning explicit and auditable
 */
export type CausalStep = {
    step: number;
    description: string;
    mechanism: string;  // HOW does this connection work?
    confidence: number; // 0-1 confidence in this specific step
};

/**
 * Assumption made during analysis
 * WHY: All assumptions must be explicitly documented
 */
export type Assumption = {
    id: string;
    description: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW'; // If wrong, how much does it matter?
    source?: string; // Where does this assumption come from?
};

/**
 * Business driver with weight
 */
export type WeightedDriver = {
    driver: BusinessDriverType;
    weight: number; // 0-1, should sum to 1 within category
};

/**
 * Sensitivity configuration
 */
export type SensitivityConfig = {
    factor: SensitivityFactor;
    sensitivity: number; // 0-1, how reactive is business to this factor
};

// ===== DOMAIN MODEL INTERFACES =====

/**
 * Normalized event
 */
export interface EventModel {
    id: string;
    eventType: EventType;
    summary: string;
    region: string; // ISO country code
    timestamp: Date;
    affectedEntities: AffectedEntity[];
    source: string;
    sourceId?: string;
    confidenceScore: number;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

/**
 * Business model configuration
 */
export interface BusinessModelConfig {
    id: string;
    userId: string;
    name: string;
    industry: Industry;
    revenueDrivers: WeightedDriver[];
    costDrivers: WeightedDriver[];
    sensitivities: SensitivityConfig[];
    operatingRegions: string[]; // ISO codes
    customerRegions: string[];
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Generated insight
 */
export interface InsightModel {
    id: string;
    businessModelId: string;
    eventId: string;
    summary: string;
    impactDirection: ImpactDirection;
    impactMagnitude: ImpactMagnitude;
    timeHorizon: TimeHorizon;
    affectedDrivers: BusinessDriverType[];
    causalPath: CausalStep[];
    assumptions: Assumption[];
    confidenceScore: number;
    confidenceRationale: string;
    llmExplanation?: string;
    generatedAt: Date;
    dismissed: boolean;
    userNotes?: string;
}
