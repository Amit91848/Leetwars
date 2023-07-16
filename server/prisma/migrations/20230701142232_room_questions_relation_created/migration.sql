/*
  Warnings:

  - You are about to drop the `Questions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Questions";

-- CreateTable
CREATE TABLE "Question" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "titleSlug" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomQuestions" (
    "roomId" TEXT NOT NULL,
    "questionId" INTEGER NOT NULL,

    CONSTRAINT "RoomQuestions_pkey" PRIMARY KEY ("roomId","questionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Question_title_key" ON "Question"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Question_titleSlug_key" ON "Question"("titleSlug");

-- AddForeignKey
ALTER TABLE "RoomQuestions" ADD CONSTRAINT "RoomQuestions_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomQuestions" ADD CONSTRAINT "RoomQuestions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
