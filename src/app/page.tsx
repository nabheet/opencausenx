/**
 * Main Dashboard Page
 * 
 * WHY: Central hub showing events, risks, and changes
 */

'use client';

import React, { useEffect, useState } from 'react';
import { EventFeed } from '@/components/dashboard/EventFeed';
import { RiskSummary } from '@/components/dashboard/RiskSummary';
import Link from 'next/link';

export default function DashboardPage() {
  const [businessModel, setBusinessModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessModel();
  }, []);

  const fetchBusinessModel = async () => {
    try {
      const response = await fetch('/api/business-model?userId=default-user');
      const data = await response.json();
      if (data.businessModels && data.businessModels.length > 0) {
        setBusinessModel(data.businessModels[0]);
      }
    } catch (error) {
      console.error('Failed to fetch business model:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!businessModel) return;

    try {
      setLoading(true);
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessModelId: businessModel.id,
          useLLM: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(
          `Generated ${data.result.created} new insights! (${data.result.skipped} skipped, ${data.result.errors} errors)`
        );
        // Refresh the page to show new insights
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to generate insights:', error);
      alert('Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">OpenCausenx</h1>
              <p className="text-gray-600 mt-1">
                Explainable decision intelligence for your business
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {businessModel && (
                <button
                  onClick={handleGenerateInsights}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {loading ? 'Generating...' : 'Generate Insights'}
                </button>
              )}
              <Link
                href="/business-model"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Configure Business Model
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!businessModel && !loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to OpenCausenx
            </h2>
            <p className="text-gray-600 mb-6">
              To get started, configure your business model so we can analyze
              how world events affect your business.
            </p>
            <Link
              href="/business-model"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Configure Business Model
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Events */}
            <div className="space-y-8">
              <EventFeed />
            </div>

            {/* Right Column: Insights */}
            <div className="space-y-8">
              {businessModel && <RiskSummary businessModelId={businessModel.id} />}
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            About OpenCausenx
          </h3>
          <p className="text-blue-800 text-sm">
            OpenCausenx uses <strong>explainable causal reasoning</strong> to
            show how world events affect your business. We prioritize
            transparency over black-box predictions. Every insight includes the
            reasoning chain, assumptions, and confidence scores.
          </p>
        </div>
      </main>
    </div>
  );
}
