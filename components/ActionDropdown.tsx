"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
    AlignLeft,
    BrainCircuit,
    FileText,
    Loader2,
    RotateCcw,
    Sparkles,
    MessageSquare
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
import { triggerDownload, parseSharedUsers } from "@/lib/utils";
import { deleteFile, renameFile, updateFileUsers, revokeDocumentShare } from "@/lib/actions/file.actions";
import {
    generateQuiz,
    generateFlashcards,
    summarizeRagDocument,
    createChatSession,
    sendChatMessage,
    getSessionMessages,
    getUserSessions,
    getSessionDocuments,
    addDocumentToSession,
    ChatSession,
    ChatMessage
} from "@/lib/actions/ai.actions";

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

const AI_ACTIONS = ["quiz", "flashcards", "summarize", "ask-ai"];

export default function ActionDropdown({ file }: { file: File_ }) {
    const path = usePathname();
    const router = useRouter();
    const fileExt = file.fileExtension?.toLowerCase() || "";

    const isAiDocSupported = SUPPORTED_AI_DOC_EXTENSIONS.includes(fileExt);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [action, setAction] = useState<ActionType | null>(null);
    const [name, setName] = useState(file.fileName);

    const [emails, setEmails] = useState<string[]>(parseSharedUsers(file.sharedUsers));
    const [userLevels, setUserLevels] = useState<Record<string, number>>({});

    const [aiResult, setAiResult] = useState<AiResultState | null>(null);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const closeAllModals = () => {
        setIsModalOpen(false);
        setIsDropdownOpen(false);
        setAction(null);
        setName(file.fileName);
        setEmails(parseSharedUsers(file.sharedUsers));
        setUserLevels({});
        setAiResult(null);
        setUserAnswers({});
        setFlippedCards({});
        setChatSessions([]);
        setSelectedSessionId(null);
        setChatMessages([]);
        setChatInput("");
    };

    const handleAction = async () => {
        if (!action) return null;
        setIsLoading(true);

        const toastId = toast.loading(`Processing ${action.label}...`);

        try {
            const actions = {
                rename: () => renameFile({ fileId: file.id, name, extension: file.fileExtension.replace('.', ''), path }),
                share: () => updateFileUsers({
                    fileId: file.id,
                    emails,
                    path,
                    levels: emails.map(id => userLevels[id] || 1)
                }),
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
        const toastId = toast.loading(`Removing user...`);

        try {
            const revoked = await revokeDocumentShare(file.id, email, path).catch(() => false);
            const success = revoked || await updateFileUsers({
                fileId: file.id,
                emails: updatedEmails,
                path,
                levels: updatedEmails.map(id => userLevels[id] || 1)
            });
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
                    id: res.id || res.quizId,
                    quizTitle: res.title || res.quizTitle || res.documentName || `${file.fileName} Quiz`,
                    questions: res.questions?.map((q: any) => ({
                        id: q.id,
                        questionTitle: q.title || q.questionTitle,
                        answers: q.answers || []
                    })) || []
                };
            } else if (endpoint === "flashcards") {
                const amount = Number(extraParams?.amount) || 10;
                const res = await generateFlashcards(file.id, amount);
                data = { deckTitle: `${file.fileName} Flashcards`, cards: res };
            } else if (endpoint === "summarize") {
                const res = await summarizeRagDocument(file.id);
                data = { summary: res.summary };
            } else if (endpoint === "ask-ai") {
                const sessions = await getUserSessions();
                let docSessions = sessions.filter(s => s.documentId === file.id);

                if (docSessions.length === 0 && sessions.length > 0) {
                    const matchedSessions: ChatSession[] = [];
                    for (const s of sessions) {
                        try {
                            const docs = await getSessionDocuments(s.id);
                            if (docs.some(d => d.documentId === file.id || d.id === file.id)) {
                                matchedSessions.push({ ...s, documentId: file.id });
                            }
                        } catch (e) {}
                    }
                    if (matchedSessions.length > 0) {
                        docSessions = matchedSessions;
                    }
                }

                setChatSessions(docSessions);

                if (docSessions.length > 0) {
                    const firstSession = docSessions[0];
                    setSelectedSessionId(firstSession.id);
                    const msgs = await getSessionMessages(firstSession.id);
                    setChatMessages(msgs);
                }
                data = { ready: true };
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

    const handleCreateSession = async () => {
        setIsChatLoading(true);
        try {
            const newSession = await createChatSession(`Chat about ${file.fileName}`, file.id);
            if (file.id && !newSession.documentId) {
                try {
                    await addDocumentToSession(newSession.id, file.id);
                    newSession.documentId = file.id;
                } catch (e) {
                    console.error("Link document to session error:", e);
                }
            }
            setChatSessions((prev) => [newSession, ...prev]);
            setSelectedSessionId(newSession.id);
            setChatMessages([]);
        } catch (error: unknown) {
            toast.error("Failed to create chat session.");
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleSelectSession = async (sessionId: string) => {
        setSelectedSessionId(sessionId);
        setIsChatLoading(true);
        try {
            const msgs = await getSessionMessages(sessionId);
            setChatMessages(msgs);
        } catch (error: unknown) {
            toast.error("Failed to load chat messages.");
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        let currentSessionId = selectedSessionId;

        if (!currentSessionId) {
            setIsChatLoading(true);
            try {
                const newSession = await createChatSession(`Chat about ${file.fileName}`);
                setChatSessions((prev) => [newSession, ...prev]);
                currentSessionId = newSession.id;
                setSelectedSessionId(newSession.id);
            } catch (error) {
                setIsChatLoading(false);
                toast.error("Failed to initialize session.");
                return;
            }
            setIsChatLoading(false);
        }

        const tempMessage: ChatMessage = {
            id: Date.now().toString(),
            chatSessionId: currentSessionId,
            sender: "user",
            content: chatInput,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setChatMessages((prev) => [...prev, tempMessage]);
        setChatInput("");
        setIsSending(true);

        try {
            const aiResponse = await sendChatMessage(currentSessionId, file.id, tempMessage.content);
            setChatMessages((prev) => [...prev, aiResponse]);
        } catch (error) {
            toast.error("Failed to send message.");
        } finally {
            setIsSending(false);
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
                className={`p-6 sm:p-8 ${
                    value === "edit" || isAiAction
                        ? "max-w-5xl! w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
                        : value === "share"
                        ? "rounded-[28px] w-[95%] sm:max-w-[540px] p-6 sm:p-8 bg-white shadow-2xl border border-slate-100 max-h-[90vh] overflow-visible"
                        : "shad-dialog sm:max-w-[460px] w-full max-h-[90vh] overflow-hidden"
                }`}
                aria-describedby={undefined}
            >
                <DialogHeader className="flex flex-col gap-3">
                    <DialogTitle
                        className={
                            value === "edit" || isAiAction
                                ? "sr-only"
                                : value === "share"
                                ? "text-left text-xl font-bold text-slate-800 tracking-tight"
                                : "text-center text-light-100"
                        }
                    >
                        {value === "share" ? "Share Document" : label}
                    </DialogTitle>

                    {value === "rename" && (
                        <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                    )}
                    {value === "details" && <FileDetails file={file} />}
                    {value === "share" && (
                        <ShareInput file={file} emails={emails} onInputChange={setEmails} onRemove={handleRemoveUser} userLevels={userLevels} onLevelsChange={setUserLevels} />
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

                            {value === "summarize" && aiResult.data?.summary && (
                                <div className="space-y-4">
                                    <div className="p-6 border light-border rounded-xl bg-light-800">
                                        <p className="text-dark-200 leading-relaxed whitespace-pre-wrap">
                                            {aiResult.data.summary as string}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {value === "ask-ai" && (
                                <div className="flex flex-col h-[50vh] gap-4">
                                    <div className="flex items-center justify-between">
                                        <select
                                            className="p-2 rounded-md border light-border bg-white text-sm outline-none cursor-pointer"
                                            value={selectedSessionId || ""}
                                            onChange={(e) => {
                                                if (e.target.value === "new") handleCreateSession();
                                                else handleSelectSession(e.target.value);
                                            }}
                                        >
                                            <option value="" disabled>Select a session</option>
                                            <option value="new" className="font-semibold text-brand">+ New Chat Session</option>
                                            {chatSessions.map((s) => (
                                                <option key={s.id} value={s.id}>{s.sessionTitle}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex-1 overflow-y-auto bg-light-800 rounded-xl p-4 space-y-4 border light-border custom-scrollbar flex flex-col">
                                        {isChatLoading ? (
                                            <div className="flex justify-center items-center h-full">
                                                <Loader2 className="animate-spin text-brand h-6 w-6" />
                                            </div>
                                        ) : chatMessages.length === 0 ? (
                                            <div className="flex-1 flex items-center justify-center text-light-400 text-sm">
                                                Start asking questions about this document.
                                            </div>
                                        ) : (
                                            chatMessages.map((msg) => {
                                                const isUserMsg = msg.sender?.toLowerCase() === "user" || (msg as any).role?.toLowerCase() === "user" || (msg as any).isUser === true || (msg.sender && msg.sender.toLowerCase() !== "ai" && msg.sender.toLowerCase() !== "assistant" && msg.sender.toLowerCase() !== "system");
                                                return (
                                                    <div
                                                        key={msg.id}
                                                        className={`p-3 rounded-xl max-w-[85%] text-sm ${
                                                            isUserMsg
                                                                ? "bg-brand text-white self-end ml-auto rounded-tr-sm"
                                                                : "bg-white text-dark-200 border light-border self-start mr-auto rounded-tl-sm whitespace-pre-wrap"
                                                        }`}
                                                    >
                                                        {msg.content}
                                                    </div>
                                                );
                                            })
                                        )}
                                        {isSending && (
                                            <div className="bg-white border light-border p-3 rounded-xl max-w-[85%] self-start mr-auto rounded-tl-sm flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-brand" />
                                                <span className="text-sm text-light-400">AI is thinking...</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Input
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                            placeholder="Ask a question about this document..."
                                            disabled={isSending || isChatLoading}
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={handleSendMessage}
                                            disabled={isSending || isChatLoading || !chatInput.trim()}
                                            className="bg-brand text-white px-6 hover:bg-emerald-500"
                                        >
                                            Send
                                        </Button>
                                    </div>
                                </div>
                            )}

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

                {["rename", "delete"].includes(value) && (
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

                {value === "share" && (
                    <DialogFooter className="flex flex-col gap-3 sm:flex-row justify-end mt-6 pt-4 border-t border-slate-100">
                        <Button
                            type="button"
                            onClick={closeAllModals}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all shadow-2xs cursor-pointer h-10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleAction}
                            disabled={isLoading}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand to-indigo-600 hover:from-brand/90 hover:to-indigo-600/90 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer h-10"
                        >
                            <span>Confirm & Save</span>
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

                        {value === "flashcards" && (
                            <Button
                                onClick={() => {
                                    closeAllModals();
                                    router.push("/flashcards");
                                }}
                                className="w-full py-2 rounded-full bg-brand text-white hover:bg-emerald-400 transition-colors cursor-pointer shadow-sm"
                            >
                                Go to My Flashcards
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
                    <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center p-1.5 rounded-full hover:bg-light-300/50 transition-colors focus:outline-none shrink-0 cursor-pointer"
                        aria-label="File actions"
                    >
                        <Image
                            src="/assets/icons/dots.svg"
                            alt="dots"
                            width={28}
                            height={28}
                            className="cursor-pointer object-contain shrink-0"
                        />
                    </button>
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

                    {isAiDocSupported && (
                        <>
                            <DropdownMenuSeparator className="my-2 bg-light-300" />
                            <DropdownMenuLabel className="text-brand flex items-center gap-2 subtitle-2">
                                <Sparkles className="h-4 w-4" /> AI Tools
                            </DropdownMenuLabel>

                            <DropdownMenuItem
                                onClick={() => triggerAIFeature("ask-ai", "Ask AI")}
                                className="shad-dropdown-item gap-2 cursor-pointer"
                            >
                                <MessageSquare className="h-4 w-4 text-brand" /> Ask AI
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => triggerAIFeature("summarize", "Document Summary")}
                                className="shad-dropdown-item gap-2 cursor-pointer"
                            >
                                <AlignLeft className="h-4 w-4 text-brand" /> Summarize Document
                            </DropdownMenuItem>

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
                                            onClick={() => triggerAIFeature("quiz", "Quiz Engine", { amount: "15" })}
                                            className="shad-dropdown-item cursor-pointer"
                                        >
                                            15 Questions
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
                                            onClick={() => triggerAIFeature("flashcards", "Flashcards", { amount: "15" })}
                                            className="shad-dropdown-item cursor-pointer"
                                        >
                                            15 Cards
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            {renderDialogContent()}
        </Dialog>
    );
}