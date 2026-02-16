/*
  Warnings:

  - You are about to drop the column `display_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `interests` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `link_title` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_phone_number_idx";

-- DropIndex
DROP INDEX "users_phone_number_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "display_name",
DROP COLUMN "interests",
DROP COLUMN "link",
DROP COLUMN "link_title",
DROP COLUMN "location",
DROP COLUMN "phone_number",
DROP COLUMN "website",
ALTER COLUMN "date_of_birth" SET DATA TYPE DATE;
