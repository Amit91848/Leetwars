import { NextFunction, Request, Response } from "express";
import { getUserRoomSession } from "../session/session.handler";
import {
    SubmissionRequestBody,
    SubmissionStatus,
} from "../../types/Submission";
import prisma from "../..";
import { PlayerSubmission, PlayerWithSubmissions } from "../../types/Player";
import { RoomSession } from "../../types/Session";
import { ChatEvent, MessageInterface } from "../../types/Message";
import { io } from "../app";

export const createSubmission = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const room = await getUserRoomSession(req.session.passport.user.id);
        if (!room?.roomId)
            throw new Error("Cannot find room for the current user");

        const userId = req.session.passport.user.id;
        const roomId = room.roomId;

        const submissionRequestBody: SubmissionRequestBody = req.body;
        const {
            submissionStatus,
            questionTitleSlug,
            url: submissionUrl,
        } = submissionRequestBody;

        const question = await prisma.question.findUnique({
            where: {
                titleSlug: questionTitleSlug,
            },
        });

        if (!question) {
            throw new Error(
                "Could not find a question with the given titleSlug"
            );
        }

        const questionId = question.id;
        const existingSubmission = await prisma.submission.findUnique({
            where: {
                userId_questionId_roomId: {
                    userId: userId,
                    questionId: questionId,
                    roomId: roomId,
                },
            },
        });

        if (existingSubmission?.status == SubmissionStatus.Accepted) {
            return;
        }

        await prisma.submission.upsert({
            where: {
                userId_questionId_roomId: {
                    userId: userId,
                    questionId: questionId,
                    roomId: roomId,
                },
            },
            update: {
                status: submissionStatus,
                url: submissionUrl,
            },
            create: {
                userId: userId,
                roomId: roomId,
                questionId: questionId,
                status: submissionStatus,
                url: submissionUrl,
            },
        });

        if (submissionStatus !== SubmissionStatus.Accepted) {
            return;
        }

        let response: PlayerWithSubmissions[] =
            await prisma.$queryRaw`SELECT u.id, u.username, u."updatedAt", json_agg(json_build_object(
                'questionId', q.id,
                'title', q.title,
                'titleSlug', q."titleSlug",
                'difficulty', q.difficulty,
                'status', s.status,
                'updatedAt', s."updatedAt",
                'url', s.url
            ))  as submissions
            FROM "User" u
            LEFT JOIN "RoomQuestion" rq ON u."roomId" = rq."roomId"
            LEFT JOIN "Question" q ON rq."questionId" = q.id
            LEFT JOIN "Submission" s ON s."questionId" = rq."questionId" AND s."roomId" = rq."roomId" AND s."userId" = u.id
            WHERE rq."roomId" = ${roomId} AND u.id = ${userId}
            GROUP BY u.id;`;

        const allAccepted = response.every((player) => {
            return player.submissions.every((submission) => {
                return submission.status === SubmissionStatus.Accepted;
            });
        });
        const lastAcceptedSubmission = response[0].submissions.filter(
            (submission) => {
                return submission.titleSlug === questionTitleSlug;
            }
        )[0];

        let playerEnteredAt = response[0].updatedAt;

        let completedTimeString = getSubmissionTime(
            playerEnteredAt,
            lastAcceptedSubmission
        );

        if (allAccepted && completedTimeString) {
            sendCompletedRoomMessage(
                req.session.passport.user.username,
                room,
                completedTimeString
            );
        }

        function sendCompletedRoomMessage(
            username: string,
            room: RoomSession,
            completedTimeString: string
        ) {
            let completedRoomMessage: MessageInterface = {
                timestamp: Date.now(),
                username: username,
                body: `completed the room in ${completedTimeString}!`,
                chatEvent: ChatEvent.Complete,
                color: room.userColor,
            };
            io.to(room.roomId).emit("chat-message", completedRoomMessage);
        }
    } catch (err) {}
};

function calculateTimeDifference(playerEnteredAt: Date, submittedAt: Date) {
    const dateConvertedSubmissionTime = new Date(submittedAt);

    let dateConvertedPlayerEnteredAt = new Date(playerEnteredAt);
    const userTimezoneOffset =
        dateConvertedPlayerEnteredAt.getTimezoneOffset() * 60000;
    dateConvertedPlayerEnteredAt = new Date(
        dateConvertedPlayerEnteredAt.getTime() +
            userTimezoneOffset * Math.sign(userTimezoneOffset)
    );

    const timeDifference =
        dateConvertedSubmissionTime.getTime() -
        dateConvertedPlayerEnteredAt.getTime();

    return timeDifference;
}

function getSubmissionTime(
    playerEnteredAt: Date,
    submission: PlayerSubmission
) {
    const submissionTime = submission.updatedAt;
    if (submission.status !== SubmissionStatus.Accepted || !submissionTime) {
        return undefined;
    }

    const solvedTime = calculateTimeDifference(playerEnteredAt, submissionTime);

    const seconds = Math.floor((solvedTime / 1000) % 60);
    const minutes = Math.floor((solvedTime / (1000 * 60)) % 60);
    const hours = Math.floor((solvedTime / (1000 * 60 * 60)) % 24);

    let result = "";
    if (seconds) {
        result += `${seconds}s`;
    }
    if (minutes) {
        result = `${minutes}m ${result}`;
    }
    if (hours) {
        result = `${hours}h ${result}`;
    }
    return result;
}
