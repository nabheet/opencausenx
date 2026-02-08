/**
 * API Route: Get specific insight by ID
 * GET /api/insights/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Insight } from '@/domain/models/Insight';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const insight = await prisma.insight.findUnique({
            where: { id },
            include: {
                event: true,
                businessModel: true,
            },
        });

        if (!insight) {
            return NextResponse.json(
                { error: 'Insight not found' },
                { status: 404 }
            );
        }

        const insightModel = Insight.fromPrisma(insight);

        return NextResponse.json({
            insight: {
                ...insightModel,
                event: insight.event,
                businessModel: insight.businessModel,
            },
        });
    } catch (error) {
        console.error('Error fetching insight:', error);
        return NextResponse.json(
            { error: 'Failed to fetch insight' },
            { status: 500 }
        );
    }
}
