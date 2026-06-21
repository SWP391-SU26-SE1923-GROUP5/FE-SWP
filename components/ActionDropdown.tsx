"use client"

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, Code, FileText, Film, ListChecks, Loader2, MessageSquare, RotateCcw, Send, Sparkles } from "lucide-react";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { ActionType, File_ } from "@/types";
import { actionsDropdownItems } from "@/constants/actionsDropdownItems";
import { constructDownloadUrl } from "@/lib/utils";
import { deleteFile, renameFile, updateFileUsers } from "@/lib/actions/file.actions";
import { executeAIFeature } from "@/lib/actions/ai.actions";

import { FileDetails, ShareInput } from "@/components/ActionsModalContent";
import ApryseViewer from "./ApryseViewer";

const SUPPORTED_EDIT_EXTENSIONS = ["pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt"];
const SUPPORTED_AI_DOC_EXTENSIONS = ["pdf", "txt", "csv", "docx", "md", "html", "json"];
const SUPPORTED_AI_VIDEO_EXTENSIONS = ["mp4", "webm", "mov"];
const SUPPORTED_AI_CODE_EXTENSIONS = ["go", "py", "js", "ts", "lua", "java"];
const AI_ACTIONS = ["quiz", "flashcards", "ask-ai", "video-indexer", "code-sandbox"];

