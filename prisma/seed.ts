/**
 * Prisma Seed Script
 * 
 * WHY: Provides sample data for development and testing
 * Run: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { createSaaSTemplate } from '../src/domain/business-templates/saas';
import { EventType, EventSourceType, AffectedEntity } from '../src/domain/models/types';

// Create PostgreSQL connection pool with adapter for Prisma 7
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // Create default user with fixed ID for API access
    const user = await prisma.user.upsert({
        where: { id: 'default-user' },
        update: {},
        create: {
            id: 'default-user',
            email: 'demo@opencausenx.com',
            name: 'Demo User',
        },
    });

    console.log('✅ Created demo user');

    // Create event sources
    const rssSource = await prisma.eventSource.upsert({
        where: { id: 'reuters-business' },
        update: {},
        create: {
            id: 'reuters-business',
            name: 'Reuters Business',
            type: EventSourceType.RSS,
            url: 'https://www.reuters.com/business/rss',
            country: 'GLOBAL',
            active: true,
            reliability: 0.9,
        },
    });

    const economicSource = await prisma.eventSource.upsert({
        where: { id: 'economic-indicators' },
        update: {},
        create: {
            id: 'economic-indicators',
            name: 'Economic Indicators',
            type: EventSourceType.API,
            country: 'US',
            active: true,
            reliability: 0.95,
        },
    });

    console.log('✅ Created event sources');

    // Create sample events
    const now = Date.now();
    const sampleEvents = [
        {
            eventType: EventType.LABOR_MARKET,
            summary: 'US tech sector wages increased 8% year-over-year, driven by high demand for software engineers and competitive talent acquisition.',
            region: 'US',
            timestamp: new Date(now - 7 * 24 * 60 * 60 * 1000),
            affectedEntities: [AffectedEntity.TECH_COMPANIES, AffectedEntity.LABOR_FORCE],
            source: 'Bureau of Labor Statistics via Reuters',
            sourceId: rssSource.id,
            confidenceScore: 0.85,
            metadata: { sector: 'technology', change_percent: 8 },
        },
        {
            eventType: EventType.INFRASTRUCTURE,
            summary: 'Major cloud providers announced 15% price increase for compute instances starting Q2 2024, citing increased energy costs.',
            region: 'GLOBAL',
            timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000),
            affectedEntities: [AffectedEntity.TECH_COMPANIES, AffectedEntity.INFRASTRUCTURE_PROVIDERS],
            source: 'AWS, Azure, GCP announcements',
            sourceId: rssSource.id,
            confidenceScore: 0.95,
            metadata: { price_increase_percent: 15, effective_date: '2024-04-01' },
        },
        {
            eventType: EventType.ECONOMIC_INDICATOR,
            summary: 'US GDP growth slowed to 1.8% in Q4 2023, below expectations of 2.2%, indicating potential economic headwinds.',
            region: 'US',
            timestamp: new Date(now - 10 * 24 * 60 * 60 * 1000),
            affectedEntities: [AffectedEntity.ALL],
            source: 'Bureau of Economic Analysis',
            sourceId: economicSource.id,
            confidenceScore: 0.95,
            metadata: { gdp_growth_rate: 1.8, expected: 2.2, quarter: 'Q4 2023' },
        },
        {
            eventType: EventType.REGULATION_CHANGE,
            summary: 'EU announces stricter data privacy regulations requiring additional compliance measures for software companies operating in Europe.',
            region: 'EU',
            timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000),
            affectedEntities: [AffectedEntity.TECH_COMPANIES],
            source: 'European Commission',
            sourceId: rssSource.id,
            confidenceScore: 0.8,
            metadata: { effective_date: '2024-07-01', compliance_deadline: '2024-12-31' },
        },
    ];

    for (const eventData of sampleEvents) {
        await prisma.event.create({ data: eventData });
    }

    console.log(`✅ Created ${sampleEvents.length} sample events`);

    // Create sample business model
    const template = createSaaSTemplate(
        user.id,
        'Acme SaaS Company',
        ['US', 'EU'],
        ['US', 'EU', 'CA']
    );

    await prisma.businessModel.create({
        data: {
            userId: user.id,
            name: template.name,
            industry: template.industry,
            revenueDrivers: template.revenueDrivers,
            costDrivers: template.costDrivers,
            sensitivities: template.sensitivities,
            operatingRegions: template.operatingRegions,
            customerRegions: template.customerRegions,
            active: template.active,
        },
    });

    console.log('✅ Created sample business model');

    console.log('\n🎉 Seeding complete!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:3000');
    console.log('3. Click "Generate Insights" to create insights from sample events');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
