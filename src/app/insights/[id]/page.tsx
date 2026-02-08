/**
 * Insight Detail Page
 * 
 * WHY: Full explanation of an insight with causal reasoning, assumptions, and confidence
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ConfidenceIndicator } from '@/components/insights/ConfidenceIndicator';

export default function InsightDetailPage() {
    const params = useParams();
    const insightId = params?.id as string;

    const [insight, setInsight] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (insightId) {
            fetchInsight();
        }
    }, [insightId]);

    const fetchInsight = async () => {
        try {
            const response = await fetch(`/api/insights/${insightId}`);
            const data = await response.json();
            setInsight(data.insight);
        } catch (error) {
            console.error('Failed to fetch insight:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading insight...</div>
            </div>
        );
    }

    if (!insight) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Insight not found</div>
            </div>
        );
    }

    const getImpactIcon = (direction: string) => {
        if (direction === 'INCREASE') return '↑';
        if (direction === 'DECREASE') return '↓';
        return '↔';
    };

    const formatDriverName = (driver: string) => {
        return driver
            .toLowerCase()
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link
                        href="/"
                        className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
                    >
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Insight Details</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
                    {/* Impact Overview */}
                    <div>
                        <div className="flex items-center space-x-4 mb-4">
                            <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold text-lg">
                                {getImpactIcon(insight.impactDirection)} {insight.impactMagnitude}{' '}
                                IMPACT
                            </span>
                            <span className="text-gray-600">{insight.timeHorizon} TERM</span>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            {insight.summary}
                        </h2>
                    </div>

                    {/* LLM Explanation */}
                    {insight.llmExplanation && (
                        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 className="text-lg font-semibold text-blue-900 mb-3">
                                Explanation
                            </h3>
                            <p className="text-blue-900 whitespace-pre-line">
                                {insight.llmExplanation}
                            </p>
                        </div>
                    )}

                    {/* Causal Path */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Causal Reasoning Chain
                        </h3>
                        <div className="space-y-4">
                            {insight.causalPath.map((step: any, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                                        {step.step}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 mb-1">
                                            {step.description}
                                        </h4>
                                        <p className="text-sm text-gray-600">{step.mechanism}</p>
                                        <div className="mt-2">
                                            <span className="text-xs text-gray-500">
                                                Step confidence: {Math.round(step.confidence * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Affected Drivers */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Affected Business Drivers
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {insight.affectedDrivers.map((driver: string) => (
                                <span
                                    key={driver}
                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                                >
                                    {formatDriverName(driver)}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Assumptions */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Key Assumptions
                        </h3>
                        <div className="space-y-3">
                            {insight.assumptions.map((assumption: any, index: number) => (
                                <div
                                    key={index}
                                    className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                                >
                                    <div className="flex items-start justify-between">
                                        <p className="text-gray-800">{assumption.description}</p>
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${assumption.impact === 'HIGH'
                                                    ? 'bg-red-100 text-red-700'
                                                    : assumption.impact === 'MEDIUM'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {assumption.impact} impact
                                        </span>
                                    </div>
                                    {assumption.source && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Source: {assumption.source}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Confidence Score */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Confidence Assessment
                        </h3>
                        <ConfidenceIndicator
                            score={insight.confidenceScore}
                            rationale={insight.confidenceRationale}
                            showLabel={true}
                        />
                    </div>

                    {/* Event Details */}
                    {insight.event && (
                        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                Source Event
                            </h3>
                            <p className="text-gray-700 mb-2">{insight.event.summary}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{insight.event.eventType}</span>
                                <span>·</span>
                                <span>{insight.event.region}</span>
                                <span>·</span>
                                <span>
                                    {new Date(insight.event.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
