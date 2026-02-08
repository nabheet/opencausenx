/**
 * Tests for RiskSummary component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RiskSummary } from '../RiskSummary';
import { InsightModel } from '@/domain/models/types';

// Mock fetch
global.fetch = jest.fn();

// Mock InsightCard component
jest.mock('../../insights/InsightCard', () => ({
    InsightCard: ({ insight }: { insight: InsightModel }) => (
        <div data-testid={`insight-${insight.id}`}>{insight.summary}</div>
    ),
}));

describe('RiskSummary', () => {
    // Suppress React act() warnings - these are expected for async state updates
    const originalError = console.error;
    beforeAll(() => {
        console.error = (...args: unknown[]) => {
            if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) {
                return;
            }
            originalError.call(console, ...args);
        };
    });

    afterAll(() => {
        console.error = originalError;
    });

    const mockInsights = [
        {
            id: 'insight-1',
            summary: 'Rising wages will increase labor costs',
            impactMagnitude: 'HIGH',
            impactDirection: 'INCREASE',
        },
        {
            id: 'insight-2',
            summary: 'Cloud costs declining',
            impactMagnitude: 'MEDIUM',
            impactDirection: 'DECREASE',
        },
        {
            id: 'insight-3',
            summary: 'New regulations require compliance',
            impactMagnitude: 'HIGH',
            impactDirection: 'INCREASE',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => ({ insights: mockInsights }),
        });
    });

    it('should show loading state initially', () => {
        render(<RiskSummary businessModelId="bm-123" />);

        expect(screen.getByText('Loading insights...')).toBeInTheDocument();
    });

    it('should fetch insights on mount', async () => {
        render(<RiskSummary businessModelId="bm-123" />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/insights?businessModelId=bm-123'
            );
        });
    });

    it('should display insights after loading', async () => {
        render(<RiskSummary businessModelId="bm-123" />);

        await waitFor(() => {
            expect(screen.getByText('Rising wages will increase labor costs')).toBeInTheDocument();
            expect(screen.getByText('Cloud costs declining')).toBeInTheDocument();
        });
    });

    it('should display high impact count badge', async () => {
        render(<RiskSummary businessModelId="bm-123" />);

        await waitFor(() => {
            expect(screen.getByText('2 High Impact')).toBeInTheDocument();
        });
    });

    it('should not show high impact badge when no high impact insights', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => ({
                insights: [mockInsights[1]], // Only MEDIUM impact
            }),
        });

        render(<RiskSummary businessModelId="bm-123" />);

        await waitFor(() => {
            expect(screen.queryByText(/High Impact/)).not.toBeInTheDocument();
        });
    });

    it('should display empty state when no insights', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => ({ insights: [] }),
        });

        render(<RiskSummary businessModelId="bm-123" />);

        await waitFor(() => {
            expect(screen.getByText('No insights yet.')).toBeInTheDocument();
            expect(
                screen.getByText(/Configure your business model/)
            ).toBeInTheDocument();
        });
    });

    it('should limit display to 10 insights', async () => {
        const manyInsights = Array.from({ length: 15 }, (_, i) => ({
            id: `insight-${i}`,
            summary: `Insight ${i}`,
            impactMagnitude: 'MEDIUM',
            impactDirection: 'INCREASE',
        }));

        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => ({ insights: manyInsights }),
        });

        const { container } = render(<RiskSummary businessModelId="bm-123" />);

        await waitFor(() => {
            const insightCards = container.querySelectorAll('[data-testid^="insight-"]');
            expect(insightCards).toHaveLength(10);
        });
    });

    it('should handle fetch errors gracefully', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation();
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        render(<RiskSummary businessModelId="bm-123" />);

        await waitFor(() => {
            expect(consoleError).toHaveBeenCalledWith(
                'Failed to fetch insights:',
                expect.any(Error)
            );
        });

        // Should show empty state on error
        expect(screen.getByText('No insights yet.')).toBeInTheDocument();

        consoleError.mockRestore();
    });

    it('should display "Active Insights" header', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ insights: [] }),
        });

        render(<RiskSummary businessModelId="bm-123" />);

        await waitFor(() => {
            expect(screen.getByText('Active Insights')).toBeInTheDocument();
        });
    });

    it('should refetch when businessModelId changes', async () => {
        const { rerender } = render(<RiskSummary businessModelId="bm-123" />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/insights?businessModelId=bm-123'
            );
        });

        (global.fetch as jest.Mock).mockClear();

        rerender(<RiskSummary businessModelId="bm-456" />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/insights?businessModelId=bm-456'
            );
        });
    });
});
