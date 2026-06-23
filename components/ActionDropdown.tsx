"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation"; // Added useRouter
import {
    BrainCircuit,
    Code,
    FileText,
    Film,
    Loader2,
    RotateCcw,
    Sparkles,
} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { ActionType, AiResultState, File_, Flashcard, QuizQuestion } from "@/types";
import { actionsDropdownItems } from "@/constants/actionsDropdownItems";
import { triggerDownload } from "@/lib/utils";
import { deleteFile, renameFile, updateFileUsers } from "@/lib/actions/file.actions";
import { generateQuiz, generateFlashcards } from "@/lib/actions/ai.actions";

import { FileDetails, ShareInput } from "@/components/ActionsModalContent";
import ApryseViewer from "./ApryseViewer";
import { toast } from "sonner";

const SUPPORTED_EDIT_EXTENSIONS = [
    ".pdf", "pdf",
    ".docx", "docx",
    ".doc", "doc",
    ".xlsx", "xlsx",
    ".xls", "xls",
    ".pptx", "pptx",
    ".ppt", "ppt"
];

const SUPPORTED_AI_DOC_EXTENSIONS = [
    ".pdf", "pdf",
    ".txt", "txt",
    ".csv", "csv",
    ".docx", "docx",
    ".md", "md",
    ".html", "html",
    ".json", "json"
];

const SUPPORTED_AI_VIDEO_EXTENSIONS = [
    ".mp4", "mp4",
    ".webm", "webm",
    ".mov", "mov"
];

const SUPPORTED_AI_CODE_EXTENSIONS = [
    ".go", "go",
    ".py", "py",
    ".js", "js",
    ".ts", "ts",
    ".lua", "lua",
    ".java", "java"
];

const AI_ACTIONS = ["quiz", "flashcards", "video-indexer", "code-sandbox"];

