-- Store only a SHA-256 digest of refresh-token bearer credentials.
-- Existing sessions are preserved by hashing their current token before the
-- plaintext column is removed.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "refresh_tokens" ADD COLUMN "token_hash" TEXT;

UPDATE "refresh_tokens"
SET "token_hash" = encode(digest("token", 'sha256'), 'hex');

ALTER TABLE "refresh_tokens"
  ALTER COLUMN "token_hash" SET NOT NULL;

DROP INDEX IF EXISTS "refresh_tokens_token_key";
DROP INDEX IF EXISTS "refresh_tokens_token_idx";
ALTER TABLE "refresh_tokens" DROP COLUMN "token";

CREATE UNIQUE INDEX "refresh_tokens_token_hash_key"
  ON "refresh_tokens"("token_hash");
CREATE INDEX "refresh_tokens_token_hash_idx"
  ON "refresh_tokens"("token_hash");
