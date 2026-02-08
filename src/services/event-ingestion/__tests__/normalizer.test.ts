/**
 * Tests for Event Normalizer service
 */

import { normalizeRSSItem, normalizeEconomicIndicator } from '../normalizer';
import { RSSItem, RSSFeed } from '../rss-fetcher';
import { EconomicIndicator } from '../economic-data';
import { EventType, AffectedEntity } from '@/domain/models/types';

// Mock the external modules
jest.mock('../rss-fetcher', () => ({
    classifyEventType: jest.fn(() => EventType.ECONOMIC_INDICATOR),
    extractRegion: jest.fn(() => 'US'),
    inferAffectedEntities: jest.fn(() => [AffectedEntity.TECH_COMPANIES]),
}));

jest.mock('../economic-data', () => ({
    economicIndicatorToSummary: jest.fn(() => 'GDP increased by 2.5%'),
    getAffectedEntitiesForIndicator: jest.fn(() => [AffectedEntity.ALL]),
}));

describe('Event Normalizer', () => {
    describe('normalizeRSSItem', () => {
        const mockFeed: RSSFeed = {
            name: 'Test Feed',
            url: 'https://example.com/rss',
            region: 'US',
            sourceId: 'test-source',
        };

        const mockItem: RSSItem = {
            title: 'Tech wages increase by 15%',
            description: 'Technology sector sees significant wage growth amid labor shortage.',
            link: 'https://example.com/article',
            pubDate: new Date('2024-01-15'),
            categories: ['economy', 'technology'],
        };

        it('should normalize RSS item to event input', async () => {
            const normalized = await normalizeRSSItem(mockItem, mockFeed, 0.8);

            expect(normalized.eventType).toBe(EventType.ECONOMIC_INDICATOR);
            expect(normalized.summary).toContain('Tech wages increase');
            expect(normalized.region).toBe('US');
            expect(normalized.timestamp).toEqual(mockItem.pubDate);
            expect(normalized.affectedEntities).toContain(AffectedEntity.TECH_COMPANIES);
        });

        it('should include source information', async () => {
            const normalized = await normalizeRSSItem(mockItem, mockFeed);

            expect(normalized.source).toContain('Test Feed');
            expect(normalized.source).toContain(mockItem.link);
            expect(normalized.sourceId).toBe('test-source');
        });

        it('should include metadata', async () => {
            const normalized = await normalizeRSSItem(mockItem, mockFeed);

            expect(normalized.metadata).toBeDefined();
            expect(normalized.metadata!.originalTitle).toBe(mockItem.title);
            expect(normalized.metadata!.link).toBe(mockItem.link);
            expect(normalized.metadata!.categories).toEqual(mockItem.categories);
        });

        it('should combine title and description in summary', async () => {
            const normalized = await normalizeRSSItem(mockItem, mockFeed);

            expect(normalized.summary).toContain(mockItem.title);
            expect(normalized.summary).toContain('Technology sector sees');
        });

        it('should handle items without description', async () => {
            const itemNoDesc = { ...mockItem, description: undefined };
            const normalized = await normalizeRSSItem(itemNoDesc, mockFeed);

            expect(normalized.summary).toBe(mockItem.title);
        });

        it('should calculate confidence score', async () => {
            const normalized = await normalizeRSSItem(mockItem, mockFeed, 0.85);

            expect(normalized.confidenceScore).toBeGreaterThan(0);
            expect(normalized.confidenceScore).toBeLessThanOrEqual(1);
        });

        it('should respect source reliability parameter', async () => {
            const highReliability = await normalizeRSSItem(mockItem, mockFeed, 0.95);
            const lowReliability = await normalizeRSSItem(mockItem, mockFeed, 0.5);

            expect(highReliability.confidenceScore).toBeGreaterThan(lowReliability.confidenceScore);
        });

        it('should truncate very long descriptions', async () => {
            const longDesc = 'A'.repeat(1000);
            const itemLongDesc = { ...mockItem, description: longDesc };
            const normalized = await normalizeRSSItem(itemLongDesc, mockFeed);

            expect(normalized.summary.length).toBeLessThan(600);
        });
    });

    describe('normalizeEconomicIndicator', () => {
        const mockIndicator: EconomicIndicator = {
            indicator: 'GDP',
            value: 2.5,
            period: '2024-Q1',
            region: 'US',
            timestamp: new Date('2024-04-15'),
            source: 'Economic Data Release',
        };

        it('should normalize economic indicator to event input', () => {
            const normalized = normalizeEconomicIndicator(mockIndicator);

            expect(normalized.eventType).toBe(EventType.ECONOMIC_INDICATOR);
            expect(normalized.summary).toBe('GDP increased by 2.5%');
            expect(normalized.region).toBe('US');
            expect(normalized.timestamp).toEqual(mockIndicator.timestamp);
        });

        it('should have high default confidence for economic data', () => {
            const normalized = normalizeEconomicIndicator(mockIndicator);

            expect(normalized.confidenceScore).toBeGreaterThanOrEqual(0.9);
        });

        it('should respect custom source reliability', () => {
            const normalized = normalizeEconomicIndicator(mockIndicator, 0.95);

            expect(normalized.confidenceScore).toBe(0.95);
        });

        it('should infer affected entities', () => {
            const normalized = normalizeEconomicIndicator(mockIndicator);

            expect(normalized.affectedEntities).toContain(AffectedEntity.ALL);
        });

        it('should include source information', () => {
            const normalized = normalizeEconomicIndicator(mockIndicator);

            expect(normalized.source).toBeDefined();
            expect(normalized.source).toContain('Economic');
        });
    });
});
