'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Trash2,
    RotateCcw,
    AlertTriangle,
    Search,
    Clock,
    ArrowLeft,
    CheckCircle2,
    FileText,
    AlertCircle
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

interface MockTrashFile {
    id: string;
    name: string;
    subjectName: string;
    size: number;
    deletedAt: string;
    daysRemaining: number;
    url: string;
}

const initialTrashFiles: MockTrashFile[] = [
    {
        id: '1',
        name: 'CS401_Lecture_05_Deep_Learning_Architectures.pdf',
        subjectName: 'Artificial Intelligence',
        size: 14800000,
        deletedAt: '2026-07-08',
        daysRemaining: 28,
        url: '/assets/icons/file-pdf.svg'
    },
    {
        id: '2',
        name: 'Database_Normalization_Cheat_Sheet_v2.docx',
        subjectName: 'Database Systems',
        size: 4200000,
        deletedAt: '2026-07-01',
        daysRemaining: 21,
        url: '/assets/icons/file-docx.svg'
    },
    {
        id: '3',
        name: 'Final_Project_Presentation_Slides.pptx',
        subjectName: 'Software Engineering',
        size: 28500000,
        deletedAt: '2026-06-15',
        daysRemaining: 5,
        url: '/assets/icons/file-other.svg'
    },
    {
        id: '4',
        name: 'Calculus_II_Practice_Exam_Solutions.pdf',
        subjectName: 'Advanced Mathematics',
        size: 8900000,
        deletedAt: '2026-06-12',
        daysRemaining: 2,
        url: '/assets/icons/file-pdf.svg'
    }
];

