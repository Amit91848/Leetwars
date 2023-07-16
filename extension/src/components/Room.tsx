import { useIsMutating } from "@tanstack/react-query";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";

import { RoomSession } from "../types/Session";
import SendIcon from "../icons/SendIcon";
import CheckMarkIcon from "../icons/CheckMarkIcon";
import CopyIcon from "../icons/CopyIcon";
import ExitRoomButton from "./Buttons/ExitRoomButton";
import Question from "./Question";
import { SERVER_URL } from "../config";
import { ChatEvent, MessageInterface } from "../types/Message";
import Message from "./Message";
import PlayersButton from "./Buttons/PlayersButton";
import { SubmissionStatus } from "../types/Questions";

interface Props {
    room: RoomSession;
    username: string;
}

interface SubmissionRequestBody {
    submissionStatus: SubmissionStatus;
    questionTitleSlug: string;
    url: string;
}

let copyIconTimer: number;

function kebabToTitle(string: string): string {
    return string
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export default function Room({ room, username }: Props) {
    const { questions, roomId, userColor, duration, createdAt } = room;

    const isLoadingGlobal = useIsMutating();
    const [hasClickedCopyIcon, setHasClickedCopyIcon] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const messagesRef = useRef<HTMLUListElement | null>(null);
    const [messages, setMessages] = useState<MessageInterface[]>([]);
    const previousSubmissionUrl = useRef<string | null>(null);

    const handleSubmitMessage = (event: SyntheticEvent) => {
        event.preventDefault();

        if (
            isLoadingGlobal ||
            !inputRef.current ||
            !socketRef.current ||
            (inputRef.current && !inputRef.current.value.trim())
        )
            return;

        console.log("sending socket now");

        const socket = socketRef.current;
        const inputText = inputRef.current.value.trim();

        const newChatMessage: MessageInterface = {
            body: inputText,
            username: username,
            chatEvent: ChatEvent.Message,
            color: userColor,
            timestamp: Date.now(),
        };

        socket.emit("chat-message", newChatMessage);

        inputRef.current.value = "";
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(roomId);
        clearTimeout(copyIconTimer);
        setHasClickedCopyIcon(() => true);
        copyIconTimer = setTimeout(() => {
            setHasClickedCopyIcon(() => false);
        }, 2000);
    };

    useEffect(() => {
        const socket: Socket = io(SERVER_URL, {
            transports: ["websocket", "polling"],
        });

        socket.on("keep-alive", () => {
            socket.emit("keep-alive", "keep-alive-message-client");
        });

        socket.on("chat-message", (newMessage) => {
            setMessages((prevMessages) => {
                const newMessages = [...prevMessages, newMessage];

                localStorage.setItem(
                    "leetWarsMessages",
                    JSON.stringify({ roomId: roomId, messages: newMessages })
                );

                return newMessages;
            });
        });

        socketRef.current = socket;

        async function handleClickCodeSubmitButton(event: MessageEvent) {
            console.log(event.data);
            if (
                event.origin !== "https://leetcode.com" ||
                event.data?.extension !== "leetwars" ||
                event.data?.button !== "submit" ||
                !event.data?.event ||
                (previousSubmissionUrl &&
                    previousSubmissionUrl.current ===
                        event.data?.submissionUrl &&
                    event.data?.event !== "accepted")
                // (event.data?.currentProblem &&
                //     !questions
                //         .map((question) => question.titleSlug)
                //         .includes(event.data.currentProblem))
            ) {
                return;
            }
            let submissionStatus;
            switch (event.data.event) {
                case "submit": {
                    const newSubmissionMessage: MessageInterface = {
                        timestamp: Date.now(),
                        username: username,
                        body: "submitted.",
                        chatEvent: ChatEvent.Submit,
                        color: userColor,
                    };
                    submissionStatus = SubmissionStatus.Attempted;
                    socket.emit("chat-message", newSubmissionMessage);
                    break;
                }
                case "accepted": {
                    const newAcceptedMessage: MessageInterface = {
                        timestamp: Date.now(),
                        username: username,
                        body: `solved ${kebabToTitle(
                            event.data.currentProblem
                        )}!`,
                        chatEvent: ChatEvent.Accepted,
                        color: userColor,
                    };
                    submissionStatus = SubmissionStatus.Accepted;
                    socket.emit("chat-message", newAcceptedMessage);
                    break;
                }
            }

            if (duration) {
                const submittedAt = new Date();
                const dateConvertedSubmittedAt = new Date(submittedAt);
                const dateConvertedCreatedAt = new Date(createdAt);
                const submittedAtInSeconds = Math.floor(
                    dateConvertedSubmittedAt.getTime() / 1000
                );
                const createdAtInSeconds = Math.floor(
                    dateConvertedCreatedAt.getTime() / 1000
                );

                if (submittedAtInSeconds > createdAtInSeconds + duration * 60) {
                    return;
                }
            }

            if (
                !submissionStatus ||
                !event.data?.currentProblem ||
                !event.data?.submissionUrl
            ) {
                console.error(
                    "Did not POST submission because of missing data"
                );
                return;
            }
            previousSubmissionUrl.current = event.data.submissionUrl;
            const submissionRequestBody: SubmissionRequestBody = {
                submissionStatus: submissionStatus,
                questionTitleSlug: event.data.currentProblem,
                url: event.data.submissionUrl,
            };
            const response = await fetch(`${SERVER_URL}/submissions/`, {
                credentials: "include",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submissionRequestBody),
            });
            if (!response.ok) {
                console.error("Failed to POST submission to server");
            }
        }

        window.addEventListener("message", handleClickCodeSubmitButton);

        return () => {
            socket.disconnect();
            window.removeEventListener("message", handleClickCodeSubmitButton);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, userColor, username]);

    useEffect(() => {
        function autoScrollToLatestMessage() {
            if (!messagesRef.current) {
                return;
            }

            const latestMessage = messagesRef.current.lastElementChild;
            latestMessage?.scrollIntoView({
                behavior: "auto",
            });
        }

        autoScrollToLatestMessage();
    }, [messages]);

    return (
        <div className="flex h-screen flex-col gap-y-2 border-x-8 border-t-8 border-lc-border bg-lc-bg px-2 text-sm text-white">
            <div className="mx-2 mt-2 flex flex-col" id="first-box">
                <div
                    className="flex flex-row items-start justify-between"
                    id="first-line"
                >
                    <div className="text-gray-2300 flex flex-col gap-y-1 text-gray-400">
                        <div className="text-xs font-medium">Room code:</div>

                        <div
                            className="flex flex-row items-center gap-x-2 rounded-lg bg-lc-fg py-[6px] pl-3 pr-2 text-xl font-medium"
                            id="room-code-and-copy-button"
                        >
                            <div className="text-white" id="room-code-display">
                                {roomId}
                            </div>

                            <div
                                id="copy-button"
                                onClick={handleCopy}
                                className="cursor-pointer rounded-md bg-lc-fg p-2 transition-all hover:bg-zinc-600"
                            >
                                {hasClickedCopyIcon ? (
                                    <CheckMarkIcon />
                                ) : (
                                    <CopyIcon />
                                )}
                            </div>
                        </div>
                    </div>

                    <ExitRoomButton />
                </div>
                <div id="second-line" className="my-4 flex flex-col gap-1">
                    {questions.map((question) => (
                        <Question question={question} key={question.id} />
                    ))}
                </div>
                <PlayersButton room={room} />
            </div>

            <div
                id="leetwars-chat"
                className="mx-2 grow overflow-auto border border-transparent px-3 py-[10px]"
            >
                <ul ref={messagesRef} className="flex flex-col gap-y-1.5">
                    {messages.map((message, index) => (
                        <Message key={index} message={message} />
                    ))}
                </ul>
            </div>

            <div className="mx-2 mb-2.5 flex flex-row items-center justify-between gap-x-2 rounded-lg border border-transparent bg-lc-fg py-[5px] pl-3 pr-2 focus-within:border-blue-500 hover:border-blue-500">
                <form onSubmit={handleSubmitMessage} className="flex-grow">
                    <input
                        ref={inputRef}
                        type="text"
                        name="chatbox"
                        id="chatbox"
                        className="w-full bg-lc-fg  outline-none"
                        placeholder="Type a message..."
                        spellCheck="false"
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                    />
                </form>
                <div
                    onClick={handleSubmitMessage}
                    className={`${
                        isLoadingGlobal ? "cursor-default" : "cursor-pointer"
                    } rounded-md bg-lc-fg p-2 transition-all hover:bg-zinc-600`}
                >
                    <SendIcon />
                </div>
            </div>
        </div>
    );
}
