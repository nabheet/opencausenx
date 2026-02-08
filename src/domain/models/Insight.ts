/**
 * Insight Domain Model
 * 
 * WHY: Represents a causal insight with full explainability.
 * Every insight includes the reasoning chain, assumptions, and confidence scoring.
 */

import {
    ImpactDirection,
    ImpactMagnitude,
    TimeHorizon,
    BusinessDriverType,
    InsightModel,
    CausalStep,
    Assumption,
} from './types';
import { Insight as PrismaInsight } from '@prisma/client';

export class Insight implements InsightModel {
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

    constructor(data: InsightModel) {
        this.id = data.id;
        this.businessModelId = data.businessModelId;
        this.eventId = data.eventId;
        this.summary = data.summary;
        this.impactDirection = data.impactDirection;
        this.impactMagnitude = data.impactMagnitude;
        this.timeHorizon = data.timeHorizon;
        this.affectedDrivers = data.affectedDrivers;
        this.causalPath = data.causalPath;
        this.assumptions = data.assumptions;
        this.confidenceScore = data.confidenceScore;
        this.confidenceRationale = data.confidenceRationale;
        this.llmExplanation = data.llmExplanation;
        this.generatedAt = data.generatedAt;
        this.dismissed = data.dismissed;
        this.userNotes = data.userNotes;
    }

    /**
     * Create Insight from Prisma entity
     */
    static fromPrisma(prisma: PrismaInsight): Insight {
        return new Insight({
            id: prisma.id,
            businessModelId: prisma.businessModelId,
            eventId: prisma.eventId,
            summary: prisma.summary,
            impactDirection: prisma.impactDirection as ImpactDirection,
            impactMagnitude: prisma.impactMagnitude as ImpactMagnitude,
            timeHorizon: prisma.timeHorizon as TimeHorizon,
            affectedDrivers: prisma.affectedDrivers as BusinessDriverType[],
            causalPath: prisma.causalPath as CausalStep[],
            assumptions: prisma.assumptions as Assumption[],
            confidenceScore: prisma.confidenceScore,
            confidenceRationale: prisma.confidenceRationale,
            llmExplanation: prisma.llmExplanation || undefined,
            generatedAt: prisma.generatedAt,
            dismissed: prisma.dismissed,
            userNotes: prisma.userNotes || undefined,
        });
    }

    /**
     * Calculate overall confidence score
     * WHY: Confidence is the product of all step confidences and event confidence
     */
    static calculateOverallConfidence(
        eventConfidence: number,
        causalPath: CausalStep[]
    ): number {
        if (causalPath.length === 0) {
            return eventConfidence * 0.5; // Penalty for no reasoning
        }

        // Overall confidence is the product of event confidence and all step confidences
        // WHY: Chain is only as strong as its weakest link
        const pathConfidence = causalPath.reduce(
            (acc, step) => acc * step.confidence,
            1.0
        );

        return eventConfidence * pathConfidence;
    }

    /**
     * Generate confidence rationale
     * WHY: Explain to user WHY we have this confidence level
     */
    static generateConfidenceRationale(
        eventConfidence: number,
        causalPath: CausalStep[],
        assumptions: Assumption[]
    ): string {
        const parts: string[] = [];

        // Event confidence
        if (eventConfidence >= 0.8) {
            parts.push('Event from highly reliable source');
        } else if (eventConfidence >= 0.6) {
            parts.push('Event from moderately reliable source');
        } else {
            parts.push('Event from unverified or low-reliability source');
        }

        // Causal path length and clarity
        if (causalPath.length <= 2) {
            parts.push('direct causal relationship');
        } else if (causalPath.length <= 4) {
            parts.push('indirect causal relationship with intermediate steps');
        } else {
            parts.push('complex causal chain with many assumptions');
        }

        // High-impact assumptions
        const highImpactAssumptions = assumptions.filter((a) => a.impact === 'HIGH');
        if (highImpactAssumptions.length > 0) {
            parts.push(
                `${highImpactAssumptions.length} high-impact assumption(s) that could significantly affect accuracy`
            );
        }

        return parts.join('; ') + '.';
    }

    /**
     * Check if insight is actionable
     * WHY: Filter out low-confidence or low-impact insights
     */
    isActionable(minConfidence: number = 0.6, minMagnitude: ImpactMagnitude = ImpactMagnitude.MEDIUM): boolean {
        if (this.dismissed) return false;
        if (this.confidenceScore < minConfidence) return false;

        const magnitudeOrder = {
            [ImpactMagnitude.LOW]: 1,
            [ImpactMagnitude.MEDIUM]: 2,
            [ImpactMagnitude.HIGH]: 3,
        };

        return magnitudeOrder[this.impactMagnitude] >= magnitudeOrder[minMagnitude];
    }

    /**
     * Get age of insight in days
     */
    getAgeInDays(): number {
        return Math.floor((Date.now() - this.generatedAt.getTime()) / (1000 * 60 * 60 * 24));
    }

    /**
     * Check if insight is stale
     * WHY: Old insights may no longer be relevant
     */
    isStale(maxAgeDays: number = 30): boolean {
        return this.getAgeInDays() > maxAgeDays;
    }
}
