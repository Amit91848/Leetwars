import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SERVER_URL } from "../../config";
import { Modal } from "../Modal";
import { PlayerSubmission, PlayerWithSubmissions } from "../../types/Player";
import { RoomSession } from "../../types/Session";
import { IQuestion, SubmissionStatus } from "../../types/Questions";
import GraphIcon from "../../icons/GraphIcon";
import { Tooltip } from "react-tooltip";
import AcceptedSubmissionIcon from "../../icons/AcceptedSubmissionIcon";
import AttemptedSubmissionIcon from "../../icons/AttemptedSubmissionIcon";
import NoSubmissionIcon from "../../icons/NoSubmissionIcon";

let cancelQueryTimer: number;

interface Props {
    room: RoomSession;
}

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

export default function PlayersButton({ room }: Props) {
    const { questions, roomId } = room;
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();
    const {
        data: players,
        isFetching,
        refetch,
    } = useQuery<PlayerWithSubmissions[]>({
        queryKey: ["players"],
        queryFn: async ({ signal }) => {
            const response = await fetch(`${SERVER_URL}/rooms/players`, {
                credentials: "include",
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                signal,
            });
            if (!response.ok) {
                throw new Error("Failed to fetch current players");
            }
            return response.json();
        },
        refetchOnWindowFocus: false,
        enabled: false,
        keepPreviousData: false,
    });

    const numberOfPlayersOnline = players
        ? players.filter((player) => player.roomId == roomId).length
        : 0;

    const playersWithSortedSubmissions = getPlayersWithSortedSubmissions(
        players,
        questions
    );

    const rankedPlayers = rankPlayers(playersWithSortedSubmissions);

    function closeModal() {
        setIsOpen(false);
        cancelQueryTimer = setTimeout(() => {
            queryClient.cancelQueries(["players"]);
        }, 1000);
    }

    function openModal() {
        clearTimeout(cancelQueryTimer);
        setIsOpen(true);
        refetch();
    }

    return (
        <>
            <div
                className="flex cursor-pointer flex-col items-center rounded-lg bg-lc-fg px-3 py-[10px] transition-all hover:bg-lc-fg-hover"
                onClick={openModal}
            >
                <div className="flex flex-row items-center gap-2">
                    <GraphIcon />
                    <div>Scoreboard</div>
                </div>
            </div>
            {isOpen && (
                <Modal
                    dialogSubheading={`${numberOfPlayersOnline} players online`}
                    closeModal={closeModal}
                    isOpen={isOpen}
                    dialogHeading="Players"
                    isLoading={isFetching}
                    panelHeight="350px"
                >
                    <Scoreboard players={rankedPlayers} roomId={roomId} />
                </Modal>
            )}
        </>
    );
}

function Scoreboard({
    players,
    roomId,
}: {
    players: PlayerWithSubmissions[] | undefined;
    roomId: string;
}) {
    return (
        <div className="mb-3 mt-3 flex flex-col overflow-auto text-sm font-medium text-lc-text-light dark:text-white">
            {players
                ? players.map((player) => {
                      return (
                          <div
                              className="flex flex-row gap-3 px-5 py-2 odd:bg-[hsl(0,0%,85%)] odd:bg-opacity-[45%] dark:odd:bg-lc-bg dark:odd:bg-opacity-[45%]"
                              key={player.id}
                          >
                              <div
                                  className={`w-28 truncate ${
                                      player.roomId === roomId
                                          ? ""
                                          : `text-[hsl(0,0%,15%,37%)] dark:text-[hsl(0,0%,100%,30%)]`
                                  }`}
                              >
                                  {player.username}
                              </div>
                              <Scores
                                  playerEnteredAt={player.updatedAt}
                                  submissions={player.submissions}
                              />
                          </div>
                      );
                  })
                : null}
        </div>
    );
}

