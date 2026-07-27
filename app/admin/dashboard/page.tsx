import { getAdminDashboard } from "@/lib/actions/admin.actions";
import { AdminDashboardDto } from "@/types";
import {
    Users,
    UserCheck,
    FileText,
    DollarSign,
    CreditCard,
    AlertCircle,
    LayoutDashboard
} from "lucide-react";
import TierRevenueChart from "@/components/admin/TierRevenueChart";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { signOutUser } from "@/lib/actions/user.actions";

export default async function AdminDashboardPage() {
    let dashboard: AdminDashboardDto | null = null;
    let fetchError = false;

    try {
        dashboard = await getAdminDashboard();
    } catch {
        fetchError = true;
    }

    if (fetchError || !dashboard) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 flex items-center justify-center">
                <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 p-8 rounded-2xl max-w-md w-full shadow-lg text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Unable to Load Dashboard</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        Could not retrieve admin analytics data from the server. Please verify backend services and authentication credentials.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-6 sm:px-10 lg:px-14">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
                            <LayoutDashboard className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Admin Dashboard
                            </h1>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                Platform telemetry, revenue tracking, and subscription diagnostics
                            </p>
                        </div>
                    </div>
                    <form action={async () => {
                        "use server"
                        await signOutUser()
                    }}>
                        <Button type="submit" className="sign-out-button py-6 cursor-pointer rounded-full bg-red-200 [&:hover]:bg-red-300 transition">
                            <Image
                                src="/assets/icons/logout.svg"
                                alt="logout"
                                width={24}
                                height={24}
                                className="w-6"
                            />
                        </Button>
                    </form>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Users</span>
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                {(dashboard?.totalUsers ?? 0).toLocaleString()}
                            </h3>
                            <p className="text-[11px] font-medium text-slate-400 mt-1">Registered accounts</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Users</span>
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                <UserCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                {(dashboard?.totalActiveUsers ?? 0).toLocaleString()}
                            </h3>
                            <p className="text-[11px] font-medium text-slate-400 mt-1">Engaged users</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Documents</span>
                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                {(dashboard?.totalDocumentsUploaded ?? 0).toLocaleString()}
                            </h3>
                            <p className="text-[11px] font-medium text-slate-400 mt-1">Uploaded files</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue</span>
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {(dashboard?.totalRevenue ?? 0).toLocaleString("vi-VN")} VND
                            </h3>
                            <p className="text-[11px] font-medium text-slate-400 mt-1">Total earnings</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Transactions</span>
                            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                <CreditCard className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                {(dashboard?.totalTransactions ?? 0).toLocaleString()}
                            </h3>
                            <p className="text-[11px] font-medium text-slate-400 mt-1">Completed orders</p>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <TierRevenueChart data={dashboard?.tierBreakdown ?? []} />
                </div>
            </div>
        </main>
    );
}
