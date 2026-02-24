/*
  Warnings:

  - The values [FOLLOWERS,FOLLOWING,MENTIONS] on the enum `ReplyPolicy` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `review_approve` on the `posts` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReplyPolicy_new" AS ENUM ('ANYONE', 'NOBODY', 'CUSTOM');
ALTER TABLE "public"."posts" ALTER COLUMN "reply_policy" DROP DEFAULT;
ALTER TABLE "posts" ALTER COLUMN "reply_policy" TYPE "ReplyPolicy_new" USING ("reply_policy"::text::"ReplyPolicy_new");
ALTER TYPE "ReplyPolicy" RENAME TO "ReplyPolicy_old";
ALTER TYPE "ReplyPolicy_new" RENAME TO "ReplyPolicy";
DROP TYPE "public"."ReplyPolicy_old";
ALTER TABLE "posts" ALTER COLUMN "reply_policy" SET DEFAULT 'ANYONE';
COMMIT;

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "review_approve",
ADD COLUMN     "allow_quote" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reply_followers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reply_following" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reply_mentioned" BOOLEAN NOT NULL DEFAULT false;
