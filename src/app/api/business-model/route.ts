/**
 * API Route: Business Model CRUD
 * GET /api/business-model - Get all business models for user
 * POST /api/business-model - Create new business model
 * PUT /api/business-model - Update business model
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BusinessModel } from '@/domain/models/BusinessModel';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId') || 'default-user'; // MVP: stub auth

        const businessModels = await prisma.businessModel.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        const models = businessModels.map((bm: any) => BusinessModel.fromPrisma(bm));

        return NextResponse.json({ businessModels: models });
    } catch (error) {
        console.error('Error fetching business models:', error);
        return NextResponse.json(
            { error: 'Failed to fetch business models' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const userId = body.userId || 'default-user'; // MVP: stub auth

        const businessModel = await prisma.businessModel.create({
            data: {
                userId,
                name: body.name,
                industry: body.industry,
                revenueDrivers: body.revenueDrivers,
                costDrivers: body.costDrivers,
                sensitivities: body.sensitivities,
                operatingRegions: body.operatingRegions,
                customerRegions: body.customerRegions,
                active: true,
            },
        });

        return NextResponse.json({
            success: true,
            businessModel: BusinessModel.fromPrisma(businessModel),
        });
    } catch (error) {
        console.error('Error creating business model:', error);
        return NextResponse.json(
            { error: 'Failed to create business model' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Business model ID is required' },
                { status: 400 }
            );
        }

        const businessModel = await prisma.businessModel.update({
            where: { id },
            data: updates,
        });

        return NextResponse.json({
            success: true,
            businessModel: BusinessModel.fromPrisma(businessModel),
        });
    } catch (error) {
        console.error('Error updating business model:', error);
        return NextResponse.json(
            { error: 'Failed to update business model' },
            { status: 500 }
        );
    }
}
