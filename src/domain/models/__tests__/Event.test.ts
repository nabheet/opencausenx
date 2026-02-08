/**
 * Tests for Event domain model
 */

import { Event } from '../Event';
import { EventType, AffectedEntity, EventModel } from '../types';

describe('Event', () => {
    const validEventData: EventModel = {
        id: 'event-123',
        eventType: EventType.LABOR_MARKET,
        summary: 'Tech worker wages increase by 15% in major metros',
        region: 'US',
        timestamp: new Date('2024-01-15'),
        affectedEntities: [AffectedEntity.TECH_COMPANIES, AffectedEntity.LABOR_FORCE],
        source: 'RSS',
        sourceId: 'source-123',
        confidenceScore: 0.85,
        metadata: { url: 'https://example.com/article' },
        createdAt: new Date('2024-01-15'),
    };

    describe('constructor', () => {
        it('should create a valid Event instance', () => {
            const event = new Event(validEventData);

            expect(event.id).toBe('event-123');
            expect(event.eventType).toBe(EventType.LABOR_MARKET);
            expect(event.summary).toContain('wages increase');
            expect(event.region).toBe('US');
            expect(event.confidenceScore).toBe(0.85);
        });
    });

    describe('calculateConfidence', () => {
        it('should calculate high confidence for complete, reliable event', () => {
            const confidence = Event.calculateConfidence(
                0.9,  // high source reliability
                true, // has specific region
                true, // has timestamp
                150   // good summary length
            );

            expect(confidence).toBeGreaterThan(0.8);
        });

        it('should penalize missing region', () => {
            const withRegion = Event.calculateConfidence(0.9, true, true, 150);
            const withoutRegion = Event.calculateConfidence(0.9, false, true, 150);

            expect(withoutRegion).toBeLessThan(withRegion);
        });

        it('should penalize missing timestamp', () => {
            const withTimestamp = Event.calculateConfidence(0.9, true, true, 150);
            const withoutTimestamp = Event.calculateConfidence(0.9, true, false, 150);

            expect(withoutTimestamp).toBeLessThan(withTimestamp);
        });

        it('should penalize very short summaries', () => {
            const goodLength = Event.calculateConfidence(0.9, true, true, 150);
            const tooShort = Event.calculateConfidence(0.9, true, true, 20);

            expect(tooShort).toBeLessThan(goodLength);
        });

        it('should penalize very long summaries', () => {
            const goodLength = Event.calculateConfidence(0.9, true, true, 150);
            const tooLong = Event.calculateConfidence(0.9, true, true, 1500);

            expect(tooLong).toBeLessThan(goodLength);
        });

        it('should never return confidence above 1 or below 0', () => {
            const confidence = Event.calculateConfidence(1.5, true, true, 150);
            expect(confidence).toBeLessThanOrEqual(1);
            expect(confidence).toBeGreaterThanOrEqual(0);
        });
    });

    describe('isRelevantToRegion', () => {
        const event = new Event(validEventData);

        it('should return true for matching region', () => {
            expect(event.isRelevantToRegion(['US', 'EU'])).toBe(true);
        });

        it('should return false for non-matching region', () => {
            expect(event.isRelevantToRegion(['EU', 'APAC'])).toBe(false);
        });

        it('should handle global events', () => {
            const globalEvent = new Event({
                ...validEventData,
                region: 'GLOBAL',
            });

            expect(globalEvent.isRelevantToRegion(['US'])).toBe(true);
        });
    });

    describe('isRecent', () => {
        it('should return true for recent event', () => {
            const recentEvent = new Event({
                ...validEventData,
                timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            });

            expect(recentEvent.isRecent(30)).toBe(true);
        });

        it('should return false for old event', () => {
            const oldEvent = new Event({
                ...validEventData,
                timestamp: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
            });

            expect(oldEvent.isRecent(30)).toBe(false);
        });

        it('should use default 90 days if not specified', () => {
            const event = new Event({
                ...validEventData,
                timestamp: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000), // 80 days ago
            });

            expect(event.isRecent()).toBe(true);
        });
    });

    describe('getAgeInDays', () => {
        it('should calculate correct age in days', () => {
            const event = new Event({
                ...validEventData,
                timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
            });

            const age = event.getAgeInDays();
            expect(age).toBeGreaterThanOrEqual(14);
            expect(age).toBeLessThanOrEqual(16);
        });

        it('should return 0 for today', () => {
            const event = new Event({
                ...validEventData,
                timestamp: new Date(),
            });

            expect(event.getAgeInDays()).toBe(0);
        });
    });
});
