-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_reporter_id_fkey";

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "is_auto_generated" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "reporter_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "reports_is_auto_generated_idx" ON "reports"("is_auto_generated");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
