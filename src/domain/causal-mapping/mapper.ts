/**
 * Causal Mapper
 * 
 * WHY: Applies deterministic causal rules to map events to business impacts.
 * This is the engine that powers insight generation - no ML, just explicit logic.
 */

import { Event } from '../models/Event';
import { BusinessModel } from '../models/BusinessModel';
import {
    EventType,
    BusinessDriverType,
    ImpactDirection,
    ImpactMagnitude,
    TimeHorizon,
    CausalStep,
    Assumption,
} from '../models/types';
import { getCausalRule, isHighConfidenceRule } from './rules';
import { getAssumptionsForEventType, validateAssumptionsForBusiness } from './assumptions';

/**
 * Result of causal mapping
 */
export interface CausalMapping {
    event: Event;
    businessModel: BusinessModel;
    affectedDrivers: BusinessDriverType[];
    impactDirection: ImpactDirection;
    impactMagnitude: ImpactMagnitude;
    timeHorizon: TimeHorizon;
    causalPath: CausalStep[];
    assumptions: Assumption[];
    confidenceScore: number;
    confidenceRationale: string;
    isRelevant: boolean; // Does this event actually affect this business?
    relevanceReason: string;
}

/**
 * Map event to business impact
 * WHY: Core causal reasoning engine
 */
export function mapEventToBusiness(
    event: Event,
    businessModel: BusinessModel
): CausalMapping | null {
    // Step 1: Check relevance
    const relevance = checkRelevance(event, businessModel);
    if (!relevance.isRelevant) {
        return {
            event,
            businessModel,
            affectedDrivers: [],
            impactDirection: ImpactDirection.NEUTRAL,
            impactMagnitude: ImpactMagnitude.LOW,
            timeHorizon: TimeHorizon.SHORT,
            causalPath: [],
            assumptions: [],
            confidenceScore: 0,
            confidenceRationale: relevance.reason,
            isRelevant: false,
            relevanceReason: relevance.reason,
        };
    }

    // Step 2: Get causal rule for event type
    const rule = getCausalRule(event.eventType);

    // Step 3: Build business context string for causal path
    const businessContext = buildBusinessContext(businessModel, rule.affectedDrivers);

    // Step 4: Generate causal path
    const causalPath = rule.getCausalPath(event.summary, businessContext);

    // Step 5: Get assumptions
    const assumptions = getAssumptionsForEventType(event.eventType);

    // Step 6: Validate assumptions for this business
    const assumptionValidation = validateAssumptionsForBusiness(assumptions, {
        hasInternationalOperations: businessModel.operatingRegions.some(
            (r) => r !== 'US' || businessModel.operatingRegions.length > 1
        ),
        hasInternationalCustomers: businessModel.customerRegions.some(
            (r) => r !== 'US' || businessModel.customerRegions.length > 1
        ),
        operatesInRegion: businessModel.hasRegionalExposure(event.region),
    });

    // Step 7: Determine impact direction
    const impactDirection = determineImpactDirection(event, rule);

    // Step 8: Calculate impact magnitude
    const impactMagnitude = calculateImpactMagnitude(
        event,
        businessModel,
        rule.affectedDrivers,
        rule.sensitivityFactor
    );

    // Step 9: Calculate overall confidence
    const confidenceScore = calculateConfidence(
        event,
        causalPath,
        businessModel,
        rule.sensitivityFactor,
        assumptions.length
    );

    // Step 10: Generate confidence rationale
    const confidenceRationale = generateConfidenceRationale(
        event,
        causalPath,
        assumptions,
        assumptionValidation.warnings
    );

    return {
        event,
        businessModel,
        affectedDrivers: rule.affectedDrivers,
        impactDirection,
        impactMagnitude,
        timeHorizon: rule.timeHorizon,
        causalPath,
        assumptions,
        confidenceScore,
        confidenceRationale,
        isRelevant: true,
        relevanceReason: relevance.reason,
    };
}

/**
 * Check if event is relevant to business
 * WHY: Filter out events that don't affect this business
 */
function checkRelevance(
    event: Event,
    businessModel: BusinessModel
): { isRelevant: boolean; reason: string } {
    // Check 1: Geographic relevance
    if (!event.isRelevantToRegion(businessModel.getAllRelevantRegions())) {
        return {
            isRelevant: false,
            reason: `Event in ${event.region} does not affect business operating in ${businessModel.getAllRelevantRegions().join(', ')}`,
        };
    }

    // Check 2: Event age
    if (!event.isRecent(90)) {
        return {
            isRelevant: false,
            reason: `Event is ${event.getAgeInDays()} days old and likely no longer relevant`,
        };
    }

    // Check 3: Event confidence
    if (event.confidenceScore < 0.3) {
        return {
            isRelevant: false,
            reason: 'Event has very low confidence score and may not be reliable',
        };
    }

    return {
        isRelevant: true,
        reason: 'Event is geographically relevant, recent, and from reliable source',
    };
}

/**
 * Build business context string for causal explanation
 * WHY: Explains business-specific factors in the causal chain
 */
function buildBusinessContext(
    businessModel: BusinessModel,
    affectedDrivers: BusinessDriverType[]
): string {
    const contextParts: string[] = [];

    for (const driver of affectedDrivers) {
        const weight = businessModel.getDriverWeight(driver);
        if (weight > 0) {
            const percentage = (weight * 100).toFixed(0);
            contextParts.push(`${driver} represents ${percentage}% of business structure`);
        }
    }

    return contextParts.join('. ');
}

