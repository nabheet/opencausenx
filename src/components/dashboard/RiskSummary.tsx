/**
 * Risk Summary Component
 * 
 * WHY: Quick overview of active business risks
 */

'use client';

import React, { useEffect, useState } from 'react';
import { InsightCard } from '../insights/InsightCard';

interface RiskSummaryProps {
    businessModelId: string;
}

export function RiskSummary({ businessModelId }: RiskSummaryProps) {
    const [insights, setInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (businessModelId) {
            fetchInsights();
        }
    }, [businessModelId]);

    const fetchInsights = async () => {
        try {
            const response = await fetch(
                `/api/insights?businessModelId=${businessModelId}`
            );
            const data = await response.json();
            setInsights(data.insights || []);
        } catch (error) {
            console.error('Failed to fetch insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const highImpactInsights = insights.filter(
        (i) => i.impactMagnitude === 'HIGH'
    );

    if (loading) {
        return <div className="text-gray-500">Loading insights...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Active Insights</h2>
                {highImpactInsights.length > 0 && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        {highImpactInsights.length} High Impact
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {insights.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-600 mb-2">No insights yet.</p>
                        <p className="text-sm text-gray-500">
                            Configure your business model and generate insights to get started.
                        </p>
                    </div>
                ) : (
                    insights.slice(0, 10).map((insight) => (
                        <InsightCard key={insight.id} insight={insight} />
                    ))
                )}
            </div>
        </div>
    );
}
