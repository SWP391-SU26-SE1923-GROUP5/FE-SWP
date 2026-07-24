'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Sparkles, Plus, Trash2, Send, Loader2, BookOpen,
    FileText, X, RefreshCw, FolderPlus, Pencil
} from 'lucide-react';
import {
    getUserSessions, createChatSession, getSessionDocuments,
    addDocumentToSession, removeDocumentFromSession, getSessionMessages,
    sendChatMessage, deleteChatSession, renameChatSession,
    ChatSession, ChatSessionDocument, ChatMessage
} from '@/lib/actions/ai.actions';
import { getFiles } from '@/lib/actions/file.actions';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import FileUploader from '@/components/FileUploader';
import { toast } from 'sonner';
import ApryseViewer from '@/components/ApryseViewer';
import { File_ } from '@/types';

interface LibraryFile {
    id: string;
    fileName: string;
    fileSizeBytes?: number;
    url?: string;
    lifecycleStatus?: number;
    status?: number;
}

interface CitationItem {
    documentId: string;
    source: string;
    snippet: string;
    pageNumber?: number;
    relevance: number;
    matchType: string;
    isHighlightable: boolean;
    reason?: string;
}

const MessageWithCitations = ({
    content,
    citations,
    onCitationClick
}: {
    content: string;
    citations?: CitationItem[];
    onCitationClick: (docId: string, page?: number, snippet?: string) => void
}) => {
    if (!citations || citations.length === 0) return <span>{content}</span>;

    const parts = content.split(/(\[\d+\])/g);
    return (
        <div className="flex flex-col gap-2">
            <span>
                {parts.map((part, i) => {
                    const match = part.match(/\[(\d+)\]/);
                    if (match) {
                        const idx = parseInt(match[1]) - 1;
                        if (idx >= 0 && idx < citations.length) {
                            const cit = citations[idx];
                            return (
                                <button
                                    key={i}
                                    onClick={() => onCitationClick(cit.documentId, cit.pageNumber, cit.isHighlightable ? cit.snippet : undefined)}
                                    className="inline-flex items-center justify-center px-1.5 py-0.5 mx-1 rounded-sm bg-brand/20 text-brand text-[10px] font-bold cursor-pointer hover:bg-brand hover:text-white transition-colors align-super"
                                    title={`Source: ${cit.source}`}
                                >
                                    {match[1]}
                                </button>
                            );
                        }
                    }
                    return <span key={i}>{part}</span>;
                })}
            </span>

            <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-dark-400/60 flex flex-wrap gap-2">
                <span className="text-[11px] font-semibold text-slate-500/80 w-full mb-0.5 uppercase tracking-wider">Sources</span>
                {citations.map((cit, idx) => (
                    <button
                        key={`source-${idx}`}
                        onClick={() => onCitationClick(cit.documentId, cit.pageNumber, cit.isHighlightable ? cit.snippet : undefined)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-dark-300 border border-slate-200 dark:border-dark-400 hover:border-brand dark:hover:border-brand transition-colors cursor-pointer group shadow-sm"
                        title={cit.isHighlightable ? cit.snippet : cit.source}
                    >
                        <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-brand/10 text-brand text-[9px] font-bold shrink-0">
                            {idx + 1}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                            {cit.source}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default function AIChatPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [sessionDocuments, setSessionDocuments] = useState<ChatSessionDocument[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState<string>('');
    const [libraryDocs, setLibraryDocs] = useState<LibraryFile[]>([]);

    const [isLoading, setIsLoading] = useState({
        sessions: true,
        messages: false,
        sources: false,
        sending: false,
        library: false,
        refetchingLibrary: false,
        action: false
    });

    const [modalState, setModalState] = useState({
        rename: false,
        delete: false,
        addDocs: false
    });
    const [renameTitleInput, setRenameTitleInput] = useState('');
    const [isAddingDocId, setIsAddingDocId] = useState<string | null>(null);

    const [activeCitation, setActiveCitation] = useState<{
        docId: string;
        page?: number;
        snippet?: string;
    } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentSession = sessions.find(s => s.id === currentSessionId);

    useEffect(() => {
        const initSessions = async () => {
            setIsLoading(p => ({ ...p, sessions: true }));
            try {
                const data = await getUserSessions();
                const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setSessions(sorted);

                if (sorted.length > 0) {
                    await handleSelectSession(sorted[0].id);
                } else {
                    setIsLoading(p => ({ ...p, sessions: false }));
                }
            } catch (error) {
                toast.error("Failed to load AI Notebook sessions.");
                setIsLoading(p => ({ ...p, sessions: false }));
            }
        };
        initSessions();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading.sending]);

    async function handleSelectSession(sessionId: string) {
        setCurrentSessionId(sessionId);
        setIsLoading(p => ({ ...p, messages: true, sources: true, sessions: false }));
        try {
            const [docs, msgs] = await Promise.all([
                getSessionDocuments(sessionId).catch(() => []),
                getSessionMessages(sessionId).catch(() => [])
            ]);
            setSessionDocuments(docs);
            setMessages(msgs);
        } catch (error) {
            toast.error("Failed to load session data");
        } finally {
            setIsLoading(p => ({ ...p, messages: false, sources: false }));
        }
    };

    const handleCreateNewNotebook = async () => {
        setIsLoading(p => ({ ...p, sessions: true }));
        try {
            const newTitle = `AI Notebook ${new Date().toLocaleDateString()}`;
            const newSession = await createChatSession(newTitle);

            setSessions(prev => [newSession, ...prev]);
            await handleSelectSession(newSession.id);
            toast.success("Created new notebook session!");
        } catch (error) {
            toast.error("Failed to create new notebook session.");
            setIsLoading(p => ({ ...p, sessions: false }));
        }
    };

    const handleRenameSession = async () => {
        if (!currentSessionId || !renameTitleInput.trim()) return;
        setIsLoading(p => ({ ...p, action: true }));
        try {
            const updatedSession = await renameChatSession(currentSessionId, renameTitleInput.trim());
            setSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
            setModalState(p => ({ ...p, rename: false }));
            toast.success("Notebook renamed!");
        } catch (error) {
            toast.error("Failed to rename notebook.");
        } finally {
            setIsLoading(p => ({ ...p, action: false }));
        }
    };

    const handleDeleteSession = async () => {
        if (!currentSessionId) return;
        setIsLoading(p => ({ ...p, action: true }));
        try {
            await deleteChatSession(currentSessionId);
            const remaining = sessions.filter(s => s.id !== currentSessionId);
            setSessions(remaining);
            setModalState(p => ({ ...p, delete: false }));
            toast.success("Notebook deleted successfully.");

            if (remaining.length > 0) {
                await handleSelectSession(remaining[0].id);
            } else {
                setCurrentSessionId(null);
                setSessionDocuments([]);
                setMessages([]);
                setActiveCitation(null);
            }
        } catch (error) {
            toast.error("Failed to delete notebook.");
        } finally {
            setIsLoading(p => ({ ...p, action: false }));
        }
    };

    const handleRemoveSource = async (documentId: string) => {
        if (!currentSessionId) return;
        try {
            await removeDocumentFromSession(currentSessionId, documentId);
            setSessionDocuments(prev => prev.filter(s => s.documentId !== documentId));
            toast.success("Source removed from notebook.");
            if (activeCitation?.docId === documentId) setActiveCitation(null);
        } catch (error) {
            toast.error("Failed to remove source.");
        }
    };

    const handleOpenAddModal = async () => {
        if (!currentSessionId) {
            toast.error("Please select or create a Notebook first!");
            return;
        }
        setModalState(p => ({ ...p, addDocs: true }));
        if (libraryDocs.length === 0) {
            setIsLoading(p => ({ ...p, library: true }));
            try {
                const res = await getFiles({ types: ["document"], limit: 50 });
                setLibraryDocs(res.documents || []);
            } catch (e) {
                toast.error("Failed to load library.");
            } finally {
                setIsLoading(p => ({ ...p, library: false }));
            }
        }
    };

    const handleAddSourceToSession = async (docId: string) => {
        if (!currentSessionId) return;
        setIsAddingDocId(docId);
        try {
            const addedDoc = await addDocumentToSession(currentSessionId, docId);
            setSessionDocuments(prev => {
                if (prev.some(d => d.documentId === addedDoc.documentId)) return prev;
                return [...prev, addedDoc];
            });
            toast.success("Document attached to notebook!");
        } catch (error) {
            toast.error("Failed to attach document.");
        } finally {
            setIsAddingDocId(null);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !currentSessionId || isLoading.sending) return;

        const content = chatInput.trim();
        const tempId = Date.now().toString();
        const tempMsg: ChatMessage = {
            id: tempId,
            chatSessionId: currentSessionId,
            sender: 'user',
            content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, tempMsg]);
        setChatInput('');
        setIsLoading(p => ({ ...p, sending: true }));

        try {
            if (sessionDocuments.length === 0) {
                toast.warning("No sources in this notebook. AI response will be general.");
            }
            const aiResponse = await sendChatMessage(currentSessionId, content);
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            toast.error("Failed to get AI response. Please try again.");
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setChatInput(content);
        } finally {
            setIsLoading(p => ({ ...p, sending: false }));
        }
    };

    const renderSidebar = () => (
        <aside className={cn("w-full lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-light-700 dark:border-dark-400 bg-white dark:bg-dark-200 flex flex-col h-1/3 lg:h-full overflow-hidden transition-all", activeCitation ? "hidden" : "flex")}>
            <div className="p-4 border-b border-light-700 dark:border-dark-400 bg-light-800/50 dark:bg-dark-300/40 space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                            Current Session
                        </label>
                        <div className="flex items-center gap-1">
                            <select
                                className="flex-1 min-w-0 bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 rounded-xl px-3 py-2 text-sm font-semibold text-dark-200 dark:text-light-100 outline-none focus:border-brand transition-colors truncate cursor-pointer shadow-2xs"
                                value={currentSessionId || ''}
                                onChange={(e) => handleSelectSession(e.target.value)}
                                disabled={isLoading.sessions || sessions.length === 0}
                            >
                                {sessions.length === 0 ? (
                                    <option value="">No sessions exist</option>
                                ) : (
                                    sessions.map(s => (
                                        <option key={s.id} value={s.id}>{s.sessionTitle}</option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={handleCreateNewNotebook}
                        className="h-10 px-3 mt-4 bg-brand hover:bg-brand/90 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                        title="Create New Session"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New</span>
                    </button>
                </div>
                {currentSessionId && (
                    <div className="flex items-center gap-2 pt-1">
                        <button
                            onClick={() => {
                                setRenameTitleInput(currentSession?.sessionTitle || '');
                                setModalState(p => ({ ...p, rename: true }));
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white dark:bg-dark-300 hover:bg-slate-100 dark:hover:bg-dark-400 border border-light-700 dark:border-dark-400 rounded-lg text-[11px] font-semibold text-slate-500 transition-colors cursor-pointer"
                        >
                            <Pencil className="w-3 h-3" />
                            Rename
                        </button>
                        <button
                            onClick={() => setModalState(p => ({ ...p, delete: true }))}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white dark:bg-dark-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 border border-light-700 dark:border-dark-400 rounded-lg text-[11px] font-semibold text-slate-500 transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-3 h-3" />
                            Delete Session
                        </button>
                    </div>
                )}
            </div>

            <div className="p-4 border-b border-light-700 dark:border-dark-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand" />
                    <span className="font-extrabold text-sm text-dark-200 dark:text-light-100">
                        Session Documents
                    </span>
                    <span className="bg-brand/10 text-brand text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {sessionDocuments.length}
                    </span>
                </div>
                <button
                    onClick={handleOpenAddModal}
                    disabled={!currentSessionId}
                    className="bg-brand/10 hover:bg-brand/20 text-brand px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/50 dark:bg-dark-300/20">
                {isLoading.sources || isLoading.sessions ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="w-6 h-6 animate-spin text-brand" />
                    </div>
                ) : !currentSessionId ? (
                    <div className="flex flex-col items-center justify-center text-center p-6 h-full border-2 border-dashed border-light-700 dark:border-dark-400 rounded-2xl text-slate-400">
                        <BookOpen className="w-10 h-10 stroke-1 mb-2 opacity-50" />
                        <p className="text-xs font-semibold mb-1 text-dark-200 dark:text-light-100">No Session Active</p>
                        <p className="text-[11px] leading-relaxed max-w-[200px]">
                            Create a new session to start attaching documents.
                        </p>
                    </div>
                ) : sessionDocuments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-6 h-full border-2 border-dashed border-light-700 dark:border-dark-400 rounded-2xl text-slate-400">
                        <FolderPlus className="w-10 h-10 stroke-1 mb-2 opacity-50" />
                        <p className="text-xs font-semibold mb-1 text-dark-200 dark:text-light-100">Session is empty</p>
                        <p className="text-[11px] leading-relaxed max-w-[200px]">
                            Add documents from your library to start chatting.
                        </p>
                        <button
                            onClick={handleOpenAddModal}
                            className="mt-4 bg-brand text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform hover:scale-[1.02] cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Documents</span>
                        </button>
                    </div>
                ) : (
                    sessionDocuments.map(doc => (
                        <div
                            key={doc.documentId}
                            className="flex items-center justify-between p-3 rounded-xl border border-light-700 dark:border-dark-400 bg-white dark:bg-dark-300 shadow-2xs group hover:border-brand/40 transition-colors"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileText className="w-5 h-5 text-brand shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-dark-200 dark:text-light-100 truncate" title={doc.title || doc.fileName}>
                                        {doc.title || doc.fileName || "Untitled Document"}
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                        Added {new Date(doc.addedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemoveSource(doc.documentId)}
                                className="p-1.5 ml-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                                title="Remove from Session"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );

    const renderChatHeader = () => (
        <div className="h-16 px-6 border-b border-light-700 dark:border-dark-400 bg-white/80 dark:bg-dark-200/80 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand shrink-0">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <h1 className="text-sm font-extrabold text-dark-200 dark:text-light-100 truncate">
                        {currentSession?.sessionTitle || "AI Chat Studio"}
                    </h1>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{sessionDocuments.length} document(s) in context</span>
                    </p>
                </div>
            </div>

            <button
                onClick={() => currentSessionId && handleSelectSession(currentSessionId)}
                disabled={isLoading.messages || !currentSessionId}
                className="p-2 hover:bg-light-700 dark:hover:bg-dark-300 rounded-xl text-slate-400 hover:text-dark-200 dark:hover:text-light-100 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh Messages"
            >
                <RefreshCw className={cn("w-4 h-4", isLoading.messages && "animate-spin")} />
            </button>
        </div>
    );

    const renderMessageList = () => (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {isLoading.messages || isLoading.sessions ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-brand" />
                </div>
            ) : !currentSessionId ? (
                <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center p-8 animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-3xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand mb-4 shadow-sm animate-bounce-subtle">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <h2 className="text-lg font-extrabold text-dark-200 dark:text-light-100 mb-2">
                        Create a Session
                    </h2>
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 mb-6">
                        Click the &#34;New&#34; button on the left panel to create a new Chat Session.
                    </p>
                    <button
                        onClick={handleCreateNewNotebook}
                        className="bg-brand text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-brand/90 hover:scale-105 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New Session</span>
                    </button>
                </div>
            ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center p-8">
                    <div className="w-16 h-16 rounded-3xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand mb-4 shadow-sm animate-bounce-subtle">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <h2 className="text-lg font-extrabold text-dark-200 dark:text-light-100 mb-2">
                        Start Your Chat Conversation
                    </h2>
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        Ask questions, request summaries, or generate study notes based on the {sessionDocuments.length} document(s) in this session.
                    </p>
                </div>
            ) : (
                messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex gap-3 max-w-3xl animate-in fade-in duration-300",
                                isUser ? "ml-auto justify-end" : "mr-auto justify-start"
                            )}
                        >
                            {!isUser && (
                                <div className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                            )}
                            <div
                                className={cn(
                                    "p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap transition-all shadow-xs",
                                    isUser
                                        ? "bg-brand text-white font-medium rounded-tr-xs"
                                        : "bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 text-dark-200 dark:text-light-100 rounded-tl-xs"
                                )}
                            >
                                {!isUser ? (
                                    <MessageWithCitations
                                        content={msg.content}
                                        citations={msg.citations}
                                        onCitationClick={(docId, page, snippet) => setActiveCitation({ docId, page, snippet })}
                                    />
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </div>
                    );
                })
            )}
            {isLoading.sending && (
                <div className="flex gap-3 max-w-3xl animate-in fade-in duration-300 mr-auto justify-start">
                    <div className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 rounded-tl-xs flex items-center gap-1.5 h-[42px] shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400/70 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );

    const renderChatInput = () => (
        <div className="p-4 border-t border-light-700 dark:border-dark-400 bg-white dark:bg-dark-200 shrink-0">
            <div className="max-w-3xl mx-auto flex items-end gap-2 bg-light-800 dark:bg-dark-300 border border-light-700 dark:border-dark-400 rounded-2xl p-2 focus-within:border-brand/60 focus-within:ring-2 focus-within:ring-brand/10 transition-all shadow-xs">
                <textarea
                    rows={1}
                    placeholder={
                        !currentSessionId
                            ? "Create a chat session first..."
                            : sessionDocuments.length === 0
                            ? "Add documents to ask specific questions..."
                            : "Ask anything about your session documents..."
                    }
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    disabled={isLoading.sending || !currentSessionId}
                    className="flex-1 bg-transparent border-0 outline-none px-3 py-2 text-xs sm:text-sm text-dark-200 dark:text-light-100 placeholder:text-slate-400 resize-none max-h-32 custom-scrollbar disabled:cursor-not-allowed"
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isLoading.sending || !currentSessionId}
                    className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                        chatInput.trim() && !isLoading.sending && currentSessionId
                            ? "bg-brand text-white shadow-sm hover:bg-brand/90 hover:scale-105 cursor-pointer"
                            : "bg-light-700 dark:bg-dark-400 text-slate-400 cursor-not-allowed"
                    )}
                >
                    {isLoading.sending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2">
                AI Chat can make mistakes. Double-check citations across your session documents.
            </p>
        </div>
    );

    const renderPdfViewerPanel = () => {
        if (!activeCitation) return null;

        const doc = sessionDocuments.find(s => s.documentId === activeCitation.docId);
        if (!doc) return null;

        const fakeFile = {
            id: doc.documentId,
            fileName: doc.fileName || doc.title,
            fileExtension: (doc.fileName || "").split('.').pop() || 'pdf',
            mimeType: "",
            fileSizeBytes: 0,
            uploadedAt: doc.addedAt,
            status: 1,
            lifecycleStatus: 1,
            isEncrypted: false,
            isPublic: false,
            encryptionKeyId: "",
            ownerId: ""
        } as unknown as File_;

        return (
            <aside className="hidden lg:flex flex-1 flex-col h-full bg-white dark:bg-dark-200 border-l border-light-700 dark:border-dark-400 z-10 transition-all shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="h-16 px-4 border-b border-light-700 dark:border-dark-400 flex items-center justify-between shrink-0 bg-white dark:bg-dark-200">
                    <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-5 h-5 text-brand" />
                        <h2 className="text-sm font-bold text-slate-800 dark:text-light-100 truncate">{doc.fileName || doc.title}</h2>
                    </div>
                    <button
                        onClick={() => setActiveCitation(null)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-300 rounded-lg text-slate-500 cursor-pointer transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 w-full relative bg-slate-50 dark:bg-dark-100">
                    <ApryseViewer
                        key={fakeFile.id}
                        file={fakeFile}
                        path="/chat"
                        closeModals={() => setActiveCitation(null)}
                        readOnly={true}
                        targetPage={activeCitation.page}
                        searchSnippet={activeCitation.snippet}
                    />
                </div>
            </aside>
        );
    };

    const renderAddDocsModal = () => (
        <Dialog open={modalState.addDocs} onOpenChange={(v) => setModalState(p => ({ ...p, addDocs: v }))}>
            <DialogContent className="shad-dialog max-w-xl p-6 bg-white dark:bg-dark-200 rounded-3xl border border-light-700 dark:border-dark-400 shadow-drop-3">
                <DialogHeader>
                    <DialogTitle className="text-lg font-extrabold text-dark-200 dark:text-light-100 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-brand" />
                        <span>Add Documents to Session</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-400">
                        Select documents from your library to attach to the current Chat Session.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 flex flex-col gap-4 max-h-[60vh] overflow-hidden">
                    {isLoading.library ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-brand" />
                        </div>
                    ) : libraryDocs.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            No documents in your library. Upload some files first!
                        </div>
                    ) : (
                        <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {libraryDocs.map(doc => {
                                const isAlreadyAttached = sessionDocuments.some(sd => sd.documentId === doc.id);
                                const isAdding = isAddingDocId === doc.id;

                                return (
                                    <div key={doc.id} className="flex items-center justify-between p-3 border border-light-700 dark:border-dark-400 rounded-xl bg-light-800/50 dark:bg-dark-300/50">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="text-sm font-semibold text-dark-200 dark:text-light-100 truncate">
                                                {doc.fileName}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleAddSourceToSession(doc.id)}
                                            disabled={isAlreadyAttached || isAdding}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0",
                                                isAlreadyAttached
                                                    ? "bg-slate-200 dark:bg-dark-400 text-slate-500 cursor-not-allowed"
                                                    : isAdding
                                                    ? "bg-brand/50 text-white cursor-not-allowed flex items-center gap-1"
                                                    : "bg-brand/10 hover:bg-brand text-brand hover:text-white cursor-pointer"
                                            )}
                                        >
                                            {isAdding ? (
                                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding</>
                                            ) : isAlreadyAttached ? (
                                                "Attached"
                                            ) : (
                                                "Add to Session"
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-light-700 dark:border-dark-400 flex flex-col gap-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Or upload new files</span>
                        <FileUploader className="w-full" />
                        <button
                            onClick={async () => {
                                setIsLoading(p => ({ ...p, refetchingLibrary: true }));
                                try {
                                    const res = await getFiles({ types: ["document"], limit: 50 });
                                    setLibraryDocs(res.documents || []);
                                    toast.success("Library refreshed!");
                                } catch (e) {
                                    toast.error("Failed to refresh library");
                                } finally {
                                    setIsLoading(p => ({ ...p, refetchingLibrary: false }));
                                }
                            }}
                            disabled={isLoading.refetchingLibrary}
                            className="w-full py-2 bg-light-700 dark:bg-dark-400 hover:bg-light-600 dark:hover:bg-dark-300 rounded-xl text-xs font-bold text-dark-200 dark:text-light-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", isLoading.refetchingLibrary && "animate-spin")} />
                            Refresh Library after Upload
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );

    const renderRenameModal = () => (
        <Dialog open={modalState.rename} onOpenChange={(v) => setModalState(p => ({ ...p, rename: v }))}>
            <DialogContent className="shad-dialog bg-white dark:bg-dark-200 rounded-3xl border border-light-700 dark:border-dark-400">
                <DialogHeader>
                    <DialogTitle className="text-dark-200 dark:text-light-100">Rename Notebook</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Enter a new title for this notebook session.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <input
                        type="text"
                        value={renameTitleInput}
                        onChange={(e) => setRenameTitleInput(e.target.value)}
                        placeholder="Notebook Title"
                        className="w-full bg-light-800 dark:bg-dark-300 border border-light-700 dark:border-dark-400 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-brand transition-colors text-dark-200 dark:text-light-100"
                    />
                </div>
                <DialogFooter>
                    <button
                        onClick={() => setModalState(p => ({ ...p, rename: false }))}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-400 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleRenameSession}
                        disabled={isLoading.action || !renameTitleInput.trim()}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand hover:bg-brand/90 disabled:opacity-50 transition-colors"
                    >
                        {isLoading.action ? "Renaming..." : "Save"}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    const renderDeleteModal = () => (
        <Dialog open={modalState.delete} onOpenChange={(v) => setModalState(p => ({ ...p, delete: v }))}>
            <DialogContent className="shad-dialog bg-white dark:bg-dark-200 rounded-3xl border border-light-700 dark:border-dark-400">
                <DialogHeader>
                    <DialogTitle className="text-dark-200 dark:text-light-100">Delete Session</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Are you sure you want to delete this session and all its history? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                    <button
                        onClick={() => setModalState(p => ({ ...p, delete: false }))}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-400 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDeleteSession}
                        disabled={isLoading.action}
                        className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {isLoading.action && <Loader2 className="w-4 h-4 animate-spin" />}
                        Delete Permanently
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    return (
        <div className="flex-1 flex flex-col lg:flex-row h-full w-full overflow-hidden bg-white dark:bg-dark-100 border-t border-light-700 dark:border-dark-400">
            {renderSidebar()}

            <main className={cn("flex flex-col h-2/3 lg:h-full bg-light-800 dark:bg-dark-100 relative overflow-hidden transition-all duration-300 border-r border-light-700 dark:border-dark-400", activeCitation ? "lg:w-[400px] xl:w-[450px] shrink-0" : "flex-1")}>
                {renderChatHeader()}
                {renderMessageList()}
                {renderChatInput()}
            </main>

            {renderPdfViewerPanel()}
            {renderAddDocsModal()}
            {renderRenameModal()}
            {renderDeleteModal()}
        </div>
    );
}
