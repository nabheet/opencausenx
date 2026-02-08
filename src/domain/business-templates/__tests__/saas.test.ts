/**
 * Tests for SaaS business template
 */

import {
    createSaaSTemplate,
    DEFAULT_SAAS_REVENUE_DRIVERS,
    DEFAULT_SAAS_COST_DRIVERS,
    DEFAULT_SAAS_SENSITIVITIES,
} from '../saas';
import { Industry, BusinessDriverType, SensitivityFactor } from '@/domain/models/types';

describe('SaaS Template', () => {
    describe('DEFAULT_SAAS_REVENUE_DRIVERS', () => {
        it('should have subscription revenue as primary driver', () => {
            const subscription = DEFAULT_SAAS_REVENUE_DRIVERS.find(
                (d) => d.driver === BusinessDriverType.SUBSCRIPTION_REVENUE
            );

            expect(subscription).toBeDefined();
            expect(subscription!.weight).toBeGreaterThan(0.8);
        });

        it('should sum to 1.0', () => {
            const total = DEFAULT_SAAS_REVENUE_DRIVERS.reduce((sum, d) => sum + d.weight, 0);
            expect(total).toBeCloseTo(1.0, 2);
        });

        it('should include all three revenue types', () => {
            expect(DEFAULT_SAAS_REVENUE_DRIVERS).toHaveLength(3);
            const drivers = DEFAULT_SAAS_REVENUE_DRIVERS.map(d => d.driver);
            expect(drivers).toContain(BusinessDriverType.SUBSCRIPTION_REVENUE);
            expect(drivers).toContain(BusinessDriverType.USAGE_REVENUE);
            expect(drivers).toContain(BusinessDriverType.SERVICES_REVENUE);
        });
    });

    describe('DEFAULT_SAAS_COST_DRIVERS', () => {
        it('should sum to 1.0', () => {
            const total = DEFAULT_SAAS_COST_DRIVERS.reduce((sum, d) => sum + d.weight, 0);
            expect(total).toBeCloseTo(1.0, 2);
        });

        it('should have labor as highest cost', () => {
            const labor = DEFAULT_SAAS_COST_DRIVERS.find(
                (d) => d.driver === BusinessDriverType.LABOR_COSTS
            );

            expect(labor).toBeDefined();
            expect(labor!.weight).toBeGreaterThan(0.35);
        });

        it('should include all five cost categories', () => {
            expect(DEFAULT_SAAS_COST_DRIVERS).toHaveLength(5);
            const drivers = DEFAULT_SAAS_COST_DRIVERS.map(d => d.driver);
            expect(drivers).toContain(BusinessDriverType.LABOR_COSTS);
            expect(drivers).toContain(BusinessDriverType.INFRASTRUCTURE_COSTS);
            expect(drivers).toContain(BusinessDriverType.SALES_MARKETING);
            expect(drivers).toContain(BusinessDriverType.R_AND_D);
            expect(drivers).toContain(BusinessDriverType.ADMINISTRATIVE);
        });

        it('should have reasonable weights for each driver', () => {
            DEFAULT_SAAS_COST_DRIVERS.forEach(driver => {
                expect(driver.weight).toBeGreaterThan(0);
                expect(driver.weight).toBeLessThanOrEqual(1);
            });
        });
    });

    describe('DEFAULT_SAAS_SENSITIVITIES', () => {
        it('should include all sensitivity factors', () => {
            expect(DEFAULT_SAAS_SENSITIVITIES).toHaveLength(5);
            const factors = DEFAULT_SAAS_SENSITIVITIES.map(s => s.factor);
            expect(factors).toContain(SensitivityFactor.LABOR);
            expect(factors).toContain(SensitivityFactor.INFRASTRUCTURE);
            expect(factors).toContain(SensitivityFactor.FX);
            expect(factors).toContain(SensitivityFactor.REGULATION);
            expect(factors).toContain(SensitivityFactor.MARKET_DEMAND);
        });

        it('should have high sensitivity to labor', () => {
            const labor = DEFAULT_SAAS_SENSITIVITIES.find(
                (s) => s.factor === SensitivityFactor.LABOR
            );

            expect(labor).toBeDefined();
            expect(labor!.sensitivity).toBeGreaterThanOrEqual(0.7);
        });

        it('should have high sensitivity to infrastructure', () => {
            const infra = DEFAULT_SAAS_SENSITIVITIES.find(
                (s) => s.factor === SensitivityFactor.INFRASTRUCTURE
            );

            expect(infra).toBeDefined();
            expect(infra!.sensitivity).toBeGreaterThanOrEqual(0.6);
        });

        it('should have all sensitivities in valid range [0, 1]', () => {
            DEFAULT_SAAS_SENSITIVITIES.forEach(sensitivity => {
                expect(sensitivity.sensitivity).toBeGreaterThanOrEqual(0);
                expect(sensitivity.sensitivity).toBeLessThanOrEqual(1);
            });
        });
    });

    describe('createSaaSTemplate', () => {
        it('should create a valid SaaS template with required params', () => {
            const template = createSaaSTemplate('user-123');

            expect(template.userId).toBe('user-123');
            expect(template.name).toBe('My SaaS Business');
            expect(template.industry).toBe(Industry.SAAS);
            expect(template.revenueDrivers).toEqual(DEFAULT_SAAS_REVENUE_DRIVERS);
            expect(template.costDrivers).toEqual(DEFAULT_SAAS_COST_DRIVERS);
            expect(template.sensitivities).toEqual(DEFAULT_SAAS_SENSITIVITIES);
            expect(template.active).toBe(true);
        });

        it('should accept custom name', () => {
            const template = createSaaSTemplate('user-123', 'Acme SaaS Corp');

            expect(template.name).toBe('Acme SaaS Corp');
        });

        it('should default to US only regions', () => {
            const template = createSaaSTemplate('user-123');

            expect(template.operatingRegions).toEqual(['US']);
            expect(template.customerRegions).toEqual(['US']);
        });

        it('should accept custom operating regions', () => {
            const template = createSaaSTemplate(
                'user-123',
                'Global SaaS',
                ['US', 'EU', 'APAC']
            );

            expect(template.operatingRegions).toEqual(['US', 'EU', 'APAC']);
        });

        it('should accept custom customer regions', () => {
            const template = createSaaSTemplate(
                'user-123',
                'Global SaaS',
                ['US'],
                ['US', 'EU', 'APAC', 'LATAM']
            );

            expect(template.customerRegions).toEqual(['US', 'EU', 'APAC', 'LATAM']);
        });

        it('should not include id, createdAt, or updatedAt', () => {
            const template = createSaaSTemplate('user-123');

            expect(template).not.toHaveProperty('id');
            expect(template).not.toHaveProperty('createdAt');
            expect(template).not.toHaveProperty('updatedAt');
        });
    });
});
