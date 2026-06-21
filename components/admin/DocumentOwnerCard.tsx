import Image from "next/image";
import { Mail, User } from "lucide-react";
import { avatarPlaceholderUrl } from "@/constants/avatar";
import { formatDateTime } from "@/lib/utils";

interface DocumentOwnerCardProps {
    ownerId: string;
    ownerName?: string;
    ownerEmail?: string;
    ownerAvatar?: string;
    fileCount?: number;
    totalStorage?: number;
    joinedAt?: string;
}

export default function DocumentOwnerCard({
    ownerId,
    ownerName,
    ownerEmail,
    ownerAvatar,
    fileCount,
    totalStorage,
    joinedAt,
}: DocumentOwnerCardProps) {
    const displayName = ownerName || "Unknown owner";
    return (
        <div className="admin-card" data-testid="document-owner-card">
            <div className="flex items-start gap-3">
                <Image
                    src={ownerAvatar || avatarPlaceholderUrl}
                    alt={displayName}
                    width={48}
                    height={48}
                    unoptimized
                    className="size-12 rounded-full object-cover ring-1 ring-light-300"
                />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-dark-100">{displayName}</p>
                    {ownerEmail ? (
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-light-400">
                            <Mail className="size-3 shrink-0" /> {ownerEmail}
                        </p>
                    ) : null}
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-light-400">
                        <User className="size-3 shrink-0" /> ID: {ownerId}
                    </p>
                </div>
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-light-300/30 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-light-400">Files</dt>
                    <dd className="mt-1 text-sm font-semibold text-dark-100">
                        {typeof fileCount === "number" ? fileCount : "—"}
                    </dd>
                </div>
                <div className="rounded-xl bg-light-300/30 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-light-400">Joined</dt>
                    <dd className="mt-1 text-sm font-semibold text-dark-100">
                        {joinedAt ? formatDateTime(joinedAt) : "—"}
                    </dd>
                </div>
            </dl>
        </div>
    );
}