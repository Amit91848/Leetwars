import {
    useIsMutating,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { SERVER_URL } from "../../config";
import { RoomSettings, defaultRoomSettings } from "../../types/RoomSettings";

const createRoom = async () => {
    const storedRoomSettings = localStorage.getItem("roomSettings");
    let roomSettings: RoomSettings;

    if (storedRoomSettings) {
        roomSettings = JSON.parse(storedRoomSettings);
    } else {
        try {
            localStorage.setItem(
                "roomSettings",
                JSON.stringify(defaultRoomSettings)
            );
            roomSettings = defaultRoomSettings;
        } catch (err) {
            throw new Error("Error to save room settings in local storage");
        }
    }

    const response = await fetch(`${SERVER_URL}/rooms/`, {
        credentials: "include",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(roomSettings),
    });

    if (!response.ok) {
        throw new Error("Failed to create a new room");
    }

    return response.json();
};

export default function CreateRoomButton() {
    const queryClient = useQueryClient();
    const isLoadingGlobal = useIsMutating();

    const { mutate: mutateSessionCreateRoom, isLoading } = useMutation({
        mutationFn: createRoom,
        onSuccess: (data) => {
            queryClient.setQueryData(["session"], data);
        },
    });

    const handleClickCreateRoom = async () => {
        if (isLoadingGlobal) return;

        mutateSessionCreateRoom();
    };
    return (
        <button
            id="create-room"
            onClick={handleClickCreateRoom}
            className={`${isLoadingGlobal && "cursor-default"}
        flex h-[33px] w-[106px] flex-col items-center justify-center rounded-lg bg-lc-green-button font-medium text-white transition-all hover:bg-lc-green-button-hover`}
        >
            {!isLoading ? "Create room" : <div className="dot-flashing"></div>}
        </button>
    );
}
