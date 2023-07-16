import { SERVER_URL } from "../config";
import { AuthProvider } from "../types/AuthProvider";

interface Props {
    authProvider: AuthProvider;
}

async function signIn(providerEndpoint: string) {
    console.log(SERVER_URL);
    window.open(`${SERVER_URL}/${providerEndpoint}`);
}

export default function SignInButton({ authProvider }: Props) {
    const { color, hoverColor, icon, name, authProviderEndpoint } =
        authProvider;

    const handleSignIn = () => {
        signIn(authProviderEndpoint);
    };
    return (
        <button
            className={`rounded-md transition-all ${color} ${hoverColor} flex w-60 flex-row items-center justify-center gap-x-4 py-2.5 text-white`}
            onClick={handleSignIn}
        >
            <img src={icon} alt={`Sign in with ${name}`} className="h-6 w-6" />
            <div className="font-semibold">Sign in with {name}</div>
        </button>
    );
}
