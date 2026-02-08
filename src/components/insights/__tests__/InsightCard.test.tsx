/**
 * Tests for InsightCard component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { InsightCard } from '../InsightCard';

// Mock Next.js Link component
jest.mock('next/link', () => {
    const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
        return <a href={href}>{children}</a>;
    };
    MockLink.displayName = 'Link';
    return MockLink;
});

describe('InsightCard', () => {
    const mockInsight = {
        id: 'insight-123',
        summary: 'Rising tech wages will increase labor costs by 10-15%',
        impactDirection: 'INCREASE',
        impactMagnitude: 'HIGH',
        timeHorizon: 'MEDIUM',
        confidenceScore: 0.76,
        confidenceRationale: 'Event from highly reliable source; direct causal relationship.',
        generatedAt: new Date('2024-01-15'),
    };

    it('should render insight summary', () => {
        render(<InsightCard insight={mockInsight} />);

        expect(screen.getByText(mockInsight.summary)).toBeInTheDocument();
    });

    it('should display impact magnitude badge', () => {
        render(<InsightCard insight={mockInsight} />);

        expect(screen.getByText(/HIGH/)).toBeInTheDocument();
    });

    it('should show correct icon for INCREASE direction', () => {
        render(<InsightCard insight={mockInsight} />);

        const badge = screen.getByText(/HIGH/).parentElement;
        expect(badge?.textContent).toContain('↑');
    });

    it('should show correct icon for DECREASE direction', () => {
        const decreaseInsight = { ...mockInsight, impactDirection: 'DECREASE' };
        render(<InsightCard insight={decreaseInsight} />);

        const badge = screen.getByText(/HIGH/).parentElement;
        expect(badge?.textContent).toContain('↓');
    });

    it('should show neutral icon for NEUTRAL direction', () => {
        const neutralInsight = { ...mockInsight, impactDirection: 'NEUTRAL' };
        render(<InsightCard insight={neutralInsight} />);

        const badge = screen.getByText(/HIGH/).parentElement;
        expect(badge?.textContent).toContain('↔');
    });

    it('should display time horizon label', () => {
        render(<InsightCard insight={mockInsight} />);

        expect(screen.getByText('3-12 months')).toBeInTheDocument();
    });

    it('should display SHORT time horizon correctly', () => {
        const shortInsight = { ...mockInsight, timeHorizon: 'SHORT' };
        render(<InsightCard insight={shortInsight} />);

        expect(screen.getByText('0-3 months')).toBeInTheDocument();
    });

    it('should display LONG time horizon correctly', () => {
        const longInsight = { ...mockInsight, timeHorizon: 'LONG' };
        render(<InsightCard insight={longInsight} />);

        expect(screen.getByText('12+ months')).toBeInTheDocument();
    });

    it('should format and display generation date', () => {
        render(<InsightCard insight={mockInsight} />);

        // Check that a date is displayed (format may vary by locale)
        const dateElement = screen.getByText(/1\/15\/2024|15\/1\/2024|2024/);
        expect(dateElement).toBeInTheDocument();
    });

    it('should render as a link to insight detail page', () => {
        const { container } = render(<InsightCard insight={mockInsight} />);

        const link = container.querySelector('a[href="/insights/insight-123"]');
        expect(link).toBeInTheDocument();
    });

    it('should apply correct color classes for HIGH INCREASE impact', () => {
        const { container } = render(<InsightCard insight={mockInsight} />);

        const badge = container.querySelector('.text-red-600');
        expect(badge).toBeInTheDocument();
    });

    it('should apply correct color classes for HIGH DECREASE impact', () => {
        const decreaseInsight = { ...mockInsight, impactDirection: 'DECREASE' };
        const { container } = render(<InsightCard insight={decreaseInsight} />);

        const badge = container.querySelector('.text-green-600');
        expect(badge).toBeInTheDocument();
    });

    it('should apply correct color classes for MEDIUM magnitude', () => {
        const mediumInsight = { ...mockInsight, impactMagnitude: 'MEDIUM' };
        const { container } = render(<InsightCard insight={mediumInsight} />);

        const badge = container.querySelector('.text-orange-600');
        expect(badge).toBeInTheDocument();
    });

    it('should apply correct color classes for LOW magnitude', () => {
        const lowInsight = { ...mockInsight, impactMagnitude: 'LOW' };
        const { container } = render(<InsightCard insight={lowInsight} />);

        const badge = container.querySelector('.text-gray-600');
        expect(badge).toBeInTheDocument();
    });

    it('should render ConfidenceIndicator', () => {
        render(<InsightCard insight={mockInsight} />);

        // ConfidenceIndicator should show the confidence percentage
        expect(screen.getByText('76%')).toBeInTheDocument();
    });

    it('should handle string dates', () => {
        const insightWithStringDate = {
            ...mockInsight,
            generatedAt: '2024-01-15T00:00:00.000Z',
        };

        render(<InsightCard insight={insightWithStringDate} />);

        // Should still render without error
        expect(screen.getByText(mockInsight.summary)).toBeInTheDocument();
    });
});
