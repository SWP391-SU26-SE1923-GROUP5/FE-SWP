"use client"

import { File_ } from "@/types";
import Thumbnail from "@/components/Thumbnail";
import FormattedDateTime from "@/components/FormattedDateTime";
import { convertFileSize, formatDateTime } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getUserById } from "@/lib/actions/user.actions"; // Adjust path if needed

const ImageThumbnail = ({ file }: { file: File_ }) => (
    <div className="file-details-thumbnail">
        <Thumbnail type={file.fileType} extension={file.fileExtension.replace('.', '')} url={file.fileLink} />
        <div className="flex flex-col">
            <p className="subtitle-2 mb-1">{file.fileName}</p>
            <FormattedDateTime date={file.createdAt || ""} className="caption" />
        </div>
    </div>
)

const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex">
        <p className="file-details-label">{label}</p>
        <p className="file-details-value">{value}</p>
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
        <>
            <ImageThumbnail file={file} />
            <div className="space-y-4 px-2 pt-2">
                <DetailRow label="Format:" value={file.fileExtension} />
                <DetailRow label="Size:" value={convertFileSize(file.fileSizeBytes || 0)} />
                <DetailRow label="Owner:" value={ownerName} />
                <DetailRow label="Last edit:" value={formatDateTime(file.updatedAt || file.createdAt || "")} />
            </div>
        </>
    )
}

interface Props {
    file: File_;
    onInputChange: React.Dispatch<React.SetStateAction<string[]>>
    onRemove: (email: string) => void
}

export const ShareInput = ({ file, onInputChange, onRemove }: Props) => {
    const [ownerName, setOwnerName] = useState<string>("Loading owner...");
    const [ownerEmail, setOwnerEmail] = useState<string>("");

    const existingUsers = file.sharedUsers && file.sharedUsers.trim() !== ""
        ? file.sharedUsers.split(",").map(e => e.trim()).filter(Boolean)
        : [];

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

        fetchOwnerDetails();
    }, [file.userId]);

    return (
        <>
            <ImageThumbnail file={file} />

            <div className="share-wrapper">
                <p className="subtitle-2 pl-1 text-light-100">Share file with other users</p>

                <Input
                    type="email"
                    placeholder="Enter email address..."
                    onChange={(e) => {
                        const newEmails = e.target.value.trim().split(",").map(e => e.trim()).filter(Boolean);
                        onInputChange([...existingUsers, ...newEmails]);
                    }}
                    className="share-input-field"
                />

                <div className="pt-4">
                    <div className="flex justify-between">
                        <p className="subtitle-2 text-light-100">Shared with</p>
                        <p className="subtitle-2 text-light-200">{existingUsers.length + 1} users</p>
                    </div>

                    <ul className="pt-2">
                        <li className="flex items-center justify-between gap-2 mb-2 p-2 bg-slate-50 rounded-md border border-slate-100">
                            <div className="flex flex-col">
                                <p className="subtitle-2 text-light-100 flex items-center gap-2">
                                    {ownerName}
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand-100 px-2 py-0.5 rounded-full">
                                        Owner
                                    </span>
                                </p>
                                {ownerEmail && <p className="caption text-light-200">{ownerEmail}</p>}
                            </div>
                        </li>

                        {existingUsers.map((email: string) => (
                            <li key={email} className="flex items-center justify-between gap-2 mb-2 p-2">
                                <p className="subtitle-2 text-light-100">
                                    {email}
                                </p>

                                <Button variant="ghost" onClick={() => onRemove(email)} className="share-remove-user">
                                    <Image
                                        src="/assets/icons/remove.svg"
                                        alt="remove"
                                        width={24}
                                        height={24}
                                        className="remove-icon cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                                    />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    )
}