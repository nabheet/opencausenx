/**
 * API Route: Generate insights
 * POST /api/insights/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateInsightsForBusiness } from '@/services/insight-engine/generator';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { businessModelId, useLLM = true } = body;

        if (!businessModelId) {
            return NextResponse.json(
                { error: 'businessModelId is required' },
                { status: 400 }
            );
        }

        const result = await generateInsightsForBusiness(businessModelId, useLLM);

        return NextResponse.json({
            success: true,
            result,
        });
    } catch (error) {
        console.error('Error generating insights:', error);
        return NextResponse.json(
            { error: 'Failed to generate insights' },
            { status: 500 }
        );
    }
}
