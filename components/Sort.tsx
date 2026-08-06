"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sortTypes } from "@/constants/sortTypes";
import { Subject } from "@/types";
import { Filter, ArrowUpDown } from "lucide-react";

interface SortProps {
    subjects: Subject[];
}

const Sort = ({ subjects }: SortProps) => {
    const path = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentSort = searchParams.get("sort") || sortTypes[0].value;
    const currentSubject = searchParams.get("subjectId") || "all";

    const handleSort = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", value);
        params.set("page", "1");
        router.push(`${path}?${params.toString()}`);
    };

    const handleSubject = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") {
            params.delete("subjectId");
        } else {
            params.set("subjectId", value);
        }
        params.set("page", "1");
        router.push(`${path}?${params.toString()}`);
    };

    return (
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Select onValueChange={handleSubject} value={currentSubject}>
                <SelectTrigger className="sort-select min-w-[220px]">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-brand shrink-0" />
                        <span className="text-slate-500 font-medium hidden sm:inline">Subject:</span>
                        <SelectValue placeholder="All Subjects" />
                    </div>
                </SelectTrigger>
                <SelectContent className="sort-select-content max-h-[300px]">
                    <SelectItem className="shad-select-item" value="all">
                        All Subjects
                    </SelectItem>
                    {subjects?.map((subject) => (
                        <SelectItem
                            key={subject.id}
                            className="shad-select-item"
                            value={subject.id}
                        >
                            {subject.subjectName}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select onValueChange={handleSort} value={currentSort}>
                <SelectTrigger className="sort-select min-w-[220px]">
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-brand shrink-0" />
                        <span className="text-slate-500 font-medium hidden sm:inline">Sort:</span>
                        <SelectValue placeholder={sortTypes[0].label} />
                    </div>
                </SelectTrigger>
                <SelectContent className="sort-select-content">
                    {sortTypes.map((sort) => (
                        <SelectItem
                            key={sort.value}
                            className="shad-select-item"
                            value={sort.value}
                        >
                            {sort.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default Sort;