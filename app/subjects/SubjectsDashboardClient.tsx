"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { BookOpen, Search, Plus, MoreHorizontal, Edit, Trash2, Tag, Calendar, Database, ArrowLeft } from 'lucide-react';
import { SubjectResponseDto, Subject } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import Pagination from '@/components/Pagination';
import SubjectDialog from '@/components/SubjectDialog';
import { deleteSubject } from '@/lib/actions/subject.actions';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubjectsDashboardClientProps {
    initialData: SubjectResponseDto;
    currentPage: number;
    searchText: string;
}

export default function SubjectsDashboardClient({
    initialData,
    currentPage,
    searchText,
}: SubjectsDashboardClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [searchInput, setSearchInput] = useState(searchText);
    const [debouncedSearch] = useDebounce(searchInput, 500);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    React.useEffect(() => {
        if (debouncedSearch !== searchText) {
            const params = new URLSearchParams(searchParams.toString());
            if (debouncedSearch) {
                params.set("query", debouncedSearch);
            } else {
                params.delete("query");
            }
            params.set("page", "1");
            router.push(`${pathname}?${params.toString()}`);
        }
    }, [debouncedSearch, router, pathname, searchParams, searchText]);

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSuccess = () => {
        router.refresh();
    };

    const confirmDelete = async () => {
        if (!subjectToDelete) return;
        setIsDeleting(true);
        try {
            const result = await deleteSubject(subjectToDelete.id);
            if (result && result.success === false) {
                toast.error(result.message || "Failed to delete subject.");
                return;
            }
            toast.success("Subject deleted successfully.");
            setSubjectToDelete(null);
            setIsDeleteDialogOpen(false);
            router.refresh();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "An unexpected error occurred.");
        } finally {
            setIsDeleting(false);
        }
    };

    const openEdit = (sub: Subject) => {
        setSelectedSubject(sub);
        setIsDialogOpen(true);
    };

    const openCreate = () => {
        setSelectedSubject(null);
        setIsDialogOpen(true);
    };

    const openDelete = (sub: Subject) => {
        setSubjectToDelete(sub);
        setIsDeleteDialogOpen(true);
    };

    const subjects = initialData.items || [];
    const totalPages = Math.max(1, Math.ceil(initialData.totalCount / initialData.limit));

    return (
        <div className="flex flex-col gap-6 pb-28 pt-6 max-w-7xl mx-auto w-full px-5 sm:px-6">
            <header className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-4">
                    <Link
                        href="/home"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-dark-300 border border-light-700 dark:border-dark-400 shadow-xs hover:bg-light-800 dark:hover:bg-dark-400 text-dark300_light700 transition-all"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="h1 capitalize text-dark100_light900 font-bold">
                            Subjects
                        </h1>
                        <p className="text-sm text-dark500_light400 mt-1">
                            Organize your study files into distinct subjects.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[320px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-dark500_light400" />
                        </div>
                        <Input
                            placeholder="Search subjects..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-10 h-10 w-full rounded-xl border-light-800 dark:border-dark-400 bg-light-900 dark:bg-dark-300 focus-visible:ring-emerald-500 shadow-xs"
                        />
                    </div>
                </div>
            </header>

            <div className="mt-8 flex flex-col gap-5 w-full flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {/* Create New Subject Card */}
                    <button
                        onClick={openCreate}
                        className="group flex flex-col items-center justify-center h-[200px] border-2 border-dashed border-light-800 dark:border-dark-400 rounded-2xl bg-light-900/30 dark:bg-dark-300/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:border-emerald-500/50 hover:shadow-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                    >
                        <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Plus className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-dark300_light700 group-hover:text-emerald-600 transition-colors">
                            Create New Subject
                        </span>
                    </button>

                    {subjects.map((sub) => (
                            <div 
                                key={sub.id} 
                                onClick={() => router.push(`/subjects/${sub.id}`)}
                                className="relative bg-white dark:bg-dark-200 border border-light-800 dark:border-dark-400 rounded-2xl p-5 hover:border-emerald-500/50 hover:shadow-lg transition-all group flex flex-col h-[200px] overflow-hidden cursor-pointer"
                            >
                                {/* Folder accent line */}
                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-80" />
                                <div className="flex items-start justify-between">
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-black tracking-wider px-3 py-1.5 rounded-lg text-xs uppercase border border-emerald-100 dark:border-emerald-800/30 w-fit line-clamp-1 break-all">
                                        {sub.subjectCode}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button 
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-dark500_light400 hover:text-dark100_light900 hover:bg-light-800 dark:hover:bg-dark-400 p-1.5 rounded-full transition-colors cursor-pointer outline-none"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 p-2 rounded-xl bg-white dark:bg-dark-200 border border-light-800 dark:border-dark-400 shadow-xl">
                                            <DropdownMenuItem 
                                                onClick={(e) => { e.stopPropagation(); openEdit(sub); }}
                                                className="flex items-center gap-2 cursor-pointer p-2 text-sm rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400"
                                            >
                                                <Edit className="h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={(e) => { e.stopPropagation(); openDelete(sub); }}
                                                className="flex items-center gap-2 cursor-pointer p-2 text-sm rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <h3 className="text-lg font-bold text-dark100_light900 mt-4 line-clamp-1 break-all" title={sub.subjectName}>
                                    {sub.subjectName}
                                </h3>
                                
                                <p className="text-sm text-dark500_light400 mt-2 line-clamp-2 leading-relaxed break-words flex-1">
                                    {sub.description || <span className="italic opacity-60">No description provided</span>}
                                </p>

                                <div className="mt-4 pt-4 border-t border-light-800 dark:border-dark-400 flex items-center justify-between text-xs font-semibold text-dark500_light400 shrink-0">
                                    <div className="flex items-center gap-1.5" title="Creation Date">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500">
                                        <Database className="h-3.5 w-3.5" />
                                        <span>Active</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                
                {subjects.length === 0 && searchText && (
                    <div className="mt-10 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                        <div className="h-16 w-16 rounded-full bg-light-800 dark:bg-dark-400 text-dark500_light400 flex items-center justify-center mb-4">
                            <Search className="h-8 w-8 opacity-50" />
                        </div>
                        <h3 className="h3 font-bold text-dark100_light900 mb-2">No matches found</h3>
                        <p className="text-dark500_light400 text-sm">
                            We couldn't find any subjects matching "{searchText}".
                        </p>
                    </div>
                )}
            </div>

            {subjects.length > 0 && totalPages > 1 && (
                <div className="fixed bottom-0 left-0 right-0 z-10 w-full xl:pl-[280px]">
                    <div className="bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 pt-8 pb-4">
                        <div className="px-6 sm:px-10 flex items-center justify-center">
                            <div className="bg-white dark:bg-dark-200 border border-light-800 dark:border-dark-400 shadow-xl rounded-full py-1.5 px-4 backdrop-blur-xl">
                                <Pagination 
                                    page={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <SubjectDialog 
                isOpen={isDialogOpen} 
                setIsOpen={setIsDialogOpen} 
                subject={selectedSubject} 
                onSuccess={handleSuccess} 
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => !isDeleting && setIsDeleteDialogOpen(open)}>
                <AlertDialogContent className="bg-white dark:bg-dark-200 border border-light-800 dark:border-dark-400 rounded-2xl shadow-xl max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-dark100_light900 font-bold">Delete Subject</AlertDialogTitle>
                        <AlertDialogDescription className="text-dark500_light400">
                            Are you sure you want to delete <span className="font-bold text-dark200_light800">{subjectToDelete?.subjectName}</span>? 
                            This action cannot be undone. Please note that you cannot delete a subject if it still contains documents.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel disabled={isDeleting} className="border-light-800 dark:border-dark-400 font-medium rounded-full hover:bg-light-900 dark:hover:bg-dark-300">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-full"
                        >
                            {isDeleting ? "Deleting..." : "Delete Subject"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
