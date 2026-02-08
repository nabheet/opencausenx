/**
 * Event Domain Model
 * 
 * WHY: Normalizes external events into a consistent structure for causal analysis.
 * All events, regardless of source, are transformed into this model.
 */

import { EventType, AffectedEntity, EventModel } from './types';
import { Event as PrismaEvent, EventSource as PrismaEventSource } from '@prisma/client';

export class Event implements EventModel {
    id: string;
    eventType: EventType;
    summary: string;
    region: string;
    timestamp: Date;
    affectedEntities: AffectedEntity[];
    source: string;
    sourceId?: string;
    confidenceScore: number;
    metadata?: Record<string, unknown>;
    createdAt: Date;

    constructor(data: EventModel) {
        this.id = data.id;
        this.eventType = data.eventType;
        this.summary = data.summary;
        this.region = data.region;
        this.timestamp = data.timestamp;
        this.affectedEntities = data.affectedEntities;
        this.source = data.source;
        this.sourceId = data.sourceId;
        this.confidenceScore = data.confidenceScore;
        this.metadata = data.metadata;
        this.createdAt = data.createdAt;
    }

    /**
     * Create Event from Prisma entity
     * WHY: Transform database entity to domain model
     */
    static fromPrisma(prismaEvent: PrismaEvent): Event {
        return new Event({
            id: prismaEvent.id,
            eventType: prismaEvent.eventType as EventType,
            summary: prismaEvent.summary,
            region: prismaEvent.region,
            timestamp: prismaEvent.timestamp,
            affectedEntities: prismaEvent.affectedEntities as AffectedEntity[],
            source: prismaEvent.source,
            sourceId: prismaEvent.sourceId || undefined,
            confidenceScore: prismaEvent.confidenceScore,
            metadata: prismaEvent.metadata as Record<string, unknown> | undefined,
            createdAt: prismaEvent.createdAt,
        });
    }

    /**
     * Calculate confidence score based on source reliability and event clarity
     * WHY: Confidence based on objective factors, not ML predictions
     */
    static calculateConfidence(
        sourceReliability: number,
        hasSpecificRegion: boolean,
        hasTimestamp: boolean,
        summaryLength: number
    ): number {
        // Start with source reliability (0-1)
        let confidence = sourceReliability;

        // Penalty for vague geographic information
        if (!hasSpecificRegion) {
            confidence *= 0.8;
        }

        // Penalty for missing or vague timestamp
        if (!hasTimestamp) {
            confidence *= 0.7;
        }

        // Penalty for very short or very long summaries (indicates low quality)
        if (summaryLength < 50 || summaryLength > 1000) {
            confidence *= 0.9;
        }

        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Check if event is relevant to a geographic region
     * WHY: Filter events that don't affect business locations
     */
    isRelevantToRegion(regions: string[]): boolean {
        return regions.includes(this.region) || this.region === 'GLOBAL';
    }

    /**
     * Check if event is recent (within last N days)
     * WHY: Old events may not be relevant for current insights
     */
    isRecent(days: number = 90): boolean {
        const ageInDays = (Date.now() - this.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        return ageInDays <= days;
    }

    /**
     * Get event age in days
     */
    getAgeInDays(): number {
        return Math.floor((Date.now() - this.timestamp.getTime()) / (1000 * 60 * 60 * 24));
    }
}
