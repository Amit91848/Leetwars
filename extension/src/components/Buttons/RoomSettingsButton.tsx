import { ChangeEvent, useCallback, useEffect, useState } from "react";
import SettingsIcon from "../../icons/SettingsIcon";
import { Modal } from "../Modal";
import { Tab } from "@headlessui/react";
import {
    QuestionFilterKind,
    RoomSettings,
    defaultRoomSettings,
    topics,
} from "../../types/RoomSettings";
import { Difficulty } from "../../types/Questions";
import StopwatchIcon from "../../icons/StopwatchIcon";
import ChevronIcon from "../../icons/ChevronIcon";

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}

export function RoomSettingsButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roomSettings, setRoomSettings] =
        useState<RoomSettings>(defaultRoomSettings);

    function openModal() {
        setIsModalOpen(true);
    }
    function closeModal() {
        setIsModalOpen(false);
    }

    function saveAndCloseModal() {
        if (
            !roomSettings.questionFilter.selections.length ||
            (!roomSettings.difficulty.Easy &&
                !roomSettings.difficulty.Medium &&
                !roomSettings.difficulty.Hard)
        ) {
            return;
        }
        try {
            localStorage.setItem("roomSettings", JSON.stringify(roomSettings));
        } catch (error) {
            console.error(
                "Failed to save updated room settings to local storage"
            );
        }
        setIsModalOpen(false);
    }

    const loadRoomSettings = useCallback(async () => {
        const roomSettingsString = localStorage.getItem("roomSettings");
        // This is a hack to wait for the modal to fade out before updating the checkbox UI in case you cancel without saving
        if (!isModalOpen) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        if (roomSettingsString) {
            try {
                const storedRoomSettings: RoomSettings =
                    JSON.parse(roomSettingsString);
                if (!storedRoomSettings.difficulty) {
                    storedRoomSettings.difficulty =
                        defaultRoomSettings.difficulty;
                    localStorage.setItem(
                        "roomSettings",
                        JSON.stringify(storedRoomSettings)
                    );
                }
                setRoomSettings(storedRoomSettings);
            } catch (error) {
                console.error(
                    "Failed to parse room settings from local storage"
                );
            }
        } else {
            try {
                localStorage.setItem(
                    "roomSettings",
                    JSON.stringify(defaultRoomSettings)
                );
                setRoomSettings(defaultRoomSettings);
            } catch (error) {
                console.error(
                    "Failed to save default room settings to local storage"
                );
            }
        }
    }, [isModalOpen]);

    useEffect(() => {
        loadRoomSettings();
    }, [loadRoomSettings]);
    return (
        <>
            <div
                className="flex cursor-pointer flex-col items-center rounded-lg bg-lc-fg-light px-2 py-2 transition-all hover:bg-lc-fg-hover-light dark:bg-lc-fg dark:hover:bg-lc-fg-hover"
                onClick={openModal}
            >
                <SettingsIcon />
            </div>

            {isModalOpen && (
                <Modal
                    panelHeight="525px"
                    dialogHeading="Room Settings"
                    closeModal={closeModal}
                    isOpen={isModalOpen}
                    dialogSubheading=""
                >
                    <>
                        <SettingsTabs
                            roomSettings={roomSettings}
                            setRoomSettings={setRoomSettings}
                        />
                        <div className="mb-4 ml-2 mr-2 mt-2 flex flex-row items-center gap-3">
                            <DurationSelector
                                roomSettings={roomSettings}
                                setRoomSettings={setRoomSettings}
                            />
                            <button
                                onClick={closeModal}
                                className="rounded-lg bg-lc-fg-modal-light px-3 py-1.5 text-sm font-medium text-lc-text-light transition-all hover:bg-lc-fg-modal-hover-light dark:bg-lc-fg-modal dark:text-white dark:hover:bg-lc-fg-modal-hover"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveAndCloseModal}
                                className={`${
                                    !roomSettings.questionFilter.selections
                                        .length ||
                                    (!roomSettings.difficulty.Easy &&
                                        !roomSettings.difficulty.Medium &&
                                        !roomSettings.difficulty.Hard)
                                        ? "cursor-not-allowed bg-lc-fg-modal-light text-lc-text-light hover:bg-lc-fg-modal-hover-light dark:bg-lc-fg-modal dark:text-white dark:hover:bg-lc-fg-modal-hover"
                                        : "bg-lc-green-button text-white hover:bg-lc-green-button-hover-light dark:hover:bg-lc-green-button-hover"
                                } rounded-lg px-3 py-1.5 text-sm font-medium transition-all`}
                            >
                                Save
                            </button>
                        </div>
                    </>
                </Modal>
            )}
        </>
    );
}

