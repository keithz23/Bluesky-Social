-- Add compound indexes for cursor pagination and high-traffic social queries.

-- Posts/feed/profile/replies
CREATE INDEX IF NOT EXISTS "idx_posts_feed_cursor"
ON "posts"("is_deleted", "parent_post_id", "created_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "idx_posts_user_cursor"
ON "posts"("user_id", "is_deleted", "created_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "idx_posts_user_parent_cursor"
ON "posts"("user_id", "is_deleted", "parent_post_id", "created_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "idx_posts_replies_cursor"
ON "posts"("parent_post_id", "created_at", "id");

-- Post media includes and media filters
CREATE INDEX IF NOT EXISTS "idx_post_media_order"
ON "post_media"("post_id", "order_index");

CREATE INDEX IF NOT EXISTS "idx_post_media_type_post"
ON "post_media"("media_type", "post_id");

-- Follow lists
CREATE INDEX IF NOT EXISTS "idx_follows_following_cursor"
ON "follows"("follower_id", "created_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "idx_follows_followers_cursor"
ON "follows"("following_id", "created_at" DESC, "id" DESC);

-- Reactions and saved posts
CREATE INDEX IF NOT EXISTS "idx_likes_user_cursor"
ON "likes"("user_id", "created_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "idx_likes_post_cursor"
ON "likes"("post_id", "created_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "idx_reposts_user_cursor"
ON "reposts"("user_id", "created_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "idx_reposts_post_cursor"
ON "reposts"("post_id", "created_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "idx_bookmarks_user_cursor"
ON "bookmarks"("user_id", "created_at" DESC, "id" DESC);

-- Lists
CREATE INDEX IF NOT EXISTS "idx_lists_user_cursor"
ON "lists"("user_id", "created_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "idx_list_members_cursor"
ON "list_members"("list_id", "added_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "idx_list_members_member_list"
ON "list_members"("member_id", "list_id");

CREATE INDEX IF NOT EXISTS "idx_list_items_cursor"
ON "list_items"("list_id", "added_at" DESC, "id" DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS "idx_notifications_user_cursor"
ON "notifications"("user_id", "created_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "idx_notifications_unread"
ON "notifications"("user_id", "is_read", "created_at" DESC);

-- Chat conversations/messages
CREATE INDEX IF NOT EXISTS "idx_conversations_activity_cursor"
ON "conversations"("last_message_at" DESC, "created_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "idx_conversations_created_cursor"
ON "conversations"("created_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "idx_participants_user_active"
ON "conversation_participants"("user_id", "left_at", "conversation_id");

CREATE INDEX IF NOT EXISTS "idx_messages_conversation_cursor"
ON "messages"("conversation_id", "created_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "idx_messages_visible_cursor"
ON "messages"("conversation_id", "is_deleted", "created_at" DESC, "id" DESC);

CREATE INDEX IF NOT EXISTS "idx_message_deleted_for_user_message"
ON "message_deleted_for"("user_id", "message_id");

-- Auth/session maintenance
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_created"
ON "refresh_tokens"("user_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_password_reset_active"
ON "password_reset_tokens"("user_id", "usedAt", "expiresAt");

CREATE INDEX IF NOT EXISTS "idx_password_reset_ip_window"
ON "password_reset_tokens"("createdIp", "createdAt" DESC);
