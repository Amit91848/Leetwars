import { Transition, Dialog } from "@headlessui/react";
import { Fragment, ReactElement } from "react";
import XIcon from "../icons/XIcon";
import Spinner from "./Spinner";

interface Props {
    isOpen: boolean;
    closeModal: VoidFunction;
    isLoading?: boolean;
    dialogHeading: string;
    dialogSubheading: string;
    panelHeight: string;
    children: ReactElement;
}

export function Modal({
    isOpen,
    closeModal,
    isLoading,
    dialogHeading,
    dialogSubheading,
    panelHeight,
    children,
}: Props) {
    return (
        <>
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-lc-bg bg-opacity-50" />
                    </Transition.Child>
                    <div id="modal" className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-6">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel
                                    className={
                                        isLoading
                                            ? `flex w-full h-[${panelHeight}] max-w-md transform items-center justify-center overflow-hidden rounded-2xl bg-lc-fg shadow-xl transition-all`
                                            : `flex w-full h-[${panelHeight}] max-w-md transform overflow-hidden rounded-2xl bg-lc-fg shadow-xl transition-all`
                                    }
                                >
                                    {isLoading ? (
                                        <Spinner />
                                    ) : (
                                        <div className="flex w-full flex-col">
                                            <div className="flex items-center justify-between border-b-[0.5px] border-gray-300 px-5 py-3 dark:border-gray-500">
                                                <div className="flex flex-col gap-y-[2px]">
                                                    <Dialog.Title
                                                        as="h3"
                                                        className="text-lg font-medium leading-6 text-white"
                                                    >
                                                        {dialogHeading}
                                                    </Dialog.Title>
                                                    <div className="text-xs text-gray-400">
                                                        {dialogSubheading}
                                                    </div>
                                                </div>
                                                <button onClick={closeModal}>
                                                    <XIcon />
                                                </button>
                                            </div>
                                            {children}
                                        </div>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}
