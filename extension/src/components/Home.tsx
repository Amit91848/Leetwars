import { SessionResponse } from "../types/Session";
import CreateRoomButton from "./Buttons/CreateRoomButton";
import JoinRoomByIdButton from "./Buttons/JoinRoomByIdButton";
import { RoomSettingsButton } from "./Buttons/RoomSettingsButton";
import SignOutButton from "./Buttons/SignOutButton";
import Room from "./Room";

interface Props {
    session: SessionResponse;
}

export default function Home({ session }: Props) {
    const { username, picture, room } = session;

    if (room) {
        return <Room username={username} room={room} />;
    } else {
        return (
            <div className="flex h-screen flex-col items-center justify-center border-x-8 border-t-8 border-lc-border bg-lc-bg p-2 text-sm">
                <div className="mr-4 flex w-full flex-col items-end">
                    <SignOutButton />
                </div>

                <div className="mx-2 mt-32 h-screen">
                    <div className="mb-6 flex flex-row items-center justify-center gap-x-3">
                        {picture ? (
                            <img
                                className="w-12 rounded-full"
                                src={picture}
                                alt="User profile picture"
                            />
                        ) : null}
                        <div className="text-lg font-semibold text-white">
                            {username}
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-y-4 rounded-xl border-[12px] border-lc-fg px-6 py-10">
                        <div className="flex flex-row items-center gap-2">
                            <CreateRoomButton />
                            <RoomSettingsButton />
                        </div>
                        <div className="text-gray-500">- OR -</div>
                        <JoinRoomByIdButton />
                    </div>
                </div>
            </div>
        );
    }
}
