import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { isAdmin } from "@/lib/admin/roles";
import { getSystemStats } from "@/lib/actions/admin.actions";
import { Toaster } from "@/components/ui/sonner";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata = {
    title: "Admin Console | SmartStore",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect("/sign-in");
    }
    if (!isAdmin(currentUser)) {
        redirect("/home?error=admin_required");
    }

    const stats = await getSystemStats().catch(() => null);

    return (
        <div className="admin-shell">
            <AdminSidebar
                fullName={currentUser.fullName}
                email={currentUser.email}
                avatar={currentUser.avatar}
                userCount={stats?.totalUsers}
                fileCount={stats?.totalFiles}
                reportCount={0}
            />
            <div className="admin-main">
                <AdminHeader userLabel={currentUser.email} />
                <main className="admin-content">{children}</main>
            </div>
            <Toaster position="top-right" richColors />
        </div>
    );
}
