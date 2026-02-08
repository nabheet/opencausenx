/**
 * API Route: Get recent events
 * GET /api/events?limit=20&region=US
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Event } from '@/domain/models/Event';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '20');
        const region = searchParams.get('region');

        const where: Prisma.EventWhereInput = {};
        if (region) {
            where.region = region;
        }

        const events = await prisma.event.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: limit,
        });

        const eventModels = events.map((e) => Event.fromPrisma(e));

        return NextResponse.json({ events: eventModels });
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json(
            { error: 'Failed to fetch events' },
            { status: 500 }
        );
    }
}
