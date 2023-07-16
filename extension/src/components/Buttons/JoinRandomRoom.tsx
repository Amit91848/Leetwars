import {
    useIsMutating,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { SERVER_URL } from "../../config";

async function joinRandomRoom() {
    const response = await fetch(`${SERVER_URL}/rooms/random`, {
        credentials: "include",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.json()) throw new Error("Failed to join random room");

    return response.json();
}

export default function JoinRandomRoomButton() {
    const queryClient = useQueryClient();
    const isLoadingGlobal = useIsMutating();

    const { mutate: mutateSessionJoinRandomRoom, isLoading } = useMutation({
        mutationFn: joinRandomRoom,
        onSuccess: (data) => {
            queryClient.setQueryData(["session"], data);
        },
        onError: (data) => {
            console.log(data);
        },
    });

    const handleClickJoinRandomRoom = () => {
        if (isLoadingGlobal) return;

        mutateSessionJoinRandomRoom();
    };

    return (
        <button
            id="join-random-room"
            onClick={handleClickJoinRandomRoom}
            className={`${
                isLoadingGlobal && "cursor-default"
            } flex h-[33px] w-[144px] flex-col items-center justify-center rounded-lg bg-lc-green-button font-medium text-white transition-all hover:bg-lc-green-button-hover`}
        >
            {!isLoading ? (
                "Join random room"
            ) : (
                <div className="dot-flashing"></div>
            )}
        </button>
    );
}
