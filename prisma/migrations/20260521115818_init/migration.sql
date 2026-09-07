-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('development', 'staging', 'production');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('web_vital', 'route_change', 'api_timing', 'js_error', 'long_task');

-- CreateEnum
CREATE TYPE "SummaryGranularity" AS ENUM ('hour', 'day');

-- CreateEnum
CREATE TYPE "RegressionStatus" AS ENUM ('healthy', 'warning', 'regressed');

-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ingestKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "App_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "environment" "Environment" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "releaseId" TEXT,
    "type" "EventType" NOT NULL,
    "environment" "Environment" NOT NULL,
    "sessionId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteSummary" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "releaseId" TEXT,
    "route" TEXT NOT NULL,
    "bucketStart" TIMESTAMP(3) NOT NULL,
    "granularity" "SummaryGranularity" NOT NULL,
    "p75Lcp" DOUBLE PRECISION,
    "p75Inp" DOUBLE PRECISION,
    "avgCls" DOUBLE PRECISION,
    "avgApiLatency" DOUBLE PRECISION,
    "jsErrorCount" INTEGER NOT NULL DEFAULT 0,
    "longTaskCount" INTEGER NOT NULL DEFAULT 0,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouteSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseSummary" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "p75Lcp" DOUBLE PRECISION,
    "p75Inp" DOUBLE PRECISION,
    "avgCls" DOUBLE PRECISION,
    "avgApiLatency" DOUBLE PRECISION,
    "jsErrorCount" INTEGER NOT NULL DEFAULT 0,
    "longTaskCount" INTEGER NOT NULL DEFAULT 0,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "regressionStatus" "RegressionStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReleaseSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "App_slug_key" ON "App"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "App_ingestKey_key" ON "App"("ingestKey");

-- CreateIndex
CREATE INDEX "Release_appId_createdAt_idx" ON "Release"("appId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Release_appId_version_environment_key" ON "Release"("appId", "version", "environment");

-- CreateIndex
CREATE INDEX "Event_appId_timestamp_idx" ON "Event"("appId", "timestamp");

-- CreateIndex
CREATE INDEX "Event_appId_route_timestamp_idx" ON "Event"("appId", "route", "timestamp");

-- CreateIndex
CREATE INDEX "Event_appId_type_timestamp_idx" ON "Event"("appId", "type", "timestamp");

-- CreateIndex
CREATE INDEX "Event_releaseId_timestamp_idx" ON "Event"("releaseId", "timestamp");

-- CreateIndex
CREATE INDEX "Event_sessionId_timestamp_idx" ON "Event"("sessionId", "timestamp");

-- CreateIndex
CREATE INDEX "RouteSummary_appId_route_bucketStart_idx" ON "RouteSummary"("appId", "route", "bucketStart");

-- CreateIndex
CREATE INDEX "RouteSummary_releaseId_bucketStart_idx" ON "RouteSummary"("releaseId", "bucketStart");

-- CreateIndex
CREATE UNIQUE INDEX "RouteSummary_appId_releaseId_route_bucketStart_granularity_key" ON "RouteSummary"("appId", "releaseId", "route", "bucketStart", "granularity");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseSummary_releaseId_key" ON "ReleaseSummary"("releaseId");

-- CreateIndex
CREATE INDEX "ReleaseSummary_appId_createdAt_idx" ON "ReleaseSummary"("appId", "createdAt");

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteSummary" ADD CONSTRAINT "RouteSummary_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteSummary" ADD CONSTRAINT "RouteSummary_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseSummary" ADD CONSTRAINT "ReleaseSummary_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseSummary" ADD CONSTRAINT "ReleaseSummary_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
