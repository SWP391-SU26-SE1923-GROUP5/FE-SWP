'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
    Trash2,
    RotateCcw,
    AlertTriangle,
    Search,
    Clock,
    ArrowLeft,
    CheckCircle2,
    X,
    BookOpen,
    ArrowUpDown,
    ChevronUp,
    ChevronDown,
    LayoutGrid,
    ListFilter,
    HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Thumbnail from '@/components/Thumbnail';
import { getFileType } from '@/lib/utils';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getTrashFiles, restoreFile, permanentDeleteFile } from '@/lib/actions/file.actions';
import { File_ } from '@/types';
import Pagination from '@/components/Pagination';

interface TrashItemView {
    id: string;
    name: string;
    subjectName: string;
    size: number;
    deletedAt: string;
    deletedTimestamp: number;
    daysRemaining: number;
    url: string;
}

type SortField = 'name' | 'subject' | 'size' | 'deletedAt' | 'daysRemaining';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';

export default function TrashPage() {
    const [trashFiles, setTrashFiles] = useState<TrashItemView[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFileToDelete, setSelectedFileToDelete] = useState<TrashItemView | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [sortField, setSortField] = useState<SortField>('daysRemaining');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [viewMode, setViewMode] = useState<ViewMode>('table');

    useEffect(() => {
        let isMounted = true;
        
        getTrashFiles()
            .then(data => {
                if (!isMounted) return;
                const docs = data?.documents || [];
                const mapped: TrashItemView[] = docs.map((doc: File_) => {
                    const deletedTimestamp = doc.updatedAt ? new Date(doc.updatedAt).getTime() : Date.now();
                    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
                    const remainingMs = Math.max(0, (deletedTimestamp + thirtyDaysMs) - Date.now());
                    const daysRemaining = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));

                    return {
                        id: doc.id,
                        name: doc.fileName || doc.title || 'Untitled file',
                        subjectName: doc.subjectId ? `Subject #${doc.subjectId.slice(0, 6)}` : 'General',
                        size: doc.fileSizeBytes || 0,
                        deletedAt: doc.updatedAt
                            ? new Date(doc.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                            : new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                        deletedTimestamp,
                        daysRemaining,
                        url: doc.fileLink || ''
                    };
                });
                setTrashFiles(mapped);
                setLoading(false);
            })
            .catch(error => {
                if (!isMounted) return;
                console.error('Failed to load trash files:', error);
                toast.error('Could not fetch deleted documents from trash.');
                setLoading(false);
            });
            
        return () => {
            isMounted = false;
        };
    }, []);

    const filteredAndSortedFiles = useMemo(() => {
        const result = trashFiles.filter(file =>
            file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            file.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
        );

        result.sort((a, b) => {
            let comp = 0;
            switch (sortField) {
                case 'name':
                    comp = a.name.localeCompare(b.name);
                    break;
                case 'subject':
                    comp = a.subjectName.localeCompare(b.subjectName);
                    break;
                case 'size':
                    comp = a.size - b.size;
                    break;
                case 'deletedAt':
                    comp = a.deletedTimestamp - b.deletedTimestamp;
                    break;
                case 'daysRemaining':
                    comp = a.daysRemaining - b.daysRemaining;
                    break;
            }
            return sortOrder === 'asc' ? comp : -comp;
        });

        return result;
    }, [trashFiles, searchQuery, sortField, sortOrder]);

    const totalItems = filteredAndSortedFiles.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const paginatedFiles = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedFiles.slice(start, start + itemsPerPage);
    }, [filteredAndSortedFiles, currentPage, itemsPerPage]);

    const totalRecoverableBytes = useMemo(() => {
        return trashFiles.reduce((acc, file) => acc + file.size, 0);
    }, [trashFiles]);

    const totalRecoverableMB = (totalRecoverableBytes / (1024 * 1024)).toFixed(2);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
        setCurrentPage(1);
    };

    const handleRestore = async (id: string, name: string) => {
        setActionLoading(id);
        try {
            await restoreFile({ fileId: id, path: '/trash' });
            setTrashFiles(prev => prev.filter(f => f.id !== id));
            toast.success(`Restored "${name}" successfully. Storage quota has been refunded!`);
        } catch (error) {
            toast.error((error as Error)?.message || `Failed to restore "${name}".`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeletePermanently = async (id: string, name: string) => {
        setActionLoading(id);
        try {
            await permanentDeleteFile({ fileId: id, path: '/trash' });
            setTrashFiles(prev => prev.filter(f => f.id !== id));
            setSelectedFileToDelete(null);
            toast.success(`"${name}" has been permanently purged.`);
        } catch (error) {
            toast.error((error as Error)?.message || `Failed to permanently delete "${name}".`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleEmptyTrash = async () => {
        if (trashFiles.length === 0) return;
        setLoading(true);
        try {
            for (const f of trashFiles) {
                await permanentDeleteFile({ fileId: f.id, path: '/trash' }).catch(() => null);
            }
            setTrashFiles([]);
            toast.success('Trash bin emptied. All storage space has been permanently reclaimed.');
        } catch {
            toast.error('An error occurred while emptying the trash bin.');
        } finally {
            setLoading(false);
        }
    };

    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="h-3.5 w-3.5 text-light-400 opacity-40 group-hover:opacity-100 transition-opacity" />;
        }
        return sortOrder === 'asc' ? (
            <ChevronUp className="h-3.5 w-3.5 text-brand" />
        ) : (
            <ChevronDown className="h-3.5 w-3.5 text-brand" />
        );
    };

    return (
        <div className="flex flex-col gap-6 pb-20 pt-6 max-w-7xl mx-auto w-full px-5 sm:px-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-700 dark:border-dark-400 pb-5">
                <div className="flex items-center gap-3.5">
                    <Link
                        href="/home"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-dark-300 border border-light-700 dark:border-dark-400 shadow-xs hover:bg-light-800 dark:hover:bg-dark-400 text-dark300_light700 transition-all"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="h2 text-dark100_light900 font-bold">Trash Bin</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                {trashFiles.length} {trashFiles.length === 1 ? 'document' : 'documents'}
                            </span>
                        </div>
                        <p className="caption text-dark500_light400 mt-0.5">
                            Deleted documents automatically purge after 30 days. Restore files right now to refund your exact storage quota.
                        </p>
                    </div>
                </div>

                {trashFiles.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={loading || actionLoading !== null}
                                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer self-start sm:self-center disabled:opacity-50 transition"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>Empty Trash Bin ({totalRecoverableMB} MB)</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 shadow-2xl p-6 sm:p-8">
                            <AlertDialogHeader className="space-y-2">
                                <AlertDialogTitle className="flex items-center gap-2.5 text-red-600 font-bold text-lg">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span>Purge entire trash bin permanently?</span>
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-dark500_light400 text-sm">
                                    You are about to permanently delete <span className="font-semibold text-dark100_light900">{trashFiles.length} files</span> ({totalRecoverableMB} MB total). All AI vector embeddings in Qdrant and cloud storage items will be purged forever and cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="pt-4 flex gap-2">
                                <AlertDialogCancel className="rounded-xl h-10 px-5 text-xs font-semibold cursor-pointer border border-light-700 dark:border-dark-400 bg-light-800 dark:bg-dark-300 text-dark200_light800 m-0">
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleEmptyTrash}
                                    className="rounded-xl h-10 px-6 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer shadow-md m-0"
                                >
                                    Yes, Empty Trash
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-dark-300 p-4 rounded-2xl border border-light-700 dark:border-dark-400 shadow-xs">
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-light-800 dark:bg-dark-200 border border-light-700 dark:border-dark-400 shrink-0">
                        <HardDrive className="h-4 w-4 text-brand" />
                        <span className="text-xs font-semibold text-dark200_light800">
                            Reclaimable: <span className="font-bold text-brand">{totalRecoverableMB} MB</span>
                        </span>
                    </div>

                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dark500_light400 pointer-events-none" />
                        <Input
                            type="text"
                            placeholder="Filter by file title or subject..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="pl-10 pr-9 h-10 w-full rounded-xl border border-light-700 dark:border-dark-400 bg-light-800/60 dark:bg-dark-200 text-xs text-dark100_light900 placeholder:text-dark500_light400 focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-transparent transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark500_light400 hover:text-dark100_light900 p-0.5 rounded-full"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-light-700 dark:border-dark-400">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-dark500_light400">Sort by:</span>
                        <select
                            value={sortField}
                            onChange={(e) => { setSortField(e.target.value as SortField); setCurrentPage(1); }}
                            className="h-9 px-3 rounded-xl border border-light-700 dark:border-dark-400 bg-light-800/60 dark:bg-dark-200 text-xs font-semibold text-dark200_light800 focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                        >
                            <option value="daysRemaining">Urgency (Days Left)</option>
                            <option value="name">File Name</option>
                            <option value="subject">Subject</option>
                            <option value="size">File Size</option>
                            <option value="deletedAt">Date Deleted</option>
                        </select>
                        <button
                            onClick={() => { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); setCurrentPage(1); }}
                            className="h-9 px-2.5 rounded-xl border border-light-700 dark:border-dark-400 bg-light-800/60 dark:bg-dark-200 text-dark200_light800 hover:bg-light-700 dark:hover:bg-dark-400 transition flex items-center justify-center cursor-pointer"
                            title={`Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                        >
                            {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4 text-brand" /> : <ChevronDown className="h-4 w-4 text-brand" />}
                        </button>
                    </div>

                    <div className="flex items-center gap-1 bg-light-800 dark:bg-dark-200 p-1 rounded-xl border border-light-700 dark:border-dark-400">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                viewMode === 'table' ? 'bg-white dark:bg-dark-300 text-brand shadow-xs' : 'text-dark500_light400 hover:text-dark100_light900'
                            }`}
                            title="Table View (Compact Layout)"
                        >
                            <ListFilter className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                viewMode === 'grid' ? 'bg-white dark:bg-dark-300 text-brand shadow-xs' : 'text-dark500_light400 hover:text-dark100_light900'
                            }`}
                            title="Grid View (Visual Cards)"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white dark:bg-dark-300 rounded-2xl border border-light-700 dark:border-dark-400">
                    <div className="w-8 h-8 rounded-full border-3 border-brand border-t-transparent animate-spin mb-3" />
                    <p className="body-2 text-dark500_light400">Loading trash documents...</p>
                </div>
            ) : trashFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-white dark:bg-dark-300 rounded-2xl border border-light-700 dark:border-dark-400 shadow-xs w-full">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-brand mb-4">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="h3 font-bold text-dark100_light900 mb-1.5">Your Trash Bin is Clean</h3>
                    <p className="caption text-dark500_light400 max-w-md mb-6 leading-relaxed">
                        There are no deleted documents occupying your storage quota. When you remove items from your subjects, they will appear here for 30 days before permanent automatic purge.
                    </p>
                    <Link href="/home">
                        <Button className="primary-btn h-10 px-6 text-xs rounded-xl cursor-pointer">
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            ) : filteredAndSortedFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-dark-300 rounded-2xl border border-light-700 dark:border-dark-400 w-full">
                    <Search className="h-10 w-10 text-dark500_light400 mb-2 opacity-40" />
                    <h4 className="text-base font-bold text-dark100_light900 mb-1">No matching files found</h4>
                    <p className="caption text-dark500_light400 max-w-sm mb-4">
                        No deleted documents matched &#34;{searchQuery}&#34;
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                        className="h-9 px-4 rounded-xl border-light-700 dark:border-dark-400 text-dark200_light800 text-xs font-semibold cursor-pointer"
                    >
                        Clear Search Filter
                    </Button>
                </div>
            ) : viewMode === 'table' ? (
                <div className="rounded-2xl border border-light-700 dark:border-dark-400 bg-white dark:bg-dark-300 shadow-xs overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-light-800/90 dark:bg-dark-200/90 border-b border-light-700 dark:border-dark-400 text-[11px] font-bold uppercase tracking-wider text-dark500_light400 select-none">
                        <button
                            onClick={() => handleSort('name')}
                            className="col-span-12 sm:col-span-5 flex items-center gap-1.5 hover:text-dark100_light900 text-left group cursor-pointer"
                        >
                            <span>Document Name & Subject</span>
                            {renderSortIcon('name')}
                        </button>
                        <button
                            onClick={() => handleSort('size')}
                            className="col-span-6 sm:col-span-2 flex items-center gap-1 hover:text-dark100_light900 group cursor-pointer"
                        >
                            <span>Size</span>
                            {renderSortIcon('size')}
                        </button>
                        <button
                            onClick={() => handleSort('deletedAt')}
                            className="col-span-6 sm:col-span-2 flex items-center gap-1 hover:text-dark100_light900 group cursor-pointer"
                        >
                            <span>Deleted On</span>
                            {renderSortIcon('deletedAt')}
                        </button>
                        <button
                            onClick={() => handleSort('daysRemaining')}
                            className="col-span-6 sm:col-span-2 flex items-center gap-1 hover:text-dark100_light900 group cursor-pointer"
                        >
                            <span>Auto-Purge</span>
                            {renderSortIcon('daysRemaining')}
                        </button>
                        <div className="col-span-6 sm:col-span-1 text-right font-semibold">
                            Actions
                        </div>
                    </div>

                    <div className="divide-y divide-light-700/60 dark:divide-dark-400/60">
                        {paginatedFiles.map((file) => {
                            const { type, extension } = getFileType(file.name);
                            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                            const isUrgent = file.daysRemaining <= 5;
                            const isRowBusy = actionLoading === file.id;

                            return (
                                <div
                                    key={file.id}
                                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-light-800/40 dark:hover:bg-dark-200/40 transition-colors group"
                                >
                                    <div className="col-span-12 sm:col-span-5 flex items-center gap-3.5 min-w-0">
                                        <Thumbnail
                                            type={type}
                                            url={file.url}
                                            extension={extension}
                                            className="shrink-0 h-11 w-11 rounded-xl shadow-2xs"
                                        />
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <p className="font-semibold text-dark100_light900 text-sm truncate group-hover:text-brand transition-colors" title={file.name}>
                                                {file.name}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                                                    <BookOpen className="h-3 w-3 shrink-0" />
                                                    <span className="truncate max-w-[130px]">{file.subjectName}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-6 sm:col-span-2 text-xs font-semibold text-dark200_light800">
                                        {sizeMB} MB
                                    </div>

                                    <div className="col-span-6 sm:col-span-2 text-xs text-dark500_light400">
                                        {file.deletedAt}
                                    </div>

                                    <div className="col-span-6 sm:col-span-2">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                                            isUrgent
                                                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 animate-pulse'
                                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                        }`}>
                                            <Clock className="h-3 w-3 shrink-0" />
                                            <span>{file.daysRemaining} {file.daysRemaining === 1 ? 'day' : 'days'} left</span>
                                        </span>
                                    </div>

                                    <div className="col-span-6 sm:col-span-1 flex items-center justify-end gap-1.5">
                                        <button
                                            type="button"
                                            disabled={isRowBusy}
                                            onClick={() => handleRestore(file.id, file.name)}
                                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-brand hover:text-white dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-brand dark:hover:text-white transition-all flex items-center gap-1.5 border border-emerald-200/80 dark:border-emerald-500/30 cursor-pointer disabled:opacity-50"
                                            title="Restore file right now"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">{isRowBusy ? '...' : 'Restore'}</span>
                                        </button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button
                                                    type="button"
                                                    disabled={isRowBusy}
                                                    onClick={() => setSelectedFileToDelete(file)}
                                                    className="p-1.5 rounded-xl text-dark500_light400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                                                    title="Permanently Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-3xl bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 shadow-2xl p-6 sm:p-8">
                                                <AlertDialogHeader className="space-y-2">
                                                    <AlertDialogTitle className="flex items-center gap-2 text-red-600 font-bold text-lg">
                                                        <AlertTriangle className="h-5 w-5" />
                                                        <span>Permanently delete file?</span>
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription className="text-dark500_light400 text-sm">
                                                        Are you sure you want to permanently delete <span className="font-semibold text-dark100_light900 break-all">&#34;{file.name}&#34;</span>? This will immediately remove all AI vector embeddings from Qdrant and cloud storage items. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="pt-4 flex gap-2">
                                                    <AlertDialogCancel className="rounded-xl h-10 px-5 text-xs font-semibold cursor-pointer border border-light-700 dark:border-dark-400 bg-light-800 dark:bg-dark-300 text-dark200_light800 m-0">
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDeletePermanently(file.id, file.name)}
                                                        className="rounded-xl h-10 px-5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer shadow-md m-0"
                                                    >
                                                        Delete Permanently
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="px-6 pb-4">
                        <Pagination
                            page={currentPage}
                            totalPages={totalPages}
                            total={totalItems}
                            onPageChange={(p) => setCurrentPage(p)}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }}
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {paginatedFiles.map((file) => {
                            const { type, extension } = getFileType(file.name);
                            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                            const isUrgent = file.daysRemaining <= 5;
                            const isRowBusy = actionLoading === file.id;

                            return (
                                <div
                                    key={file.id}
                                    className={`group flex flex-col justify-between rounded-2xl bg-white dark:bg-dark-300 p-5 border transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                                        isUrgent ? 'border-red-500/40 dark:border-red-500/30' : 'border-light-700 dark:border-dark-400'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/60 truncate max-w-[140px]">
                                                <BookOpen className="h-3 w-3 shrink-0" />
                                                <span>{file.subjectName}</span>
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                isUrgent ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                            }`}>
                                                <Clock className="h-3 w-3" />
                                                <span>{file.daysRemaining}d left</span>
                                            </span>
                                        </div>

                                        <div className="flex flex-col items-center text-center my-3 space-y-2.5">
                                            <Thumbnail
                                                type={type}
                                                url={file.url}
                                                extension={extension}
                                                className="h-16 w-16 rounded-2xl shadow-2xs"
                                            />
                                            <div className="w-full space-y-0.5">
                                                <h4 className="font-bold text-dark100_light900 truncate text-sm px-1 group-hover:text-brand transition-colors" title={file.name}>
                                                    {file.name}
                                                </h4>
                                                <p className="text-[11px] text-dark500_light400 font-medium">
                                                    {sizeMB} MB • Deleted {file.deletedAt}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-light-700/60 dark:border-dark-400/60">
                                        <button
                                            type="button"
                                            disabled={isRowBusy}
                                            onClick={() => handleRestore(file.id, file.name)}
                                            className="flex-1 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-brand hover:text-white dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-brand font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-emerald-200/80 cursor-pointer disabled:opacity-50"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            <span>{isRowBusy ? 'Restoring...' : 'Restore'}</span>
                                        </button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button
                                                    type="button"
                                                    disabled={isRowBusy}
                                                    onClick={() => setSelectedFileToDelete(file)}
                                                    className="p-2 rounded-xl text-dark500_light400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                                                    title="Permanently Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-3xl bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 shadow-2xl p-6 sm:p-8">
                                                <AlertDialogHeader className="space-y-2">
                                                    <AlertDialogTitle className="flex items-center gap-2 text-red-600 font-bold text-lg">
                                                        <AlertTriangle className="h-5 w-5" />
                                                        <span>Permanently delete file?</span>
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription className="text-dark500_light400 text-sm">
                                                        Are you sure you want to permanently delete <span className="font-semibold text-dark100_light900 break-all">&#34;{file.name}&#34;</span>? This will immediately remove all AI vector embeddings from Qdrant and cloud storage items. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="pt-4 flex gap-2">
                                                    <AlertDialogCancel className="rounded-xl h-10 px-5 text-xs font-semibold cursor-pointer border border-light-700 dark:border-dark-400 bg-light-800 dark:bg-dark-300 text-dark200_light800 m-0">
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDeletePermanently(file.id, file.name)}
                                                        className="rounded-xl h-10 px-5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer shadow-md m-0"
                                                    >
                                                        Delete Permanently
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="px-6 pb-4">
                        <Pagination
                            page={currentPage}
                            totalPages={totalPages}
                            total={totalItems}
                            onPageChange={(p) => setCurrentPage(p)}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
