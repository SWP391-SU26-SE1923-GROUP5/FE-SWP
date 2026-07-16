'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    Sparkles, 
    Plus, 
    Trash2, 
    MessageSquare, 
    Send, 
    Loader2, 
    BookOpen, 
    FileText, 
    X, 
    RefreshCw,
    FolderPlus,
    Check,
    Pencil
} from 'lucide-react';
import { 
    getUserSessions, 
    createChatSession, 
    getSessionDocuments, 
    addDocumentToSession, 
    removeDocumentFromSession, 
    getSessionMessages, 
    sendChatMessage, 
    deleteChatSession,
    renameChatSession,
    ChatSession, 
    ChatSessionDocument, 
    ChatMessage 
} from '@/lib/actions/ai.actions';
import { getFiles } from '@/lib/actions/file.actions';
import { cn } from '@/lib/utils';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import FileUploader from '@/components/FileUploader';
import { toast } from 'sonner';
import ApryseViewer from '@/components/ApryseViewer';
import { File_ } from '@/types';

interface LibraryFile {
    id: string;
    fileName: string;
    fileSizeBytes?: number;
    url?: string;
    lifecycleStatus?: any;
    status?: any;
}

const MessageWithCitations = ({ 
    content, 
    citations, 
    onCitationClick 
}: { 
    content: string; 
    citations?: any[]; 
    onCitationClick: (docId: string, page?: number, snippet?: string) => void 
}) => {
    if (!citations || citations.length === 0) return <span>{content}</span>;

    const parts = content.split(/(\[\d+\])/g);
    return (
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
                                onClick={() => onCitationClick(
                                    cit.documentId || cit.DocumentId, 
                                    cit.pageNumber || cit.PageNumber, 
                                    cit.snippet || cit.Snippet
                                )}
                                className="inline-flex items-center justify-center px-1.5 py-0.5 mx-1 rounded-sm bg-brand/20 text-brand text-[10px] font-bold cursor-pointer hover:bg-brand hover:text-white transition-colors align-super"
                                title={`Source: ${cit.source || cit.Source}`}
                            >
                                {match[1]}
                            </button>
                        );
                    }
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

