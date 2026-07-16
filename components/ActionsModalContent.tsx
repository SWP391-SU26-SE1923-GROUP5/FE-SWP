"use client"

import { File_ } from "@/types";
import Thumbnail from "@/components/Thumbnail";
import FormattedDateTime from "@/components/FormattedDateTime";
import { convertFileSize, formatDateTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import { getUserById, getShareableUsers } from "@/lib/actions/user.actions";
import { getDocumentShares } from "@/lib/actions/file.actions";
import { parseSharedUsers } from "@/lib/utils";

const ImageThumbnail = ({ file }: { file: File_ }) => (
    <div className="flex items-center gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
        <div className="bg-white p-2 rounded-xl shadow-2xs border border-slate-100">
            <Thumbnail type={file.fileType} extension={file.fileExtension.replace('.', '')} url={file.fileLink} className="!size-12 shrink-0" imageClassName="!size-7 shrink-0" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
            <p className="text-base font-bold text-slate-800 truncate" title={file.fileName}>{file.fileName}</p>
            <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    Created on <FormattedDateTime date={file.createdAt || ""} className="!text-xs !text-slate-500 m-0 p-0" />
                </div>
            </div>
        </div>
    </div>
)

const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col gap-1 py-3 border-b border-slate-100/60 last:border-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-slate-700 truncate" title={value}>{value}</p>
    </div>
)

export const FileDetails = ({ file }: { file: File_ }) => {
    const [ownerName, setOwnerName] = useState<string>("Loading...");

    useEffect(() => {
        const fetchOwnerDetails = async () => {
            if (!file.userId) return;
            try {
                const user = await getUserById(file.userId);
                setOwnerName(user?.fullName || "Unknown Owner");
            } catch (error) {
                console.error("Failed to fetch owner details:", error);
                setOwnerName(file.userId);
            }
        };

        fetchOwnerDetails();
    }, [file.userId]);

    return (
        <div className="flex flex-col gap-6 pt-2">
            <ImageThumbnail file={file} />
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4 flex flex-col">
                <DetailRow label="Format" value={file.fileExtension.toUpperCase()} />
                <DetailRow label="Size" value={convertFileSize(file.fileSizeBytes || 0)} />
                <DetailRow label="Owner" value={ownerName} />
                <DetailRow label="Last edit" value={formatDateTime(file.updatedAt || file.createdAt || "")} />
            </div>
        </div>
    )
}

