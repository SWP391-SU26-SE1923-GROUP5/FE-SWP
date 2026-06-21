"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const TIER_OPTIONS = [
    {value: "Free", label: "Free", description: "Standard tier with core storage & quizzes"},
    {value: "Premium", label: "Premium", description: "Unlocks AI deep research, larger uploads, and analytics"},
] as const;

export type TierValue = (typeof TIER_OPTIONS)[number]["value"];

interface TierSwitcherProps {
    currentTier: string;
    onSubmit: (tier: TierValue) => Promise<void>;
    className?: string;
}

export default function TierSwitcher({currentTier, onSubmit, className}: TierSwitcherProps) {
    const [isPending, startTransition] = useTransition();

    const handleChange = (tier: TierValue) => {
        if (tier === currentTier) return;
        startTransition(async () => {
            await onSubmit(tier);
        });
    };

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TIER_OPTIONS.map((option) => {
                    const selected = option.value === currentTier;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            disabled={isPending}
                            onClick={() => handleChange(option.value)}
                            className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition",
                                selected
                                    ? "border-brand bg-brand/5"
                                    : "border-light-300 bg-white hover:border-brand/40",
                                isPending && "cursor-not-allowed opacity-60",
                            )}
                            aria-pressed={selected}
                        >
                            <span
                                className={cn(
                                    "mt-1 size-4 shrink-0 rounded-full border-2",
                                    selected ? "border-brand bg-brand" : "border-light-300 bg-white",
                                )}
                            />
                            <div>
                                <p className="text-sm font-semibold text-dark-100">{option.label}</p>
                                <p className="text-xs text-light-400">{option.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
            {isPending && (
                <p className="flex items-center gap-2 text-xs text-light-400">
                    <Loader2 className="size-3.5 animate-spin" /> Updating tier…
                </p>
            )}
            <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => handleChange(currentTier === "Premium" ? "Free" : "Premium")}
                className="self-start rounded-full"
            >
                {currentTier === "Premium" ? "Downgrade to Free" : "Upgrade to Premium"}
            </Button>
        </div>
    );
}
