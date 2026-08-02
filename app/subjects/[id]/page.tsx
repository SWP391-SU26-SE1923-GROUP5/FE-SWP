import React from "react";
import { getSubjectById } from "@/lib/actions/subject.actions";
import { getFiles } from "@/lib/actions/file.actions";
import { SearchParamProps, File_ } from "@/types";
import Card from "@/components/Card";
import FileUploader from "@/components/FileUploader";
import { BookOpen, ArrowLeft, Calendar, Database, Tag } from "lucide-react";
import Link from "next/link";
import { convertFileSize } from "@/lib/utils";
import FormattedDateTime from "@/components/FormattedDateTime";

const SubjectDetailsPage = async ({ params, searchParams }: SearchParamProps) => {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const subjectId = resolvedParams?.id as string;
    const page = Number(resolvedSearchParams?.page) || 1;
    const limit = Number(resolvedSearchParams?.limit) || 12;

    const [subject, files] = await Promise.all([
        getSubjectById(subjectId),
        getFiles({ subjectId, page, limit })
    ]);

    const totalSizeInBytes = files.documents.reduce((acc: number, file: File_) => {
        return acc + (file.fileSizeBytes || 0);
    }, 0);

    if (!subject) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-10">
                <h1 className="h1 text-dark-100">Subject Not Found</h1>
                <Link href="/subjects" className="text-brand mt-4 underline">Return to Subjects</Link>
            </div>
        );
    }

    return (
        <div className="page-container flex flex-col flex-1 h-full gap-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-6 bg-white dark:bg-dark-200 border border-light-800 dark:border-dark-400 p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-bl-[100px] -mr-10 -mt-10 pointer-events-none" />
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10 w-full">
                    <Link
                        href="/subjects"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-light-800 dark:bg-dark-300 border border-light-700 dark:border-dark-400 shadow-xs hover:bg-light-700 dark:hover:bg-dark-400 text-dark300_light700 transition-all self-start md:self-center"
                        title="Back to Subjects"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand border border-brand/20 shadow-inner">
                            <BookOpen className="h-10 w-10" />
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                            <h1 className="h1 capitalize text-dark-100 break-words">{subject.subjectName}</h1>
                            {subject.description && (
                                <p className="text-light-400 body-2 max-w-3xl">
                                    {subject.description}
                                </p>
                            )}
                            <div className="flex items-center gap-4 flex-wrap mt-1">
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-dark-300 dark:text-light-400 px-3 py-1 rounded-full border border-slate-200 dark:border-dark-400 shadow-xs">
                                    <Tag className="w-3.5 h-3.5 text-brand" />
                                    {subject.subjectCode || "N/A"}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-dark-300 dark:text-light-400 px-3 py-1 rounded-full border border-slate-200 dark:border-dark-400 shadow-xs">
                                    <Database className="w-3.5 h-3.5 text-sky-500" />
                                    {convertFileSize(totalSizeInBytes)}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-dark-300 dark:text-light-400 px-3 py-1 rounded-full border border-slate-200 dark:border-dark-400 shadow-xs">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                                    Updated <FormattedDateTime date={subject.updatedAt?.toString() || new Date().toISOString()} className="inline" />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0 mt-4 sm:mt-0 relative z-10 w-full sm:w-auto">
                    <FileUploader subjects={[subject]} className="w-full sm:w-auto [&>button]:w-full" />
                </div>
            </header>

            <section className="flex flex-col flex-1 pb-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="h2 text-dark-100">Files ({files.total})</h2>
                </div>
                
                {files.documents && files.documents.length > 0 ? (
                    <div className="file-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {files.documents.map((file: File_) => (
                            <Card key={file.id} file={file} subjects={[subject]} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-light-900/50 dark:bg-dark-300/20 border-2 border-dashed border-light-800 dark:border-dark-400 rounded-3xl p-16 text-center mt-4">
                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-100 dark:border-emerald-800/30">
                            <BookOpen className="w-10 h-10 opacity-80" />
                        </div>
                        <h3 className="h3-bold text-dark-100 mb-3">No files in this subject yet</h3>
                        <p className="body-2 text-light-400 max-w-md mx-auto mb-8 leading-relaxed">
                            Upload your lecture slides, notes, or practice exams to start generating smart flashcards and quizzes!
                        </p>
                        <FileUploader subjects={[subject]} />
                    </div>
                )}
            </section>
        </div>
    );
};

export default SubjectDetailsPage;
