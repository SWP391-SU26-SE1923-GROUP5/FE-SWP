'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    Sparkles, 
    Plus, 
    Trash2, 
    CheckSquare, 
    Square, 
    MessageSquare, 
    Send, 
    Loader2, 
    BookOpen, 
    FileText, 
    X, 
    RefreshCw,
    FolderPlus,
    Check
} from 'lucide-react';
import { 
    getUserSessions, 
    createChatSession, 
    getSessionDocuments, 
    addDocumentToSession, 
    removeDocumentFromSession, 
    getSessionMessages, 
    sendChatMessage, 
    ChatSession, 
    ChatSessionDocument, 
    ChatMessage 
} from '@/lib/actions/ai.actions';
import { getFiles, getTrashFiles } from '@/lib/actions/file.actions';
import { cn } from '@/lib/utils';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from '@/components/ui/dialog';
import FileUploader from '@/components/FileUploader';
import { toast } from 'sonner';

interface LibraryFile {
    id: string;
    fileName: string;
    fileSizeBytes?: number;
    url?: string;
    lifecycleStatus?: any;
    status?: any;
}

const isDocumentValid = (docId: string, docObj?: any, trashedIds?: Set<string>) => {
    if (!docId) return false;
    if (trashedIds && trashedIds.has(docId)) return false;
    if (docObj) {
        const status = (docObj.lifecycleStatus || docObj.status || '').toString().toLowerCase();
        if (status === 'trashed' || status === 'purged' || status === 'deleted') return false;
        if (docObj.isTrashed === true || docObj.isDeleted === true || docObj.isTrash === true) return false;
    }
    return true;
};

