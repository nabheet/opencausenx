/**
 * Business Model Configuration Page
 * 
 * WHY: Allow users to configure their business structure and sensitivities
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createSaaSTemplate, SAAS_TEMPLATE_EXPLANATION } from '@/domain/business-templates/saas';

export default function BusinessModelPage() {
    const [loading, setLoading] = useState(false);
    const [existingModel, setExistingModel] = useState<any>(null);
    const [useTemplate, setUseTemplate] = useState(true);

    useEffect(() => {
        fetchExistingModel();
    }, []);

    const fetchExistingModel = async () => {
        try {
            const response = await fetch('/api/business-model?userId=default-user');
            const data = await response.json();
            if (data.businessModels && data.businessModels.length > 0) {
                setExistingModel(data.businessModels[0]);
                setUseTemplate(false);
            }
        } catch (error) {
            console.error('Failed to fetch business model:', error);
        }
    };

    const handleCreateFromTemplate = async () => {
        setLoading(true);
        try {
            const template = createSaaSTemplate('default-user', 'My SaaS Business', ['US'], ['US']);

            const response = await fetch('/api/business-model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...template,
                    userId: 'default-user',
                }),
            });

            const data = await response.json();
            if (data.success) {
                alert('Business model created successfully!');
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Failed to create business model:', error);
            alert('Failed to create business model');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Business Model Configuration
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Configure your business structure to enable causal analysis
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {existingModel ? (
                    <div className="bg-white rounded-lg shadow-sm p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Current Business Model: {existingModel.name}
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Industry</h3>
                                <p className="text-gray-600">{existingModel.industry}</p>
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Operating Regions</h3>
                                <p className="text-gray-600">{existingModel.operatingRegions.join(', ')}</p>
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Customer Regions</h3>
                                <p className="text-gray-600">{existingModel.customerRegions.join(', ')}</p>
                            </div>

                            <div className="pt-4 border-t">
                                <p className="text-sm text-gray-500">
                                    Advanced configuration (editing revenue/cost structure) will be added in a future version.
                                    For now, the SaaS template provides sensible defaults.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Create Your Business Model
                            </h2>
                            <p className="text-gray-600">
                                Start with a SaaS business template that includes industry-standard assumptions.
                            </p>
                        </div>

                        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 className="font-semibold text-blue-900 mb-3">
                                SaaS Business Template
                            </h3>
                            <div className="text-sm text-blue-800 whitespace-pre-line">
                                {SAAS_TEMPLATE_EXPLANATION}
                            </div>
                        </div>

                        <button
                            onClick={handleCreateFromTemplate}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
                        >
                            {loading ? 'Creating...' : 'Create from SaaS Template'}
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                            You can customize these values later through the API
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
