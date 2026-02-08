-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "country" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "reliability" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "affectedEntities" TEXT[],
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessModel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My SaaS Business',
    "industry" TEXT NOT NULL DEFAULT 'SAAS',
    "revenueDrivers" JSONB NOT NULL,
    "costDrivers" JSONB NOT NULL,
    "sensitivities" JSONB NOT NULL,
    "operatingRegions" TEXT[],
    "customerRegions" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "businessModelId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "impactDirection" TEXT NOT NULL,
    "impactMagnitude" TEXT NOT NULL,
    "timeHorizon" TEXT NOT NULL,
    "affectedDrivers" TEXT[],
    "causalPath" JSONB NOT NULL,
    "assumptions" JSONB NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "confidenceRationale" TEXT NOT NULL,
    "llmExplanation" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "userNotes" TEXT,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Event_eventType_region_timestamp_idx" ON "Event"("eventType", "region", "timestamp");

-- CreateIndex
CREATE INDEX "Event_timestamp_idx" ON "Event"("timestamp");

-- CreateIndex
CREATE INDEX "BusinessModel_userId_active_idx" ON "BusinessModel"("userId", "active");

-- CreateIndex
CREATE INDEX "Insight_businessModelId_generatedAt_idx" ON "Insight"("businessModelId", "generatedAt");

-- CreateIndex
CREATE INDEX "Insight_eventId_idx" ON "Insight"("eventId");

-- CreateIndex
CREATE INDEX "Insight_dismissed_generatedAt_idx" ON "Insight"("dismissed", "generatedAt");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "EventSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessModel" ADD CONSTRAINT "BusinessModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_businessModelId_fkey" FOREIGN KEY ("businessModelId") REFERENCES "BusinessModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
