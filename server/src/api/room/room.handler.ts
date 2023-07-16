import { NextFunction, Request, Response } from "express";
import prisma from "../..";
import { Question, Room, RoomQuestions } from "@prisma/client";
import { nanoid } from "nanoid";
import {
    deleteUserRoomSession,
    getUserRoomSession,
    setUserRoomSession,
} from "../session/session.handler";
import {
    generateRandomUserColor,
    createMessage,
    getNumberOfQuestionsPerDifficulty,
} from "../../utils";
import { RoomSession } from "../../types/Session";
import { io } from "../app";
import { ChatEvent } from "../../types/Message";
import { QuestionFilterKind, RoomSettings } from "../../types/RoomSettings";
import { PlayerWithSubmissions } from "../../types/Player";

export async function createRoom(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        await prisma.$transaction(async (prisma) => {
            if (!req.user)
                throw new Error(
                    "Request authenticated but user session not found"
                );

            let roomSettings: RoomSettings = req.body;
            let { kind: filterKind, selections } = roomSettings.questionFilter;

            if (filterKind !== QuestionFilterKind.Topics)
                throw new Error(`Invalid question filter kind: ${filterKind}`);

            let filteredQuestions: Question[] = await prisma.question.findMany({
                where: {
                    tags: {
                        hasSome: selections,
                    },
                },
            });

            let easyQuestions = filteredQuestions.filter(
                (question) => question.difficulty === "Easy"
            );
            let mediumQuestions = filteredQuestions.filter(
                (question) => question.difficulty === "Medium"
            );
            let hardQuestions = filteredQuestions.filter(
                (question) => question.difficulty === "Hard"
            );

            let {
                Easy: numberOfEasy,
                Medium: numberOfMedium,
                Hard: numberOfHard,
            } = getNumberOfQuestionsPerDifficulty(
                roomSettings.difficulty,
                easyQuestions,
                mediumQuestions,
                hardQuestions
            );

            // Select 4 random questions
            let randomlySelectedEasyQuestions: Question[] = easyQuestions
                .sort(() => Math.random() - 0.5)
                .slice(0, numberOfEasy);
            let randomlySelectedMediumQuestions: Question[] = mediumQuestions
                .sort(() => Math.random() - 0.5)
                .slice(0, numberOfMedium);
            let randomlySelectedHardQuestions: Question[] = hardQuestions
                .sort(() => Math.random() - 0.5)
                .slice(0, numberOfHard);

            let randomlySelectedQuestions =
                randomlySelectedEasyQuestions.concat(
                    randomlySelectedMediumQuestions,
                    randomlySelectedHardQuestions
                );

            let newRoomId = nanoid(10);
            let newRoom = await prisma.room.create({
                data: {
                    questionFilterKind: filterKind,
                    questionFilterSelections: selections,
                    duration: roomSettings.duration,
                    id: newRoomId,
                },
            });

            let roomQuestionsData: RoomQuestions[] =
                randomlySelectedQuestions.map(({ id }) => {
                    return {
                        questionId: id,
                        roomId: newRoom.id,
                    };
                });

            // Add the questions to the room in the join table (RoomQuestion)
            await prisma.roomQuestions.createMany({
                data: roomQuestionsData,
            });

            // Update the user table with the roomId
            const user = await prisma.user.update({
                data: {
                    roomId: newRoomId,
                },
                where: {
                    id: req.user.id,
                },
            });

            const { joinedAt } = await prisma.roomUser.create({
                data: {
                    userId: user.id,
                    roomId: newRoomId,
                },
            });

            const userColor = generateRandomUserColor();

            await setUserRoomSession(req.user.id, {
                questions: randomlySelectedQuestions,
                roomId: newRoom.id,
                userColor: userColor,
                duration: roomSettings.duration,
                createdAt: newRoom.createdAt,
                joinedAt,
            });

            io.to(newRoomId).emit(
                "chat-message",
                createMessage({
                    body: " joined the room!",
                    chatEvent: ChatEvent.Join,
                    color: userColor,
                    username: req.session.passport.user.username,
                })
            );

            return res.redirect("../sessions");
        });
    } catch (err) {
        return next(err);
    }
}

export async function exitRoom(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        await exitRoomFunction(req);
        return res.redirect("../sessions");
    } catch (err) {
        next(err);
    }
}

export async function exitRoomFunction(req: Request) {
    await prisma.$transaction(async (prisma) => {
        if (!req.session.passport.user)
            throw new Error("Request authenticated but session not found");

        const room = await getUserRoomSession(req.session.passport.user.id);

        if (!room) throw new Error("Request authenticated but room not found");

        const roomId = room.roomId;

        // Without this there are multiple left the room messages
        const user = await prisma.user.findUnique({
            where: {
                id: req.session.passport.user.id,
            },
        });

        if (!user?.roomId)
            throw new Error("User not in any room. Possibly a race condition");

        await prisma.user.update({
            data: {
                roomId: null,
            },
            where: {
                id: user.id,
            },
        });

        // check number of users in room, if none delete the room
        const currentUsers = await prisma.user.findMany({
            where: {
                roomId: roomId,
            },
        });

        if (currentUsers.length === 0) {
            await prisma.room.delete({
                where: {
                    id: roomId,
                },
            });
        }

        io.to(room.roomId).emit(
            "chat-message",
            createMessage({
                body: " left the room!",
                chatEvent: ChatEvent.Leave,
                color: generateRandomUserColor(),
                username: req.session.passport.user.username,
            })
        );

        // Update the session
        await deleteUserRoomSession(req.session.passport.user.id);
        req.session.save();
    });
}

