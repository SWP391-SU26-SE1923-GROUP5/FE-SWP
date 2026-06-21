"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import ViolationStatusBadge, { type ViolationStatus } from "@/components/admin/ViolationStatusBadge";
import { formatDateTime } from "@/lib/utils";

export interface AdminViolationRowData {
    $id: string;
    reason: string | null;
    status: ViolationStatus;
    createdAt: string;
    reporterName?: string;
    reporterEmail?: string;
    reporterAvatar?: string;
    documentId: string;
    documentName: string;
    documentExtension?: string;
}

interface AdminViolationRowProps {
    violation: AdminViolationRowData;
}

export default function AdminViolationRow({ violation }: AdminViolationRowProps) {
    const reporterLabel = violation.reporterName || violation.reporterEmail || "Unknown reporter";
    return (
        <tr data-testid="violation-row" data-violation-id={violation.$id}>
            <td>
                <div className="flex items-center gap-3">
                    <Image
                        src={violation.reporterAvatar || "/assets/icons/file-document-light.svg"}
                        alt={reporterLabel}
                        width={32}
                        height={32}
                        unoptimized
                        className="size-8 rounded-full object-cover ring-1 ring-light-300"
                    />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-dark-100">{reporterLabel}</p>
                        {violation.reporterEmail && violation.reporterName ? (
                            <p className="truncate text-xs text-light-400">{violation.reporterEmail}</p>
                        ) : null}
                    </div>
                </div>
            </td>
            <td>
                <p className="truncate text-sm text-dark-100">{violation.documentName}</p>
                {violation.documentExtension ? (
                    <p className="truncate text-xs text-light-400">.{violation.documentExtension}</p>
                ) : null}
            </td>
            <td>
                <p className="line-clamp-2 text-xs text-light-100" title={violation.reason ?? undefined}>
                    {violation.reason || <span className="italic text-light-400">No reason provided</span>}
                </p>
            </td>
            <td>
                <ViolationStatusBadge status={violation.status} />
            </td>
            <td className="hidden md:table-cell text-xs text-light-400">
                {formatDateTime(violation.createdAt)}
            </td>
            <td className="text-right">
                <Link
                    href={`/admin/reports/${violation.$id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                    aria-label={`Open violation ${violation.$id}`}
                >
                    Review <ChevronRight className="size-3" />
                </Link>
            </td>
        </tr>
    );
}