function SettingsTabs({
    roomSettings,
    setRoomSettings,
}: {
    roomSettings: RoomSettings;
    setRoomSettings: (roomSettings: RoomSettings) => void;
}) {
    const tabs = ["Topics"];
    return (
        <div className="h-full px-2 py-2">
            <Tab.Group>
                <Tab.List className="flex gap-2">
                    {tabs.map((category) => (
                        <Tab
                            key={category}
                            className={({ selected }) =>
                                classNames(
                                    "w-full rounded-lg py-2.5 text-sm font-medium text-lc-text-light dark:text-white",
                                    selected
                                        ? "bg-lc-fg-modal-light dark:bg-lc-fg-modal"
                                        : "hover:bg-lc-fg-modal-hover-light dark:hover:bg-lc-fg-modal"
                                )
                            }
                        >
                            {category}
                        </Tab>
                    ))}
                </Tab.List>
                <Tab.Panels className="mt-2">
                    <TopicSelector
                        roomSettings={roomSettings}
                        setRoomSettings={setRoomSettings}
                    />
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
}

function TopicSelector({
    roomSettings,
    setRoomSettings,
}: {
    roomSettings: RoomSettings;
    setRoomSettings: (roomSettings: RoomSettings) => void;
}) {
    const { selections } = roomSettings.questionFilter;

    function handleSelect(event: ChangeEvent<HTMLInputElement>) {
        const newSelection = event.target.value;
        if (event.target.checked) {
            setRoomSettings({
                ...roomSettings,
                questionFilter: {
                    kind: QuestionFilterKind.Topics,
                    selections: [...selections, newSelection],
                },
            });
        } else {
            setRoomSettings({
                ...roomSettings,
                questionFilter: {
                    kind: QuestionFilterKind.Topics,
                    selections: selections.filter(
                        (selection) => selection !== newSelection
                    ),
                },
            });
        }
    }

    function handleSelectUnselectAll(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.checked) {
            setRoomSettings({
                ...roomSettings,
                questionFilter: {
                    kind: QuestionFilterKind.Topics,
                    selections: topics,
                },
            });
        } else {
            setRoomSettings({
                ...roomSettings,
                questionFilter: {
                    kind: QuestionFilterKind.Topics,
                    selections: [],
                },
            });
        }
    }

    function handleDifficultySelection(difficulty: Difficulty) {
        const newDifficulty = { ...roomSettings.difficulty };
        newDifficulty[difficulty] = !newDifficulty[difficulty];
        setRoomSettings({
            ...roomSettings,
            difficulty: newDifficulty,
        });
    }

    return (
        <Tab.Panel>
            <label className="mb-2 flex flex-row items-center gap-3 rounded-md bg-lc-fg-modal-light px-3 py-1 text-sm text-lc-text-light dark:bg-lc-fg-modal dark:text-white">
                <input
                    type="checkbox"
                    name="select-unselect-all"
                    value={"Select/Unselect All"}
                    onChange={handleSelectUnselectAll}
                    checked={Boolean(selections.length)}
                    id={"select-unselect-all"}
                />
                {"Select/Unselect All"}
            </label>

            <div
                className={classNames(
                    "h-56 overflow-auto rounded-md bg-lc-fg-modal-light dark:bg-lc-fg-modal dark:text-white"
                )}
            >
                <ul className="flex flex-col text-sm">
                    {topics.map((topic) => (
                        <label
                            key={topic}
                            className="flex flex-row items-center gap-3 px-3 py-1 even:bg-white even:bg-opacity-[45%] dark:even:bg-lc-bg dark:even:bg-opacity-[35%]"
                        >
                            <input
                                type="checkbox"
                                name="topics"
                                value={topic}
                                onChange={handleSelect}
                                checked={selections.includes(topic)}
                                id={topic}
                            />
                            {topic}
                        </label>
                    ))}
                </ul>
            </div>

            <fieldset className="mt-3 flex flex-row items-center justify-around rounded-lg border-4 border-lc-fg-modal-light p-2 pb-3 text-sm text-lc-text-light dark:border-lc-fg-modal dark:text-white">
                <legend className="px-2 dark:text-lc-fg-modal-light">
                    Difficulty
                </legend>
                <button
                    onClick={() => handleDifficultySelection(Difficulty.Easy)}
                    className={`
                    rounded-[21px] px-3 py-1.5 font-medium transition-all
                    ${
                        !roomSettings.difficulty.Easy
                            ? "bg-lc-fg-modal-light text-lc-text-light hover:bg-lc-fg-modal-hover-light dark:bg-lc-fg-modal dark:text-white dark:hover:bg-lc-fg-modal-hover"
                            : "bg-[hsl(168,41%,89%)] text-[hsl(173,97%,35%)] hover:bg-[hsl(168,41%,85%)] dark:bg-[hsl(172,20%,32%)] dark:text-[hsl(173,100%,42%)] dark:hover:bg-[hsl(172,20%,35%)]"
                    }`}
                >
                    Easy
                </button>
                <button
                    onClick={() => handleDifficultySelection(Difficulty.Medium)}
                    className={`
                    rounded-[21px] px-3 py-1.5 font-medium transition-all
                    ${
                        !roomSettings.difficulty.Medium
                            ? "bg-lc-fg-modal-light text-lc-text-light hover:bg-lc-fg-modal-hover-light dark:bg-lc-fg-modal dark:text-white dark:hover:bg-lc-fg-modal-hover"
                            : "bg-[hsl(38,100%,90%)] text-[hsl(43,100%,50%)] hover:bg-[hsl(38,100%,87%)] dark:bg-[hsl(39,32%,27%)] dark:text-[hsl(43,100%,56%)] dark:hover:bg-[hsl(39,32%,30%)]"
                    }`}
                >
                    Medium
                </button>
                <button
                    onClick={() => handleDifficultySelection(Difficulty.Hard)}
                    className={`
                    rounded-[21px] px-3 py-1.5 font-medium transition-all
                    ${
                        !roomSettings.difficulty.Hard
                            ? "bg-lc-fg-modal-light text-lc-text-light hover:bg-lc-fg-modal-hover-light dark:bg-lc-fg-modal dark:text-white dark:hover:bg-lc-fg-modal-hover"
                            : "bg-[hsl(355,100%,95%)] text-[hsl(349,100%,59%)] hover:bg-[hsl(355,100%,93%)] dark:bg-[hsl(353,27%,26%)] dark:text-[hsl(347,100%,67%)] dark:hover:bg-[hsl(353,27%,28%)]"
                    }`}
                >
                    Hard
                </button>
            </fieldset>
        </Tab.Panel>
    );
}

