/**
 * API Route: Get insights for a business model
 * GET /api/insights?businessModelId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Insight } from '@/domain/models/Insight';
import { Insight as PrismaInsight, Event as PrismaEvent } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const businessModelId = searchParams.get('businessModelId');

        if (!businessModelId) {
            return NextResponse.json(
                { error: 'businessModelId is required' },
                { status: 400 }
            );
        }

        // Fetch insights
        const insights = await prisma.insight.findMany({
            where: {
                businessModelId,
                dismissed: false,
            },
            include: {
                event: true,
            },
            orderBy: [
                { impactMagnitude: 'desc' },
                { confidenceScore: 'desc' },
                { generatedAt: 'desc' },
            ],
            take: 50, // Limit to 50 most relevant
        });

        // Transform to domain models
        const insightModels = insights.map((i: PrismaInsight & { event: PrismaEvent | null }) => ({
            ...Insight.fromPrisma(i),
            event: i.event,
        }));

        return NextResponse.json({ insights: insightModels });
    } catch (error) {
        console.error('Error fetching insights:', error);
        return NextResponse.json(
            { error: 'Failed to fetch insights' },
            { status: 500 }
        );
    }
}
