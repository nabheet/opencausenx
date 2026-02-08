/**
 * Application Configuration
 * 
 * WHY: Centralized configuration with validation and defaults.
 * All environment variables are accessed through this module to ensure type safety.
 */

export const config = {
    database: {
        url: process.env.DATABASE_URL || '',
    },
    llm: {
        // WHY: We use LLMs ONLY for explanation synthesis, never for prediction
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
        provider: (process.env.LLM_PROVIDER || 'openai') as 'openai' | 'anthropic',
    },
    app: {
        baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        environment: process.env.NODE_ENV || 'development',
    },
    jobs: {
        // Background job intervals in minutes
        eventFetchInterval: parseInt(process.env.EVENT_FETCH_INTERVAL_MINUTES || '60', 10),
        insightGenerationInterval: parseInt(process.env.INSIGHT_GENERATION_INTERVAL_MINUTES || '30', 10),
    },
} as const;

/**
 * Validate required configuration
 * WHY: Fail fast if critical config is missing
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.database.url) {
        errors.push('DATABASE_URL is required');
    }

    // LLM key is optional for basic operation, but warn if missing
    if (!config.llm.openaiApiKey && !config.llm.anthropicApiKey) {
        console.warn('Warning: No LLM API key configured. LLM explanations will not be available.');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
