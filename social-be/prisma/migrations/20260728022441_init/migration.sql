/*
  Warnings:

  - You are about to drop the column `reason` on the `reports` table. All the data in the column will be lost.
  - Added the required column `rule_id` to the `reports` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RuleSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "KeywordAction" AS ENUM ('FLAG', 'AUTO_HIDE', 'WARN');

-- AlterTable
ALTER TABLE "reports" DROP COLUMN "reason",
ADD COLUMN     "rule_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "RuleSeverity" NOT NULL DEFAULT 'LOW',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keywords" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "action" "KeywordAction" NOT NULL DEFAULT 'FLAG',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rules_is_active_display_order_idx" ON "rules"("is_active", "display_order");

-- CreateIndex
CREATE INDEX "keywords_rule_id_idx" ON "keywords"("rule_id");

-- CreateIndex
CREATE UNIQUE INDEX "keywords_word_key" ON "keywords"("word");

-- CreateIndex
CREATE INDEX "reports_rule_id_idx" ON "reports"("rule_id");

-- AddForeignKey
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