interface Props {
    file: File_;
    emails?: string[];
    onInputChange: React.Dispatch<React.SetStateAction<string[]>>;
    onRemove: (email: string) => void;
    userLevels?: Record<string, number>;
    onLevelsChange?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export const ShareInput = ({ file, emails, onInputChange, onRemove, userLevels, onLevelsChange }: Props) => {
    const [ownerName, setOwnerName] = useState<string>("Loading owner...");
    const [ownerEmail, setOwnerEmail] = useState<string>("");
    const [shareableUsers, setShareableUsers] = useState<any[]>([]);
    const [shareDetails, setShareDetails] = useState<Record<string, { fullName?: string; email?: string }>>({});
    const [selectedAccessLevel, setSelectedAccessLevel] = useState<number>(1);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const existingUsers = emails || parseSharedUsers(file.sharedUsers);

    useEffect(() => {
        const fetchOwnerDetails = async () => {
            if (!file.userId) return;
            try {
                const user = await getUserById(file.userId);
                if (user) {
                    setOwnerName(user.fullName || "Unknown Owner");
                    setOwnerEmail(user.email || "");
                } else {
                    setOwnerName("Unknown Owner");
                }
            } catch (error) {
                console.error("Failed to fetch owner details:", error);
                setOwnerName(file.userId);
            }
        };

        const fetchShareData = async () => {
            try {
                const users = await getShareableUsers();
                setShareableUsers(users || []);
            } catch (error) {
                console.error("Failed to fetch shareable users:", error);
            }

            try {
                const shares = await getDocumentShares(file.id);
                if (shares && Array.isArray(shares)) {
                    const sharedIds = shares.map((s: any) => s.userId || s.UserId).filter(Boolean);
                    if (sharedIds.length > 0) {
                        onInputChange(sharedIds);
                    }
                    const details: Record<string, { fullName?: string; email?: string }> = {};
                    const initialLevels: Record<string, number> = {};
                    shares.forEach((s: any) => {
                        const uid = s.userId || s.UserId;
                        if (uid) {
                            initialLevels[uid] = Number(s.level || s.Level || s.accessLevel || 1);
                            details[uid] = { fullName: s.userFullName || s.UserFullName };
                        }
                    });
                    setShareDetails(prev => ({ ...prev, ...details }));
                    if (onLevelsChange && Object.keys(initialLevels).length > 0) {
                        onLevelsChange(prev => ({ ...prev, ...initialLevels }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch document shares:", error);
            }
        };

        fetchOwnerDetails();
        fetchShareData();
    }, [file.userId, file.id]);

    const handleAddUser = (userKey: string, levelToAdd?: number) => {
        if (!userKey || userKey.trim() === "") return;
        if (userKey === file.userId) {
            toast.error("You cannot share a file with its owner.");
            return;
        }

        const matched = shareableUsers.find(u => u.id === userKey || u.email?.toLowerCase() === userKey.toLowerCase());
        if (existingUsers.includes(userKey) || (matched && existingUsers.includes(matched.id))) {
            toast.info(`"${matched?.fullName || matched?.email || userKey}" is already shared.`);
            return;
        }

        onInputChange([...existingUsers, userKey]);
        if (onLevelsChange) {
            onLevelsChange(prev => ({ ...prev, [userKey]: levelToAdd || selectedAccessLevel }));
        }
        if (matched) {
            toast.success(`Added ${matched.fullName || matched.email} to share list.`);
        }
        setSearchQuery("");
    };

    const filteredUsers = searchQuery.trim() === ""
        ? []
        : shareableUsers.filter(u =>
            u.id !== file.userId &&
            !existingUsers.includes(u.id) &&
            !existingUsers.includes(u.email) &&
            (u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()))
          );

    return (
        <div className="share-wrapper min-w-0 flex flex-col w-full">
            {/* Sleek Document Header Card */}
            <div className="flex items-center gap-3.5 p-3.5 bg-gradient-to-r from-brand/5 via-indigo-500/5 to-purple-500/5 border border-brand/15 rounded-2xl mb-5 shadow-2xs min-w-0">
                <Thumbnail
                    type={file.fileType}
                    extension={file.fileExtension.replace('.', '')}
                    url={file.fileLink}
                    className="!size-12 shrink-0 rounded-xl shadow-sm bg-white border border-slate-100/80"
                    imageClassName="!size-6 shrink-0"
                />
                <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate" title={file.fileName || file.title}>
                        {file.fileName || file.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-brand/10 text-brand border border-brand/20 shrink-0">
                            {file.fileExtension?.replace('.', '') || file.fileType || 'Doc'}
                        </span>
                        <FormattedDateTime date={file.createdAt || ""} className="text-xs text-slate-400 truncate" />
                    </div>
                </div>
            </div>

            {/* Invite Collaborators Section */}
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Invite Collaborators
                </label>
            </div>

            <div className="flex gap-2.5 items-center w-full relative">
                <div className="relative flex-1 min-w-0">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
                        <Image
                            src="/assets/icons/search.svg"
                            alt="search"
                            width={18}
                            height={18}
                            className="opacity-60"
                        />
                    </div>
                    <Input
                        type="text"
                        placeholder="Search by name or email address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="!h-[46px] !pl-10 !pr-4 !rounded-xl !border-slate-200 !bg-slate-50/70 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:!bg-white focus:!border-brand focus:!ring-4 focus:!ring-brand/15 transition-all shadow-2xs w-full"
                    />
                </div>
                <select
                    value={selectedAccessLevel}
                    onChange={(e) => setSelectedAccessLevel(Number(e.target.value))}
                    className="h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/15 shrink-0 cursor-pointer shadow-2xs hover:bg-slate-50 transition-all"
                >
                    <option value={1}>Can view</option>
                    <option value={2}>Can edit</option>
                </select>
            </div>

            {/* Floating Search Results */}
            {filteredUsers.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 mt-3 max-h-56 overflow-y-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-1.5 space-y-1 divide-y divide-slate-100/80 animate-in fade-in-50 zoom-in-95 duration-150">
                    {filteredUsers.map((u) => {
                        const initials = (u.fullName || u.email || 'U').slice(0, 2).toUpperCase();
                        return (
                            <li
                                key={u.id || u.email}
                                onClick={() => handleAddUser(u.id || u.email, selectedAccessLevel)}
                                className="flex items-center justify-between p-2.5 hover:bg-brand-50/60 rounded-xl cursor-pointer transition-all duration-150 group pt-2.5 first:pt-2.5"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                                        {initials}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand transition-colors">
                                            {u.fullName || u.email}
                                        </p>
                                        {u.fullName && u.email && (
                                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                        )}
                                    </div>
                                </div>
                                <span className="px-3 py-1.5 rounded-lg bg-brand/10 group-hover:bg-brand text-brand group-hover:text-white text-xs font-bold transition-all duration-200 shadow-2xs shrink-0 ml-2 flex items-center gap-1">
                                    <span>+ Invite</span>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* Who Has Access List */}
            <div className="pt-6 min-w-0">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Who Has Access
                    </label>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                        {existingUsers.length + 1} {existingUsers.length + 1 === 1 ? 'person' : 'people'}
                    </span>
                </div>

                <ul className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1 min-w-0">
                    {/* Owner Card */}
                    <li className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-yellow-50/40 rounded-2xl border border-amber-200/80 shadow-2xs min-w-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                                {(ownerName || 'O').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-800 flex items-center gap-2 truncate">
                                    <span className="truncate">{ownerName}</span>
                                </p>
                                {ownerEmail && <p className="text-xs text-slate-400 truncate">{ownerEmail}</p>}
                            </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300/80 shadow-2xs shrink-0">
                            Owner
                        </span>
                    </li>

                    {/* Collaborator Cards */}
                    {existingUsers.map((userKey: string) => {
                        const matched = shareableUsers.find(u => u.id === userKey || u.email?.toLowerCase() === userKey.toLowerCase());
                        const detail = shareDetails[userKey];
                        const displayName = matched ? (matched.fullName || matched.email) : (detail?.fullName || detail?.email || userKey);
                        const displayEmail = (matched && matched.fullName) ? matched.email : (detail?.email || "");
                        const currentLevel = (userLevels && userLevels[userKey]) ? userLevels[userKey] : 1;
                        const initials = (displayName || 'U').slice(0, 2).toUpperCase();

                        return (
                            <li key={userKey} className="flex items-center justify-between gap-3 p-3 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/80 shadow-2xs transition-all duration-200 min-w-0 group">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                                        {initials}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-800 truncate" title={displayName}>
                                            {displayName}
                                        </p>
                                        {displayEmail && <p className="text-xs text-slate-400 truncate">{displayEmail}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {onLevelsChange && (
                                        <select
                                            value={currentLevel}
                                            onChange={(e) => onLevelsChange(prev => ({ ...prev, [userKey]: Number(e.target.value) }))}
                                            className="h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all cursor-pointer shadow-2xs"
                                        >
                                            <option value={1}>Can view</option>
                                            <option value={2}>Can edit</option>
                                        </select>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => onRemove(userKey)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 shrink-0 cursor-pointer"
                                        title="Revoke access"
                                    >
                                        <Image
                                            src="/assets/icons/remove.svg"
                                            alt="remove"
                                            width={16}
                                            height={16}
                                            className="opacity-60 group-hover:opacity-100 transition-opacity"
                                        />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};