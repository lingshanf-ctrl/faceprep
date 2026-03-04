-- CreateEnum
CREATE TYPE "BugType" AS ENUM ('BUG', 'FEATURE', 'OTHER');

-- CreateEnum
CREATE TYPE "BugStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL,
    "type" "BugType" NOT NULL DEFAULT 'BUG',
    "content" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "status" "BugStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BugReport_status_idx" ON "BugReport"("status");

-- CreateIndex
CREATE INDEX "BugReport_createdAt_idx" ON "BugReport"("createdAt");
