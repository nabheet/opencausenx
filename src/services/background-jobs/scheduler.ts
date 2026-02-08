/**
 * Background Jobs Scheduler
 * 
 * WHY: Simple in-process job scheduler for periodic tasks.
 * NO external infrastructure (Redis, BullMQ, etc.) - just setInterval.
 * 
 * LIMITATION: Jobs stop when server restarts. For production, consider:
 * - Persistent job queue (BullMQ + Redis)
 * - Separate worker processes
 * - Cloud-based schedulers (AWS EventBridge, GCP Cloud Scheduler)
 * 
 * For MVP: This is good enough.
 */

import { config } from '@/lib/config';

export type JobFunction = () => Promise<void>;

export interface Job {
    name: string;
    fn: JobFunction;
    intervalMinutes: number;
    running: boolean;
    lastRun?: Date;
    nextRun?: Date;
    errors: number;
}

/**
 * Simple job scheduler
 */
class JobScheduler {
    private jobs: Map<string, Job> = new Map();
    private intervals: Map<string, NodeJS.Timeout> = new Map();

    /**
     * Register a job
     */
    register(name: string, fn: JobFunction, intervalMinutes: number): void {
        if (this.jobs.has(name)) {
            console.warn(`Job ${name} is already registered`);
            return;
        }

        const job: Job = {
            name,
            fn,
            intervalMinutes,
            running: false,
            errors: 0,
        };

        this.jobs.set(name, job);
        console.log(`Registered job: ${name} (runs every ${intervalMinutes} minutes)`);
    }

    /**
     * Start a job
     */
    start(name: string): void {
        const job = this.jobs.get(name);
        if (!job) {
            console.error(`Job ${name} not found`);
            return;
        }

        if (this.intervals.has(name)) {
            console.warn(`Job ${name} is already running`);
            return;
        }

        // Run immediately
        this.runJob(job);

        // Schedule periodic runs
        const intervalMs = job.intervalMinutes * 60 * 1000;
        const interval = setInterval(() => {
            this.runJob(job);
        }, intervalMs);

        this.intervals.set(name, interval);
        job.nextRun = new Date(Date.now() + intervalMs);

        console.log(`Started job: ${name}`);
    }

    /**
     * Stop a job
     */
    stop(name: string): void {
        const interval = this.intervals.get(name);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(name);
            console.log(`Stopped job: ${name}`);
        }

        const job = this.jobs.get(name);
        if (job) {
            job.running = false;
            job.nextRun = undefined;
        }
    }

    /**
     * Start all registered jobs
     */
    startAll(): void {
        for (const name of this.jobs.keys()) {
            this.start(name);
        }
    }

    /**
     * Stop all jobs
     */
    stopAll(): void {
        for (const name of this.jobs.keys()) {
            this.stop(name);
        }
    }

    /**
     * Run a job once
     */
    private async runJob(job: Job): Promise<void> {
        if (job.running) {
            console.warn(`Job ${job.name} is already running, skipping this execution`);
            return;
        }

        job.running = true;
        job.lastRun = new Date();

        try {
            console.log(`Running job: ${job.name}`);
            await job.fn();
            console.log(`Job ${job.name} completed successfully`);
        } catch (error) {
            console.error(`Job ${job.name} failed:`, error);
            job.errors++;
        } finally {
            job.running = false;

            // Calculate next run
            const intervalMs = job.intervalMinutes * 60 * 1000;
            job.nextRun = new Date(Date.now() + intervalMs);
        }
    }

    /**
     * Get job status
     */
    getStatus(): Job[] {
        return Array.from(this.jobs.values());
    }

    /**
     * Get specific job
     */
    getJob(name: string): Job | undefined {
        return this.jobs.get(name);
    }
}

// Singleton instance
export const scheduler = new JobScheduler();

/**
 * Initialize default jobs
 * WHY: Set up standard background jobs for OpenCausenx
 */
export async function initializeJobs(): Promise<void> {
    // Import job functions dynamically to avoid circular dependencies
    const { fetchAndIngestEvents } = await import('./jobs');
    const { generateInsightsForAllBusinesses } = await import('../insight-engine/generator');

    // Job 1: Fetch and ingest events
    scheduler.register(
        'fetch-events',
        fetchAndIngestEvents,
        config.jobs.eventFetchInterval
    );

    // Job 2: Generate insights
    scheduler.register(
        'generate-insights',
        async () => {
            const result = await generateInsightsForAllBusinesses(true);
            console.log(`Generated insights: ${result.created} created, ${result.skipped} skipped, ${result.errors} errors`);
        },
        config.jobs.insightGenerationInterval
    );

    console.log('Background jobs initialized');
}

/**
 * Start all jobs
 * WHY: Called when server starts
 */
export function startJobs(): void {
    scheduler.startAll();
    console.log('Background jobs started');
}

/**
 * Stop all jobs
 * WHY: Called when server shuts down
 */
export function stopJobs(): void {
    scheduler.stopAll();
    console.log('Background jobs stopped');
}