export async function joinRoomById(
    req: Request,
    res: Response,
    next: NextFunction
) {
    await prisma.$transaction(async (prisma) => {
        if (!req.user)
            throw new Error("Request authenticated but user session not found");

        const roomId = req.params.id;

        const room = await prisma.room.findUnique({
            where: {
                id: roomId,
            },
        });

        if (!room) throw new Error(`Cannot find room with id: ${roomId}`);

        const questions: Question[] = await prisma.$queryRaw`
            SELECT "q".* FROM "RoomQuestions" as "rq"
            INNER JOIN "Question" as "q"
            on "q".id = "rq"."questionId"
            WHERE "rq"."roomId" = ${roomId}
        `;

        const user = await prisma.user.update({
            data: {
                roomId: roomId,
            },
            where: {
                id: req.user.id,
            },
        });

        const roomUser = await prisma.roomUser.findUnique({
            where: {
                roomId_userId: {
                    roomId: roomId,
                    userId: req.user.id,
                },
            },
        });

        let joinedAt: Date;

        if (!roomUser) {
            // Update the room user table with the join time
            let roomUser = await prisma.roomUser.create({
                data: {
                    userId: user.id,
                    roomId: roomId,
                },
            });
            joinedAt = roomUser.joinedAt;
        } else {
            joinedAt = roomUser.joinedAt;
        }

        const userColor = generateRandomUserColor();

        const roomData: RoomSession = {
            roomId,
            questions,
            userColor,
            duration: room.duration,
            createdAt: room.createdAt,
            joinedAt: joinedAt,
        };

        io.emit(
            "chat-message",
            createMessage({
                body: " joined the room!",
                chatEvent: ChatEvent.Join,
                color: userColor,
                username: req.session.passport.user.username,
            })
        );
        await setUserRoomSession(req.user.id, roomData);

        return res.redirect("../sessions");
    });
}

// export async function joinRandomRoom(
//     req: Request,
//     res: Response,
//     next: NextFunction
// ) {
//     try {
//         await prisma.$transaction(async (prisma) => {
//             if (!req.user) {
//                 throw new Error(
//                     "Request authenticated but user session not found!"
//                 );
//             }

//             let randomlySelectRoom: Room[] =
//                 await prisma.$queryRaw`SELECT * FROM "Room" ORDER BY random() LIMIT 1`;
//             console.log("executed query: ", randomlySelectRoom);

//             //TODO: Alert user when room is available, use mq maybe?
//             if (!randomlySelectRoom || randomlySelectRoom.length === 0) {
//                 console.log("cannot join room");
//                 throw new Error(
//                     "No rooms currently available for randomly joining"
//                 );
//             }

//             let randomlySelectedId = randomlySelectRoom[0].id;

//             let questions: Question[] = await prisma.$queryRaw`
//                 SELECT "Q".* FROM "RoomQuestions" as "RQ"
//                 INNER JOIN "Question" as "Q"
//                 ON "Q"."id" = "RQ"."questionId"
//                 WHERE "RQ"."roomId" = ${randomlySelectedId}
//             `;
//             console.log("fetched questions: ", questions);

//             await prisma.user.update({
//                 data: {
//                     roomId: randomlySelectedId,
//                 },
//                 where: {
//                     id: req.user.id,
//                 },
//             });
//             console.log("updated user table");

//             const userColor = generateRandomUserColor();

//             let room = {
//                 roomId: randomlySelectedId,
//                 questions: questions,
//                 userColor: userColor,
//             };

//             await setUserRoomSession(req.user.id, room);
//             console.log("updated user session");

//             io.emit(
//                 "chat-message",
//                 createMessage({
//                     body: " joined the room!",
//                     chatEvent: ChatEvent.Join,
//                     color: userColor,
//                     username: req.session.passport.user.username,
//                 })
//             );

//             return res.redirect("../sessions");
//         });
//     } catch (err) {
//         return next(err);
//     }
// }

export async function getRoomPlayers(
    req: Request,
    res: Response<PlayerWithSubmissions[]>,
    next: NextFunction
) {
    try {
        let room = await getUserRoomSession(req.session.passport.user.id);
        if (!room?.roomId) {
            throw new Error("Could not find a room for the current user");
        }
        let roomId = room.roomId;
        let response: PlayerWithSubmissions[] = await prisma.$queryRaw`SELECT 
        u."id",
        u."username",
        u."roomId",
        ru."joinedAt" as "updatedAt",
        json_agg(
            json_build_object(
                'questionId', q."id", 
                'title', q."title",
                'titleSlug', q."titleSlug",
                'difficulty', q."difficulty",
                'status', s."status",
                'updatedAt', s."updatedAt",
                'url', s."url"
            )
        ) AS submissions
    FROM "User" u
    JOIN "RoomUser" ru ON u."id" = ru."userId"
    JOIN "Room" r ON r."id" = ${roomId} AND ru."roomId" = r."id"
    JOIN "RoomQuestions" rq ON r."id" = rq."roomId"
    JOIN "Question" q ON rq."questionId" = q."id"
    LEFT JOIN "Submission" s ON u."id" = s."userId" AND s."questionId" = q."id" AND s."roomId" = r."id"
    GROUP BY u."id", ru."joinedAt", u."roomId";`;
        return res.json(response);
    } catch (error) {
        return next(error);
    }
}
