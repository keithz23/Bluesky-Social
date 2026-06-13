-- CreateTable
CREATE TABLE "list_members" (
    "id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "added_by" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "list_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "list_members_list_id_idx" ON "list_members"("list_id");

-- CreateIndex
CREATE UNIQUE INDEX "list_members_list_id_member_id_key" ON "list_members"("list_id", "member_id");

-- AddForeignKey
ALTER TABLE "list_members" ADD CONSTRAINT "list_members_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_members" ADD CONSTRAINT "list_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
