/**
 * Job Definitions
 * 
 * WHY: Concrete job implementations that run periodically
 */

import { prisma } from '@/lib/prisma';
import {
    fetchRSSFeed,
    DEFAULT_RSS_FEEDS,
} from '../event-ingestion/rss-fetcher';
import {
    fetchEconomicIndicators,
} from '../event-ingestion/economic-data';
import {
    batchNormalizeAndSave,
    normalizeRSSItem,
    normalizeEconomicIndicator,
} from '../event-ingestion/normalizer';
import { EventSourceType } from '@/domain/models/types';

/**
 * Fetch and ingest events from all sources
 * WHY: Keep event database up-to-date with latest world events
 */
export async function fetchAndIngestEvents(): Promise<void> {
    console.log('Starting event ingestion...');

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Fetch from RSS feeds
    for (const feed of DEFAULT_RSS_FEEDS) {
        try {
            console.log(`Fetching RSS feed: ${feed.name}`);

            // Get or create event source
            let eventSource = await prisma.eventSource.findFirst({
                where: { url: feed.url },
            });

            if (!eventSource) {
                eventSource = await prisma.eventSource.create({
                    data: {
                        name: feed.name,
                        type: EventSourceType.RSS,
                        url: feed.url,
                        country: feed.region,
                        active: true,
                        reliability: 0.7, // Default reliability for RSS feeds
                    },
                });
            }

            // Fetch RSS items
            const items = await fetchRSSFeed(feed.url);
            console.log(`Fetched ${items.length} items from ${feed.name}`);

            // Normalize events
            const normalizedEvents = await Promise.all(
                items.map((item) =>
                    normalizeRSSItem(item, feed, eventSource!.reliability)
                )
            );

            // Save to database
            const result = await batchNormalizeAndSave(normalizedEvents);
            totalCreated += result.created;
            totalSkipped += result.skipped;
            totalErrors += result.errors;

            console.log(
                `Processed ${feed.name}: ${result.created} created, ${result.skipped} skipped, ${result.errors} errors`
            );
        } catch (error) {
            console.error(`Error fetching RSS feed ${feed.name}:`, error);
            totalErrors++;
        }
    }

    // Fetch economic indicators
    try {
        console.log('Fetching economic indicators...');

        // Get or create economic data source
        let economicSource = await prisma.eventSource.findFirst({
            where: { name: 'Economic Indicators' },
        });

        if (!economicSource) {
            economicSource = await prisma.eventSource.create({
                data: {
                    name: 'Economic Indicators',
                    type: EventSourceType.API,
                    country: 'US',
                    active: true,
                    reliability: 0.95, // Economic data is highly reliable
                },
            });
        }

        const indicators = await fetchEconomicIndicators('US');
        console.log(`Fetched ${indicators.length} economic indicators`);

        const normalizedEvents = indicators.map((indicator) =>
            normalizeEconomicIndicator(indicator, economicSource!.reliability)
        );

        const result = await batchNormalizeAndSave(normalizedEvents);
        totalCreated += result.created;
        totalSkipped += result.skipped;
        totalErrors += result.errors;

        console.log(
            `Processed economic indicators: ${result.created} created, ${result.skipped} skipped, ${result.errors} errors`
        );
    } catch (error) {
        console.error('Error fetching economic indicators:', error);
        totalErrors++;
    }

    console.log(
        `Event ingestion complete: ${totalCreated} created, ${totalSkipped} skipped, ${totalErrors} errors`
    );
}

/**
 * Cleanup old events
 * WHY: Prevent database from growing indefinitely
 */
export async function cleanupOldEvents(): Promise<void> {
    const retentionDays = 180; // 6 months
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    console.log(`Cleaning up events older than ${cutoffDate.toISOString()}`);

    const result = await prisma.event.deleteMany({
        where: {
            timestamp: {
                lt: cutoffDate,
            },
        },
    });

    console.log(`Deleted ${result.count} old events`);
}

/**
 * Cleanup dismissed insights
 * WHY: Keep insights table lean
 */
export async function cleanupDismissedInsights(): Promise<void> {
    const retentionDays = 90; // 3 months
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    console.log(
        `Cleaning up dismissed insights older than ${cutoffDate.toISOString()}`
    );

    const result = await prisma.insight.deleteMany({
        where: {
            dismissed: true,
            generatedAt: {
                lt: cutoffDate,
            },
        },
    });

    console.log(`Deleted ${result.count} dismissed insights`);
}
