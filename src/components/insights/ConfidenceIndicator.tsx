/**
 * Confidence Indicator Component
 * 
 * WHY: Visualize confidence scores clearly to users
 */

import React from 'react';

interface ConfidenceIndicatorProps {
    score: number; // 0-1
    rationale: string;
    showLabel?: boolean;
}

export function ConfidenceIndicator({
    score,
    rationale,
    showLabel = true,
}: ConfidenceIndicatorProps) {
    const percentage = Math.round(score * 100);

    const getColor = (score: number) => {
        if (score >= 0.8) return 'text-green-600';
        if (score >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getBarColor = (score: number) => {
        if (score >= 0.8) return 'bg-green-500';
        if (score >= 0.6) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getLabel = (score: number) => {
        if (score >= 0.8) return 'High confidence';
        if (score >= 0.6) return 'Moderate confidence';
        return 'Low confidence';
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                {showLabel && (
                    <span className={`text-sm font-medium ${getColor(score)}`}>
                        {getLabel(score)}
                    </span>
                )}
                <span className="text-sm text-gray-600">{percentage}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full ${getBarColor(score)} transition-all`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Rationale */}
            {rationale && (
                <p className="text-xs text-gray-500 mt-2">{rationale}</p>
            )}
        </div>
    );
}
