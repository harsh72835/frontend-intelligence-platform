-- CreateTable
CREATE TABLE "SourceMap" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "release" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SourceMap_appId_release_idx" ON "SourceMap"("appId", "release");

-- CreateIndex
CREATE UNIQUE INDEX "SourceMap_appId_release_filename_key" ON "SourceMap"("appId", "release", "filename");
