"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function TypeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") || "all";

  const handleTypeChange = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "all") {
      params.delete("type");
    } else {
      params.set("type", type);
    }
    // Reset limit when changing type
    params.delete("limit");
    
    router.push(`/home?${params.toString()}`, { scroll: false });
  };

  const types = [
    { value: "all", label: "All" },
    { value: "documents", label: "Documents" },
    { value: "images", label: "Images" },
    { value: "media", label: "Media" },
    { value: "others", label: "Others" },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
      {types.map((type) => (
        <button
          key={type.value}
          onClick={() => handleTypeChange(type.value)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            currentType === type.value
              ? "bg-brand text-white shadow-drop-1"
              : "bg-white dark:bg-dark-200 text-dark200_light800 border border-light-800 dark:border-dark-400 hover:bg-light-800 dark:hover:bg-dark-300"
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
