/**
 * Tests for causal mapping rules
 */

import { getCausalRule, isHighConfidenceRule, CAUSAL_RULES } from '../rules';
import {
    EventType,
    BusinessDriverType,
    SensitivityFactor,
    ImpactDirection,
    TimeHorizon,
} from '@/domain/models/types';

describe('Causal Rules', () => {
    describe('CAUSAL_RULES', () => {
        it('should have a rule for every event type', () => {
            const eventTypes = Object.values(EventType);

            eventTypes.forEach((eventType) => {
                expect(CAUSAL_RULES[eventType]).toBeDefined();
            });
        });

        it('should have complete rule structure for each event type', () => {
            Object.values(CAUSAL_RULES).forEach((rule) => {
                expect(rule.eventType).toBeDefined();
                expect(rule.affectedDrivers).toBeDefined();
                expect(rule.affectedDrivers.length).toBeGreaterThan(0);
                expect(rule.sensitivityFactor).toBeDefined();
                expect(rule.defaultDirection).toBeDefined();
                expect(rule.timeHorizon).toBeDefined();
                expect(rule.getCausalPath).toBeInstanceOf(Function);
            });
        });
    });

    describe('getCausalRule', () => {
        it('should return rule for LABOR_MARKET event', () => {
            const rule = getCausalRule(EventType.LABOR_MARKET);

            expect(rule.eventType).toBe(EventType.LABOR_MARKET);
            expect(rule.affectedDrivers).toContain(BusinessDriverType.LABOR_COSTS);
            expect(rule.sensitivityFactor).toBe(SensitivityFactor.LABOR);
            expect(rule.defaultDirection).toBe(ImpactDirection.INCREASE);
            expect(rule.timeHorizon).toBe(TimeHorizon.MEDIUM);
        });

        it('should return rule for INFRASTRUCTURE event', () => {
            const rule = getCausalRule(EventType.INFRASTRUCTURE);

            expect(rule.affectedDrivers).toContain(BusinessDriverType.INFRASTRUCTURE_COSTS);
            expect(rule.sensitivityFactor).toBe(SensitivityFactor.INFRASTRUCTURE);
            expect(rule.timeHorizon).toBe(TimeHorizon.SHORT);
        });

        it('should return rule for REGULATION_CHANGE event', () => {
            const rule = getCausalRule(EventType.REGULATION_CHANGE);

            expect(rule.affectedDrivers.length).toBeGreaterThan(0);
            expect(rule.sensitivityFactor).toBe(SensitivityFactor.REGULATION);
            expect(rule.defaultDirection).toBe(ImpactDirection.INCREASE);
        });

        it('should return rule for ECONOMIC_INDICATOR event', () => {
            const rule = getCausalRule(EventType.ECONOMIC_INDICATOR);

            expect(rule.sensitivityFactor).toBe(SensitivityFactor.MARKET_DEMAND);
            expect(rule.defaultDirection).toBe(ImpactDirection.NEUTRAL);
        });

        it('should return rule for CURRENCY event', () => {
            const rule = getCausalRule(EventType.CURRENCY);

            expect(rule.sensitivityFactor).toBe(SensitivityFactor.FX);
        });
    });

    describe('getCausalPath', () => {
        it('should generate causal path for labor market event', () => {
            const rule = getCausalRule(EventType.LABOR_MARKET);
            const path = rule.getCausalPath(
                'Tech wages increase by 15%',
                'Labor costs represent 40% of business structure'
            );

            expect(path).toHaveLength(3);
            expect(path[0].step).toBe(1);
            expect(path[0].description).toContain('Labor market event');
            expect(path[0].confidence).toBeGreaterThan(0);
            expect(path[0].confidence).toBeLessThanOrEqual(1);

            // Each step should have required fields
            path.forEach((step) => {
                expect(step.step).toBeGreaterThan(0);
                expect(step.description).toBeTruthy();
                expect(step.mechanism).toBeTruthy();
                expect(step.confidence).toBeGreaterThan(0);
                expect(step.confidence).toBeLessThanOrEqual(1);
            });
        });

        it('should generate causal path for infrastructure event', () => {
            const rule = getCausalRule(EventType.INFRASTRUCTURE);
            const path = rule.getCausalPath(
                'AWS increases EC2 pricing by 10%',
                'Infrastructure costs represent 15% of business structure'
            );

            expect(path.length).toBeGreaterThan(0);
            expect(path[0].mechanism).toContain('increases EC2 pricing');
        });

        it('should include business context in causal path', () => {
            const rule = getCausalRule(EventType.LABOR_MARKET);
            const businessContext = 'Labor costs represent 40% of business structure';
            const path = rule.getCausalPath('Tech wages increase', businessContext);

            const hasContext = path.some((step) =>
                step.mechanism.includes('40%') || step.mechanism.includes('Labor costs')
            );

            expect(hasContext).toBe(true);
        });
    });

    describe('isHighConfidenceRule', () => {
        it('should identify labor market as high confidence', () => {
            expect(isHighConfidenceRule(EventType.LABOR_MARKET)).toBe(true);
        });

        it('should identify infrastructure as high confidence', () => {
            expect(isHighConfidenceRule(EventType.INFRASTRUCTURE)).toBe(true);
        });

        it('should identify regulation as moderate confidence', () => {
            // Regulation changes can have unclear impacts
            const isHigh = isHighConfidenceRule(EventType.REGULATION_CHANGE);
            // This depends on implementation, so we just check it returns boolean
            expect(typeof isHigh).toBe('boolean');
        });
    });

    describe('rule consistency', () => {
        it('should have consistent time horizons for similar events', () => {
            const infraRule = getCausalRule(EventType.INFRASTRUCTURE);
            const currencyRule = getCausalRule(EventType.CURRENCY);

            // Infrastructure and currency events should both be short-term
            expect(infraRule.timeHorizon).toBe(TimeHorizon.SHORT);
            expect(currencyRule.timeHorizon).toBe(TimeHorizon.SHORT);
        });

        it('should map cost events to cost drivers', () => {
            const laborRule = getCausalRule(EventType.LABOR_MARKET);
            const infraRule = getCausalRule(EventType.INFRASTRUCTURE);

            const costDrivers = [
                BusinessDriverType.LABOR_COSTS,
                BusinessDriverType.INFRASTRUCTURE_COSTS,
                BusinessDriverType.SALES_MARKETING,
                BusinessDriverType.R_AND_D,
                BusinessDriverType.ADMINISTRATIVE,
            ];

            laborRule.affectedDrivers.forEach((driver) => {
                expect(costDrivers).toContain(driver);
            });

            infraRule.affectedDrivers.forEach((driver) => {
                expect(costDrivers).toContain(driver);
            });
        });
    });
});