/**
 * Determine impact direction based on event details
 * WHY: Some events clearly increase or decrease costs/risks
 */
function determineImpactDirection(event: Event, rule: any): ImpactDirection {
    const summary = event.summary.toLowerCase();

    // Look for directional keywords
    if (
        summary.includes('increase') ||
        summary.includes('rise') ||
        summary.includes('growth') ||
        summary.includes('up')
    ) {
        return ImpactDirection.INCREASE;
    }

    if (
        summary.includes('decrease') ||
        summary.includes('decline') ||
        summary.includes('fall') ||
        summary.includes('down')
    ) {
        return ImpactDirection.DECREASE;
    }

    // Fall back to rule default
    return rule.defaultDirection;
}

/**
 * Calculate impact magnitude
 * WHY: Prioritize high-impact events
 * 
 * Formula: magnitude = driver_weight * sensitivity * event_confidence
 */
function calculateImpactMagnitude(
    event: Event,
    businessModel: BusinessModel,
    affectedDrivers: BusinessDriverType[],
    sensitivityFactor: any
): ImpactMagnitude {
    // Calculate weighted impact
    let totalWeight = 0;
    for (const driver of affectedDrivers) {
        totalWeight += businessModel.getDriverWeight(driver);
    }

    const sensitivity = businessModel.getSensitivity(sensitivityFactor);
    const rawMagnitude = totalWeight * sensitivity * event.confidenceScore;

    // Map to categories
    // WHY: Thresholds based on business materiality (>5% is typically material)
    if (rawMagnitude > 0.05) {
        return ImpactMagnitude.HIGH;
    } else if (rawMagnitude > 0.02) {
        return ImpactMagnitude.MEDIUM;
    } else {
        return ImpactMagnitude.LOW;
    }
}

/**
 * Calculate overall confidence score
 * WHY: Aggregate confidence from multiple factors
 */
function calculateConfidence(
    event: Event,
    causalPath: CausalStep[],
    businessModel: BusinessModel,
    sensitivityFactor: any,
    assumptionCount: number
): number {
    // Start with event confidence
    let confidence = event.confidenceScore;

    // Multiply by causal path confidence (weakest link principle)
    const pathConfidence = causalPath.reduce((acc, step) => acc * step.confidence, 1.0);
    confidence *= pathConfidence;

    // Adjust for rule quality
    if (isHighConfidenceRule(event.eventType)) {
        confidence *= 1.0; // No penalty
    } else {
        confidence *= 0.9; // Small penalty for less certain rules
    }

    // Penalty for many assumptions
    const assumptionPenalty = Math.pow(0.95, assumptionCount);
    confidence *= assumptionPenalty;

    // Bonus for high sensitivity (means business is actually affected)
    const sensitivity = businessModel.getSensitivity(sensitivityFactor);
    if (sensitivity > 0.7) {
        confidence *= 1.1; // Boost confidence
    }

    return Math.max(0, Math.min(1, confidence));
}

/**
 * Generate confidence rationale
 * WHY: Explain confidence score to user
 */
function generateConfidenceRationale(
    event: Event,
    causalPath: CausalStep[],
    assumptions: Assumption[],
    warnings: string[]
): string {
    const parts: string[] = [];

    // Event quality
    if (event.confidenceScore >= 0.8) {
        parts.push('Event from highly reliable source');
    } else if (event.confidenceScore >= 0.6) {
        parts.push('Event from moderately reliable source');
    } else {
        parts.push('Event from uncertain or unverified source');
    }

    // Causal certainty
    if (isHighConfidenceRule(event.eventType)) {
        parts.push('well-established causal relationship');
    } else {
        parts.push('uncertain or indirect causal relationship');
    }

    // Causal path complexity
    if (causalPath.length <= 2) {
        parts.push('direct impact');
    } else {
        parts.push(`${causalPath.length}-step causal chain`);
    }

    // Assumptions
    if (assumptions.length > 0) {
        const highImpact = assumptions.filter((a) => a.impact === 'HIGH').length;
        if (highImpact > 0) {
            parts.push(`${highImpact} critical assumption(s)`);
        }
    }

    // Warnings
    if (warnings.length > 0) {
        parts.push(`${warnings.length} caveat(s)`);
    }

    return parts.join('; ') + '.';
}

/**
 * Batch map multiple events to a business
 * WHY: Efficient processing of many events
 */
export function batchMapEventsToBusiness(
    events: Event[],
    businessModel: BusinessModel
): CausalMapping[] {
    const mappings: CausalMapping[] = [];

    for (const event of events) {
        const mapping = mapEventToBusiness(event, businessModel);
        if (mapping && mapping.isRelevant) {
            mappings.push(mapping);
        }
    }

    // Sort by confidence * magnitude (prioritize high-quality, high-impact)
    return mappings.sort((a, b) => {
        const scoreA = a.confidenceScore * getMagnitudeWeight(a.impactMagnitude);
        const scoreB = b.confidenceScore * getMagnitudeWeight(b.impactMagnitude);
        return scoreB - scoreA;
    });
}

/**
 * Get numeric weight for magnitude
 */
function getMagnitudeWeight(magnitude: ImpactMagnitude): number {
    switch (magnitude) {
        case ImpactMagnitude.HIGH:
            return 3;
        case ImpactMagnitude.MEDIUM:
            return 2;
        case ImpactMagnitude.LOW:
            return 1;
    }
}
