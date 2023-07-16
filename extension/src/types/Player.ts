import { SubmissionStatus } from "./Questions";
export interface Player {
    id: number;
    username: string;
    updatedAt: Date;
    roomId: string;
}

export interface PlayerSubmission {
    title: string;
    titleSlug: string;
    difficulty: string;
    status?: SubmissionStatus;
    updatedAt?: Date;
    url: string;
}

export interface PlayerWithSubmissions extends Player {
    submissions: PlayerSubmission[];
}
