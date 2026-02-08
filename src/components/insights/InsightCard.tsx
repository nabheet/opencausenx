/**
 * Insight Card Component
 * 
 * WHY: Display insight summary in a card format
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ConfidenceIndicator } from './ConfidenceIndicator';

interface InsightCardProps {
    insight: {
        id: string;
        summary: string;
        impactDirection: string;
        impactMagnitude: string;
        timeHorizon: string;
        confidenceScore: number;
        confidenceRationale: string;
        generatedAt: Date | string;
    };
}

export function InsightCard({ insight }: InsightCardProps) {
    const getImpactIcon = (direction: string) => {
        if (direction === 'INCREASE') return '↑';
        if (direction === 'DECREASE') return '↓';
        return '↔';
    };

    const getImpactColor = (direction: string, magnitude: string) => {
        if (magnitude === 'HIGH') {
            return direction === 'INCREASE'
                ? 'text-red-600 bg-red-50'
                : 'text-green-600 bg-green-50';
        }
        if (magnitude === 'MEDIUM') {
            return direction === 'INCREASE'
                ? 'text-orange-600 bg-orange-50'
                : 'text-blue-600 bg-blue-50';
        }
        return 'text-gray-600 bg-gray-50';
    };

    const getHorizonLabel = (horizon: string) => {
        if (horizon === 'SHORT') return '0-3 months';
        if (horizon === 'MEDIUM') return '3-12 months';
        return '12+ months';
    };

    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString();
    };

    return (
        <Link href={`/insights/${insight.id}`}>
            <div className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <span
                            className={`px-3 py-1 rounded-full font-semibold ${getImpactColor(
                                insight.impactDirection,
                                insight.impactMagnitude
                            )}`}
                        >
                            {getImpactIcon(insight.impactDirection)} {insight.impactMagnitude}
                        </span>
                        <span className="text-sm text-gray-500">
                            {getHorizonLabel(insight.timeHorizon)}
                        </span>
                    </div>
                    <span className="text-xs text-gray-400">
                        {formatDate(insight.generatedAt)}
                    </span>
                </div>

                {/* Summary */}
                <p className="text-gray-800 mb-4">{insight.summary}</p>

                {/* Confidence */}
                <ConfidenceIndicator
                    score={insight.confidenceScore}
                    rationale=""
                    showLabel={false}
                />
            </div>
        </Link>
    );
}
