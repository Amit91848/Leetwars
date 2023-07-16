import { Router } from "express";
import * as RoomHandler from "./room.handler";

const router = Router();

router.get("/players", RoomHandler.getRoomPlayers);
router.post("/", RoomHandler.createRoom);
// router.post("/random", RoomHandler.joinRandomRoom);
router.post("/exit", RoomHandler.exitRoom);
router.post("/:id", RoomHandler.joinRoomById);

export default router;
