/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN "password" TEXT;
ALTER TABLE "Student" ADD COLUMN "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_username_key" ON "Student"("username");
