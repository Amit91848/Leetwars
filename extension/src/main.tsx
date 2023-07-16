import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";
import "react-tooltip/dist/react-tooltip.css";

ReactDOM.createRoot(
    document.getElementById("leetwars-root") as HTMLElement
).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
