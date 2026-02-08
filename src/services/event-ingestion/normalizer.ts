/**
 * Event Normalizer
 * 
 * WHY: Transforms raw data from various sources (RSS, APIs, manual input) into
 * our unified Event schema. This normalization is critical for consistent causal mapping.
 */

import { Event } from '@/domain/models/Event';
import { EventType, AffectedEntity } from '@/domain/models/types';
import { prisma } from '@/lib/prisma';
import {
    RSSItem,
    RSSFeed,
    classifyEventType,
    inferAffectedEntities,
    extractRegion,
} from './rss-fetcher';
import {
    EconomicIndicator,
    economicIndicatorToSummary,
    getAffectedEntitiesForIndicator,
} from './economic-data';

export interface NormalizedEventInput {
    eventType: EventType;
    summary: string;
    region: string;
    timestamp: Date;
    affectedEntities: AffectedEntity[];
    source: string;
    sourceId?: string;
    confidenceScore: number;
    metadata?: Record<string, unknown>;
}

/**
 * Normalize RSS item to Event
 * WHY: Convert unstructured news into structured, analyzable events
 */
export async function normalizeRSSItem(
    item: RSSItem,
    feed: RSSFeed,
    sourceReliability: number = 0.7
): Promise<NormalizedEventInput> {
    // Step 1: Classify event type
    const eventType = classifyEventType(item);

    // Step 2: Extract region
    const region = extractRegion(item, feed.region);

    // Step 3: Infer affected entities
    const affectedEntities = inferAffectedEntities(item, eventType);

    // Step 4: Build summary
    // WHY: Combine title and description, but keep it concise
    const summary = item.description
        ? `${item.title}. ${item.description.substring(0, 500)}`
        : item.title;

    // Step 5: Calculate confidence
    // WHY: Based on source reliability, region specificity, and content length
    const confidenceScore = Event.calculateConfidence(
        sourceReliability,
        region !== 'GLOBAL',
        true, // RSS items always have timestamps
        summary.length
    );

    return {
        eventType,
        summary,
        region,
        timestamp: item.pubDate,
        affectedEntities,
        source: `${feed.name} (${item.link})`,
        sourceId: feed.sourceId,
        confidenceScore,
        metadata: {
            originalTitle: item.title,
            originalDescription: item.description,
            link: item.link,
            categories: item.categories,
            feedUrl: feed.url,
        },
    };
}

/**
 * Normalize economic indicator to Event
 * WHY: Treat economic data as events for unified processing
 */
export function normalizeEconomicIndicator(
    indicator: EconomicIndicator,
    sourceReliability: number = 0.9 // Economic indicators are highly reliable
): NormalizedEventInput {
    const summary = economicIndicatorToSummary(indicator);
    const affectedEntities = getAffectedEntitiesForIndicator(indicator.indicator);

    // WHY: Economic indicators have high confidence (official data)
    const confidenceScore = sourceReliability;

    return {
        eventType: EventType.ECONOMIC_INDICATOR,
        summary,
        region: indicator.region,
        timestamp: indicator.timestamp,
        affectedEntities,
        source: indicator.source,
        confidenceScore,
        metadata: {
            indicator: indicator.indicator,
            value: indicator.value,
            previousValue: indicator.previousValue,
            unit: indicator.unit,
        },
    };
}

/**
 * Save normalized events to database
 * WHY: Persist events for later causal analysis
 */
export async function saveEvents(
    events: NormalizedEventInput[]
): Promise<{ created: number; skipped: number; errors: number }> {
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const eventInput of events) {
        try {
            // Check for duplicates
            // WHY: Avoid processing the same event multiple times
            const existing = await prisma.event.findFirst({
                where: {
                    summary: eventInput.summary,
                    timestamp: eventInput.timestamp,
                },
            });

            if (existing) {
                skipped++;
                continue;
            }

            // Create event
            await prisma.event.create({
                data: {
                    eventType: eventInput.eventType,
                    summary: eventInput.summary,
                    region: eventInput.region,
                    timestamp: eventInput.timestamp,
                    affectedEntities: eventInput.affectedEntities,
                    source: eventInput.source,
                    sourceId: eventInput.sourceId,
                    confidenceScore: eventInput.confidenceScore,
                    metadata: (eventInput.metadata || {}) as any,
                },
            });

            created++;
        } catch (error) {
            console.error('Error saving event:', error);
            errors++;
        }
    }

    return { created, skipped, errors };
}

/**
 * Validate normalized event
 * WHY: Ensure data quality before saving
 */
export function validateNormalizedEvent(
    event: NormalizedEventInput
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!event.summary || event.summary.length < 10) {
        errors.push('Summary is too short or missing');
    }

    if (!event.region || event.region.length < 2) {
        errors.push('Region is invalid');
    }

    if (!event.timestamp || isNaN(event.timestamp.getTime())) {
        errors.push('Timestamp is invalid');
    }

    if (!event.affectedEntities || event.affectedEntities.length === 0) {
        errors.push('No affected entities specified');
    }

    if (event.confidenceScore < 0 || event.confidenceScore > 1) {
        errors.push('Confidence score must be between 0 and 1');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Batch process multiple events with validation
 * WHY: Efficient processing with error handling
 */
export async function batchNormalizeAndSave(
    events: NormalizedEventInput[]
): Promise<{
    created: number;
    skipped: number;
    errors: number;
    validationErrors: string[];
}> {
    const validEvents: NormalizedEventInput[] = [];
    const validationErrors: string[] = [];

    // Validate all events first
    for (const event of events) {
        const validation = validateNormalizedEvent(event);
        if (validation.valid) {
            validEvents.push(event);
        } else {
            validationErrors.push(
                `Event "${event.summary.substring(0, 50)}...": ${validation.errors.join(', ')}`
            );
        }
    }

    // Save valid events
    const results = await saveEvents(validEvents);

    return {
        ...results,
        validationErrors,
    };
}
