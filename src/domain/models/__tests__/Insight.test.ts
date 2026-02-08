/**
 * Tests for Insight domain model
 */

import { Insight } from '../Insight';
import {
    ImpactDirection,
    ImpactMagnitude,
    TimeHorizon,
    BusinessDriverType,
    InsightModel,
    CausalStep,
    Assumption,
} from '../types';

describe('Insight', () => {
    const validCausalPath: CausalStep[] = [
        {
            step: 1,
            description: 'Labor market event occurs',
            mechanism: 'Tech worker wages increase by 15%',
            confidence: 0.9,
        },
        {
            step: 2,
            description: 'Wage pressure affects hiring costs',
            mechanism: 'Competitive labor market forces wage increases',
            confidence: 0.85,
        },
    ];

    const validAssumptions: Assumption[] = [
        {
            id: 'labor-mobility',
            description: 'Workers can switch jobs freely',
            impact: 'HIGH',
            validationCriteria: 'No-compete clauses are rare',
        },
    ];

    const validInsightData: InsightModel = {
        id: 'insight-123',
        businessModelId: 'bm-123',
        eventId: 'event-123',
        summary: 'Rising tech wages will increase labor costs by 10-15%',
        impactDirection: ImpactDirection.INCREASE,
        impactMagnitude: ImpactMagnitude.HIGH,
        timeHorizon: TimeHorizon.MEDIUM,
        affectedDrivers: [BusinessDriverType.LABOR_COSTS],
        causalPath: validCausalPath,
        assumptions: validAssumptions,
        confidenceScore: 0.76,
        confidenceRationale: 'Event from highly reliable source; direct causal relationship.',
        llmExplanation: 'Your labor costs will increase due to rising wages.',
        generatedAt: new Date('2024-01-15'),
        dismissed: false,
    };

    describe('constructor', () => {
        it('should create a valid Insight instance', () => {
            const insight = new Insight(validInsightData);

            expect(insight.id).toBe('insight-123');
            expect(insight.summary).toContain('labor costs');
            expect(insight.impactDirection).toBe(ImpactDirection.INCREASE);
            expect(insight.impactMagnitude).toBe(ImpactMagnitude.HIGH);
            expect(insight.causalPath).toHaveLength(2);
        });
    });

    describe('calculateOverallConfidence', () => {
        it('should calculate confidence as product of event and path confidences', () => {
            const eventConfidence = 0.9;
            const causalPath = [
                { step: 1, description: 'Step 1', mechanism: 'Mechanism 1', confidence: 0.9 },
                { step: 2, description: 'Step 2', mechanism: 'Mechanism 2', confidence: 0.8 },
            ];

            const overall = Insight.calculateOverallConfidence(eventConfidence, causalPath);

            // 0.9 * 0.9 * 0.8 = 0.648
            expect(overall).toBeCloseTo(0.648, 2);
        });

        it('should penalize empty causal path', () => {
            const confidence = Insight.calculateOverallConfidence(0.9, []);

            expect(confidence).toBe(0.45); // 0.9 * 0.5 penalty
        });

        it('should result in lower confidence for longer chains', () => {
            const shortPath = [
                { step: 1, description: 'Step 1', mechanism: 'M1', confidence: 0.9 },
            ];
            const longPath = [
                { step: 1, description: 'Step 1', mechanism: 'M1', confidence: 0.9 },
                { step: 2, description: 'Step 2', mechanism: 'M2', confidence: 0.9 },
                { step: 3, description: 'Step 3', mechanism: 'M3', confidence: 0.9 },
            ];

            const shortConfidence = Insight.calculateOverallConfidence(0.9, shortPath);
            const longConfidence = Insight.calculateOverallConfidence(0.9, longPath);

            expect(longConfidence).toBeLessThan(shortConfidence);
        });
    });

    describe('generateConfidenceRationale', () => {
        it('should mention high reliability sources', () => {
            const rationale = Insight.generateConfidenceRationale(0.85, validCausalPath, validAssumptions);

            expect(rationale).toContain('highly reliable source');
        });

        it('should mention moderate reliability sources', () => {
            const rationale = Insight.generateConfidenceRationale(0.65, validCausalPath, validAssumptions);

            expect(rationale).toContain('moderately reliable source');
        });

        it('should mention low reliability sources', () => {
            const rationale = Insight.generateConfidenceRationale(0.45, validCausalPath, validAssumptions);

            expect(rationale).toContain('low-reliability source');
        });

        it('should identify direct causal relationships', () => {
            const shortPath = [
                { step: 1, description: 'Step 1', mechanism: 'M1', confidence: 0.9 },
            ];
            const rationale = Insight.generateConfidenceRationale(0.85, shortPath, []);

            expect(rationale).toContain('direct causal relationship');
        });

        it('should identify indirect causal relationships', () => {
            const mediumPath = [
                { step: 1, description: 'S1', mechanism: 'M1', confidence: 0.9 },
                { step: 2, description: 'S2', mechanism: 'M2', confidence: 0.9 },
                { step: 3, description: 'S3', mechanism: 'M3', confidence: 0.9 },
            ];
            const rationale = Insight.generateConfidenceRationale(0.85, mediumPath, []);

            expect(rationale).toContain('indirect causal relationship');
        });

        it('should mention high-impact assumptions', () => {
            const rationale = Insight.generateConfidenceRationale(0.85, validCausalPath, validAssumptions);

            expect(rationale).toContain('high-impact assumption');
        });
    });

    describe('isActionable', () => {
        it('should return true for high confidence, high magnitude insight', () => {
            const insight = new Insight(validInsightData);

            expect(insight.isActionable()).toBe(true);
        });

        it('should return false for dismissed insight', () => {
            const insight = new Insight({
                ...validInsightData,
                dismissed: true,
            });

            expect(insight.isActionable()).toBe(false);
        });

        it('should return false for low confidence insight', () => {
            const insight = new Insight({
                ...validInsightData,
                confidenceScore: 0.3,
            });

            expect(insight.isActionable()).toBe(false);
        });

        it('should respect custom confidence threshold', () => {
            const insight = new Insight({
                ...validInsightData,
                confidenceScore: 0.65,
            });

            expect(insight.isActionable(0.6)).toBe(true);
            expect(insight.isActionable(0.7)).toBe(false);
        });

        it('should return false for low magnitude insight', () => {
            const insight = new Insight({
                ...validInsightData,
                impactMagnitude: ImpactMagnitude.LOW,
            });

            expect(insight.isActionable(0.6, ImpactMagnitude.MEDIUM)).toBe(false);
        });
    });
});
