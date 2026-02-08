/**
 * Business Model Domain Model
 * 
 * WHY: Represents the structure and sensitivities of a business.
 * This abstraction enables deterministic causal mapping from events to business impacts.
 */

import {
    Industry,
    BusinessDriverType,
    SensitivityFactor,
    BusinessModelConfig,
    WeightedDriver,
    SensitivityConfig,
} from './types';
import { BusinessModel as PrismaBusinessModel } from '@prisma/client';

export class BusinessModel implements BusinessModelConfig {
    id: string;
    userId: string;
    name: string;
    industry: Industry;
    revenueDrivers: WeightedDriver[];
    costDrivers: WeightedDriver[];
    sensitivities: SensitivityConfig[];
    operatingRegions: string[];
    customerRegions: string[];
    active: boolean;
    createdAt: Date;
    updatedAt: Date;

    constructor(data: BusinessModelConfig) {
        this.id = data.id;
        this.userId = data.userId;
        this.name = data.name;
        this.industry = data.industry;
        this.revenueDrivers = data.revenueDrivers;
        this.costDrivers = data.costDrivers;
        this.sensitivities = data.sensitivities;
        this.operatingRegions = data.operatingRegions;
        this.customerRegions = data.customerRegions;
        this.active = data.active;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    /**
     * Create BusinessModel from Prisma entity
     */
    static fromPrisma(prisma: PrismaBusinessModel): BusinessModel {
        return new BusinessModel({
            id: prisma.id,
            userId: prisma.userId,
            name: prisma.name,
            industry: prisma.industry as Industry,
            revenueDrivers: prisma.revenueDrivers as WeightedDriver[],
            costDrivers: prisma.costDrivers as WeightedDriver[],
            sensitivities: prisma.sensitivities as SensitivityConfig[],
            operatingRegions: prisma.operatingRegions,
            customerRegions: prisma.customerRegions,
            active: prisma.active,
            createdAt: prisma.createdAt,
            updatedAt: prisma.updatedAt,
        });
    }

    /**
     * Get weight for a specific business driver
     * WHY: Used in impact magnitude calculations
     */
    getDriverWeight(driver: BusinessDriverType): number {
        const allDrivers = [...this.revenueDrivers, ...this.costDrivers];
        const found = allDrivers.find((d) => d.driver === driver);
        return found?.weight || 0;
    }

    /**
     * Get sensitivity to a specific factor
     * WHY: Determines how strongly business reacts to external changes
     */
    getSensitivity(factor: SensitivityFactor): number {
        const found = this.sensitivities.find((s) => s.factor === factor);
        return found?.sensitivity || 0.5; // Default moderate sensitivity
    }

    /**
     * Check if business operates in or serves a specific region
     * WHY: Regional relevance filtering for events
     */
    hasRegionalExposure(region: string): boolean {
        return (
            this.operatingRegions.includes(region) ||
            this.customerRegions.includes(region) ||
            region === 'GLOBAL'
        );
    }

    /**
     * Get all relevant regions for this business
     */
    getAllRelevantRegions(): string[] {
        return [...new Set([...this.operatingRegions, ...this.customerRegions])];
    }

    /**
     * Validate business model configuration
     * WHY: Ensure weights sum to 1 and sensitivities are in valid range
     */
    validate(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check revenue drivers sum to ~1
        const revenueSum = this.revenueDrivers.reduce((sum, d) => sum + d.weight, 0);
        if (Math.abs(revenueSum - 1.0) > 0.01) {
            errors.push(`Revenue drivers must sum to 1.0 (currently ${revenueSum.toFixed(2)})`);
        }

        // Check cost drivers sum to ~1
        const costSum = this.costDrivers.reduce((sum, d) => sum + d.weight, 0);
        if (Math.abs(costSum - 1.0) > 0.01) {
            errors.push(`Cost drivers must sum to 1.0 (currently ${costSum.toFixed(2)})`);
        }

        // Check sensitivities are in 0-1 range
        for (const sensitivity of this.sensitivities) {
            if (sensitivity.sensitivity < 0 || sensitivity.sensitivity > 1) {
                errors.push(`Sensitivity for ${sensitivity.factor} must be between 0 and 1`);
            }
        }

        // Check regions are valid ISO codes (basic check)
        const allRegions = [...this.operatingRegions, ...this.customerRegions];
        for (const region of allRegions) {
            if (region.length < 2 || region.length > 5) {
                errors.push(`Invalid region code: ${region}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
