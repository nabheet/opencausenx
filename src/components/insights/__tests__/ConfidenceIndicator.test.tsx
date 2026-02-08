/**
 * Tests for ConfidenceIndicator component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConfidenceIndicator } from '../ConfidenceIndicator';

describe('ConfidenceIndicator', () => {
    it('should render confidence percentage', () => {
        render(<ConfidenceIndicator score={0.76} rationale="" />);

        expect(screen.getByText('76%')).toBeInTheDocument();
    });

    it('should display high confidence label for score >= 0.8', () => {
        render(<ConfidenceIndicator score={0.85} rationale="" />);

        expect(screen.getByText('High confidence')).toBeInTheDocument();
    });

    it('should display moderate confidence label for score >= 0.6', () => {
        render(<ConfidenceIndicator score={0.65} rationale="" />);

        expect(screen.getByText('Moderate confidence')).toBeInTheDocument();
    });

    it('should display low confidence label for score < 0.6', () => {
        render(<ConfidenceIndicator score={0.45} rationale="" />);

        expect(screen.getByText('Low confidence')).toBeInTheDocument();
    });

    it('should hide label when showLabel is false', () => {
        render(<ConfidenceIndicator score={0.85} rationale="" showLabel={false} />);

        expect(screen.queryByText('High confidence')).not.toBeInTheDocument();
        expect(screen.getByText('85%')).toBeInTheDocument(); // Percentage still shows
    });

    it('should display rationale text when provided', () => {
        const rationale = 'Event from highly reliable source; direct causal relationship.';
        render(<ConfidenceIndicator score={0.76} rationale={rationale} />);

        expect(screen.getByText(rationale)).toBeInTheDocument();
    });

    it('should not display rationale when empty', () => {
        const { container } = render(<ConfidenceIndicator score={0.76} rationale="" />);

        const rationaleElement = container.querySelector('.text-xs.text-gray-500');
        expect(rationaleElement).not.toBeInTheDocument();
    });

    it('should apply green color for high confidence', () => {
        const { container } = render(<ConfidenceIndicator score={0.85} rationale="" />);

        const label = container.querySelector('.text-green-600');
        expect(label).toBeInTheDocument();

        const bar = container.querySelector('.bg-green-500');
        expect(bar).toBeInTheDocument();
    });

    it('should apply yellow color for moderate confidence', () => {
        const { container } = render(<ConfidenceIndicator score={0.65} rationale="" />);

        const label = container.querySelector('.text-yellow-600');
        expect(label).toBeInTheDocument();

        const bar = container.querySelector('.bg-yellow-500');
        expect(bar).toBeInTheDocument();
    });

    it('should apply red color for low confidence', () => {
        const { container } = render(<ConfidenceIndicator score={0.45} rationale="" />);

        const label = container.querySelector('.text-red-600');
        expect(label).toBeInTheDocument();

        const bar = container.querySelector('.bg-red-500');
        expect(bar).toBeInTheDocument();
    });

    it('should set progress bar width based on score', () => {
        const { container } = render(<ConfidenceIndicator score={0.75} rationale="" />);

        const bar = container.querySelector('.bg-yellow-500') as HTMLElement;
        expect(bar.style.width).toBe('75%');
    });

    it('should round percentage to nearest integer', () => {
        render(<ConfidenceIndicator score={0.876} rationale="" />);

        expect(screen.getByText('88%')).toBeInTheDocument();
    });

    it('should handle edge case of 0 score', () => {
        const { container } = render(<ConfidenceIndicator score={0} rationale="" />);

        expect(screen.getByText('0%')).toBeInTheDocument();

        const bar = container.querySelector('.bg-red-500') as HTMLElement;
        expect(bar.style.width).toBe('0%');
    });

    it('should handle edge case of 1.0 score', () => {
        const { container } = render(<ConfidenceIndicator score={1.0} rationale="" />);

        expect(screen.getByText('100%')).toBeInTheDocument();

        const bar = container.querySelector('.bg-green-500') as HTMLElement;
        expect(bar.style.width).toBe('100%');
    });

    it('should have default showLabel value of true', () => {
        render(<ConfidenceIndicator score={0.85} rationale="" />);

        expect(screen.getByText('High confidence')).toBeInTheDocument();
    });
});
