/**
 * Insight Generator
 * 
 * WHY: Orchestrates the entire insight generation pipeline:
 * 1. Fetch events and business models
 * 2. Apply causal mapping
 * 3. Generate explanations (with or without LLM)
 * 4. Store insights
 */

import { prisma } from '@/lib/prisma';
import { Event } from '@/domain/models/Event';
import { BusinessModel } from '@/domain/models/BusinessModel';
import { mapEventToBusiness, batchMapEventsToBusiness, CausalMapping } from '@/domain/causal-mapping/mapper';
import { generateLLMExplanation, generateBasicExplanation } from './llm-explainer';
import { BusinessDriverType } from '@/domain/models/types';
import { Event as PrismaEvent } from '@prisma/client';

/**
 * Generate insights for a specific business model
 * WHY: Find all relevant events and create insights
 */
export async function generateInsightsForBusiness(
    businessModelId: string,
    useLLM: boolean = true
): Promise<{ created: number; skipped: number; errors: number }> {
    let created = 0;
    let skipped = 0;
    let errors = 0;

    try {
        // Fetch business model
        const businessModelData = await prisma.businessModel.findUnique({
            where: { id: businessModelId },
        });

        if (!businessModelData) {
            throw new Error(`Business model ${businessModelId} not found`);
        }

        const businessModel = BusinessModel.fromPrisma(businessModelData);

        // Fetch recent events
        const recentEvents = await prisma.event.findMany({
            where: {
                timestamp: {
                    gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
        });

        const events = recentEvents.map((e: PrismaEvent) => Event.fromPrisma(e));

        // Apply causal mapping
        const mappings = batchMapEventsToBusiness(events, businessModel);

        // Generate insights
        for (const mapping of mappings) {
            if (!mapping.isRelevant) {
                skipped++;
                continue;
            }

            try {
                // Check if insight already exists
                const existing = await prisma.insight.findFirst({
                    where: {
                        businessModelId: businessModel.id,
                        eventId: mapping.event.id,
                    },
                });

                if (existing) {
                    skipped++;
                    continue;
                }

                // Generate summary
                const summary = generateInsightSummary(mapping);

                // Generate LLM explanation (optional)
                let llmExplanation: string | null = null;
                if (useLLM) {
                    llmExplanation = await generateLLMExplanation(mapping);
                }

                // If no LLM explanation, use basic explanation
                if (!llmExplanation) {
                    llmExplanation = generateBasicExplanation(mapping);
                }

                // Store insight
                await prisma.insight.create({
                    data: {
                        businessModelId: businessModel.id,
                        eventId: mapping.event.id,
                        summary,
                        impactDirection: mapping.impactDirection,
                        impactMagnitude: mapping.impactMagnitude,
                        timeHorizon: mapping.timeHorizon,
                        affectedDrivers: mapping.affectedDrivers,
                        causalPath: mapping.causalPath,
                        assumptions: mapping.assumptions,
                        confidenceScore: mapping.confidenceScore,
                        confidenceRationale: mapping.confidenceRationale,
                        llmExplanation,
                    },
                });

                created++;
            } catch (error) {
                console.error('Error generating insight:', error);
                errors++;
            }
        }
    } catch (error) {
        console.error('Error in generateInsightsForBusiness:', error);
        errors++;
    }

    return { created, skipped, errors };
}

/**
 * Generate insights for all active business models
 * WHY: Batch processing for background jobs
 */
export async function generateInsightsForAllBusinesses(
    useLLM: boolean = true
): Promise<{ total: number; created: number; skipped: number; errors: number }> {
    const businessModels = await prisma.businessModel.findMany({
        where: { active: true },
    });

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const bm of businessModels) {
        const result = await generateInsightsForBusiness(bm.id, useLLM);
        totalCreated += result.created;
        totalSkipped += result.skipped;
        totalErrors += result.errors;
    }

    return {
        total: businessModels.length,
        created: totalCreated,
        skipped: totalSkipped,
        errors: totalErrors,
    };
}

/**
 * Generate a concise summary for an insight
 * WHY: One-line summary for dashboard display
 */
export function generateInsightSummary(mapping: CausalMapping): string {
    const { event, impactDirection, impactMagnitude, affectedDrivers } = mapping;

    const directionText =
        impactDirection === 'INCREASE'
            ? 'may increase'
            : impactDirection === 'DECREASE'
                ? 'may decrease'
                : 'may affect';

    const magnitudeText =
        impactMagnitude === 'HIGH'
            ? 'significantly'
            : impactMagnitude === 'MEDIUM'
                ? 'moderately'
                : 'slightly';

    // Simplify driver names
    const driverNames = affectedDrivers.map((d: BusinessDriverType) =>
        d.toLowerCase().replace(/_/g, ' ')
    );

    const eventSummary = event.summary.substring(0, 100);

    return `${eventSummary}... ${magnitudeText} ${directionText} ${driverNames.join(', ')}`;
}

/**
 * Regenerate insights for stale or updated business models
 * WHY: Keep insights fresh as business conditions change
 */
export async function regenerateStaleInsights(
    maxAgeDays: number = 30,
    useLLM: boolean = true
): Promise<{ regenerated: number; errors: number }> {
    const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);

    // Find stale insights
    const staleInsights = await prisma.insight.findMany({
        where: {
            generatedAt: {
                lt: cutoffDate,
            },
            dismissed: false,
        },
        include: {
            businessModel: true,
            event: true,
        },
    });

    let regenerated = 0;
    let errors = 0;

    for (const staleInsight of staleInsights) {
        try {
            const businessModel = BusinessModel.fromPrisma(staleInsight.businessModel);
            const event = Event.fromPrisma(staleInsight.event);

            // Re-run causal mapping
            const mapping = mapEventToBusiness(event, businessModel);

            if (!mapping || !mapping.isRelevant) {
                // Insight is no longer relevant, mark as dismissed
                await prisma.insight.update({
                    where: { id: staleInsight.id },
                    data: { dismissed: true },
                });
                continue;
            }

            // Update insight
            const summary = generateInsightSummary(mapping);
            let llmExplanation: string | null = null;

            if (useLLM) {
                llmExplanation = await generateLLMExplanation(mapping);
            }

            if (!llmExplanation) {
                llmExplanation = generateBasicExplanation(mapping);
            }

            await prisma.insight.update({
                where: { id: staleInsight.id },
                data: {
                    summary,
                    impactDirection: mapping.impactDirection,
                    impactMagnitude: mapping.impactMagnitude,
                    timeHorizon: mapping.timeHorizon,
                    affectedDrivers: mapping.affectedDrivers,
                    causalPath: mapping.causalPath,
                    assumptions: mapping.assumptions,
                    confidenceScore: mapping.confidenceScore,
                    confidenceRationale: mapping.confidenceRationale,
                    llmExplanation,
                    generatedAt: new Date(),
                },
            });

            regenerated++;
        } catch (error) {
            console.error('Error regenerating insight:', error);
            errors++;
        }
    }

    return { regenerated, errors };
}

/**
 * Get changes since last week
 * WHY: "What's new" feature for dashboard
 */
export async function getChangesSinceLastWeek(
    businessModelId: string
): Promise<{
    newInsights: number;
    newHighImpact: number;
    dismissedInsights: number;
}> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [newInsights, newHighImpact, dismissedInsights] = await Promise.all([
        prisma.insight.count({
            where: {
                businessModelId,
                generatedAt: { gte: oneWeekAgo },
                dismissed: false,
            },
        }),
        prisma.insight.count({
            where: {
                businessModelId,
                generatedAt: { gte: oneWeekAgo },
                impactMagnitude: 'HIGH',
                dismissed: false,
            },
        }),
        prisma.insight.count({
            where: {
                businessModelId,
                dismissed: true,
                generatedAt: { gte: oneWeekAgo },
            },
        }),
    ]);

    return {
        newInsights,
        newHighImpact,
        dismissedInsights,
    };
}
