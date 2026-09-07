-- CreateTable
CREATE TABLE "BundleReport" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "totalSizeKb" DOUBLE PRECISION NOT NULL,
    "gzipSizeKb" DOUBLE PRECISION,
    "chunks" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BundleReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BundleReport_appId_createdAt_idx" ON "BundleReport"("appId", "createdAt");

-- CreateIndex
CREATE INDEX "BundleReport_releaseId_idx" ON "BundleReport"("releaseId");

-- AddForeignKey
ALTER TABLE "BundleReport" ADD CONSTRAINT "BundleReport_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
