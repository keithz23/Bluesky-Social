/*
  Warnings:

  - You are about to drop the column `is_pinned` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `mentions` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[display_name]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `display_name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "conversation_participants_user_id_is_pinned_last_read_at_idx";

-- DropIndex
DROP INDEX "messages_conversation_id_status_idx";

-- DropIndex
DROP INDEX "users_displayName_key";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "is_pinned",
DROP COLUMN "mentions";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "displayName",
ADD COLUMN     "display_name" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "message_mentions" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_deleted_for" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_deleted_for_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_mentions_user_id_idx" ON "message_mentions"("user_id");

-- CreateIndex
CREATE INDEX "message_mentions_message_id_idx" ON "message_mentions"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_mentions_message_id_user_id_key" ON "message_mentions"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "message_deleted_for_user_id_idx" ON "message_deleted_for"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_deleted_for_message_id_user_id_key" ON "message_deleted_for"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "conversation_participants_user_id_left_at_is_pinned_idx" ON "conversation_participants"("user_id", "left_at", "is_pinned");

-- CreateIndex
CREATE UNIQUE INDEX "users_display_name_key" ON "users"("display_name");

-- AddForeignKey
ALTER TABLE "message_mentions" ADD CONSTRAINT "message_mentions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_mentions" ADD CONSTRAINT "message_mentions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_deleted_for" ADD CONSTRAINT "message_deleted_for_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_deleted_for" ADD CONSTRAINT "message_deleted_for_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
