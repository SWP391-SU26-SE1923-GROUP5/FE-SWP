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
        <div className="flex flex-col sm:flex-row items-center gap-3">
            <Select onValueChange={handleSubject} value={currentSubject}>
                <SelectTrigger className="sort-select min-w-[200px]">
                    <SelectValue placeholder="All Subjects" />
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
                <SelectTrigger className="sort-select">
                    <SelectValue placeholder={sortTypes[0].label} />
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