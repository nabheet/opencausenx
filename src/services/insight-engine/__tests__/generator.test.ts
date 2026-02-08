/**
 * Tests for Insight Generator service
 */

import { generateInsightsForBusiness, generateInsightSummary } from '../generator';
import { Event } from '@/domain/models/Event';
import { BusinessModel } from '@/domain/models/BusinessModel';
import {
    EventType,
    AffectedEntity,
    Industry,
    BusinessDriverType,
    SensitivityFactor,
    ImpactDirection,
    ImpactMagnitude,
    TimeHorizon,
} from '@/domain/models/types';

// Mock Prisma with proper typing - define inside the factory to avoid hoisting issues
jest.mock('@/lib/prisma', () => ({
    prisma: {
        businessModel: {
            findUnique: jest.fn(),
        },
        event: {
            findMany: jest.fn(),
        },
        insight: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
    },
}));

// Mock causal mapper
jest.mock('@/domain/causal-mapping/mapper', () => ({
    batchMapEventsToBusiness: jest.fn(),
}));

// Mock LLM explainer
jest.mock('../llm-explainer', () => ({
    generateLLMExplanation: jest.fn(() => Promise.resolve('LLM explanation')),
    generateBasicExplanation: jest.fn(() => 'Basic explanation'),
}));

// Import the mocked modules
import { prisma } from '@/lib/prisma';
import { batchMapEventsToBusiness } from '@/domain/causal-mapping/mapper';

describe('Insight Generator', () => {
    const mockBusinessModel = {
        id: 'bm-123',
        userId: 'user-123',
        name: 'Test SaaS',
        industry: Industry.SAAS,
        revenueDrivers: [{ driver: BusinessDriverType.SUBSCRIPTION_REVENUE, weight: 1.0 }],
        costDrivers: [{ driver: BusinessDriverType.LABOR_COSTS, weight: 1.0 }],
        sensitivities: [{ factor: SensitivityFactor.LABOR, sensitivity: 0.8 }],
        operatingRegions: ['US'],
        customerRegions: ['US'],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    describe('generateInsightsForBusiness', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            (batchMapEventsToBusiness as jest.Mock).mockReturnValue([]);
        });

        it('should return error count for non-existent business model', async () => {
            (prisma.businessModel.findUnique as jest.Mock).mockResolvedValue(null);

            // Suppress expected console.error
            const consoleError = jest.spyOn(console, 'error').mockImplementation();

            const result = await generateInsightsForBusiness('invalid-id');

            expect(result.errors).toBe(1);
            expect(result.created).toBe(0);
            expect(result.skipped).toBe(0);

            consoleError.mockRestore();
        });

        it('should fetch business model and recent events', async () => {
            (prisma.businessModel.findUnique as jest.Mock).mockResolvedValue(mockBusinessModel);
            (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

            const result = await generateInsightsForBusiness('bm-123');

            expect(prisma.businessModel.findUnique).toHaveBeenCalledWith({
                where: { id: 'bm-123' },
            });
            expect(prisma.event.findMany).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should skip irrelevant events', async () => {
            (prisma.businessModel.findUnique as jest.Mock).mockResolvedValue(mockBusinessModel);
            (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
            (batchMapEventsToBusiness as jest.Mock).mockReturnValue([
                { isRelevant: false },
                { isRelevant: false },
            ]);

            const result = await generateInsightsForBusiness('bm-123');

            expect(result.skipped).toBe(2);
            expect(result.created).toBe(0);
        });

        it('should skip existing insights', async () => {
            (prisma.businessModel.findUnique as jest.Mock).mockResolvedValue(mockBusinessModel);
            (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.insight.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });

            (batchMapEventsToBusiness as jest.Mock).mockReturnValue([
                {
                    isRelevant: true,
                    event: { id: 'event-1' },
                    affectedDrivers: [BusinessDriverType.LABOR_COSTS],
                    impactDirection: ImpactDirection.INCREASE,
                    impactMagnitude: ImpactMagnitude.HIGH,
                    timeHorizon: TimeHorizon.MEDIUM,
                    causalPath: [],
                    assumptions: [],
                    confidenceScore: 0.8,
                    confidenceRationale: 'Test',
                },
            ]);

            const result = await generateInsightsForBusiness('bm-123');

            expect(result.skipped).toBeGreaterThan(0);
        });
    });

    describe('generateInsightSummary', () => {
        const mockMapping = {
            event: new Event({
                id: 'event-1',
                eventType: EventType.LABOR_MARKET,
                summary: 'Tech wages increase by 15%',
                region: 'US',
                timestamp: new Date(),
                affectedEntities: [AffectedEntity.TECH_COMPANIES],
                source: 'RSS',
                confidenceScore: 0.85,
                createdAt: new Date(),
            }),
            businessModel: new BusinessModel(mockBusinessModel),
            affectedDrivers: [BusinessDriverType.LABOR_COSTS],
            impactDirection: ImpactDirection.INCREASE,
            impactMagnitude: ImpactMagnitude.HIGH,
            timeHorizon: TimeHorizon.MEDIUM,
            causalPath: [],
            assumptions: [],
            confidenceScore: 0.8,
            confidenceRationale: 'Test',
            isRelevant: true,
            relevanceReason: 'Relevant',
        };

        it('should generate summary with impact direction', () => {
            const summary = generateInsightSummary(mockMapping);

            expect(summary).toContain('increase');
            expect(summary.toLowerCase()).toMatch(/cost|expense|impact/);
        });

        it('should mention affected drivers', () => {
            const summary = generateInsightSummary(mockMapping);

            expect(summary.toLowerCase()).toContain('labor');
        });

        it('should include magnitude information', () => {
            const summary = generateInsightSummary(mockMapping);

            expect(summary.toLowerCase()).toMatch(/high|significant/);
        });

        it('should handle decrease direction', () => {
            const decreaseMapping = {
                ...mockMapping,
                impactDirection: ImpactDirection.DECREASE,
            };

            const summary = generateInsightSummary(decreaseMapping);

            expect(summary).toContain('decrease');
        });
    });
});
