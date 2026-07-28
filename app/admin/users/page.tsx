import { getAdminUsers } from "@/lib/actions/admin.actions";
import { AdminUserDto } from "@/types";
import AdminNavigation from "@/components/admin/AdminNavigation";
import UserManagementTable from "@/components/admin/UserManagementTable";
import { Users, UserCheck, UserX, AlertCircle } from "lucide-react";

export default async function AdminUsersPage() {
    let users: AdminUserDto[] = [];
    let fetchError = false;

    try {
        users = await getAdminUsers();
    } catch {
        fetchError = true;
    }

    if (fetchError) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 flex items-center justify-center">
                <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 p-8 rounded-2xl max-w-md w-full shadow-lg text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Unable to Load Users</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        Could not retrieve account inventory from the server. Please verify backend services and authentication credentials.
                    </p>
                </div>
            </div>
        );
    }

    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status?.toLowerCase() === "active").length;
    const bannedUsers = users.filter((u) => u.status?.toLowerCase() === "banned").length;

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-6 sm:px-10 lg:px-14">
            <div className="max-w-7xl mx-auto space-y-8">
                <AdminNavigation
                    title="User Governance Console"
                    subtitle="Manage account status, enforce platform compliance, and review resource quotas"
                    currentTab="users"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Registered</span>
                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                {totalUsers.toLocaleString()}
                            </h3>
                            <p className="text-[11px] font-medium text-slate-400 mt-1">All database accounts</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Accounts</span>
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                <UserCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {activeUsers.toLocaleString()}
                            </h3>
                            <p className="text-[11px] font-medium text-slate-400 mt-1">Currently unbanned & compliant</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Banned Accounts</span>
                            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                                <UserX className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                {bannedUsers.toLocaleString()}
                            </h3>
                            <p className="text-[11px] font-medium text-slate-400 mt-1">Restricted from access</p>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <UserManagementTable initialUsers={users} />
                </div>
            </div>
        </main>
    );
}
