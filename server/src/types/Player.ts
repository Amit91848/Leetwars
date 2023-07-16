import { SubmissionStatus } from "./Submission";

export interface RoomsPathParameter {
    id: string;
}

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
}

export interface PlayerWithSubmissions extends Player {
    submissions: PlayerSubmission[];
}
