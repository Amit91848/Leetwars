import { SERVER_URL, authProviders } from "../config";
import SignInButton from "./SignInButton";

import LeetwarsIcon from "../assets/LeetwarsIcon.png";
import { useQuery } from "@tanstack/react-query";
import { SessionResponse } from "../types/Session";
import Spinner from "./Spinner";
import Home from "./Home";

async function fetchSession() {
    const response = await fetch(`${SERVER_URL}/sessions`, {
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Failed to fetch session");
    }
    return response.json();
}

export default function Login() {
    const { data: session, isLoading } = useQuery<SessionResponse>(
        ["session"],
        fetchSession
    );

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center border-x-8 border-t-8 border-lc-border bg-lc-bg p-2 text-sm">
                <Spinner />
            </div>
        );
    }

    if (session) {
        return <Home session={session} />;
    } else {
        return (
            <div className="flex h-screen flex-col items-center border-x-8 border-t-8 border-lc-border bg-lc-bg p-2 text-sm">
                <a
                    href="https://github.com/Amit91848/Leetwars"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <img
                        className="mb-2 mt-32 h-24 w-24"
                        src={LeetwarsIcon}
                        alt="Leetwars icon"
                    />
                </a>
                <div className="text-xl font-semibold text-white">Leetwars</div>
                <div className="mt-10 flex flex-col items-center justify-center gap-y-3">
                    {authProviders.map((authProvider) => {
                        return (
                            <SignInButton
                                key={authProvider.name}
                                authProvider={authProvider}
                            />
                        );
                    })}
                </div>
            </div>
        );
    }
}
