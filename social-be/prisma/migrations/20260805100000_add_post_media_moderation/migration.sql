CREATE TYPE "PostMediaModerationStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'FLAGGED',
    'BLOCKED',
    'SKIPPED',
    'ERROR'
);

ALTER TABLE "post_media"
ADD COLUMN "moderation_status" "PostMediaModerationStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "moderation_labels" JSONB,
ADD COLUMN "moderation_checked_at" TIMESTAMP(3),
ADD COLUMN "moderation_provider" TEXT,
ADD COLUMN "moderation_block_reason" TEXT;

CREATE INDEX "idx_post_media_moderation_status"
ON "post_media"("moderation_status");
