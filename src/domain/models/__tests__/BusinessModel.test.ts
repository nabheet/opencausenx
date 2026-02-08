/**
 * Tests for BusinessModel domain model
 */

import { BusinessModel } from '../BusinessModel';
import {
    Industry,
    BusinessDriverType,
    SensitivityFactor,
    BusinessModelConfig,
} from '../types';

describe('BusinessModel', () => {
    const validBusinessModelData: BusinessModelConfig = {
        id: 'test-id',
        userId: 'user-123',
        name: 'Test SaaS Company',
        industry: Industry.SAAS,
        revenueDrivers: [
            { driver: BusinessDriverType.SUBSCRIPTION_REVENUE, weight: 0.85 },
            { driver: BusinessDriverType.USAGE_REVENUE, weight: 0.10 },
            { driver: BusinessDriverType.SERVICES_REVENUE, weight: 0.05 },
        ],
        costDrivers: [
            { driver: BusinessDriverType.LABOR_COSTS, weight: 0.40 },
            { driver: BusinessDriverType.INFRASTRUCTURE_COSTS, weight: 0.15 },
            { driver: BusinessDriverType.SALES_MARKETING, weight: 0.30 },
            { driver: BusinessDriverType.R_AND_D, weight: 0.10 },
            { driver: BusinessDriverType.ADMINISTRATIVE, weight: 0.05 },
        ],
        sensitivities: [
            { factor: SensitivityFactor.LABOR, sensitivity: 0.8 },
            { factor: SensitivityFactor.INFRASTRUCTURE, sensitivity: 0.7 },
            { factor: SensitivityFactor.FX, sensitivity: 0.4 },
            { factor: SensitivityFactor.REGULATION, sensitivity: 0.6 },
            { factor: SensitivityFactor.MARKET_DEMAND, sensitivity: 0.7 },
        ],
        operatingRegions: ['US', 'EU'],
        customerRegions: ['US', 'EU', 'APAC'],
        active: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    };

    describe('constructor', () => {
        it('should create a valid BusinessModel instance', () => {
            const model = new BusinessModel(validBusinessModelData);

            expect(model.id).toBe('test-id');
            expect(model.name).toBe('Test SaaS Company');
            expect(model.industry).toBe(Industry.SAAS);
            expect(model.revenueDrivers).toHaveLength(3);
            expect(model.costDrivers).toHaveLength(5);
        });
    });

    describe('getDriverWeight', () => {
        it('should return correct weight for existing revenue driver', () => {
            const model = new BusinessModel(validBusinessModelData);
            expect(model.getDriverWeight(BusinessDriverType.SUBSCRIPTION_REVENUE)).toBe(0.85);
        });

        it('should return correct weight for existing cost driver', () => {
            const model = new BusinessModel(validBusinessModelData);
            expect(model.getDriverWeight(BusinessDriverType.LABOR_COSTS)).toBe(0.40);
        });

        it('should return 0 for non-existent driver', () => {
            const model = new BusinessModel(validBusinessModelData);
            expect(model.getDriverWeight(BusinessDriverType.SUBSCRIPTION_REVENUE)).toBeGreaterThan(0);
        });
    });

    describe('getSensitivity', () => {
        it('should return correct sensitivity for existing factor', () => {
            const model = new BusinessModel(validBusinessModelData);
            expect(model.getSensitivity(SensitivityFactor.LABOR)).toBe(0.8);
        });

        it('should return default 0.5 for non-existent factor', () => {
            const modelWithMissingSensitivity = new BusinessModel({
                ...validBusinessModelData,
                sensitivities: [],
            });
            expect(modelWithMissingSensitivity.getSensitivity(SensitivityFactor.LABOR)).toBe(0.5);
        });
    });

    describe('hasRegionalExposure', () => {
        const model = new BusinessModel(validBusinessModelData);

        it('should return true for operating region', () => {
            expect(model.hasRegionalExposure('US')).toBe(true);
            expect(model.hasRegionalExposure('EU')).toBe(true);
        });

        it('should return true for customer region', () => {
            expect(model.hasRegionalExposure('APAC')).toBe(true);
        });

        it('should return true for GLOBAL region', () => {
            expect(model.hasRegionalExposure('GLOBAL')).toBe(true);
        });

        it('should return false for unrelated region', () => {
            expect(model.hasRegionalExposure('LATAM')).toBe(false);
        });
    });

    describe('getAllRelevantRegions', () => {
        it('should return unique set of all regions', () => {
            const model = new BusinessModel(validBusinessModelData);
            const regions = model.getAllRelevantRegions();

            expect(regions).toContain('US');
            expect(regions).toContain('EU');
            expect(regions).toContain('APAC');
            expect(regions).toHaveLength(3); // US, EU, APAC (no duplicates)
        });
    });

    describe('validate', () => {
        it('should validate a correct business model', () => {
            const model = new BusinessModel(validBusinessModelData);
            const result = model.validate();
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect invalid revenue driver weights', () => {
            const invalidModel = new BusinessModel({
                ...validBusinessModelData,
                revenueDrivers: [
                    { driver: BusinessDriverType.SUBSCRIPTION_REVENUE, weight: 0.5 },
                    { driver: BusinessDriverType.USAGE_REVENUE, weight: 0.3 },
                ],
            });

            const result = invalidModel.validate();
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Revenue drivers'))).toBe(true);
        });

        it('should detect invalid cost driver weights', () => {
            const invalidModel = new BusinessModel({
                ...validBusinessModelData,
                costDrivers: [
                    { driver: BusinessDriverType.LABOR_COSTS, weight: 0.6 },
                ],
            });

            const result = invalidModel.validate();
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Cost drivers'))).toBe(true);
        });

        it('should detect out-of-range sensitivity values', () => {
            const invalidModel = new BusinessModel({
                ...validBusinessModelData,
                sensitivities: [
                    { factor: SensitivityFactor.LABOR, sensitivity: 1.5 },
                ],
            });

            const result = invalidModel.validate();
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Sensitivity'))).toBe(true);
        });

        it('should detect invalid region codes', () => {
            const invalidModel = new BusinessModel({
                ...validBusinessModelData,
                operatingRegions: ['INVALID_REGION_CODE'],
            });

            const result = invalidModel.validate();
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Invalid region'))).toBe(true);
        });
    });
});