export default function ActionDropdown({ file }: { file: File_ }) {
    const path = usePathname();
    const fileExt = file.extension?.toLowerCase() || "";

    const isAiDocSupported = SUPPORTED_AI_DOC_EXTENSIONS.includes(fileExt);
    const isVideoSupported = SUPPORTED_AI_VIDEO_EXTENSIONS.includes(fileExt);
    const isCodeSupported = SUPPORTED_AI_CODE_EXTENSIONS.includes(fileExt);
    const hasAnyAiSupport = isAiDocSupported || isVideoSupported || isCodeSupported;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [action, setAction] = useState<ActionType | null>(null);
    const [name, setName] = useState(file.name);
    const [emails, setEmails] = useState<string[]>([]);

    const [aiResult, setAiResult] = useState<any>(null);
    const [isChatting, setIsChatting] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState<{ sender: 'user'|'ai'; text: string }[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

    const closeAllModals = () => {
        setIsModalOpen(false);
        setIsDropdownOpen(false);
        setAction(null);
        setName(file.name);
        setAiResult(null);
        setChatHistory([]);
        setChatInput("");
        setUserAnswers({});
        setFlippedCards({});
    };

    const handleAction = async () => {
        if (!action) return null;
        setIsLoading(true);

        const actions = {
            rename: () => renameFile({ fileId: file.$id, name, extension: file.extension, path }),
            share: () => updateFileUsers({ fileId: file.$id, emails: file.users, path }),
            delete: () => deleteFile({ fileId: file.$id, bucketFileId: file.bucketFileId, path }),
            edit: () => Promise.resolve(true),
        };

        const actionKey = action.value as keyof typeof actions;
        const success = await actions[actionKey]();

        if (success) closeAllModals();
        setIsLoading(false);
    };

    const handleRemoveUser = async (email: string) => {
        const updatedEmails = emails.filter((e) => e !== email);
        const success = await updateFileUsers({ fileId: file.$id, emails: file.users, path });
        if (success) setEmails(updatedEmails);
        closeAllModals();
    };

    const triggerAIFeature = async (endpoint: string, label: string, extraParams?: Record<string, string>) => {
        setAction({ value: endpoint, label, icon: "" } as ActionType);
        setIsModalOpen(true);
        setIsLoading(true);
        try {
            const data = await executeAIFeature(file, endpoint, extraParams);
            setAiResult({ type: endpoint, data });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartAskAI = () => {
        setAction({ value: 'ask-ai', label: 'Ask AI', icon: "" } as ActionType);
        setIsModalOpen(true);
        setAiResult({ type: 'ask-ai', data: { fileUrl: file.url } });
        setChatHistory([{
            sender: 'ai',
            text: `I have active context for ${file.name}. What would you like to know? You can select a quick action or ask a specific question.`
        }]);
    };

    const submitChatQuery = async (query: string) => {
        if (!query.trim()) return;

        setChatHistory(prev => [...prev, { sender: 'user', text: query }]);
        setChatInput("");
        setIsChatting(true);

        const mimeTypes: Record<string, string> = { pdf: "application/pdf", txt: "text/plain", csv: "text/csv", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
        const mappedMimeType = mimeTypes[fileExt] || "application/pdf";

        try {
            const res = await fetch('/api/ai/context-caching', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileUrl: file.url, mimeType: mappedMimeType, userQuestion: query })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setChatHistory(prev => [...prev, { sender: 'ai', text: data.answer }]);
        } catch (error) {
            setChatHistory(prev => [...prev, { sender: 'ai', text: "Sorry, I encountered an error analyzing the document context." }]);
        } finally {
            setIsChatting(false);
        }
    };

    const renderDialogContent = () => {
        if (!action) return null;
        const { value, label } = action;
        const isAiAction = AI_ACTIONS.includes(value);

        return (
            <DialogContent className={`p-8 ${(value === "edit" || isAiAction) ? "max-w-5xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar" : "shad-dialog"}`} aria-describedby={undefined}>
                <DialogHeader className="flex flex-col gap-3">
                    <DialogTitle className={(value === "edit" || isAiAction) ? "sr-only" : "text-center text-light-100"}>{label}</DialogTitle>

                    {value === "rename" && <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />}
                    {value === "details" && <FileDetails file={file} />}
                    {value === "share" && <ShareInput file={file} onInputChange={setEmails} onRemove={handleRemoveUser}/>}
                    {value === "edit" && <ApryseViewer file={file} path={path} closeModals={closeAllModals} />}
                    {value === "delete" && <p className="delete-confirmation">Are you sure you want to delete <span className="delete-file-name">{file.name}</span>?</p>}

                    {isAiAction && !isLoading && aiResult && (
                        <div className="text-left space-y-6">
                            <h2 className="h2-bold text-dark-100 mb-6">{label}</h2>

                            {value === 'ask-ai' && (
                                <div className="flex flex-col h-[55vh]">
                                    <div className="flex justify-between items-center mb-4 pb-2 border-b light-border">
                                        <span className="caption text-light-400 flex items-center gap-2"><Sparkles className="h-3 w-3 text-brand"/> Powered by Gemini 1.5 Flash</span>
                                        <span className="caption text-brand bg-brand-100 px-2 py-1 rounded-md">Native Caching Active</span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                                        {chatHistory.map((msg, idx) => (
                                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] p-4 text-sm rounded-2xl whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-brand text-white rounded-br-none' : 'bg-light-800 text-dark-200 rounded-bl-none border border-slate-100 shadow-sm'}`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        {chatHistory.length === 1 && !isChatting && (
                                            <div className="flex flex-col sm:flex-row gap-2 mt-4 ml-2">
                                                <button onClick={() => submitChatQuery("Provide a comprehensive summary of this document.")} className="flex items-center gap-2 text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg transition-colors"><FileText className="h-3 w-3" /> Summarize File</button>
                                                <button onClick={() => submitChatQuery("Extract all actionable items, tasks, or key takeaways.")} className="flex items-center gap-2 text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg transition-colors"><ListChecks className="h-3 w-3" /> Extract Action Items</button>
                                            </div>
                                        )}
                                        {isChatting && <div className="text-xs text-light-400 animate-pulse pl-2 flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin text-brand"/> Analyzing file context...</div>}
                                    </div>

                                    <form onSubmit={(e) => { e.preventDefault(); submitChatQuery(chatInput); }} className="mt-4 flex gap-3 pt-4 border-t light-border">
                                        <Input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a specific question..." className="flex-1" disabled={isChatting} />
                                        <Button type="submit" disabled={isChatting || !chatInput.trim()} className="primary-btn px-5 rounded-xl"><Send className="h-4 w-4" /></Button>
                                    </form>
                                </div>
                            )}

                            {value === 'quiz' && aiResult.data?.questions && (
                                <div className="space-y-6">
                                    <h3 className="h3-bold text-brand">{aiResult.data.quiz_title}</h3>
                                    {aiResult.data.questions.map((q: any, idx: number) => {
                                        const hasAnswered = userAnswers[idx] !== undefined;
                                        const isCorrect = userAnswers[idx] === q.correct_answer;

                                        return (
                                            <div key={idx} className="p-4 border light-border rounded-xl bg-light-800 space-y-2">
                                                <p className="font-semibold text-dark-200">{idx + 1}. {q.question_text}</p>
                                                <div className="grid gap-2 mt-3">
                                                    {q.options.map((opt: string, i: number) => {
                                                        let optionClass = "text-sm p-3 bg-white rounded-lg border light-border flex items-center gap-2 transition-all duration-200";
                                                        let circleClass = "h-4 w-4 rounded-full border light-border shrink-0 transition-colors";
                                                        if (!hasAnswered) { optionClass += " cursor-pointer hover:bg-brand/10 hover:border-brand"; }
                                                        else {
                                                            if (opt === q.correct_answer) { optionClass += " bg-emerald-50 border-emerald-500 text-emerald-800 font-medium"; circleClass = "h-4 w-4 rounded-full border-emerald-500 bg-emerald-500 shrink-0"; }
                                                            else if (opt === userAnswers[idx]) { optionClass += " bg-red/10 border-red text-red font-medium"; circleClass = "h-4 w-4 rounded-full border-red bg-red shrink-0"; }
                                                            else { optionClass += " opacity-40 cursor-default"; }
                                                        }
                                                        return (
                                                            <div key={i} className={optionClass} onClick={() => { if (!hasAnswered) setUserAnswers(prev => ({ ...prev, [idx]: opt })); }}>
                                                                <div className={circleClass} /> {opt}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {hasAnswered && (
                                                    <div className={`mt-3 pt-3 border-t light-border text-sm font-medium ${isCorrect ? 'text-emerald-600' : 'text-red'}`}>
                                                        {isCorrect ? '✨ Correct!' : `❌ Incorrect. The right answer is: ${q.correct_answer}`}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {value === 'flashcards' && aiResult.data?.cards && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="h3-bold text-brand">{aiResult.data.deck_title}</h3>
                                        <span className="caption text-light-400">Click a card to flip</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {aiResult.data.cards.map((card: any, idx: number) => {
                                            const isFlipped = flippedCards[idx];
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => setFlippedCards(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                                    className={`relative cursor-pointer min-h-[160px] p-6 rounded-2xl border flex items-center justify-center text-center transition-all duration-300 transform ${isFlipped ? 'bg-brand text-white border-brand shadow-drop-1' : 'bg-white text-dark-200 border-slate-200 hover:border-brand hover:shadow-sm'}`}
                                                >
                                                    <div className="absolute top-3 right-3 opacity-30">
                                                        <RotateCcw className={`h-4 w-4 transition-transform duration-300 ${isFlipped ? 'rotate-180' : ''}`} />
                                                    </div>

                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className="uppercase text-[10px] font-bold tracking-widest opacity-60">
                                                            {isFlipped ? "Definition" : "Term"}
                                                        </span>
                                                        <p className={`font-medium ${isFlipped ? 'text-sm' : 'text-lg'}`}>
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
                        <Button onClick={closeAllModals} className="modal-cancel-button cursor-pointer bg-red py-2 rounded-full">Cancel</Button>
                        <Button onClick={handleAction} className="modal-submit-button cursor-pointer py-2 rounded-full"><p className="capitalize">{value}</p></Button>
                    </DialogFooter>
                )}

                {isAiAction && !isLoading && (
                    <DialogFooter className="mt-4 border-t light-border pt-4">
                        <Button onClick={closeAllModals} className="btn-secondary w-full py-2 rounded-full text-dark-100 font-semibold hover:bg-light-700 transition-colors cursor-pointer">Close AI Workspace</Button>
                    </DialogFooter>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center mt-10 gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-brand" />
                        {isAiAction && <p className="subtitle-2 text-dark-300">Setting up cognitive framework...</p>}
                    </div>
                )}
            </DialogContent>
        );
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild className="shad-no-focus">
                    <Image src="/assets/icons/dots.svg" alt="dots" width={34} height={34} className="cursor-pointer" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel className="max-w-[200px] truncate">{file.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {actionsDropdownItems
                        .filter((item) => {
                            if (item.value === "edit") return SUPPORTED_EDIT_EXTENSIONS.includes(fileExt);
                            return true;
                        })
                        .map((item) => (
                            <DropdownMenuItem key={item.value} className="shad-dropdown-item" onClick={() => {
                                setAction(item);
                                if (["rename", "share", "delete", "details", "edit"].includes(item.value)) setIsModalOpen(true);
                            }}>
                                {item.value === "download" ? (
                                    <Link href={constructDownloadUrl(file.bucketFileId)} download={file.name} className="flex items-center gap-2">
                                        <Image src={item.icon} alt={item.label} width={30} height={30} /> {item.label}
                                    </Link>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Image src={item.icon} alt={item.label} width={30} height={30} /> {item.label}
                                    </div>
                                )}
                            </DropdownMenuItem>
                        ))}

                    {hasAnyAiSupport && (
                        <>
                            <DropdownMenuSeparator className="my-2 bg-light-300" />
                            <DropdownMenuLabel className="text-brand flex items-center gap-2 subtitle-2">
                                <Sparkles className="h-4 w-4"/> AI Tools
                            </DropdownMenuLabel>

                            {isAiDocSupported && (
                                <>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="shad-dropdown-item gap-2">
                                            <BrainCircuit className="h-4 w-4 text-brand" /> Generate Quiz
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem onClick={() => triggerAIFeature('quiz', 'Quiz Engine', { amount: '10' })} className="shad-dropdown-item cursor-pointer">10 Questions</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => triggerAIFeature('quiz', 'Quiz Engine', { amount: '20' })} className="shad-dropdown-item cursor-pointer">20 Questions</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => triggerAIFeature('quiz', 'Quiz Engine', { amount: '50' })} className="shad-dropdown-item cursor-pointer">50 Questions</DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>

                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="shad-dropdown-item gap-2">
                                            <FileText className="h-4 w-4 text-brand" /> Extract Flashcards
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem onClick={() => triggerAIFeature('flashcards', 'Flashcards', { amount: '10' })} className="shad-dropdown-item cursor-pointer">10 Cards</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => triggerAIFeature('flashcards', 'Flashcards', { amount: '20' })} className="shad-dropdown-item cursor-pointer">20 Cards</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => triggerAIFeature('flashcards', 'Flashcards', { amount: '50' })} className="shad-dropdown-item cursor-pointer">50 Cards</DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>

                                    <DropdownMenuItem onClick={handleStartAskAI} className="shad-dropdown-item gap-2"><MessageSquare className="h-4 w-4 text-brand" /> Ask AI</DropdownMenuItem>
                                </>
                            )}

                            {isVideoSupported && (
                                <DropdownMenuItem onClick={() => triggerAIFeature('video-indexer', 'Video Indexer')} className="shad-dropdown-item gap-2"><Film className="h-4 w-4 text-brand" /> Index Video Chapters</DropdownMenuItem>
                            )}

                            {isCodeSupported && (
                                <DropdownMenuItem onClick={() => triggerAIFeature('code-sandbox', 'Code Sandbox')} className="shad-dropdown-item gap-2"><Code className="h-4 w-4 text-brand" /> Run in Sandbox</DropdownMenuItem>
                            )}
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            {renderDialogContent()}
        </Dialog>
    );
}