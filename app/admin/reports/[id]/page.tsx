import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileText, Flag, MessageSquare, User2, XCircle, ShieldOff } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import ViolationStatusBadge, { type ViolationStatus } from "@/components/admin/ViolationStatusBadge";
import DocumentStatusBadge, { type DocumentModerationStatus } from "@/components/admin/DocumentStatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import { getAdminReportById, getAdminFileById } from "@/lib/actions/admin.actions";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AdminReportDetailPage({ params }: PageProps) {
    const { id } = await params;
    if (!id) notFound();

    const report = await getAdminReportById(id).catch(() => null);
    if (!report) notFound();

    const document = await getAdminFileById(report.documentId).catch(() => null);
    const documentName = document?.title ?? document?.name ?? report.documentTitle ?? report.documentFileName ?? `Document ${report.documentId}`;
    const documentStatus: DocumentModerationStatus =
        typeof document?.status === "string" && document.status.toLowerCase() === "banned" ? "removed" : "active";
    const status: ViolationStatus = (report.status as ViolationStatus | undefined) ?? "pending";

    return (
        <div className="space-y-6" data-testid="admin-report-detail">
            <div>
                <Link
                    href="/admin/reports"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-light-400 hover:text-brand"
                >
                    <ArrowLeft className="size-3" /> Back to reports
                </Link>
            </div>

            <header className="admin-card">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-light-400">Report ID</p>
                        <h2 className="mt-1 font-mono text-sm text-dark-100 break-all">{report.id ?? id}</h2>
                    </div>
                    <ViolationStatusBadge status={status} />
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="admin-card lg:col-span-2">
                    <h3 className="admin-card-title flex items-center gap-2">
                        <MessageSquare className="size-4 text-light-100" /> Report reason
                    </h3>
                    {report.reason ? (
                        <p className="mt-4 whitespace-pre-wrap rounded-xl border border-light-300 bg-light-300/30 p-4 text-sm text-dark-100">
                            {report.reason}
                        </p>
                    ) : (
                        <div className="mt-4">
                            <EmptyState
                                icon={Flag}
                                title="No reason provided"
                                description="The reporter did not include a reason with this report."
                            />
                        </div>
                    )}
                </section>

                <aside className="admin-card lg:col-span-1">
                    <h3 className="admin-card-title flex items-center gap-2">
                        <User2 className="size-4 text-light-100" /> Reporter
                    </h3>
                    <p className="admin-card-subtitle mt-1">Information about the user who submitted the report</p>
                    <dl className="mt-3 space-y-2 text-sm">
                        <div>
                            <dt className="text-[10px] font-bold uppercase tracking-widest text-light-400">Name</dt>
                            <dd className="text-dark-100">{report.reporterName ?? "Unknown"}</dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-bold uppercase tracking-widest text-light-400">Email</dt>
                            <dd className="text-dark-100">{report.reporterEmail ?? "—"}</dd>
                        </div>
                    </dl>

                    <h3 className="admin-card-title mt-6 flex items-center gap-2">
                        <FileText className="size-4 text-light-100" /> Reported document
                    </h3>
                    <p className="admin-card-subtitle mt-1">File under review</p>
                    <div className="mt-3 flex items-center gap-2">
                        <DocumentStatusBadge status={documentStatus} />
                        <span className="truncate text-sm text-dark-100">{documentName}</span>
                    </div>
                    {document?.fileLink ? (
                        <a
                            href={document.fileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex text-xs font-semibold text-brand hover:underline"
                        >
                            Open file ↗
                        </a>
                    ) : null}
                </aside>
            </div>

            <section className="admin-card">
                <h3 className="admin-card-title">Moderation actions</h3>
                <p className="admin-card-subtitle">
                    Reviewing this report does not change the report status on the AIStudyHub backend
                    (no update endpoint exposed), but you can ban or reinstate the offending document.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Button disabled className="rounded-full cursor-not-allowed opacity-60" title="Backend does not expose an approve endpoint">
                        <CheckCircle2 className="size-4" /> Approve violation
                    </Button>
                    <Button disabled variant="outline" className="rounded-full cursor-not-allowed opacity-60" title="Backend does not expose a reject endpoint">
                        <XCircle className="size-4" /> Reject violation
                    </Button>
                    <Button
                        asChild={Boolean(document?.id)}
                        variant="outline"
                        className="rounded-full"
                    >
                        <Link href={`/admin/document-violations`}>
                            <ShieldOff className="size-4" /> Manage document bans
                        </Link>
                    </Button>
                </div>
            </section>

            <p className="text-xs text-light-400">
                Created: {formatDateTime(report.createdAt)} · Updated: {formatDateTime(report.updatedAt ?? report.createdAt)}
            </p>
        </div>
    );
}
