-- CreateTable
CREATE TABLE "home_timelines" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "home_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "home_timelines_user_id_created_at_id_idx" ON "home_timelines"("user_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "home_timelines_author_id_idx" ON "home_timelines"("author_id");

-- CreateIndex
CREATE INDEX "home_timelines_post_id_idx" ON "home_timelines"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "home_timelines_user_id_post_id_key" ON "home_timelines"("user_id", "post_id");

-- AddForeignKey
ALTER TABLE "home_timelines" ADD CONSTRAINT "home_timelines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_timelines" ADD CONSTRAINT "home_timelines_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_timelines" ADD CONSTRAINT "home_timelines_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
