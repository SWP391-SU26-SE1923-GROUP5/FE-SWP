"use client";

import { Loader2, Search as SearchIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";

interface AdminSearchBarProps {
    placeholder?: string;
    paramName?: string;
    className?: string;
}

export default function AdminSearchBar({
    placeholder = "Search...",
    paramName = "search",
    className,
}: AdminSearchBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const initial = searchParams.get(paramName) ?? "";
    const [value, setValue] = useState(initial);
    const [debounced] = useDebounce(value, 300);

    useEffect(() => {
        const next = new URLSearchParams(searchParams.toString());
        if (debounced.trim()) {
            next.set(paramName, debounced.trim());
        } else {
            next.delete(paramName);
        }
        next.delete("page");

        const query = next.toString();
        router.replace(query ? `${pathname}?${query}` : pathname);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced]);

    return (
        <div className={`admin-search ${className ?? ""}`} role="search">
            <SearchIcon className="admin-search-icon" />
            <input
                type="search"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="admin-search-input"
                aria-label={placeholder}
            />
            {value && (
                <button
                    type="button"
                    onClick={() => setValue("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-light-400 hover:text-dark-100"
                    aria-label="Clear search"
                >
                    <X className="size-4" />
                </button>
            )}
        </div>
    );
}

export function AdminLoadingState({ label = "Loading..." }: { label?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-light-400" role="status" aria-live="polite">
            <Loader2 className="size-6 animate-spin text-brand" />
            {label}
        </div>
    );
}
