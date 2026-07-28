import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { signOutUser } from "@/lib/actions/user.actions";
import { LayoutDashboard, Users, Shield } from "lucide-react";

interface AdminNavigationProps {
    title: string;
    subtitle: string;
    currentTab: "dashboard" | "users";
}

export default async function AdminNavigation({
    title,
    subtitle,
    currentTab,
}: AdminNavigationProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
                    <Shield className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {title}
                    </h1>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {subtitle}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
                <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <Link href="/admin/dashboard">
                        <Button
                            type="button"
                            variant={currentTab === "dashboard" ? "default" : "ghost"}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                                currentTab === "dashboard"
                                    ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                            }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Analytics</span>
                        </Button>
                    </Link>
                    <Link href="/admin/users">
                        <Button
                            type="button"
                            variant={currentTab === "users" ? "default" : "ghost"}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                                currentTab === "users"
                                    ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>Users</span>
                        </Button>
                    </Link>
                </div>

                <form action={async () => {
                    "use server";
                    await signOutUser();
                }}>
                    <Button type="submit" className="sign-out-button py-6 px-4 cursor-pointer rounded-xl bg-red-100 text-red-600 hover:bg-red-200 border border-red-200/60 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900 text-xs font-bold flex items-center gap-2 transition-all shadow-xs">
                        <Image
                            src="/assets/icons/logout.svg"
                            alt="logout"
                            width={18}
                            height={18}
                            className="w-4 h-4"
                        />
                        <span className="hidden sm:inline">Sign Out</span>
                    </Button>
                </form>
            </div>
        </div>
    );
}
