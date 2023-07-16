-- DropForeignKey
ALTER TABLE "RoomQuestions" DROP CONSTRAINT "RoomQuestions_roomId_fkey";

-- AddForeignKey
ALTER TABLE "RoomQuestions" ADD CONSTRAINT "RoomQuestions_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
