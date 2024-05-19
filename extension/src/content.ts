const APP_URL = "https://app.leetwars.localhost";

const dragHandlebarSVG = `<svg class="handlebar-svg" id="drag-handlebar-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 14" width="2" height="14">
<circle r="1" transform="matrix(4.37114e-08 -1 -1 -4.37114e-08 1 1)"></circle>
<circle r="1" transform="matrix(4.37114e-08 -1 -1 -4.37114e-08 1 7)"></circle>
<circle r="1" transform="matrix(4.37114e-08 -1 -1 -4.37114e-08 1 13)"></circle>
    </svg>`;

const openHandlebarSVG = `<svg class="handlebar-svg" id="open-handlebar-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
    <path fill-rule="evenodd" d="M7.913 19.071l7.057-7.078-7.057-7.064a1 1 0 011.414-1.414l7.764 7.77a1 1 0 010 1.415l-7.764 7.785a1 1 0 01-1.414-1.414z" clip-rule="evenodd"></path>
    </svg>`;

async function main() {
    let prevSubmissionId = "";
    const reactRoot = document.createElement("iframe");

    reactRoot.src = "https://app.leetwars.localhost";
    reactRoot.id = "leetwars-iframe";
    reactRoot.allow = "clipboard-read; clipboard-write";

    const handlebar = document.createElement("div");
    handlebar.id = "leetwars-handlebar";
    handlebar.style.minWidth = "8px";
    handlebar.style.userSelect = "none"; // This line disables text selection on the handlebar
    handlebar.style.position = "relative";
    handlebar.style.left = "-4px";

    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.display = "none";

    let isResizing = false;
    let initialMousePosition = 0;
    let isOpen = true;

    function setToggleState(toggleState: boolean) {
        if (toggleState) {
            reactRoot.style.display = "block";
            handlebar.innerHTML = dragHandlebarSVG;
            handlebar.style.cursor = "col-resize";
            chrome.storage.local.set({ leetwarsToggleState: true });
            isOpen = true;
            handlebar.style.zIndex = "10";
        } else {
            reactRoot.style.display = "none";
            handlebar.innerHTML = openHandlebarSVG;
            handlebar.style.cursor = "pointer";
            chrome.storage.local.set({ leetwarsToggleState: false });
            isOpen = false;
            handlebar.style.zIndex = "0";
        }
    }

    function startResizing(event: MouseEvent) {
        isResizing = true;
        initialMousePosition = event.clientX;
        overlay.style.display = "block";
    }

    handlebar.addEventListener("mousedown", (event) => {
        if (!isOpen) {
            setToggleState(true);
            return;
        }
        startResizing(event);
    });
    handlebar.addEventListener("dragstart", (event) => event.preventDefault()); // Prevent the default drag behavior

    handlebar.addEventListener("dblclick", () => {
        if (isOpen) {
            setToggleState(false);
        }
    });

    function stopResizing() {
        isResizing = false;
        overlay.style.display = "none"; // Hide the overlay
    }

    function throttle(func: any, limit: number) {
        let inThrottle: boolean;
        return (...args: any) => {
            if (!inThrottle) {
                func.apply(null, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    const MIN_WIDTH = 350;
    const MAX_WIDTH = 800;

    function updateWidth(event: MouseEvent) {
        if (!isResizing) return;
        const deltaX = initialMousePosition - event.clientX;
        initialMousePosition = event.clientX;
        const currentWidth = parseInt(reactRoot.style.width);
        let newWidth = currentWidth + deltaX;
        if (
            isOpen &&
            initialMousePosition - window.innerWidth - MIN_WIDTH > -450
        ) {
            setToggleState(false);
            return;
        } else if (
            !isOpen &&
            initialMousePosition - window.innerWidth - MIN_WIDTH < -450
        ) {
            setToggleState(true);
            return;
        }
        if (newWidth < MIN_WIDTH) {
            newWidth = MIN_WIDTH;
            if (
                deltaX < 0 &&
                event.clientX > handlebar.getBoundingClientRect().right
            ) {
                initialMousePosition = event.clientX;
            }
        } else if (newWidth > MAX_WIDTH) {
            newWidth = MAX_WIDTH;
            if (
                deltaX > 0 &&
                event.clientX < handlebar.getBoundingClientRect().left
            ) {
                initialMousePosition = event.clientX;
            }
        } else {
            if (
                deltaX < 0 &&
                event.clientX > handlebar.getBoundingClientRect().right
            ) {
                newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));
            } else if (
                deltaX > 0 &&
                event.clientX < handlebar.getBoundingClientRect().left
            ) {
                newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));
            } else {
                return;
            }
        }

        reactRoot.style.width = `${newWidth}px`;
        chrome.storage.local.set({ leetwarsWidth: newWidth });
    }

    window.addEventListener("mousemove", throttle(updateWidth, 16));
    window.addEventListener("mouseup", stopResizing);

    chrome.storage.local.get("leetwarsToggleState", (result) => {
        const toggleState = result.leetwarsToggleState ?? true;
        if (toggleState) {
            setToggleState(true);
        } else {
            setToggleState(false);
        }
    });
    chrome.storage.local.get("leetwarsWidth", (result) => {
        const leetwarsWidth = result.leetwarsWidth ?? "525";
        reactRoot.style.width = `${leetwarsWidth}px`;
    });

    const mainContentContainer = await waitForElement(["#qd-content"]);

    mainContentContainer.insertAdjacentElement("afterend", overlay);
    mainContentContainer.insertAdjacentElement("afterend", reactRoot);
    mainContentContainer.insertAdjacentElement("afterend", handlebar);

    chrome.storage.onChanged.addListener((changes, namespace) => {
        for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
            if (key == "leetwarsToggleState") {
                if (newValue == true) {
                    setToggleState(true);
                } else {
                    setToggleState(false);
                }
            }
            if (key == "leetwarsWidth") {
                reactRoot.style.width = `${newValue}px`;
            }
            if (key == "leetwarsDarkMode" && reactRoot.contentWindow) {
                reactRoot.contentWindow.postMessage(
                    {
                        extension: "leetwars",
                        event: "darkMode",
                        isDarkMode: newValue,
                    },
                    APP_URL
                );
            }
        }
    });

    let submissionButtonTimer: number;
    function handleClickSubmitCodeButton(submissionId: string) {
        clearInterval(submissionButtonTimer);
        const currentQuestionTitleSlug = getCurrentQuestionTitleSlug();
        if (!reactRoot.contentWindow || !currentQuestionTitleSlug) return;

        const submissionUrl = `https://leetcode.com/problems/${currentQuestionTitleSlug}/submissions/${submissionId}/`;

        console.log(
            "clicked submit, sending message to: ",
            APP_URL,
            "\n subId: ",
            submissionId,
            "\n problem: ",
            currentQuestionTitleSlug,
            "\n submission url: ",
            submissionUrl
        );
        reactRoot.contentWindow.postMessage(
            {
                extension: "leetwars",
                button: "submit",
                event: "submit",
                currentProblem: currentQuestionTitleSlug,
                submissionUrl: submissionUrl,
            },
            APP_URL
        );

        const startTime = Date.now();
        const timeout = 20_000;
        submissionButtonTimer = setInterval(() => {
            const element = document.querySelector(
                "[data-e2e-locator='submission-result']"
            );
            if (element?.innerHTML === "Accepted") {
                clearInterval(submissionButtonTimer);
                if (!reactRoot.contentWindow || !currentQuestionTitleSlug) {
                    return;
                }
                reactRoot.contentWindow.postMessage(
                    {
                        extension: "leetwars",
                        button: "submit",
                        event: "accepted",
                        currentProblem: currentQuestionTitleSlug,
                        submissionUrl: submissionUrl,
                    },
                    APP_URL
                );
            } else if (Date.now() - startTime > timeout) {
                clearInterval(submissionButtonTimer);
            }
        }, 100);
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (prevSubmissionId === message.submissionId) return;

        prevSubmissionId = message.submissionId;
        handleClickSubmitCodeButton(message.submissionId);
    });
}

function waitForElement(selectors: string[]): Promise<Element> {
    return new Promise((resolve) => {
        const observer = new MutationObserver(() => {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    observer.disconnect();
                    return;
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
}

function getCurrentQuestionTitleSlug(): string | undefined {
    const currentUrl = window.location.href;
    if (currentUrl.startsWith("https://leetcode.com/problems/")) {
        return currentUrl.split("/")[4];
    }
}

main();

export { };
