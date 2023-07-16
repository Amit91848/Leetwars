-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('Easy', 'Medium', 'Hard');

-- CreateTable
CREATE TABLE "Questions" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "titleSlug" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,

    CONSTRAINT "Questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Questions_title_key" ON "Questions"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Questions_titleSlug_key" ON "Questions"("titleSlug");