export default function AIChatPage() {
    // 1. Session State
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isSessionsLoading, setIsSessionsLoading] = useState<boolean>(true);

    // 1.1 Session Edit/Delete State
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [renameTitleInput, setRenameTitleInput] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // 2. Documents in CURRENT Session
    const [sessionDocuments, setSessionDocuments] = useState<ChatSessionDocument[]>([]);
    const [isSourcesLoading, setIsSourcesLoading] = useState<boolean>(false);

    // 3. Messages in CURRENT Session
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isMessagesLoading, setIsMessagesLoading] = useState<boolean>(false);

    // 4. Library (for Add Sources Modal)
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [libraryDocs, setLibraryDocs] = useState<LibraryFile[]>([]);
    const [isLibraryLoading, setIsLibraryLoading] = useState<boolean>(false);
    const [isAddingDocId, setIsAddingDocId] = useState<string | null>(null);
    const [isRefetchingLibrary, setIsRefetchingLibrary] = useState<boolean>(false);

    // 5. PDF Citation Viewer
    const [activeCitationDocId, setActiveCitationDocId] = useState<string | null>(null);
    const [activeCitationPage, setActiveCitationPage] = useState<number | undefined>(undefined);
    const [activeCitationSnippet, setActiveCitationSnippet] = useState<string | undefined>(undefined);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isSending]);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        setIsSessionsLoading(true);
        try {
            const data = await getUserSessions();
            const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setSessions(sorted);
            
            if (sorted.length > 0) {
                await selectSession(sorted[0].id);
            } else {
                setCurrentSessionId(null);
                setSessionDocuments([]);
                setMessages([]);
            }
        } catch (error: unknown) {
            toast.error("Failed to load AI Notebook sessions.");
        } finally {
            setIsSessionsLoading(false);
        }
    };

    const selectSession = async (sessionId: string) => {
        setCurrentSessionId(sessionId);
        await Promise.all([
            loadAttachedSources(sessionId),
            loadMessages(sessionId)
        ]);
    };

    const loadAttachedSources = async (sessionId: string) => {
        setIsSourcesLoading(true);
        try {
            const docs = await getSessionDocuments(sessionId);
            setSessionDocuments(docs);
        } catch (error: unknown) {
            toast.error("Failed to load attached sources.");
            setSessionDocuments([]);
        } finally {
            setIsSourcesLoading(false);
        }
    };

    const loadMessages = async (sessionId: string) => {
        setIsMessagesLoading(true);
        try {
            const msgs = await getSessionMessages(sessionId);
            setMessages(msgs);
        } catch (error: unknown) {
            toast.error("Failed to load chat history.");
            setMessages([]);
        } finally {
            setIsMessagesLoading(false);
        }
    };

    const handleCreateNewNotebook = async () => {
        try {
            const newTitle = `AI Notebook ${new Date().toLocaleDateString()}`;
            const newSession = await createChatSession(newTitle);
            
            setSessions(prev => [newSession, ...prev]);
            setCurrentSessionId(newSession.id);
            setSessionDocuments([]);
            setMessages([]);
            
            toast.success("Created new notebook session!");
        } catch (error: unknown) {
            toast.error("Failed to create new notebook session.");
        }
    };

    const handleRenameSession = async () => {
        if (!currentSessionId || !renameTitleInput.trim()) return;
        setIsRenaming(true);
        try {
            const updatedSession = await renameChatSession(currentSessionId, renameTitleInput.trim());
            setSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
            setIsRenameModalOpen(false);
            toast.success("Notebook renamed!");
        } catch (error: unknown) {
            toast.error("Failed to rename notebook.");
        } finally {
            setIsRenaming(false);
        }
    };

    const handleDeleteSession = async () => {
        if (!currentSessionId) return;
        setIsDeleting(true);
        try {
            await deleteChatSession(currentSessionId);
            setSessions(prev => prev.filter(s => s.id !== currentSessionId));
            setIsDeleteModalOpen(false);
            toast.success("Notebook deleted successfully.");
            
            // Auto select another session if available
            const remaining = sessions.filter(s => s.id !== currentSessionId);
            if (remaining.length > 0) {
                selectSession(remaining[0].id);
            } else {
                setCurrentSessionId(null);
                setSessionDocuments([]);
                setMessages([]);
            }
        } catch (error: unknown) {
            toast.error("Failed to delete notebook.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRemoveSource = async (documentId: string) => {
        if (!currentSessionId) return;
        try {
            await removeDocumentFromSession(currentSessionId, documentId);
            setSessionDocuments(prev => prev.filter(s => s.documentId !== documentId));
            toast.success("Source removed from notebook.");
        } catch (error: unknown) {
            toast.error("Failed to remove source.");
        }
    };

    const loadLibrary = async () => {
        setIsLibraryLoading(true);
        try {
            const res = await getFiles({ types: ["document"], limit: 50 });
            setLibraryDocs(res.documents || []);
        } catch (e) {
            toast.error("Failed to load library.");
        } finally {
            setIsLibraryLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        if (!currentSessionId) {
            toast.error("Please select or create a Notebook first!");
            return;
        }
        if (libraryDocs.length === 0) {
            loadLibrary();
        }
        setIsAddModalOpen(true);
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
        } catch (error: unknown) {
            toast.error("Failed to attach document. It might already be attached.");
        } finally {
            setIsAddingDocId(null);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !currentSessionId || isSending) return;

        const content = chatInput.trim();
        const tempMsg: ChatMessage = {
            id: Date.now().toString(),
            chatSessionId: currentSessionId,
            sender: 'user',
            content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, tempMsg]);
        setChatInput('');
        setIsSending(true);

        try {
            if (sessionDocuments.length === 0) {
                toast.warning("No sources in this notebook. AI response will be general.");
            }
            const aiResponse = await sendChatMessage(currentSessionId, content);
            setMessages(prev => [...prev, aiResponse]);
        } catch (error: unknown) {
            toast.error("Failed to get AI response. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    const currentSession = sessions.find(s => s.id === currentSessionId);

    return (
        <div className="flex-1 flex flex-col lg:flex-row h-full w-full overflow-hidden bg-white dark:bg-dark-100 border-t border-light-700 dark:border-dark-400">
            {/* LEFT COLUMN: SOURCES SIDEBAR (WORKSPACE) */}
            <aside className="w-full lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-light-700 dark:border-dark-400 bg-white dark:bg-dark-200 flex flex-col h-1/3 lg:h-full overflow-hidden">
                {/* Chat Session Switcher */}
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
                                    onChange={(e) => selectSession(e.target.value)}
                                    disabled={isSessionsLoading || sessions.length === 0}
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
                    {/* Session Actions (Rename / Delete) */}
                    {currentSessionId && (
                        <div className="flex items-center gap-2 pt-1">
                            <button
                                onClick={() => {
                                    setRenameTitleInput(currentSession?.sessionTitle || '');
                                    setIsRenameModalOpen(true);
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white dark:bg-dark-300 hover:bg-slate-100 dark:hover:bg-dark-400 border border-light-700 dark:border-dark-400 rounded-lg text-[11px] font-semibold text-slate-500 transition-colors cursor-pointer"
                            >
                                <Pencil className="w-3 h-3" />
                                Rename
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white dark:bg-dark-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 border border-light-700 dark:border-dark-400 rounded-lg text-[11px] font-semibold text-slate-500 transition-colors cursor-pointer"
                            >
                                <Trash2 className="w-3 h-3" />
                                Delete Session
                            </button>
                        </div>
                    )}
                </div>

                {/* Sources Header */}
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

                {/* Sources List for Current Session */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/50 dark:bg-dark-300/20">
                    {isSourcesLoading || isSessionsLoading ? (
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
                                    className="p-1.5 ml-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shrink-0"
                                    title="Remove from Session"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* RIGHT / MIDDLE COLUMN: CHAT STUDIO */}
            <main className={cn("flex flex-col h-2/3 lg:h-full bg-light-800 dark:bg-dark-100 relative overflow-hidden transition-all duration-300", activeCitationDocId ? "lg:w-1/3 xl:w-[40%]" : "flex-1")}>
                {/* Chat Studio Top Banner */}
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
                        onClick={() => currentSessionId && loadMessages(currentSessionId)}
                        disabled={isMessagesLoading || !currentSessionId}
                        className="p-2 hover:bg-light-700 dark:hover:bg-dark-300 rounded-xl text-slate-400 hover:text-dark-200 dark:hover:text-light-100 transition-colors cursor-pointer disabled:opacity-50"
                        title="Refresh Messages"
                    >
                        <RefreshCw className={cn("w-4 h-4", isMessagesLoading && "animate-spin")} />
                    </button>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {isMessagesLoading || isSessionsLoading ? (
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
                                Click the "+ New" button on the left panel to create a new Chat Session.
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
                                                citations={msg.citations || (msg as any).Citations} 
                                                onCitationClick={(docId, page, snippet) => {
                                                    setActiveCitationDocId(docId);
                                                    setActiveCitationPage(page);
                                                    setActiveCitationSnippet(snippet);
                                                }}
                                            />
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {isSending && (
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

                {/* Bottom Chat Input Bar */}
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
                            disabled={isSending || !currentSessionId}
                            className="flex-1 bg-transparent border-0 outline-none px-3 py-2 text-xs sm:text-sm text-dark-200 dark:text-light-100 placeholder:text-slate-400 resize-none max-h-32 custom-scrollbar disabled:cursor-not-allowed"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isSending || !currentSessionId}
                            className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                                chatInput.trim() && !isSending && currentSessionId
                                    ? "bg-brand text-white shadow-sm hover:bg-brand/90 hover:scale-105 cursor-pointer"
                                    : "bg-light-700 dark:bg-dark-400 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            {isSending ? (
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
            </main>

            {/* FAR RIGHT COLUMN: APRYSE VIEWER */}
            {activeCitationDocId && (() => {
                const doc = sessionDocuments.find(s => s.documentId === activeCitationDocId);
                if (!doc) return null;
                const fakeFile: File_ = {
                    id: doc.documentId,
                    fileName: doc.fileName || doc.title,
                    fileExtension: (doc.fileName || "").split('.').pop() || 'pdf',
                    mimeType: "",
                    fileSizeBytes: 0,
                    uploadedAt: doc.addedAt,
                    status: "Completed",
                    lifecycleStatus: "Active",
                    isEncrypted: false,
                    isPublic: false,
                    encryptionKeyId: "",
                    ownerId: ""
                };
                return (
                    <aside className="hidden lg:flex flex-1 flex-col h-full bg-white dark:bg-dark-200 border-l border-light-700 dark:border-dark-400 z-10 transition-all shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
                        <div className="h-16 px-4 border-b border-light-700 dark:border-dark-400 flex items-center justify-between shrink-0 bg-white">
                            <div className="flex items-center gap-2 min-w-0">
                                <BookOpen className="w-5 h-5 text-brand" />
                                <h2 className="text-sm font-bold text-slate-800 truncate">{doc.fileName || doc.title}</h2>
                            </div>
                            <button 
                                onClick={() => setActiveCitationDocId(null)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 w-full relative bg-slate-50">
                            <ApryseViewer 
                                key={`${fakeFile.id}-${activeCitationPage}`}
                                file={fakeFile} 
                                path="/chat" 
                                closeModals={() => setActiveCitationDocId(null)} 
                                readOnly={true} 
                                targetPage={activeCitationPage}
                                searchSnippet={activeCitationSnippet}
                            />
                        </div>
                    </aside>
                );
            })()}

            {/* ADD SOURCES MODAL */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
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
                        {isLibraryLoading ? (
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
                                    setIsRefetchingLibrary(true);
                                    try {
                                        const res = await getFiles({ types: ["document"], limit: 50 });
                                        setLibraryDocs(res.documents || []);
                                        toast.success("Library refreshed!");
                                    } catch (e) {
                                        toast.error("Failed to refresh library");
                                    } finally {
                                        setIsRefetchingLibrary(false);
                                    }
                                }}
                                disabled={isRefetchingLibrary}
                                className="w-full py-2 bg-light-700 dark:bg-dark-400 hover:bg-light-600 dark:hover:bg-dark-300 rounded-xl text-xs font-bold text-dark-200 dark:text-light-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <RefreshCw className={cn("w-3.5 h-3.5", isRefetchingLibrary && "animate-spin")} />
                                Refresh Library after Upload
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* RENAME MODAL */}
            <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
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
                            className="w-full bg-light-800 dark:bg-dark-300 border border-light-700 dark:border-dark-400 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-brand transition-colors"
                        />
                    </div>
                    <DialogFooter>
                        <button
                            onClick={() => setIsRenameModalOpen(false)}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-400 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRenameSession}
                            disabled={isRenaming || !renameTitleInput.trim()}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand hover:bg-brand/90 disabled:opacity-50 transition-colors"
                        >
                            {isRenaming ? "Renaming..." : "Save"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE MODAL */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="shad-dialog bg-white dark:bg-dark-200 rounded-3xl border border-light-700 dark:border-dark-400">
                    <DialogHeader>
                        <DialogTitle className="text-dark-200 dark:text-light-100">Delete Session</DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Are you sure you want to delete this session and all its history? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-400 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteSession}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Delete Permanently
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