export default function ActionDropdown({ file }: { file: File_ }) {
    const path = usePathname();
    const router = useRouter();
    const fileExt = file.fileExtension?.toLowerCase() || "";

    const isAiDocSupported = SUPPORTED_AI_DOC_EXTENSIONS.includes(fileExt);
    const isVideoSupported = SUPPORTED_AI_VIDEO_EXTENSIONS.includes(fileExt);
    const isCodeSupported = SUPPORTED_AI_CODE_EXTENSIONS.includes(fileExt);
    const hasAnyAiSupport = isAiDocSupported || isVideoSupported || isCodeSupported;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [action, setAction] = useState<ActionType | null>(null);
    const [name, setName] = useState(file.fileName);

    const [emails, setEmails] = useState<string[]>(
        file.sharedUsers && file.sharedUsers.trim() !== ""
            ? file.sharedUsers.split(",")
            : []
    );

    const [aiResult, setAiResult] = useState<AiResultState | null>(null);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

    const closeAllModals = () => {
        setIsModalOpen(false);
        setIsDropdownOpen(false);
        setAction(null);
        setName(file.fileName);
        setEmails(
            file.sharedUsers && file.sharedUsers.trim() !== ""
                ? file.sharedUsers.split(",")
                : []
        );
        setAiResult(null);
        setUserAnswers({});
        setFlippedCards({});
    };

    const handleAction = async () => {
        if (!action) return null;
        setIsLoading(true);

        const toastId = toast.loading(`Processing ${action.label}...`);

        try {
            const actions = {
                rename: () => renameFile({ fileId: file.id, name, extension: file.fileExtension.replace('.', ''), path }),
                share: () => updateFileUsers({ fileId: file.id, emails, path }),
                delete: () => deleteFile({ fileId: file.id, path }),
                edit: () => Promise.resolve(true),
            };

            const actionKey = action.value as keyof typeof actions;
            const success = await actions[actionKey]();

            if (success) {
                toast.success(`${action.label} completed successfully!`, { id: toastId });
                closeAllModals();
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message, { id: toastId });
            } else {
                toast.error(`Failed to execute ${action.label}.`, { id: toastId });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveUser = async (email: string) => {
        const updatedEmails = emails.filter((e) => e !== email);
        const toastId = toast.loading(`Removing ${email}...`);

        try {
            const success = await updateFileUsers({ fileId: file.id, emails: updatedEmails, path });
            if (success) {
                setEmails(updatedEmails);
                toast.success(`User removed successfully!`, { id: toastId });
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message, { id: toastId });
            } else {
                toast.error("Failed to remove user.", { id: toastId });
            }
        }
    };

    const triggerAIFeature = async (
        endpoint: string,
        label: string,
        extraParams?: Record<string, string>
    ) => {
        setAction({ value: endpoint, label, icon: "" } as ActionType);
        setIsModalOpen(true);
        setIsLoading(true);
        const toastId = toast.loading(`Initializing ${label}...`);

        try {
            let data: Record<string, unknown> = {};

            if (endpoint === "quiz") {
                const amount = Number(extraParams?.amount) || 10;
                const res = await generateQuiz(file.id, amount);

                data = {
                    quizTitle: res.quizTitle || `${file.fileName} Quiz`,
                    questions: res.questions?.map((q: any) => ({
                        questionTitle: q.title || q.questionTitle,
                        answers: q.answers || []
                    })) || []
                };
            } else if (endpoint === "flashcards") {
                const amount = Number(extraParams?.amount) || 10;
                const res = await generateFlashcards(file.id, amount);
                data = { deckTitle: `${file.fileName} Flashcards`, cards: res };
            }

            setAiResult({ type: endpoint, data });
            toast.success(`${label} ready!`, { id: toastId });
        } catch (error: unknown) {
            console.error(error);
            if (error instanceof Error) {
                toast.error(error.message, { id: toastId });
            } else {
                toast.error(`Failed to load ${label}.`, { id: toastId });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        const toastId = toast.loading(`Downloading ${file.fileName}...`);
        try {
            await triggerDownload(file.id, file.fileName);
            toast.success("Download complete!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to download file.", { id: toastId });
        }
    };

    const renderDialogContent = () => {
        if (!action) return null;
        const { value, label } = action;
        const isAiAction = AI_ACTIONS.includes(value);

        return (
            <DialogContent
                className={`p-8 ${
                    value === "edit" || isAiAction
                        ? "max-w-5xl! w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
                        : "shad-dialog"
                }`}
                aria-describedby={undefined}
            >
                <DialogHeader className="flex flex-col gap-3">
                    <DialogTitle
                        className={
                            value === "edit" || isAiAction ? "sr-only" : "text-center text-light-100"
                        }
                    >
                        {label}
                    </DialogTitle>

                    {value === "rename" && (
                        <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                    )}
                    {value === "details" && <FileDetails file={file} />}
                    {value === "share" && (
                        <ShareInput file={file} onInputChange={setEmails} onRemove={handleRemoveUser} />
                    )}
                    {value === "edit" && (
                        <ApryseViewer file={file} path={path} closeModals={closeAllModals} />
                    )}
                    {value === "delete" && (
                        <p className="delete-confirmation">
                            Are you sure you want to delete{" "}
                            <span className="delete-file-name">{file.fileName}</span>?
                        </p>
                    )}

                    {isAiAction && !isLoading && aiResult && (
                        <div className="text-left space-y-6">
                            <h2 className="h2-bold text-dark-100 mb-6">{label}</h2>

                            {value === "quiz" && aiResult.data?.questions && (
                                <div className="space-y-6">
                                    <h3 className="h3-bold text-brand">{aiResult.data.quizTitle}</h3>
                                    {aiResult.data.questions.map((q: QuizQuestion, idx: number) => {
                                        const hasAnswered = userAnswers[idx] !== undefined;
                                        const selectedIndex = Number(userAnswers[idx]);
                                        const isCorrect = hasAnswered ? q.answers[selectedIndex]?.isCorrect : false;
                                        const correctText = q.answers.find((a) => a.isCorrect)?.selectedOption;

                                        return (
                                            <div
                                                key={idx}
                                                className="p-4 border light-border rounded-xl bg-light-800 space-y-2"
                                            >
                                                <p className="font-semibold text-dark-200">
                                                    {idx + 1}. {q.questionTitle}
                                                </p>
                                                <div className="grid gap-2 mt-3">
                                                    {q.answers.map((ans, i: number) => {
                                                        let optionClass =
                                                            "text-sm p-3 bg-white rounded-lg border light-border flex items-center gap-2 transition-all duration-200";
                                                        let circleClass =
                                                            "h-4 w-4 rounded-full border light-border shrink-0 transition-colors";

                                                        if (!hasAnswered) {
                                                            optionClass += " cursor-pointer hover:bg-brand/10 hover:border-brand";
                                                        } else {
                                                            if (ans.isCorrect) {
                                                                optionClass +=
                                                                    " bg-emerald-50 border-emerald-500 text-emerald-800 font-medium";
                                                                circleClass =
                                                                    "h-4 w-4 rounded-full border-emerald-500 bg-emerald-500 shrink-0";
                                                            } else if (i === selectedIndex) {
                                                                optionClass += " bg-red/10 border-red text-red font-medium";
                                                                circleClass =
                                                                    "h-4 w-4 rounded-full border-red bg-red shrink-0";
                                                            } else {
                                                                optionClass += " opacity-40 cursor-default";
                                                            }
                                                        }
                                                        return (
                                                            <div
                                                                key={i}
                                                                className={optionClass}
                                                                onClick={() => {
                                                                    if (!hasAnswered)
                                                                        setUserAnswers((prev) => ({
                                                                            ...prev,
                                                                            [idx]: i.toString()
                                                                        }));
                                                                }}
                                                            >
                                                                <div className={circleClass} />
                                                                <p>{ans.selectedOption}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {hasAnswered && (
                                                    <div
                                                        className={`mt-3 pt-3 border-t light-border text-sm font-medium ${
                                                            isCorrect ? "text-emerald-600" : "text-red"
                                                        }`}
                                                    >
                                                        {isCorrect
                                                            ? "✨ Correct!"
                                                            : `❌ Incorrect. The right answer is: ${correctText}`}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {value === "flashcards" && aiResult.data?.cards && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="h3-bold text-brand">{aiResult.data.deckTitle}</h3>
                                        <span className="caption text-light-400">Click a card to flip</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {aiResult.data.cards.map((card: Flashcard, idx: number) => {
                                            const isFlipped = flippedCards[idx];
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() =>
                                                        setFlippedCards((prev) => ({ ...prev, [idx]: !prev[idx] }))
                                                    }
                                                    className={`relative cursor-pointer min-h-[160px] p-6 rounded-2xl border flex items-center justify-center text-center transition-all duration-300 transform ${
                                                        isFlipped
                                                            ? "bg-brand text-white border-brand shadow-drop-1"
                                                            : "bg-white text-dark-200 border-slate-200 hover:border-brand hover:shadow-sm"
                                                    }`}
                                                >
                                                    <div className="absolute top-3 right-3 opacity-30">
                                                        <RotateCcw
                                                            className={`h-4 w-4 transition-transform duration-300 ${
                                                                isFlipped ? "rotate-180" : ""
                                                            }`}
                                                        />
                                                    </div>

                                                    <div className="flex flex-col items-center gap-2">
                                                        <span
                                                            className="uppercase text-[10px] font-bold tracking-widest opacity-60">
                                                            {isFlipped ? "Definition" : "Term"}
                                                        </span>
                                                        <p
                                                            className={`font-medium ${
                                                                isFlipped ? "text-sm" : "text-lg"
                                                            }`}
                                                        >
                                                            {isFlipped ? card.back : card.front}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogHeader>

                {["rename", "delete", "share"].includes(value) && (
                    <DialogFooter className="flex flex-col gap-3 md:flex-row mt-4">
                        <Button
                            onClick={closeAllModals}
                            className="modal-cancel-button cursor-pointer bg-red py-2 rounded-full"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAction}
                            className="modal-submit-button cursor-pointer py-2 rounded-full"
                        >
                            <p className="capitalize">{value}</p>
                        </Button>
                    </DialogFooter>
                )}

                {isAiAction && !isLoading && (
                    <DialogFooter className="mt-4 border-t light-border pt-4 flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={closeAllModals}
                            className="btn-secondary w-full py-2 rounded-full text-dark-100 font-semibold hover:bg-light-700 transition-colors cursor-pointer"
                        >
                            Close Workspace
                        </Button>

                        {value === "quiz" && (
                            <Button
                                onClick={() => {
                                    closeAllModals();
                                    router.push("/quizzes");
                                }}
                                className="w-full py-2 rounded-full bg-brand text-white hover:bg-emerald-400 transition-colors cursor-pointer shadow-sm"
                            >
                                Go to My Quizzes
                            </Button>
                        )}
                    </DialogFooter>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center mt-10 gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-brand" />
                        {isAiAction && (
                            <p className="subtitle-2 text-dark-300">Setting up cognitive framework...</p>
                        )}
                    </div>
                )}
            </DialogContent>
        );
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild className="shad-no-focus">
                    <Image
                        src="/assets/icons/dots.svg"
                        alt="dots"
                        width={34}
                        height={34}
                        className="cursor-pointer"
                    />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel className="max-w-[200px] truncate">
                        {file.fileName}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {actionsDropdownItems
                        .filter((item) => {
                            if (item.value === "edit") return SUPPORTED_EDIT_EXTENSIONS.includes(fileExt);
                            return true;
                        })
                        .map((item) => (
                            <DropdownMenuItem
                                key={item.value}
                                className="shad-dropdown-item"
                                onClick={() => {
                                    setAction(item);
                                    if (
                                        ["rename", "share", "delete", "details", "edit"].includes(item.value)
                                    ) {
                                        setIsModalOpen(true);
                                    }
                                }}
                            >
                                {item.value === "download" ? (
                                    <button
                                        type="button"
                                        onClick={handleDownload}
                                        className="flex items-center gap-2 cursor-pointer w-full text-left"
                                    >
                                        <Image src={item.icon} alt={item.label} width={30} height={30} />
                                        {item.label}
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Image src={item.icon} alt={item.label} width={30} height={30} />{" "}
                                        {item.label}
                                    </div>
                                )}
                            </DropdownMenuItem>
                        ))}

                    {hasAnyAiSupport && (
                        <>
                            <DropdownMenuSeparator className="my-2 bg-light-300" />
                            <DropdownMenuLabel className="text-brand flex items-center gap-2 subtitle-2">
                                <Sparkles className="h-4 w-4" /> AI Tools
                            </DropdownMenuLabel>

                            {isAiDocSupported && (
                                <>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="shad-dropdown-item gap-2">
                                            <BrainCircuit className="h-4 w-4 text-brand" /> Generate Quiz
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem
                                                    onClick={() => triggerAIFeature("quiz", "Quiz Engine", { amount: "10" })}
                                                    className="shad-dropdown-item cursor-pointer"
                                                >
                                                    10 Questions
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => triggerAIFeature("quiz", "Quiz Engine", { amount: "20" })}
                                                    className="shad-dropdown-item cursor-pointer"
                                                >
                                                    20 Questions
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => triggerAIFeature("quiz", "Quiz Engine", { amount: "50" })}
                                                    className="shad-dropdown-item cursor-pointer"
                                                >
                                                    50 Questions
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>

                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="shad-dropdown-item gap-2">
                                            <FileText className="h-4 w-4 text-brand" /> Extract Flashcards
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem
                                                    onClick={() => triggerAIFeature("flashcards", "Flashcards", { amount: "10" })}
                                                    className="shad-dropdown-item cursor-pointer"
                                                >
                                                    10 Cards
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => triggerAIFeature("flashcards", "Flashcards", { amount: "20" })}
                                                    className="shad-dropdown-item cursor-pointer"
                                                >
                                                    20 Cards
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => triggerAIFeature("flashcards", "Flashcards", { amount: "50" })}
                                                    className="shad-dropdown-item cursor-pointer"
                                                >
                                                    50 Cards
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                </>
                            )}

                            {isVideoSupported && (
                                <DropdownMenuItem
                                    onClick={() => triggerAIFeature("video-indexer", "Video Indexer")}
                                    className="shad-dropdown-item gap-2"
                                >
                                    <Film className="h-4 w-4 text-brand" /> Index Video Chapters
                                </DropdownMenuItem>
                            )}

                            {isCodeSupported && (
                                <DropdownMenuItem
                                    onClick={() => triggerAIFeature("code-sandbox", "Code Sandbox")}
                                    className="shad-dropdown-item gap-2"
                                >
                                    <Code className="h-4 w-4 text-brand" /> Run in Sandbox
                                </DropdownMenuItem>
                            )}
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            {renderDialogContent()}
        </Dialog>
    );
}