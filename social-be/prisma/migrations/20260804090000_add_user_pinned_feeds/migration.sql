CREATE TABLE "user_pinned_feeds" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "feed_slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pinned_feeds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_pinned_feeds_user_id_feed_slug_key"
ON "user_pinned_feeds"("user_id", "feed_slug");

CREATE INDEX "user_pinned_feeds_user_id_position_idx"
ON "user_pinned_feeds"("user_id", "position");

ALTER TABLE "user_pinned_feeds"
ADD CONSTRAINT "user_pinned_feeds_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
