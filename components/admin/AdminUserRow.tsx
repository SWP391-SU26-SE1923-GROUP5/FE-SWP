"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import {Button} from "@/components/ui/button";
import {avatarPlaceholderUrl} from "@/constants/avatar";
import {formatDateTime} from "@/lib/utils";
import TierSwitcher from "@/components/admin/TierSwitcher";
import {updateAdminUserTier} from "@/lib/actions/admin.actions";
import {toast} from "sonner";
import type {AdminUser} from "@/types/admin";

interface AdminUserRowProps {
    user: AdminUser;
    isSelf?: boolean;
}

export default function AdminUserRow({user, isSelf = false}: AdminUserRowProps) {
    const userId = user.id ?? user.$id ?? "";
    const tier = user.tier ?? "Free";

    const handleTierChange = async (next: "Free" | "Premium") => {
        try {
            await updateAdminUserTier(userId, next);
            toast.success(`${user.fullName} is now on the ${next} tier.`);
        } catch (error: any) {
            toast.error(error?.message || "Could not update tier.");
        }
    };

    return (
        <tr data-testid="user-row" data-user-id={userId}>
            <td>
                <div className="flex items-center gap-3">
                    <Image
                        src={user.avatar || avatarPlaceholderUrl}
                        alt={user.fullName}
                        width={40}
                        height={40}
                        unoptimized
                        className="size-10 rounded-full object-cover ring-1 ring-light-300"
                    />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-dark-100">{user.fullName}</p>
                        <p className="truncate text-xs text-light-400">{user.email}</p>
                    </div>
                </div>
            </td>
            <td>
                <span
                    className={`admin-badge ${
                        user.role === "admin" ? "admin-badge-admin" : "admin-badge-user"
                    }`}
                >
                    {user.role === "admin" ? "Admin" : "User"}
                </span>
            </td>
            <td className="min-w-[260px]">
                <TierSwitcher currentTier={tier} onSubmit={handleTierChange} />
            </td>
            <td className="hidden md:table-cell text-xs text-light-400">
                {user.createdAt ? formatDateTime(user.createdAt) : "—"}
            </td>
            <td className="text-right">
                <Button
                    asChild
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 rounded-full"
                    aria-label="View user"
                >
                    <Link href={`/admin/users/${userId}`}>
                        <Eye className="size-4" />
                    </Link>
                </Button>
                {isSelf && <span className="ml-2 text-[10px] font-semibold uppercase text-light-400">You</span>}
            </td>
        </tr>
    );
}
