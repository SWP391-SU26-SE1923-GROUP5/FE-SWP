"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdminFileListClientProps {
    currentType: string;
    currentSort: string;
}

const TYPE_OPTIONS = [
    { value: "all", label: "All types" },
    { value: "document", label: "Documents" },
    { value: "image", label: "Images" },
    { value: "video", label: "Video" },
    { value: "audio", label: "Audio" },
    { value: "other", label: "Other" },
];

const SORT_OPTIONS = [
    { value: "$createdAt-desc", label: "Newest first" },
    { value: "$createdAt-asc", label: "Oldest first" },
    { value: "name-asc", label: "Name (A → Z)" },
    { value: "name-desc", label: "Name (Z → A)" },
    { value: "size-desc", label: "Largest files" },
    { value: "size-asc", label: "Smallest files" },
];

export default function AdminFileListClient({ currentType, currentSort }: AdminFileListClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const updateQuery = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams.toString());
        if (!value || (value === "all") || (key === "sort" && value === "$createdAt-desc")) {
            next.delete(key);
        } else {
            next.set(key, value);
        }
        next.delete("page");
        const query = next.toString();
        router.replace(query ? `${pathname}?${query}` : pathname);
    };

    return (
        <div className="flex items-center gap-2">
            <Select value={currentType} onValueChange={(v) => updateQuery("type", v)}>
                <SelectTrigger className="h-10 w-[150px] rounded-xl border-light-300 bg-white">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={currentSort} onValueChange={(v) => updateQuery("sort", v)}>
                <SelectTrigger className="h-10 w-[180px] rounded-xl border-light-300 bg-white">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
