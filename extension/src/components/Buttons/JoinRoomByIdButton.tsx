import {
    useIsMutating,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { SyntheticEvent, useRef } from "react";
import { SERVER_URL } from "../../config";

async function joinRoomById(roomId: string) {
    const response = await fetch(`${SERVER_URL}/rooms/${roomId}`, {
        credentials: "include",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) throw new Error("Failed to join room by id");
    return response.json();
}

export default function JoinRoomByIdButton() {
    const queryClient = useQueryClient();
    const isLoadingGlobal = useIsMutating();
    const roomRef = useRef<HTMLInputElement>(null);

    const { mutate: mutateSessionJoinRoomById, isLoading } = useMutation({
        mutationFn: joinRoomById,
        onSuccess: (data) => {
            queryClient.setQueryData(["session"], data);
        },
    });

    async function handleSubmitJoinRoomById(event: SyntheticEvent) {
        event.preventDefault();
        if (
            !roomRef.current ||
            roomRef.current.value.trim() == "" ||
            isLoadingGlobal
        )
            return;
        const inputRoomCode = roomRef.current.value.trim();
        mutateSessionJoinRoomById(inputRoomCode);
    }

    return (
        <div
            id="join-room-by-id"
            className="flex flex-row items-center justify-between gap-4"
        >
            <div className="flex flex-row items-center justify-between gap-x-2 rounded-lg border border-transparent bg-lc-fg px-3 py-[6px] text-white focus-within:border-blue-500 hover:border-blue-500">
                <form onSubmit={handleSubmitJoinRoomById}>
                    <input
                        className="w-full bg-lc-fg  outline-none"
                        ref={roomRef}
                        type="text"
                        name="roomNumber"
                        id="roomNumber"
                        placeholder="Room code"
                        spellCheck="false"
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                    />
                </form>
            </div>

            <button
                id="join-room"
                onClick={handleSubmitJoinRoomById}
                className={`${
                    isLoadingGlobal && "cursor-default"
                } flex h-[33px] w-[90px] flex-col items-center justify-center rounded-lg bg-lc-green-button font-medium text-white transition-all hover:bg-lc-green-button-hover`}
            >
                {!isLoading ? (
                    "Join room"
                ) : (
                    <div className="dot-flashing"></div>
                )}
            </button>
        </div>
    );
}
