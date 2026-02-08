/**
 * RSS Feed Fetcher
 * 
 * WHY: Ingests world events from RSS feeds. This is a simple, reliable way to
 * get structured news data without complex scraping or expensive API subscriptions.
 */

import { EventType, AffectedEntity } from '@/domain/models/types';

export interface RSSItem {
    title: string;
    description: string;
    link: string;
    pubDate: Date;
    categories?: string[];
}

export interface RSSFeed {
    sourceId: string;
    url: string;
    name: string;
    region: string;
}

/**
 * Curated RSS feeds for different event types
 * WHY: Start with reliable, well-structured sources
 */
export const DEFAULT_RSS_FEEDS: RSSFeed[] = [
    {
        sourceId: 'reuters-business',
        url: 'https://www.reuters.com/business/rss',
        name: 'Reuters Business',
        region: 'GLOBAL',
    },
    {
        sourceId: 'ft-economics',
        url: 'https://www.ft.com/economics?format=rss',
        name: 'Financial Times Economics',
        region: 'GLOBAL',
    },
    // More feeds can be added as needed
];

/**
 * Parse RSS feed and extract items
 * 
 * WHY: For MVP, we'll use a simple fetch + parse approach.
 * In production, consider using a library like `rss-parser`.
 */
export async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'OpenCausenx/1.0',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
        }

        const xml = await response.text();
        return parseRSS(xml);
    } catch (error) {
        console.error(`Error fetching RSS feed from ${url}:`, error);
        return [];
    }
}

/**
 * Parse RSS XML into structured items
 * WHY: Simple XML parsing for RSS 2.0 format
 */
function parseRSS(xml: string): RSSItem[] {
    const items: RSSItem[] = [];

    // Simple regex-based parsing (good enough for MVP)
    // In production, use proper XML parser
    const itemRegex = /<item>(.*?)<\/item>/gs;
    const matches = xml.matchAll(itemRegex);

    for (const match of matches) {
        const itemXml = match[1];

        const title = extractTag(itemXml, 'title');
        const description = extractTag(itemXml, 'description');
        const link = extractTag(itemXml, 'link');
        const pubDate = extractTag(itemXml, 'pubDate');
        const categories = extractAllTags(itemXml, 'category');

        if (title && description && link) {
            items.push({
                title,
                description: cleanHTML(description),
                link,
                pubDate: pubDate ? new Date(pubDate) : new Date(),
                categories,
            });
        }
    }

    return items;
}

/**
 * Extract text content from XML tag
 */
function extractTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 's');
    const match = xml.match(regex);
    return match ? cleanHTML(match[1].trim()) : '';
}

/**
 * Extract all occurrences of a tag
 */
function extractAllTags(xml: string, tag: string): string[] {
    const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'gs');
    const matches = xml.matchAll(regex);
    return Array.from(matches).map((m) => cleanHTML(m[1].trim()));
}

/**
 * Remove HTML tags and decode entities
 * WHY: RSS descriptions often contain HTML
 */
function cleanHTML(str: string): string {
    return str
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#39;/g, "'")
        .trim();
}

/**
 * Classify RSS item into event type
 * WHY: Deterministic classification based on keywords
 * This is NOT ML - it's explicit keyword matching
 */
export function classifyEventType(item: RSSItem): EventType {
    const text = `${item.title} ${item.description} ${item.categories?.join(' ')}`.toLowerCase();

    // WHY: Order matters - check more specific patterns first
    if (
        text.includes('regulation') ||
        text.includes('law') ||
        text.includes('compliance') ||
        text.includes('policy change') ||
        text.includes('legislation')
    ) {
        return EventType.REGULATION_CHANGE;
    }

    if (
        text.includes('gdp') ||
        text.includes('inflation') ||
        text.includes('interest rate') ||
        text.includes('unemployment') ||
        text.includes('economic indicator')
    ) {
        return EventType.ECONOMIC_INDICATOR;
    }

    if (
        text.includes('wage') ||
        text.includes('labor market') ||
        text.includes('hiring') ||
        text.includes('layoff') ||
        text.includes('talent')
    ) {
        return EventType.LABOR_MARKET;
    }

    if (
        text.includes('cloud cost') ||
        text.includes('aws') ||
        text.includes('azure') ||
        text.includes('infrastructure') ||
        text.includes('energy cost')
    ) {
        return EventType.INFRASTRUCTURE;
    }

    if (
        text.includes('currency') ||
        text.includes('dollar') ||
        text.includes('euro') ||
        text.includes('exchange rate') ||
        text.includes('forex')
    ) {
        return EventType.CURRENCY;
    }

    if (
        text.includes('war') ||
        text.includes('sanction') ||
        text.includes('trade war') ||
        text.includes('geopolitical') ||
        text.includes('conflict')
    ) {
        return EventType.GEOPOLITICAL;
    }

    if (
        text.includes('pandemic') ||
        text.includes('disaster') ||
        text.includes('earthquake') ||
        text.includes('flood')
    ) {
        return EventType.DISASTER;
    }

    // Default to market shift
    return EventType.MARKET_SHIFT;
}

/**
 * Infer affected entities from RSS item
 * WHY: Helps filter events that are relevant to businesses
 */
export function inferAffectedEntities(item: RSSItem, eventType: EventType): AffectedEntity[] {
    const text = `${item.title} ${item.description}`.toLowerCase();
    const entities = new Set<AffectedEntity>();

    if (text.includes('tech') || text.includes('software') || text.includes('saas')) {
        entities.add(AffectedEntity.TECH_COMPANIES);
    }

    if (
        text.includes('worker') ||
        text.includes('employee') ||
        text.includes('labor') ||
        eventType === EventType.LABOR_MARKET
    ) {
        entities.add(AffectedEntity.LABOR_FORCE);
    }

    if (text.includes('consumer') || text.includes('customer')) {
        entities.add(AffectedEntity.CONSUMERS);
    }

    if (
        text.includes('cloud') ||
        text.includes('infrastructure') ||
        eventType === EventType.INFRASTRUCTURE
    ) {
        entities.add(AffectedEntity.INFRASTRUCTURE_PROVIDERS);
    }

    // If no specific entities, mark as affecting all
    if (entities.size === 0) {
        entities.add(AffectedEntity.ALL);
    }

    return Array.from(entities);
}

/**
 * Extract region from RSS item
 * WHY: Geographic filtering is critical for relevance
 */
export function extractRegion(item: RSSItem, feedRegion: string): string {
    const text = `${item.title} ${item.description}`.toLowerCase();

    // Country-specific keywords
    const countryMapping: Record<string, string> = {
        'united states': 'US',
        'u.s.': 'US',
        'america': 'US',
        'uk': 'GB',
        'britain': 'GB',
        'united kingdom': 'GB',
        'germany': 'DE',
        'france': 'FR',
        'china': 'CN',
        'japan': 'JP',
        'india': 'IN',
        'canada': 'CA',
        'australia': 'AU',
    };

    for (const [keyword, code] of Object.entries(countryMapping)) {
        if (text.includes(keyword)) {
            return code;
        }
    }

    // Fall back to feed's default region
    return feedRegion;
}
