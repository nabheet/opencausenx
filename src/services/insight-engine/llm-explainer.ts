/**
 * LLM Explainer
 * 
 * WHY: Uses LLMs ONLY for transforming technical causal reasoning into
 * plain-English explanations. LLMs are NOT used for causal inference or prediction.
 * 
 * CRITICAL: LLMs explain our deterministic logic, they don't replace it.
 */

import { config } from '@/lib/config';
import { CausalMapping } from '@/domain/causal-mapping/mapper';

/**
 * Generate plain-English explanation using LLM
 * WHY: Make technical causal chains accessible to non-technical users
 */
export async function generateLLMExplanation(
    mapping: CausalMapping
): Promise<string | null> {
    // Check if LLM is configured
    if (!config.llm.openaiApiKey && !config.llm.anthropicApiKey) {
        console.warn('No LLM API key configured. Skipping LLM explanation.');
        return null;
    }

    try {
        // Build prompt
        const prompt = buildExplanationPrompt(mapping);

        // Call LLM (using OpenAI as example)
        if (config.llm.provider === 'openai' && config.llm.openaiApiKey) {
            return await callOpenAI(prompt);
        } else if (config.llm.provider === 'anthropic' && config.llm.anthropicApiKey) {
            return await callAnthropic(prompt);
        }

        return null;
    } catch (error) {
        console.error('Error generating LLM explanation:', error);
        return null;
    }
}

/**
 * Build prompt for LLM explanation
 * WHY: Provide all the causal reasoning and ask LLM to explain it clearly
 */
function buildExplanationPrompt(mapping: CausalMapping): string {
    const { event, businessModel, causalPath, affectedDrivers, impactDirection, impactMagnitude, timeHorizon, assumptions } = mapping;

    return `
You are explaining a business insight to a decision-maker. Your job is to take technical causal reasoning and explain it in clear, plain English.

CRITICAL: You are NOT making predictions or inferring causality. You are ONLY explaining the causal logic that has already been determined.

EVENT:
${event.summary}

BUSINESS CONTEXT:
- Industry: ${businessModel.industry}
- Operating regions: ${businessModel.operatingRegions.join(', ')}
- Customer regions: ${businessModel.customerRegions.join(', ')}

CAUSAL REASONING (already determined):
${causalPath.map((step) => `Step ${step.step}: ${step.description}\n   How: ${step.mechanism}`).join('\n\n')}

AFFECTED BUSINESS DRIVERS:
${affectedDrivers.join(', ')}

IMPACT:
- Direction: ${impactDirection}
- Magnitude: ${impactMagnitude}
- Time horizon: ${timeHorizon}

ASSUMPTIONS:
${assumptions.map((a) => `- ${a.description} (${a.impact} impact)`).join('\n')}

Your task:
Write a 2-3 paragraph plain-English explanation of how this event affects the business. Explain the causal chain clearly. Mention the key assumptions. Be honest about uncertainty.

DO NOT:
- Make new predictions
- Add causal reasoning not shown above
- Exaggerate certainty
- Use jargon without explanation

Write the explanation:
`.trim();
}

/**
 * Call OpenAI API
 * WHY: For MVP, simple completion API
 */
async function callOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.llm.openaiApiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a business analyst explaining insights clearly and honestly. Never exaggerate certainty.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 500,
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}

/**
 * Call Anthropic API
 * WHY: Alternative LLM provider
 */
async function callAnthropic(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.llm.anthropicApiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 500,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
}

/**
 * Generate explanation without LLM (fallback)
 * WHY: System should work even without LLM configured
 */
export function generateBasicExplanation(mapping: CausalMapping): string {
    const { event, affectedDrivers, impactDirection, impactMagnitude, timeHorizon, causalPath } = mapping;

    const directionText =
        impactDirection === 'INCREASE'
            ? 'increase'
            : impactDirection === 'DECREASE'
                ? 'decrease'
                : 'affect';

    const magnitudeText =
        impactMagnitude === 'HIGH'
            ? 'significantly'
            : impactMagnitude === 'MEDIUM'
                ? 'moderately'
                : 'slightly';

    const horizonText =
        timeHorizon === 'SHORT'
            ? 'in the next 0-3 months'
            : timeHorizon === 'MEDIUM'
                ? 'over the next 3-12 months'
                : 'over 12+ months';

    const driversText = affectedDrivers.join(', ');

    return `
The event "${event.summary}" is expected to ${magnitudeText} ${directionText} your business costs ${horizonText}.

This impact primarily affects: ${driversText}.

The causal reasoning is as follows:
${causalPath.map((step, idx) => `${idx + 1}. ${step.description}: ${step.mechanism}`).join('\n')}

This analysis is based on deterministic causal rules and your business model configuration.
  `.trim();
}
