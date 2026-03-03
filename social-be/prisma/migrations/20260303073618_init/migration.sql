/*
  Warnings:

  - Added the required column `userId` to the `mentions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "mentions" ADD COLUMN     "userId" TEXT NOT NULL;
