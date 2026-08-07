"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
    AlignLeft,
    BrainCircuit,
    FileText,
    Loader2,
    Sparkles,
    MessageSquare,
    Pencil,
    Trash2,
    Check,
    X,
    Copy,
    RotateCw
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
import { deleteFile, renameFile, updateFileUsers, revokeDocumentShare, getDocumentShares, getFileStatus, reprocessFile } from "@/lib/actions/file.actions";
import { parseAsUTC } from "@/lib/utils";
import {
    generateQuiz,
    generateFlashcards,
    summarizeRagDocument,
    createChatSession,
    sendChatMessage,
    getSessionMessages,
    getUserSessions,
    getSessionDocuments,
    renameChatSession,
    deleteChatSession,
    getSuggestedPrompts,
    ChatSession,
    ChatMessage
} from "@/lib/actions/ai.actions";

import { FileDetails, ShareInput } from "@/components/ActionsModalContent";
import ApryseViewer from "./ApryseViewer";
import { toast } from "sonner";

interface Citation {
    isHighlightable?: boolean;
    source?: string;
    snippet?: string;
}

const MiniMessageWithCitations = ({ content, citations }: { content: string; citations?: Citation[] }) => {
    const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

    if (!citations || citations.length === 0) return <div className="whitespace-pre-wrap">{content}</div>;

    const parts = content.split(/(\[\d+\])/g);
    return (
        <div className="flex flex-col gap-2 relative">
            <div className="whitespace-pre-wrap">
                {parts.map((part, i) => {
                    const match = part.match(/\[(\d+)\]/);
                    if (match) {
                        const idx = parseInt(match[1]) - 1;
                        if (idx >= 0 && idx < citations.length) {
                            const cit = citations[idx];
                            return (
                                <button
                                    key={i}
                                    onClick={() => setActiveCitation(activeCitation === cit ? null : cit)}
                                    className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 rounded-sm bg-brand/20 text-brand text-[10px] font-bold cursor-pointer hover:bg-brand hover:text-white transition-colors align-super"
                                    title={cit.isHighlightable === false ? "Click to view summary" : "Click to view snippet"}
                                >
                                    {match[1]}
                                </button>
                            );
                        }
                    }
                    return <span key={i}>{part}</span>;
                })}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-dark-400/60 flex flex-wrap gap-2">
                <span className="text-[11px] font-semibold text-slate-500/80 w-full mb-0.5 uppercase tracking-wider">Sources</span>
                {citations.map((cit, idx) => (
                    <button
                        key={`source-${idx}`}
                        onClick={() => setActiveCitation(activeCitation === cit ? null : cit)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-dark-300 border border-slate-200 dark:border-dark-400 hover:border-brand dark:hover:border-brand transition-colors cursor-pointer group shadow-sm"
                        title={cit.source || "Document source"}
                    >
                        <FileText className="w-3 h-3 text-slate-400 group-hover:text-brand" />
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                            {cit.source || `Source ${idx + 1}`}
                        </span>
                        {cit.isHighlightable === false && (
                            <span className="px-1.5 py-0.5 text-[8px] font-bold bg-purple-100 text-purple-700 rounded-full uppercase ml-1">
                                AI
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {activeCitation && (
                <div className="mt-2 p-3 bg-slate-50 dark:bg-dark-300 border border-slate-200 dark:border-dark-400 rounded-lg relative animate-in fade-in zoom-in duration-200">
                    <button
                        onClick={() => setActiveCitation(null)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                    >
                        <X className="w-3 h-3" />
                    </button>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">
                        {activeCitation.isHighlightable === false ? "AI Summary:" : "Source Snippet:"}
                    </p>
                    <p className={`text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed ${activeCitation.isHighlightable === false ? '' : 'italic'}`}>
                        {activeCitation.isHighlightable === false ? activeCitation.snippet : `"...${activeCitation.snippet}..."`}
                    </p>
                </div>
            )}
        </div>
    );
};

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

function unwrap<T>(res: T | { error: string }): T {
    if (res && typeof res === 'object' && 'error' in res) {
        throw new Error(res.error as string);
    }
    return res as T;
}

export default function ActionDropdown({ file }: { file: File_ }) {
    const path = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const fileExt = file.fileExtension?.toLowerCase() || "";

    const isAiDocSupported = SUPPORTED_AI_DOC_EXTENSIONS.includes(fileExt);

    const currentUserId = session?.user?.id;
    const isOwner = !!currentUserId && file.userId === currentUserId;
    const [userAccessLevel, setUserAccessLevel] = useState<number | null>(null);
    const accessLevelFetched = useRef(false);

    const canEdit = isOwner || userAccessLevel === 2;

    const fetchAccessLevel = useCallback(async () => {
        if (isOwner || accessLevelFetched.current) return;
        accessLevelFetched.current = true;
        try {
            const shares = await getDocumentShares(file.id);
            if (shares && Array.isArray(shares)) {
                const myShare = shares.find(
                    (s: { userId?: string, level?: number }) => s.userId  === currentUserId
                ) || shares[0];
                if (myShare) {
                    setUserAccessLevel(Number(myShare.level || 1));
                } else {
                    setUserAccessLevel(1);
                }
            } else {
                setUserAccessLevel(1);
            }
        } catch {
            setUserAccessLevel(1);
        }
    }, [file.id, currentUserId, isOwner]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [localStatus, setLocalStatus] = useState(file.status);
    const [isLoading, setIsLoading] = useState(false);
    const [action, setAction] = useState<ActionType | null>(null);

    const isProcessing = localStatus === 5 || String(localStatus).toLowerCase() === "processing";
    const isFailed = localStatus === 6 || String(localStatus).toLowerCase() === "failed";
    const isReady = localStatus === 2 || String(localStatus).toLowerCase() === "done";

    const handleDropdownOpen = async (open: boolean) => {
        setIsDropdownOpen(open);
        if (open && !isReady && isAiDocSupported) {
            try {
                const res = await getFileStatus(file.id);
                if (res) setLocalStatus(res.status);
            } catch (e) {}
        }
    };

    useEffect(() => {
        if (!isDropdownOpen || !isProcessing || !isAiDocSupported) return;

        const interval = setInterval(async () => {
            try {
                const res = await getFileStatus(file.id);
                if (res) {
                    setLocalStatus(res.status);
                    if (res.status !== 5 && String(res.status).toLowerCase() !== "processing") {
                        clearInterval(interval);
                    }
                }
            } catch (error) {
                console.error("Error polling status in dropdown:", error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [isDropdownOpen, isProcessing, isAiDocSupported, file.id]);

    const [name, setName] = useState(file.fileName);

    const [emails, setEmails] = useState<string[]>(parseSharedUsers(file.sharedUsers));
    const [userLevels, setUserLevels] = useState<Record<string, number>>({});
    const [generationAmount, setGenerationAmount] = useState<number>(10);

    const [aiResult, setAiResult] = useState<AiResultState | null>(null);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isSending]);

    const [isRenameSessionModalOpen, setIsRenameSessionModalOpen] = useState(false);
    const [renameSessionTitle, setRenameSessionTitle] = useState("");
    const [isRenamingSession, setIsRenamingSession] = useState(false);
    const [isDeleteSessionModalOpen, setIsDeleteSessionModalOpen] = useState(false);
    const [isDeletingSession, setIsDeletingSession] = useState(false);

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

    const handleReprocess = async () => {
        setIsDropdownOpen(false);
        const toastId = toast.loading("Sending file for reprocessing...");
        try {
            await reprocessFile(file.id);
            setLocalStatus(5);
            toast.success("File sent for reprocessing...", { id: toastId });
        } catch (error) {
            toast.error("Failed to reprocess file", { id: toastId });
        }
    };

    const triggerAIFeature = async (
        endpoint: string,
        label: string,
        extraParams?: Record<string, string>
    ) => {
        const checkToastId = toast.loading(`Checking file status...`);
        try {
            const currentStatusRes = await getFileStatus(file.id);
            if (currentStatusRes) {
                setLocalStatus(currentStatusRes.status);
                if (currentStatusRes.status === 5 || String(currentStatusRes.status).toLowerCase() === "processing") {
                    toast.error("Still processing this document. Please wait a moment.", { id: checkToastId });
                    return;
                }
                if (currentStatusRes.status === 6 || String(currentStatusRes.status).toLowerCase() === "failed") {
                    toast.error("Processing failed for this document. Please reprocess.", { id: checkToastId });
                    return;
                }
                toast.dismiss(checkToastId);
            }
        } catch (e) {
            toast.error("Failed to check file status.", { id: checkToastId });
            return;
        }

        if (endpoint === "quiz" || endpoint === "flashcards" || endpoint === "summarize") {
            setIsDropdownOpen(false);
            closeAllModals();
            
            const amount = Number(extraParams?.amount) || 10;
            const actionVerb = endpoint === "summarize" ? "Summarizing" : "Generating";
            const toastId = toast.loading(`${actionVerb} ${label} in background...`);
            
            (async () => {
                try {
                    let res: any;
                    if (endpoint === "quiz") {
                        res = await generateQuiz(file.id, amount);
                    } else if (endpoint === "flashcards") {
                        res = await generateFlashcards(file.id, amount);
                    } else {
                        res = await summarizeRagDocument(file.id);
                    }
                    
                    if (res && res.error) {
                        toast.error(res.error, { id: toastId });
                        return;
                    }
                    
                    if (endpoint === "summarize") {
                        toast.success(`${label} generated successfully!`, {
                            id: toastId,
                            duration: 10000,
                            action: {
                                label: `View ${label}`,
                                onClick: () => {
                                    setAction({ value: endpoint, label, icon: "" } as ActionType);
                                    setAiResult({ type: endpoint, data: { summary: res.summary } });
                                    setIsModalOpen(true);
                                }
                            }
                        });
                    } else {
                        const targetId = endpoint === "quiz" ? (res.id || res.quizId) : res.deckId;
                        const path = endpoint === "quiz" ? `/quizzes/${targetId}` : `/flashcards/${targetId}`;
                        
                        toast.success(`${label} generated successfully!`, {
                            id: toastId,
                            duration: 10000,
                            action: {
                                label: `View ${label}`,
                                onClick: () => {
                                    router.push(path);
                                }
                            }
                        });
                    }
                } catch (e: any) {
                    toast.error(`Failed to generate ${label}.`, { id: toastId });
                }
            })();
            return;
        }

        setAction({ value: endpoint, label, icon: "" } as ActionType);
        setIsModalOpen(true);
        setIsLoading(true);
        const toastId = toast.loading(`Initializing ${label}...`);

        try {
            let data: Record<string, unknown> = {};

            if (endpoint === "ask-ai") {
                const sessions = unwrap(await getUserSessions());
                let docSessions = sessions.filter(s => s.documentId === file.id);

                if (docSessions.length === 0 && sessions.length > 0) {
                    const matchedSessions: ChatSession[] = [];
                    const recentSessions = sessions.slice(0, 15);
                    await Promise.all(
                        recentSessions.map(async (s) => {
                            try {
                                const docs = unwrap(await getSessionDocuments(s.id));
                                if (docs.some(d => d.documentId === file.id || d.id === file.id)) {
                                    matchedSessions.push({ ...s, documentId: file.id });
                                }
                            } catch (e) {}
                        })
                    );

                    if (matchedSessions.length > 0) {
                        docSessions = matchedSessions.sort(
                            (a, b) => parseAsUTC(b.createdAt || undefined).getTime() - parseAsUTC(a.createdAt || undefined).getTime()
                        );
                    }
                }

                setChatSessions(docSessions);

                if (docSessions.length > 0) {
                    const firstSession = docSessions[0];
                    setSelectedSessionId(firstSession.id);
                    const msgs = unwrap(await getSessionMessages(firstSession.id));
                    setChatMessages(msgs);
                }

                try {
                    const prompts = unwrap(await getSuggestedPrompts(file.id));
                    setSuggestedPrompts(prompts);
                } catch (e) {
                    console.error("Failed to fetch suggested prompts", e);
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
            const newSession = unwrap(await createChatSession(`Chat about ${file.fileName}`, file.id));
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
            const msgs = unwrap(await getSessionMessages(sessionId));
            setChatMessages(msgs);
        } catch (error: unknown) {
            toast.error("Failed to load chat messages.");
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleSendMessage = async (promptText?: string) => {
        const textToSend = promptText || chatInput;
        if (!textToSend.trim()) return;

        let currentSessionId = selectedSessionId;

        if (!currentSessionId) {
            setIsChatLoading(true);
            try {
                const newSession = unwrap(await createChatSession(`Chat about ${file.fileName}`, file.id));
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

        const userMessage = {
            // eslint-disable-next-line react-hooks/purity
            id: Date.now().toString(),
            chatSessionId: currentSessionId,
            sender: "user",
            content: textToSend,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setChatMessages((prev) => [...prev, userMessage as unknown as ChatMessage]);
        if (typeof promptText !== 'string') setChatInput("");
        setIsSending(true);

        try {
            const aiResponse = unwrap(await sendChatMessage(currentSessionId, textToSend));
            setChatMessages((prev) => [...prev, aiResponse]);
        } catch (error: unknown) {
            setChatMessages((prev) => prev.filter(msg => msg.id !== userMessage.id));
            if (typeof promptText !== 'string') setChatInput(textToSend);
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Failed to send message.");
            }
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

    const handleRenameSession = async () => {
        if (!selectedSessionId || !renameSessionTitle.trim()) return;
        setIsRenamingSession(true);
        const toastId = toast.loading("Renaming session...");
        try {
            const updated = unwrap(await renameChatSession(selectedSessionId, renameSessionTitle));
            setChatSessions(prev => prev.map(s => s.id === selectedSessionId ? { ...s, sessionTitle: updated.sessionTitle } : s));
            setIsRenameSessionModalOpen(false);
            toast.success("Session renamed successfully!", { id: toastId });
        } catch (error) {
            toast.error((error as Error)?.message || "Failed to rename session", { id: toastId });
        } finally {
            setIsRenamingSession(false);
        }
    };

    const handleDeleteSession = async () => {
        if (!selectedSessionId) return;
        setIsDeletingSession(true);
        const toastId = toast.loading("Deleting session...");
        try {
            unwrap(await deleteChatSession(selectedSessionId));
            const remaining = chatSessions.filter(s => s.id !== selectedSessionId);
            setChatSessions(remaining);
            if (remaining.length > 0) {
                handleSelectSession(remaining[0].id);
            } else {
                setSelectedSessionId(null);
                setChatMessages([]);
            }
            setIsDeleteSessionModalOpen(false);
            toast.success("Session deleted successfully!", { id: toastId });
        } catch (error) {
            toast.error((error as Error)?.message || "Failed to delete session", { id: toastId });
        } finally {
            setIsDeletingSession(false);
        }
    };

    const renderDialogContent = () => {
        if (!action) return null;
        const { value, label } = action;
        const isAiAction = AI_ACTIONS.includes(value);

        return (
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
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
                                : ["share", "rename", "delete", "details"].includes(value)
                                ? "text-left text-xl font-bold text-slate-800 tracking-tight"
                                : "text-center text-light-100"
                        }
                    >
                        {value === "share" ? "Share Document" : value === "rename" ? "Rename Document" : value === "delete" ? "Move to Trash" : value === "details" ? "Document Details" : label}
                    </DialogTitle>

                    {value === "rename" && (
                        <div className="flex flex-col gap-2 pt-2">
                            <label className="text-sm font-semibold text-slate-600">New Name</label>
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="!h-[46px] !rounded-xl !border-slate-200 !bg-slate-50/70 text-sm font-medium text-slate-800 focus:!bg-white focus:!border-brand focus:!ring-4 focus:!ring-brand/15 transition-all shadow-2xs w-full"
                                placeholder="Enter document name..."
                            />
                        </div>
                    )}
                    {value === "details" && <FileDetails file={file} />}
                    {value === "share" && (
                        <ShareInput file={file} emails={emails} onInputChange={setEmails} onRemove={handleRemoveUser} userLevels={userLevels} onLevelsChange={setUserLevels} />
                    )}
                    {value === "edit" && (
                        <ApryseViewer file={file} path={path} closeModals={closeAllModals} readOnly={!canEdit} />
                    )}
                    {value === "delete" && (
                        <p className="delete-confirmation">
                            Are you sure you want to move{" "}
                            <span className="delete-file-name">{file.fileName}</span> to trash?
                        </p>
                    )}

                    {isAiAction && !isLoading && aiResult && (
                        <div className="text-left space-y-6">
                            <h2 className="h2-bold text-dark-100 mb-6">{label}</h2>

                            {value === "summarize" && aiResult.data?.summary && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-3 px-1">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center shadow-lg shadow-brand/20 text-white shrink-0">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">Summary</h3>
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Key Insights Extracted</p>
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 border border-slate-200/60 rounded-2xl bg-gradient-to-b from-slate-50/50 to-white shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700 pointer-events-none" />
                                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap relative z-10 font-medium text-[15px]">
                                            {aiResult.data?.summary as string}
                                        </p>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            onClick={() => navigator.clipboard.writeText(aiResult.data?.summary as string)}
                                            variant="outline"
                                            className="gap-2 rounded-xl text-slate-600 hover:text-brand hover:bg-brand/5 border-slate-200 cursor-pointer shadow-2xs"
                                        >
                                            <Copy className="w-4 h-4" /> Copy Summary
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {value === "ask-ai" && (
                                <div className="flex flex-col h-[50vh] gap-4">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 relative">
                                                <select
                                                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none cursor-pointer hover:border-brand focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all appearance-none"
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
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>

                                            {selectedSessionId && selectedSessionId !== "new" && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => {
                                                            const session = chatSessions.find(s => s.id === selectedSessionId);
                                                            if (session) {
                                                                setRenameSessionTitle(session.sessionTitle);
                                                                setIsRenameSessionModalOpen(true);
                                                                setIsDeleteSessionModalOpen(false);
                                                            }
                                                        }}
                                                        className="p-2.5 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-xl transition-all cursor-pointer"
                                                        title="Rename session"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setIsDeleteSessionModalOpen(true);
                                                            setIsRenameSessionModalOpen(false);
                                                        }}
                                                        className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                                        title="Delete session"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {isRenameSessionModalOpen && (
                                            <div className="flex items-center gap-2 p-3 bg-brand/5 border border-brand/20 rounded-xl animate-in slide-in-from-top-2">
                                                <Input
                                                    value={renameSessionTitle}
                                                    onChange={(e) => setRenameSessionTitle(e.target.value)}
                                                    placeholder="New session name..."
                                                    className="h-9 flex-1 bg-white border-brand/30 focus-visible:ring-brand/30"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleRenameSession();
                                                        if (e.key === 'Escape') setIsRenameSessionModalOpen(false);
                                                    }}
                                                />
                                                <Button size="icon" onClick={handleRenameSession} disabled={isRenamingSession} className="h-9 w-9 bg-brand hover:bg-brand/90 text-white shrink-0 cursor-pointer">
                                                    {isRenamingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => setIsRenameSessionModalOpen(false)} disabled={isRenamingSession} className="h-9 w-9 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 shrink-0 cursor-pointer">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}

                                        {/* Inline Delete UI */}
                                        {isDeleteSessionModalOpen && (
                                            <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-xl animate-in slide-in-from-top-2">
                                                <span className="text-sm font-medium text-rose-800">Delete this session?</span>
                                                <div className="flex items-center gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => setIsDeleteSessionModalOpen(false)} disabled={isDeletingSession} className="h-8 px-3 text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 cursor-pointer">
                                                        Cancel
                                                    </Button>
                                                    <Button size="sm" onClick={handleDeleteSession} disabled={isDeletingSession} className="h-8 px-4 bg-rose-500 hover:bg-rose-600 text-white font-medium cursor-pointer">
                                                        {isDeletingSession ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto bg-light-800 rounded-xl p-4 space-y-4 border light-border custom-scrollbar flex flex-col">
                                        {isChatLoading ? (
                                            <div className="flex justify-center items-center h-full">
                                                <Loader2 className="animate-spin text-brand h-6 w-6" />
                                            </div>
                                        ) : chatMessages.length === 0 ? (
                                            <div className="flex-1 flex flex-col items-center justify-center p-4">
                                                <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-4 text-2xl">
                                                    💬
                                                </div>
                                                <p className="text-light-400 text-sm mb-6 text-center">
                                                    Start asking questions about this document or try one of these prompts:
                                                </p>
                                                {suggestedPrompts.length > 0 ? (
                                                    <div className="flex flex-col gap-3 w-full max-w-md">
                                                        {suggestedPrompts.map((prompt, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => handleSendMessage(prompt)}
                                                                className="text-left text-sm bg-white border border-slate-200 p-3 rounded-xl hover:border-brand hover:shadow-sm transition-all text-slate-700 cursor-pointer flex items-start"
                                                            >
                                                                <Sparkles className="w-4 h-4 text-brand inline-block mr-2 mt-0.5 shrink-0" />
                                                                <span>{prompt}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-slate-400 italic">No suggested prompts available.</p>
                                                )}
                                            </div>
                                        ) : (
                                            chatMessages.map((msg) => {
                                                const isUserMsg = msg.sender?.toLowerCase() === "user";
                                                return (
                                                    <div
                                                        key={msg.id}
                                                        className={`p-3 rounded-xl max-w-[85%] text-sm ${
                                                            isUserMsg
                                                                ? "bg-brand text-white self-end ml-auto rounded-tr-sm"
                                                                : "bg-white dark:bg-dark-200 text-dark-200 dark:text-light-100 border light-border self-start mr-auto rounded-tl-sm"
                                                        }`}
                                                    >
                                                        {isUserMsg ? (
                                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                                        ) : (
                                                            <MiniMessageWithCitations content={msg.content} citations={msg.citations} />
                                                        )}
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
                                        <div ref={messagesEndRef} />
                                    </div>

                                    <div className="flex gap-2">
                                        <Input
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            placeholder="Ask a question about this document..."
                                            disabled={isSending || isChatLoading}
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={() => handleSendMessage()}
                                            disabled={isSending || isChatLoading || !chatInput.trim()}
                                            className="bg-brand text-white px-6 hover:bg-emerald-500"
                                        >
                                            Send
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {value === "quiz" && aiResult.data?.questions && (
                                <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
                                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-2 text-3xl">
                                        ✨
                                    </div>
                                    <h3 className="h3-bold text-dark-100">{aiResult.data?.quizTitle as string}</h3>
                                    <p className="text-light-400">Successfully generated {(aiResult.data?.questions as unknown[])?.length} questions for this document.</p>
                                </div>
                            )}

                            {value === "flashcards" && aiResult.data?.cards && (
                                <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
                                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-2 text-3xl">
                                        ✨
                                    </div>
                                    <h3 className="h3-bold text-dark-100">{aiResult.data?.deckTitle as string}</h3>
                                    <p className="text-light-400">Successfully generated {(aiResult.data?.cards as unknown[])?.length} flashcards for this document.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {value === "generate-settings" && (
                        <div className="flex flex-col gap-6 p-2 mt-4 text-left">
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-bold text-slate-700">
                                    Number of {action.icon === "quiz" ? "Questions" : "Flashcards"}
                                </label>
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="20" 
                                        value={generationAmount} 
                                        onChange={(e) => setGenerationAmount(Number(e.target.value))}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand"
                                    />
                                    <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs font-bold text-lg text-brand w-14 text-center">
                                        {generationAmount}
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-slate-500 ml-1">
                                    Select any amount between 1 and 20.
                                </p>
                            </div>
                        </div>
                    )}
                </DialogHeader>

                {["rename", "delete"].includes(value) && (
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
                            className={`px-6 py-2.5 rounded-xl text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer h-10 ${
                                value === "delete"
                                    ? "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-500/90 hover:to-rose-600/90"
                                    : "bg-gradient-to-r from-brand to-indigo-600 hover:from-brand/90 hover:to-indigo-600/90"
                            }`}
                        >
                            <span className="capitalize">{value === "rename" ? "Save Changes" : value === "delete" ? "Move to Trash" : value}</span>
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

                {value === "generate-settings" && (
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
                            onClick={() => triggerAIFeature(action.icon as "quiz" | "flashcards", action.label, { amount: String(generationAmount) })}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand to-indigo-600 hover:from-brand/90 hover:to-indigo-600/90 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer h-10"
                        >
                            <span>{action.label}</span>
                        </Button>
                    </DialogFooter>
                )}

                {isAiAction && !isLoading && (
                    <DialogFooter className="mt-4 border-t light-border pt-4 flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={closeAllModals}
                            className="btn-secondary w-full py-2 rounded-full text-dark-100 font-semibold hover:bg-light-700 transition-colors cursor-pointer"
                        >
                            Close
                        </Button>

                        {value === "quiz" && (
                            <Button
                                onClick={() => {
                                    closeAllModals();
                                    router.push(`/quizzes/${aiResult?.data?.id}`);
                                }}
                                className="w-full py-2 rounded-full bg-brand text-white hover:bg-emerald-400 transition-colors cursor-pointer shadow-sm"
                            >
                                Take Quiz Now
                            </Button>
                        )}

                        {value === "flashcards" && (
                            <Button
                                onClick={() => {
                                    closeAllModals();
                                    router.push(`/flashcards/${aiResult?.data?.deckId}`);
                                }}
                                className="w-full py-2 rounded-full bg-brand text-white hover:bg-emerald-400 transition-colors cursor-pointer shadow-sm"
                            >
                                Review Flashcards
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
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen} modal={action?.value !== "edit"}>
            <DropdownMenu open={isDropdownOpen} onOpenChange={(open) => {
                handleDropdownOpen(open);
                if (open && !isOwner) fetchAccessLevel();
            }}>
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
                <DropdownMenuContent className="w-56 p-1.5 rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xl" align="end" sideOffset={8}>
                    <DropdownMenuLabel className="max-w-[220px] truncate px-3 py-2.5 text-sm font-bold text-slate-800">
                        {file.fileName}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1 bg-slate-100" />

                    {actionsDropdownItems
                        .filter((item) => {
                            if (item.value === "edit") {
                                if (!SUPPORTED_EDIT_EXTENSIONS.includes(fileExt)) return false;
                                if (!canEdit) return false;
                                return true;
                            }
                            if ((item as ActionType & { editOnly?: boolean }).editOnly && !isOwner) {
                                if (userAccessLevel === null) return false;
                                if (userAccessLevel < 2) return false;
                            }
                            return true;
                        })
                        .map((item) => (
                            <DropdownMenuItem
                                key={item.value}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 text-sm font-medium mx-0.5 ${
                                    item.value === "delete"
                                        ? "text-rose-600 hover:!bg-rose-50 focus:!bg-rose-50"
                                        : "text-slate-700 hover:!bg-slate-50 focus:!bg-slate-50"
                                }`}
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
                                        className="flex items-center gap-3 cursor-pointer w-full text-left"
                                    >
                                        <Image src={item.icon} alt={item.label} width={20} height={20} className="opacity-70" />
                                        {item.label}
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Image src={item.icon} alt={item.label} width={20} height={20} className="opacity-70" />
                                        {item.label}
                                    </div>
                                )}
                            </DropdownMenuItem>
                        ))}

                    {isAiDocSupported && (
                        <>
                            <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
                            <DropdownMenuLabel className="px-3 py-2 text-brand flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                <Sparkles className="h-3.5 w-3.5" /> AI Tools
                            </DropdownMenuLabel>

                            {isProcessing && (
                                <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-600 bg-amber-50/50 mx-0.5 rounded-lg mb-1 border border-amber-100/50">
                                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                    Processing...
                                </div>
                            )}

                            {isReady && (
                                <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50/50 mx-0.5 rounded-lg mb-1 border border-emerald-100/50">
                                    <Check className="h-4 w-4 shrink-0" />
                                    Ready for analysis
                                </div>
                            )}

                            {isFailed && (
                                <DropdownMenuItem
                                    onClick={(e) => { e.preventDefault(); handleReprocess(); }}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium text-amber-600 focus:text-amber-600 hover:!bg-amber-50 focus:!bg-amber-50 dark:hover:!bg-amber-900/20 dark:focus:!bg-amber-900/20 mx-0.5 transition-all duration-150"
                                >
                                    <RotateCw className="h-4 w-4 shrink-0" /> Reprocess Document
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                                onClick={() => triggerAIFeature("ask-ai", "Ask AI")}
                                disabled={isProcessing || isFailed}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium text-slate-700 hover:!bg-brand/5 focus:!bg-brand/5 mx-0.5 transition-all duration-150 ${(isProcessing || isFailed) ? "opacity-50 !cursor-not-allowed pointer-events-none" : ""}`}
                            >
                                <MessageSquare className="h-4 w-4 text-brand opacity-80 shrink-0" /> Ask AI
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => triggerAIFeature("summarize", "Document Summary")}
                                disabled={isProcessing || isFailed}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium text-slate-700 hover:!bg-brand/5 focus:!bg-brand/5 mx-0.5 transition-all duration-150 ${(isProcessing || isFailed) ? "opacity-50 !cursor-not-allowed pointer-events-none" : ""}`}
                            >
                                <AlignLeft className="h-4 w-4 text-brand opacity-80 shrink-0" /> Summarize
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => {
                                    setAction({ value: "generate-settings", label: "Generate Quiz", icon: "quiz" });
                                    setGenerationAmount(10);
                                    setIsModalOpen(true);
                                }}
                                disabled={isProcessing || isFailed}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium text-slate-700 hover:!bg-brand/5 focus:!bg-brand/5 mx-0.5 transition-all duration-150 ${(isProcessing || isFailed) ? "opacity-50 !cursor-not-allowed pointer-events-none" : ""}`}
                            >
                                <BrainCircuit className="h-4 w-4 text-brand opacity-80 shrink-0" /> Generate Quiz
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => {
                                    setAction({ value: "generate-settings", label: "Generate Flashcards", icon: "flashcards" });
                                    setGenerationAmount(10);
                                    setIsModalOpen(true);
                                }}
                                disabled={isProcessing || isFailed}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium text-slate-700 hover:!bg-brand/5 focus:!bg-brand/5 mx-0.5 transition-all duration-150 ${(isProcessing || isFailed) ? "opacity-50 !cursor-not-allowed pointer-events-none" : ""}`}
                            >
                                <FileText className="h-4 w-4 text-brand opacity-80 shrink-0" /> Generate Flashcards
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            {renderDialogContent()}
        </Dialog>
    );
}
