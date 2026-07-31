-- The earlier migration named add_pg_trgm did not create the extension or
-- indexes. ILIKE '%query%' needs trigram GIN indexes; B-tree indexes cannot
-- serve a leading-wildcard search.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Prisma executes PostgreSQL migrations transactionally, so these indexes are
-- deliberately not CONCURRENTLY. For a very large production table, create
-- the same indexes concurrently in a scheduled maintenance operation first.
CREATE INDEX IF NOT EXISTS "users_username_trgm_idx"
  ON "users" USING GIN ("username" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "users_display_name_trgm_idx"
  ON "users" USING GIN ("display_name" gin_trgm_ops);