export default function AIChatPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isSessionsLoading, setIsSessionsLoading] = useState<boolean>(true);
    const [sessionDocsMap, setSessionDocsMap] = useState<Record<string, string[]>>({});

    const [attachedSources, setAttachedSources] = useState<ChatSessionDocument[]>([]);
    const [activeSourceIds, setActiveSourceIds] = useState<Set<string>>(new Set());
    const [isSourcesLoading, setIsSourcesLoading] = useState<boolean>(false);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isMessagesLoading, setIsMessagesLoading] = useState<boolean>(false);

    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isRefetchingLibrary, setIsRefetchingLibrary] = useState<boolean>(false);

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
            const [data, trashRes] = await Promise.all([
                getUserSessions(),
                getTrashFiles().catch(() => ({ documents: [] }))
            ]);
            const trashedIds = new Set<string>((trashRes.documents || []).map((d: any) => d.id || d.Id || d.documentId));

            const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setSessions(sorted);

            const docsMap: Record<string, string[]> = {};
            const allUniqueDocsMap = new Map<string, ChatSessionDocument>();
            await Promise.all(sorted.map(async (s) => {
                try {
                    const docs = await getSessionDocuments(s.id);
                    const validDocs = docs.filter(d => isDocumentValid(d.documentId, d, trashedIds));
                    docsMap[s.id] = validDocs.map(d => d.documentId);
                    validDocs.forEach(d => allUniqueDocsMap.set(d.documentId, d));
                    if (s.documentId && !docsMap[s.id].includes(s.documentId) && isDocumentValid(s.documentId, undefined, trashedIds)) {
                        docsMap[s.id].push(s.documentId);
                    }
                } catch {
                    docsMap[s.id] = (s.documentId && isDocumentValid(s.documentId, undefined, trashedIds)) ? [s.documentId] : [];
                }
            }));
            setSessionDocsMap(docsMap);

            try {
                const res = await getFiles({ types: ["document"], limit: 50 });
                const libraryDocs: ChatSessionDocument[] = (res.documents || [])
                    .filter((f: any) => isDocumentValid(f.id || f.Id, f, trashedIds))
                    .map((f: any) => ({
                        chatSessionId: '',
                        documentId: f.id || f.Id,
                        title: f.fileName || f.title,
                        fileName: f.fileName || f.title,
                        addedAt: new Date().toISOString()
                    }));
                libraryDocs.forEach(d => {
                    if (!allUniqueDocsMap.has(d.documentId)) {
                        allUniqueDocsMap.set(d.documentId, d);
                    }
                });
            } catch {
            }

            const allDocs = Array.from(allUniqueDocsMap.values());
            setAttachedSources(allDocs);
            setActiveSourceIds(new Set());
            setCurrentSessionId(null);
            setMessages([]);
        } catch (error: unknown) {
            toast.error("Failed to load AI Notebook sessions.");
        } finally {
            setIsSessionsLoading(false);
        }
    };

    const filteredSessions = activeSourceIds.size === 0 ? [] : sessions.filter(s => {
        const docIds = sessionDocsMap[s.id] || (s.documentId ? [s.documentId] : []);
        return docIds.some(id => activeSourceIds.has(id));
    });

    useEffect(() => {
        if (activeSourceIds.size === 0) {
            setCurrentSessionId(null);
            setMessages([]);
        } else if (filteredSessions.length > 0 && (!currentSessionId || !filteredSessions.some(s => s.id === currentSessionId))) {
            setCurrentSessionId(filteredSessions[0].id);
            loadMessages(filteredSessions[0].id);
        } else if (filteredSessions.length === 0) {
            setCurrentSessionId(null);
            setMessages([]);
        }
    }, [activeSourceIds, sessions, sessionDocsMap]);

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
            const [docs, trashRes] = await Promise.all([
                getSessionDocuments(sessionId),
                getTrashFiles().catch(() => ({ documents: [] }))
            ]);
            const trashedIds = new Set<string>((trashRes.documents || []).map((d: any) => d.id || d.Id || d.documentId));
            const validDocs = docs.filter(d => isDocumentValid(d.documentId, d, trashedIds));

            setSessionDocsMap(prev => ({
                ...prev,
                [sessionId]: validDocs.map(d => d.documentId)
            }));

            setAttachedSources(prev => {
                const map = new Map(prev.map(p => [p.documentId, p]));
                validDocs.forEach(d => map.set(d.documentId, d));
                return Array.from(map.values()).filter(d => isDocumentValid(d.documentId, d, trashedIds));
            });

            setActiveSourceIds(prev => {
                if (prev.size === 0) {
                    return new Set(validDocs.map(d => d.documentId));
                }
                const next = new Set<string>();
                prev.forEach(id => {
                    if (isDocumentValid(id, undefined, trashedIds)) next.add(id);
                });
                return next;
            });
        } catch (error: unknown) {
            toast.error("Failed to load attached sources.");
            setAttachedSources([]);
            setActiveSourceIds(new Set());
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
        setIsSessionsLoading(true);
        try {
            const newTitle = `AI Notebook ${new Date().toLocaleDateString()}`;
            const newSession = await createChatSession(newTitle);
            
            // If active sources are currently selected, automatically attach them to this new notebook
            const activeIds = Array.from(activeSourceIds);
            const attachedDocsForNewSession: ChatSessionDocument[] = [];
            if (activeIds.length > 0) {
                for (const docId of activeIds) {
                    try {
                        const addedDoc = await addDocumentToSession(newSession.id, docId);
                        attachedDocsForNewSession.push(addedDoc);
                    } catch {
                        // ignore error for specific doc
                    }
                }
            }

            setSessions(prev => [newSession, ...prev]);
            setSessionDocsMap(prev => ({
                ...prev,
                [newSession.id]: activeIds
            }));
            setCurrentSessionId(newSession.id);
            if (attachedDocsForNewSession.length > 0) {
                setAttachedSources(prev => {
                    const map = new Map(prev.map(p => [p.documentId, p]));
                    attachedDocsForNewSession.forEach(d => map.set(d.documentId, d));
                    return Array.from(map.values());
                });
            }
            setMessages([]);
            toast.success(activeIds.length > 0 ? `Created new notebook with ${activeIds.length} source(s)!` : "Created new notebook session!");
        } catch (error: unknown) {
            toast.error("Failed to create new notebook session.");
        } finally {
            setIsSessionsLoading(false);
        }
    };

    // Toggle individual source checkbox
    const toggleSourceActive = (documentId: string) => {
        setActiveSourceIds(prev => {
            const next = new Set(prev);
            if (next.has(documentId)) {
                next.delete(documentId);
            } else {
                next.add(documentId);
            }
            return next;
        });
    };

    // Remove source from session
    const handleRemoveSource = async (documentId: string) => {
        if (!currentSessionId) return;
        try {
            await removeDocumentFromSession(currentSessionId, documentId);
            setAttachedSources(prev => prev.filter(s => s.documentId !== documentId));
            setActiveSourceIds(prev => {
                const next = new Set(prev);
                next.delete(documentId);
                return next;
            });
            setSessionDocsMap(prev => ({
                ...prev,
                [currentSessionId]: (prev[currentSessionId] || []).filter(id => id !== documentId)
            }));
            toast.success("Source removed from notebook.");
        } catch (error: unknown) {
            toast.error("Failed to remove source.");
        }
    };

    // Open add modal
    const handleOpenAddModal = () => {
        setIsAddModalOpen(true);
    };

    // Send chat message
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
            // Auto attach all active checked sources to current session if they aren't attached yet
            const attachedIds = sessionDocsMap[currentSessionId] || [];
            const activeIdsList = Array.from(activeSourceIds);
            const newlyAttached: ChatSessionDocument[] = [];
            for (const docId of activeIdsList) {
                if (!attachedIds.includes(docId)) {
                    try {
                        const added = await addDocumentToSession(currentSessionId, docId);
                        newlyAttached.push(added);
                    } catch {
                        // ignore error for specific doc
                    }
                }
            }
            if (newlyAttached.length > 0) {
                setSessionDocsMap(prev => ({
                    ...prev,
                    [currentSessionId]: Array.from(new Set([...(prev[currentSessionId] || []), ...newlyAttached.map(d => d.documentId)]))
                }));
                setAttachedSources(prev => {
                    const map = new Map(prev.map(p => [p.documentId, p]));
                    newlyAttached.forEach(d => map.set(d.documentId, d));
                    return Array.from(map.values());
                });
            }

            const activeDocId = activeIdsList[0] || (attachedSources[0]?.documentId || null);
            if (!activeDocId) {
                toast.warning("No active source selected. AI response might be general.");
            }
            const aiResponse = await sendChatMessage(currentSessionId, activeDocId || '', content);
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
            {/* LEFT COLUMN: SOURCES SIDEBAR */}
            <aside className="w-full lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-light-700 dark:border-dark-400 bg-white dark:bg-dark-200 flex flex-col h-1/3 lg:h-full overflow-hidden">
                {/* Notebook Session Header & Switcher */}
                <div className="p-4 border-b border-light-700 dark:border-dark-400 bg-light-800/50 dark:bg-dark-300/40 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                                Current Notebook
                            </label>
                            <select
                                className="w-full bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 rounded-xl px-3 py-2 text-sm font-semibold text-dark-200 dark:text-light-100 outline-none focus:border-brand transition-colors truncate cursor-pointer shadow-2xs"
                                value={currentSessionId || ''}
                                onChange={(e) => selectSession(e.target.value)}
                                disabled={isSessionsLoading || activeSourceIds.size === 0 || filteredSessions.length === 0}
                            >
                                {activeSourceIds.size === 0 ? (
                                    <option value="">Select source(s) to view notebook</option>
                                ) : filteredSessions.length === 0 ? (
                                    <option value="">No notebook for selected sources</option>
                                ) : (
                                    filteredSessions.map(s => (
                                        <option key={s.id} value={s.id}>{s.sessionTitle}</option>
                                    ))
                                )}
                            </select>
                        </div>
                        <button
                            onClick={handleCreateNewNotebook}
                            disabled={isSessionsLoading || activeSourceIds.size === 0}
                            className={cn(
                                "h-10 px-3 mt-4 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-xs shrink-0",
                                activeSourceIds.size === 0
                                    ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                                    : "bg-brand hover:bg-brand/90 cursor-pointer"
                            )}
                            title="Create New Notebook"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New</span>
                        </button>
                    </div>
                </div>

                {/* Sources Section Header */}
                <div className="p-4 border-b border-light-700 dark:border-dark-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-brand" />
                        <span className="font-extrabold text-sm text-dark-200 dark:text-light-100">
                            Sources
                        </span>
                        <span className="bg-brand/10 text-brand text-[11px] font-bold px-2 py-0.5 rounded-full">
                            {attachedSources.length}
                        </span>
                    </div>
                    <button
                        onClick={handleOpenAddModal}
                        className="bg-brand/10 hover:bg-brand/20 text-brand px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Sources</span>
                    </button>
                </div>

                {/* Sources List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {isSourcesLoading || isSessionsLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-6 h-6 animate-spin text-brand" />
                        </div>
                    ) : attachedSources.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center p-6 h-full border-2 border-dashed border-light-700 dark:border-dark-400 rounded-2xl text-slate-400">
                            <FileText className="w-10 h-10 stroke-1 mb-2 opacity-50" />
                            <p className="text-xs font-semibold mb-1 text-dark-200 dark:text-light-100">No sources available</p>
                            <p className="text-[11px] leading-relaxed max-w-[200px]">
                                Add documents from your library or upload new files to start studying with AI.
                            </p>
                            <button
                                onClick={handleOpenAddModal}
                                className="mt-4 bg-brand text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform hover:scale-[1.02] cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Your First Source</span>
                            </button>
                        </div>
                    ) : (
                        attachedSources.map(doc => {
                            const isActive = activeSourceIds.has(doc.documentId);
                            return (
                                <div
                                    key={doc.documentId}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group",
                                        isActive 
                                            ? "border-brand/40 bg-brand/5 dark:bg-brand/10 shadow-2xs" 
                                            : "border-light-700 dark:border-dark-400 bg-white dark:bg-dark-300 opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <div 
                                        className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
                                        onClick={() => toggleSourceActive(doc.documentId)}
                                    >
                                        <button type="button" className="text-brand shrink-0 focus:outline-none">
                                            {isActive ? (
                                                <CheckSquare className="w-4 h-4 fill-brand text-white" />
                                            ) : (
                                                <Square className="w-4 h-4 text-slate-400" />
                                            )}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-dark-200 dark:text-light-100 truncate">
                                                {doc.title || doc.fileName || "Untitled Document"}
                                            </p>
                                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                Added {new Date(doc.addedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveSource(doc.documentId)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shrink-0"
                                        title="Detach Source"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* RIGHT / MIDDLE COLUMN: CHAT STUDIO */}
            <main className="flex-1 flex flex-col h-2/3 lg:h-full bg-light-800 dark:bg-dark-100 relative overflow-hidden">
                {/* Chat Studio Top Banner */}
                <div className="h-16 px-6 border-b border-light-700 dark:border-dark-400 bg-white/80 dark:bg-dark-200/80 backdrop-blur-md flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand shrink-0">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-extrabold text-dark-200 dark:text-light-100 truncate">
                                {currentSession?.sessionTitle || (activeSourceIds.size === 0 ? "Select Sources to Begin" : "AI Notebook Studio")}
                            </h1>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>{activeSourceIds.size} of {attachedSources.length} sources selected</span>
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
                    ) : activeSourceIds.size === 0 || !currentSessionId ? (
                        <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center p-8 animate-in fade-in duration-300">
                            <div className="w-16 h-16 rounded-3xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand mb-4 shadow-sm animate-bounce-subtle">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <h2 className="text-lg font-extrabold text-dark-200 dark:text-light-100 mb-2">
                                {activeSourceIds.size === 0 ? "No Sources Selected" : "No Notebook for Selected Sources"}
                            </h2>
                            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 mb-6">
                                {activeSourceIds.size === 0 
                                    ? "Please check at least one source document from the left panel to open its notebook or create a new one."
                                    : "No notebook session exists for the selected sources yet. Click + New above to create one right away!"}
                            </p>
                            <button
                                onClick={activeSourceIds.size === 0 ? handleOpenAddModal : handleCreateNewNotebook}
                                className="bg-brand text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-brand/90 hover:scale-105 transition-all cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>{activeSourceIds.size === 0 ? "Add Sources" : "Create New Notebook"}</span>
                            </button>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center p-8">
                            <div className="w-16 h-16 rounded-3xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand mb-4 shadow-sm animate-bounce-subtle">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <h2 className="text-lg font-extrabold text-dark-200 dark:text-light-100 mb-2">
                                Start Your Notebook Conversation
                            </h2>
                            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                Ask questions, request summaries, or generate study notes based on your selected sources on the left panel.
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
                                        {msg.content}
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
                                activeSourceIds.size === 0
                                    ? "Select at least one source on the left to start chatting..."
                                    : !currentSessionId
                                    ? "Click + New above to create a notebook for these sources first..."
                                    : "Ask anything about your selected sources..."
                            }
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            disabled={isSending || activeSourceIds.size === 0 || !currentSessionId}
                            className="flex-1 bg-transparent border-0 outline-none px-3 py-2 text-xs sm:text-sm text-dark-200 dark:text-light-100 placeholder:text-slate-400 resize-none max-h-32 custom-scrollbar disabled:cursor-not-allowed"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isSending || activeSourceIds.size === 0 || !currentSessionId}
                            className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                                chatInput.trim() && !isSending && activeSourceIds.size > 0 && currentSessionId
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
                        AI Notebook can make mistakes. Check important info across your attached source files.
                    </p>
                </div>
            </main>

            {/* ADD SOURCES MODAL */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="shad-dialog max-w-xl p-6 bg-white dark:bg-dark-200 rounded-3xl border border-light-700 dark:border-dark-400 shadow-drop-3">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-extrabold text-dark-200 dark:text-light-100 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-brand" />
                            <span>Add Sources to Notebook</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-400">
                            Upload new documents to add them directly to your library and notebook.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 py-4">
                        <FileUploader className="w-full" />
                        <div className="mt-6 pt-4 border-t border-light-700 dark:border-dark-400 flex justify-end">
                            <button
                                onClick={async () => {
                                    setIsRefetchingLibrary(true);
                                    try {
                                        const [res, trashRes] = await Promise.all([
                                            getFiles({ types: ["document"], limit: 50 }),
                                            getTrashFiles().catch(() => ({ documents: [] }))
                                        ]);
                                        const trashedIds = new Set<string>((trashRes.documents || []).map((d: any) => d.id || d.Id || d.documentId));
                                        
                                        const newDocs = (res.documents || []).filter((f: any) => isDocumentValid(f.id || f.Id, f, trashedIds));
                                        
                                        setAttachedSources(prev => {
                                            const map = new Map(prev.map(p => [p.documentId, p]));
                                            let addedNew = false;
                                            newDocs.forEach((f: any) => {
                                                const id = f.id || f.Id;
                                                if (!map.has(id)) {
                                                    map.set(id, {
                                                        chatSessionId: '',
                                                        documentId: id,
                                                        title: f.fileName || f.title,
                                                        fileName: f.fileName || f.title,
                                                        addedAt: new Date().toISOString()
                                                    });
                                                    addedNew = true;
                                                }
                                            });
                                            
                                            if (addedNew) {
                                                toast.success("Library refreshed and new files added to sidebar!");
                                            }
                                            return Array.from(map.values()).sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
                                        });
                                    } catch (e) {
                                        toast.error("Failed to refresh library");
                                    } finally {
                                        setIsRefetchingLibrary(false);
                                        setIsAddModalOpen(false);
                                    }
                                }}
                                disabled={isRefetchingLibrary}
                                className="px-5 py-2.5 bg-brand text-white hover:bg-brand/90 font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                            >
                                {isRefetchingLibrary ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Refreshing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Done Uploading</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