function Scores({
    playerEnteredAt,
    submissions,
}: {
    playerEnteredAt: Date;
    submissions: PlayerSubmission[];
}) {
    function getSubmissionStatusIcon(status: SubmissionStatus | undefined) {
        if (status === SubmissionStatus.Accepted) {
            return <AcceptedSubmissionIcon />;
        } else if (status === SubmissionStatus.Attempted) {
            return <AttemptedSubmissionIcon />;
        } else {
            return <NoSubmissionIcon />;
        }
    }

    function getSubmissionTime(
        playerEnteredAt: Date,
        submission: PlayerSubmission
    ) {
        const submissionTime = submission.updatedAt;
        if (
            submission.status !== SubmissionStatus.Accepted ||
            !submissionTime
        ) {
            return undefined;
        }

        const solvedTime = calculateTimeDifference(
            playerEnteredAt,
            submissionTime
        );

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

    function handleClickSubmission(submission: PlayerSubmission) {
        if (submission.status !== SubmissionStatus.Accepted) {
            return;
        }
        window.open(submission.url, "_blank");
    }

    return (
        <div className="flex flex-1 flex-row justify-around">
            {submissions.map((submission) => {
                return (
                    <div
                        onClick={() => handleClickSubmission(submission)}
                        className={
                            submission.status === SubmissionStatus.Accepted
                                ? "cursor-pointer"
                                : ""
                        }
                        key={submission.titleSlug}
                    >
                        <div
                            data-tooltip-id={submission.titleSlug}
                            data-tooltip-content={getSubmissionTime(
                                playerEnteredAt,
                                submission
                            )}
                        >
                            {getSubmissionStatusIcon(submission.status)}
                        </div>
                        {submission.status === SubmissionStatus.Accepted && (
                            <Tooltip id={submission.titleSlug} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function getPlayersWithSortedSubmissions(
    players: PlayerWithSubmissions[] | undefined,
    questions: IQuestion[]
) {
    if (!players) {
        return undefined;
    }
    const playersWithSortedSubmissions: PlayerWithSubmissions[] = [];
    for (const player of players) {
        const submissions = player.submissions;
        const sortedSubmissions = sortSubmissionsByQuestionOrder(
            submissions,
            questions
        );
        playersWithSortedSubmissions.push({
            ...player,
            submissions: sortedSubmissions,
        });
    }
    return playersWithSortedSubmissions;
}

function sortSubmissionsByQuestionOrder(
    submissions: PlayerSubmission[],
    questions: IQuestion[]
) {
    const sortedSubmissions = [];
    for (const question of questions) {
        const foundSubmission = submissions.find(
            (submission) => submission.titleSlug === question.titleSlug
        );
        if (foundSubmission) {
            sortedSubmissions.push(foundSubmission);
        }
    }
    return sortedSubmissions;
}

function rankPlayers(players: PlayerWithSubmissions[] | undefined) {
    if (!players) {
        return undefined;
    }
    // Sort players by number of accepted, then by number of acceptted + attempted, then by total submission time
    const ranked = players.sort((a, b) => {
        const aAccepted = a.submissions.filter(
            (submission) =>
                submission.status === SubmissionStatus.Accepted &&
                submission.updatedAt
        );
        const bAccepted = b.submissions.filter(
            (submission) =>
                submission.status === SubmissionStatus.Accepted &&
                submission.updatedAt
        );

        if (aAccepted.length !== bAccepted.length) {
            return bAccepted.length - aAccepted.length;
        }

        const aSubmissions = a.submissions.filter(
            (submission) => submission.status
        );
        const bSubmissions = b.submissions.filter(
            (submission) => submission.status
        );

        if (aSubmissions.length !== bSubmissions.length) {
            return bSubmissions.length - aSubmissions.length;
        }

        const aTotalSubmissionTime = aAccepted.reduce((total, submission) => {
            return (
                total +
                calculateTimeDifference(a.updatedAt, submission.updatedAt!)
            );
        }, 0);
        const bTotalSubmissionTime = bAccepted.reduce((total, submission) => {
            return (
                total +
                calculateTimeDifference(b.updatedAt, submission.updatedAt!)
            );
        }, 0);

        return aTotalSubmissionTime - bTotalSubmissionTime;
    });

    return ranked;
}
