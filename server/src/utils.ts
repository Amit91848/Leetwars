import { Question } from "@prisma/client";
import { ChatEvent, ICreateMessage, MessageInterface } from "./types/Message";
import {
    RoomDifficulty,
    RoomDifficultyNumberOfQuestions,
} from "./types/RoomSettings";

export function generateRandomUserColor(): string {
    let colorChoices = [
        "text-red-400",
        "text-orange-400",
        "text-amber-400",
        "text-yellow-400",
        "text-green-400",
        "text-emerald-400",
        "text-teal-400",
        "text-cyan-400",
        "text-sky-400",
        "text-blue-400",
        "text-indigo-400",
        "text-violet-400",
        "text-purple-400",
        "text-fuchsia-400",
        "text-pink-400",
        "text-rose-400",
    ];

    return colorChoices[Math.floor(Math.random() * colorChoices.length)];
}

export const createMessage = ({
    body,
    chatEvent,
    color,
    username,
}: ICreateMessage): MessageInterface => {
    return {
        timestamp: Date.now(),
        username,
        body,
        chatEvent,
        color,
    };
};

export function getNumberOfQuestionsPerDifficulty(
    roomDifficulty: RoomDifficulty,
    easyQuestions: Question[],
    mediumQuestions: Question[],
    hardQuestions: Question[]
): RoomDifficultyNumberOfQuestions {
    let { Easy: easy, Medium: medium, Hard: hard } = roomDifficulty;
    if (easy && medium && hard) {
        let numberOfQuestions = {
            Easy: 1,
            Medium: 2,
            Hard: 1,
        };

        // If there are not enough easy questions, get more medium or hard questions.
        if (easyQuestions.length < numberOfQuestions.Easy) {
            let diff = numberOfQuestions.Easy - easyQuestions.length;
            numberOfQuestions.Easy = easyQuestions.length;
            if (mediumQuestions.length >= numberOfQuestions.Medium + diff) {
                numberOfQuestions.Medium += diff;
            } else if (hardQuestions.length >= numberOfQuestions.Hard + diff) {
                numberOfQuestions.Hard += diff;
            }
        }

        // If there are not enough medium questions, get more easy or hard questions.
        if (mediumQuestions.length < numberOfQuestions.Medium) {
            let diff = numberOfQuestions.Medium - mediumQuestions.length;
            numberOfQuestions.Medium = mediumQuestions.length;
            if (easyQuestions.length >= numberOfQuestions.Easy + diff) {
                numberOfQuestions.Easy += diff;
            } else if (hardQuestions.length >= numberOfQuestions.Hard + diff) {
                numberOfQuestions.Hard += diff;
            }
        }

        // If there are not enough hard questions, get more easy or medium questions.
        if (hardQuestions.length < numberOfQuestions.Hard) {
            let diff = numberOfQuestions.Hard - hardQuestions.length;
            numberOfQuestions.Hard = hardQuestions.length;
            if (easyQuestions.length >= numberOfQuestions.Easy + diff) {
                numberOfQuestions.Easy += diff;
            } else if (
                mediumQuestions.length >=
                numberOfQuestions.Medium + diff
            ) {
                numberOfQuestions.Medium += diff;
            }
        }

        return numberOfQuestions;
    } else if (easy && medium) {
        let numberOfQuestions = {
            Easy: 2,
            Medium: 2,
            Hard: 0,
        };

        if (easyQuestions.length < numberOfQuestions.Easy) {
            let diff = numberOfQuestions.Easy - easyQuestions.length;
            numberOfQuestions.Easy = easyQuestions.length;
            if (mediumQuestions.length >= numberOfQuestions.Medium + diff) {
                numberOfQuestions.Medium += diff;
            }
        }

        if (mediumQuestions.length < numberOfQuestions.Medium) {
            let diff = numberOfQuestions.Medium - mediumQuestions.length;
            numberOfQuestions.Medium = mediumQuestions.length;
            if (easyQuestions.length >= numberOfQuestions.Easy + diff) {
                numberOfQuestions.Easy += diff;
            }
        }

        return numberOfQuestions;
    } else if (easy && hard) {
        let numberOfQuestions = {
            Easy: 2,
            Medium: 0,
            Hard: 2,
        };

        if (easyQuestions.length < numberOfQuestions.Easy) {
            let diff = numberOfQuestions.Easy - easyQuestions.length;
            numberOfQuestions.Easy = easyQuestions.length;
            if (hardQuestions.length >= numberOfQuestions.Hard + diff) {
                numberOfQuestions.Hard += diff;
            }
        }

        if (hardQuestions.length < numberOfQuestions.Hard) {
            let diff = numberOfQuestions.Hard - hardQuestions.length;
            numberOfQuestions.Hard = hardQuestions.length;
            if (easyQuestions.length >= numberOfQuestions.Easy + diff) {
                numberOfQuestions.Easy += diff;
            }
        }

        return numberOfQuestions;
    } else if (medium && hard) {
        let numberOfQuestions = {
            Easy: 0,
            Medium: 2,
            Hard: 2,
        };

        if (mediumQuestions.length < numberOfQuestions.Medium) {
            let diff = numberOfQuestions.Medium - mediumQuestions.length;
            numberOfQuestions.Medium = mediumQuestions.length;
            if (hardQuestions.length >= numberOfQuestions.Hard + diff) {
                numberOfQuestions.Hard += diff;
            }
        }

        if (hardQuestions.length < numberOfQuestions.Hard) {
            let diff = numberOfQuestions.Hard - hardQuestions.length;
            numberOfQuestions.Hard = hardQuestions.length;
            if (mediumQuestions.length >= numberOfQuestions.Medium + diff) {
                numberOfQuestions.Medium += diff;
            }
        }

        return numberOfQuestions;
    } else if (easy) {
        return {
            Easy: 4,
            Medium: 0,
            Hard: 0,
        };
    } else if (medium) {
        return {
            Easy: 0,
            Medium: 4,
            Hard: 0,
        };
    } else if (hard) {
        return {
            Easy: 0,
            Medium: 0,
            Hard: 4,
        };
    }
    return {
        Easy: 0,
        Medium: 0,
        Hard: 0,
    };
}
