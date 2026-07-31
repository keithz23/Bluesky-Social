ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MODERATION';

ALTER TABLE "notifications"
  ADD COLUMN "message" TEXT,
  ALTER COLUMN "actor_id" DROP NOT NULL;

ALTER TABLE "notifications"
  DROP CONSTRAINT IF EXISTS "notifications_actor_id_fkey";

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