function DurationSelector({
    roomSettings,
    setRoomSettings,
}: {
    roomSettings: RoomSettings;
    setRoomSettings: (roomSettings: RoomSettings) => void;
}) {
    function handleIncrement() {
        if (!roomSettings.duration) {
            return;
        } else if (roomSettings.duration >= 90) {
            setRoomSettings({
                ...roomSettings,
                duration: null,
            });
            return;
        }
        setRoomSettings({
            ...roomSettings,
            duration: roomSettings.duration + 15,
        });
    }

    function handleDecrement() {
        if (!roomSettings.duration) {
            setRoomSettings({
                ...roomSettings,
                duration: 90,
            });
            return;
        } else if (roomSettings.duration <= 15) {
            return;
        }
        setRoomSettings({
            ...roomSettings,
            duration: roomSettings.duration - 15,
        });
    }

    return (
        <div className="flex grow flex-row items-stretch">
            <div className="flex flex-row items-center gap-1 rounded-l-lg bg-lc-fg-modal-light py-1.5 pl-2 pr-2 text-xs font-medium text-lc-text-light transition-all dark:bg-lc-fg-modal dark:text-white">
                <StopwatchIcon />
                <div
                    className={`w-[31px] text-center ${
                        roomSettings.duration ? "text-inherit" : "text-sm"
                    }`}
                >
                    {roomSettings.duration ? `${roomSettings.duration}m` : "∞"}
                </div>
            </div>
            <div className="flex flex-col rounded-r-md bg-lc-fg-modal-hover">
                <button
                    onClick={handleIncrement}
                    className={
                        !roomSettings.duration
                            ? "cursor-not-allowed rounded-tl-md"
                            : "cursor-pointer rounded-tr-md bg-[hsl(180,9%,84%)] transition-all hover:bg-[hsl(180,9%,78%)] dark:bg-[hsl(0,0%,38%)] dark:hover:bg-lc-fg-modal-hover"
                    }
                >
                    <ChevronIcon />
                </button>
                <button
                    onClick={handleDecrement}
                    className={
                        roomSettings.duration && roomSettings.duration <= 15
                            ? `rotate-180 cursor-not-allowed rounded-tl-md`
                            : `rotate-180 cursor-pointer rounded-tl-md bg-[hsl(180,9%,84%)] transition-all hover:bg-[hsl(180,9%,78%)] dark:bg-[hsl(0,0%,38%)] dark:hover:bg-lc-fg-modal-hover`
                    }
                >
                    <ChevronIcon />
                </button>
            </div>
        </div>
    );
}
