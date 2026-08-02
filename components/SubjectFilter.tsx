"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Subject } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen } from "lucide-react";

interface SubjectFilterProps {
  subjects: Subject[];
}

export default function SubjectFilter({ subjects }: SubjectFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSubjectId = searchParams.get("subjectId") || "all";

  const handleValueChange = (value: string) => {
    if (value === "all") {
      router.push("/home");
    } else {
      router.push(`/home?subjectId=${value}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentSubjectId} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[180px] sm:w-[220px] bg-white dark:bg-dark-200 border border-light-800 dark:border-dark-400 rounded-xl focus:ring-emerald-500 shadow-xs h-10 font-medium text-dark200_light800">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="truncate block text-left flex-1">
                <SelectValue placeholder="Filter by Subject" />
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-dark-200 border-light-800 dark:border-dark-400 rounded-xl shadow-xl">
          <SelectItem value="all" className="cursor-pointer font-medium hover:bg-light-800 dark:hover:bg-dark-400 focus:bg-light-800 dark:focus:bg-dark-400 text-dark200_light800">
            All Subjects
          </SelectItem>
          {subjects?.map((sub) => (
            <SelectItem key={sub.id} value={sub.id} className="cursor-pointer font-medium hover:bg-light-800 dark:hover:bg-dark-400 focus:bg-light-800 dark:focus:bg-dark-400 text-dark200_light800 max-w-[80vw] sm:max-w-[400px]">
              <span className="truncate block w-full text-left">
                {sub.subjectCode} - {sub.subjectName}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