export default function TrashPage() {
    const [trashFiles, setTrashFiles] = useState<MockTrashFile[]>(initialTrashFiles);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFileToDelete, setSelectedFileToDelete] = useState<MockTrashFile | null>(null);

    const filteredFiles = trashFiles.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalRecoverableBytes = trashFiles.reduce((acc, file) => acc + file.size, 0);
    const totalRecoverableMB = (totalRecoverableBytes / (1024 * 1024)).toFixed(1);

    const handleRestore = (id: string, name: string) => {
        setTrashFiles(prev => prev.filter(f => f.id !== id));
        toast.success(`Restored "${name}" successfully. Storage quota has been refunded!`);
    };

    const handleDeletePermanently = (id: string, name: string) => {
        setTrashFiles(prev => prev.filter(f => f.id !== id));
        setSelectedFileToDelete(null);
        toast.error(`"${name}" has been permanently deleted.`);
    };

    const handleEmptyTrash = () => {
        setTrashFiles([]);
        toast.success('Trash bin emptied. All storage space has been permanently reclaimed.');
    };

    return (
        <div className="flex flex-col gap-8 pb-16 pt-4 max-w-7xl mx-auto w-full px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-800 dark:border-dark-400 pb-6">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <Link href="/home" className="p-2 rounded-full hover:bg-light-800 dark:hover:bg-dark-300 transition text-dark300_light700">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
                                <Trash2 className="h-6 w-6" />
                            </div>
                            <h1 className="h1 font-bold text-dark100_light900">Trash Bin</h1>
                        </div>
                    </div>
                    <p className="text-sm text-dark500_light400 pl-14">
                        Items are permanently purged after 30 days. Restoring a document immediately reclaims your storage quota.
                    </p>
                </div>

                {trashFiles.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="rounded-full px-6 py-5 flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto">
                                <Trash2 className="h-4 w-4" />
                                <span className="font-semibold">Empty Trash</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl bg-white dark:bg-dark-200 border border-light-800 dark:border-dark-400">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-bold text-dark100_light900 flex items-center gap-2">
                                    <AlertTriangle className="h-6 w-6 text-red-500" />
                                    Empty entire trash bin?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-dark500_light400">
                                    This action cannot be undone. All {trashFiles.length} files ({totalRecoverableMB} MB) will be permanently deleted from servers and cannot be recovered.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="pt-4">
                                <AlertDialogCancel className="rounded-xl px-5 cursor-pointer border-light-800 dark:border-dark-400">
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction onClick={handleEmptyTrash} className="rounded-xl px-6 bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer">
                                    Yes, Empty Trash
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-light-900 dark:bg-dark-300 p-4 rounded-2xl border border-light-800 dark:border-dark-400 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-dark200_light800">
                            {trashFiles.length} {trashFiles.length === 1 ? 'item' : 'items'} in Trash
                        </p>
                        <p className="text-xs text-dark500_light400">
                            Total recoverable storage: <span className="font-medium text-brand">{totalRecoverableMB} MB</span>
                        </p>
                    </div>
                </div>

                <div className="relative min-w-[280px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dark500_light400 pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Search deleted files or subjects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 rounded-xl border-light-800 dark:border-dark-400 bg-white dark:bg-dark-200 text-sm focus-visible:ring-emerald-500"
                    />
                </div>
            </div>

            {trashFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-light-800 dark:border-dark-400 rounded-3xl bg-light-900/40 dark:bg-dark-300/20">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-4 shadow-inner">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h3 className="h3 font-bold text-dark100_light900 mb-2">Trash Bin is Empty</h3>
                    <p className="text-sm text-dark500_light400 max-w-md mb-6">
                        All clean! There are no deleted files consuming storage. When you remove documents from your subjects, they will appear here for 30 days before being permanently purged.
                    </p>
                    <Link href="/home">
                        <Button className="primary-gradient text-light-900 rounded-full px-8 py-6 font-medium shadow-md cursor-pointer">
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-light-800 dark:border-dark-400 rounded-3xl bg-white dark:bg-dark-200">
                    <Search className="h-12 w-12 text-dark500_light400 mb-3 opacity-40" />
                    <h4 className="text-lg font-semibold text-dark200_light800 mb-1">No matching files found</h4>
                    <p className="text-sm text-dark500_light400">
                        Try adjusting your search terms for "{searchQuery}"
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-3xl border border-light-800 dark:border-dark-400 bg-white dark:bg-dark-200 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-light-800 dark:border-dark-400 bg-light-900/60 dark:bg-dark-300/40 text-xs font-semibold uppercase tracking-wider text-dark500_light400">
                                    <th className="py-4 px-6">File Name & Subject</th>
                                    <th className="py-4 px-6">Size</th>
                                    <th className="py-4 px-6">Deleted On</th>
                                    <th className="py-4 px-6">Auto-Purge In</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-light-800 dark:divide-dark-400 text-sm">
                                {filteredFiles.map((file) => {
                                    const { type, extension } = getFileType(file.name);
                                    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                                    const isUrgent = file.daysRemaining <= 5;

                                    return (
                                        <tr key={file.id} className="hover:bg-light-900/80 dark:hover:bg-dark-300/50 transition-colors group">
                                            <td className="py-4 px-6 max-w-[320px]">
                                                <div className="flex items-center gap-3.5">
                                                    <Thumbnail
                                                        type={type}
                                                        url={file.url}
                                                        extension={extension}
                                                        className="h-11 w-11 shrink-0"
                                                    />
                                                    <div className="overflow-hidden">
                                                        <p className="font-semibold text-dark200_light800 truncate" title={file.name}>
                                                            {file.name}
                                                        </p>
                                                        <span className="inline-block mt-0.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-light-800 dark:bg-dark-400 text-dark400_light700">
                                                            {file.subjectName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-6 font-medium text-dark300_light700 whitespace-nowrap">
                                                {sizeMB} MB
                                            </td>

                                            <td className="py-4 px-6 text-dark400_light700 whitespace-nowrap">
                                                {file.deletedAt}
                                            </td>

                                            <td className="py-4 px-6 whitespace-nowrap">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                                    isUrgent
                                                        ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                                                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                                }`}>
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>{file.daysRemaining} {file.daysRemaining === 1 ? 'day' : 'days'} left</span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-6 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        onClick={() => handleRestore(file.id, file.name)}
                                                        className="rounded-xl px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-none border border-emerald-200 dark:border-emerald-500/30"
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                        <span>Restore</span>
                                                    </Button>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                onClick={() => setSelectedFileToDelete(file)}
                                                                className="rounded-xl p-2.5 text-dark500_light400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition"
                                                                title="Delete Permanently"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="rounded-3xl bg-white dark:bg-dark-200 border border-light-800 dark:border-dark-400">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="text-xl font-bold text-dark100_light900 flex items-center gap-2">
                                                                    <AlertTriangle className="h-6 w-6 text-red-500" />
                                                                    Permanently delete file?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription className="text-dark500_light400">
                                                                    Are you sure you want to permanently delete <span className="font-semibold text-dark200_light800">"{file.name}"</span>? This will immediately remove all AI vector embeddings from Qdrant and blob storage. This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter className="pt-4">
                                                                <AlertDialogCancel className="rounded-xl px-5 cursor-pointer border-light-800 dark:border-dark-400">
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeletePermanently(file.id, file.name)}
                                                                    className="rounded-xl px-6 bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
                                                                >
                                                                    Delete Permanently
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
