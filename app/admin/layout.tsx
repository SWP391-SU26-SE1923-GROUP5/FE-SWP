import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { isAdmin } from "@/lib/admin/roles";
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

    return (
        <div className="admin-shell">
            <AdminSidebar fullName={currentUser.fullName} email={currentUser.email} avatar={currentUser.avatar} />
            <div className="admin-main">
                <AdminHeader userLabel={currentUser.email} />
                <main className="admin-content">{children}</main>
            </div>
            <Toaster position="top-right" richColors />
        </div>
    );
}
