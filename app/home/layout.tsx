import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { avatarPlaceholderUrl } from "@/constants/avatar";

const Layout = async ({ children }: { children: React.ReactNode}) => {
    const currentUser = await getCurrentUser();

    const fullName = currentUser?.fullName || "User";
    const email = currentUser?.email || "";

    return (
        <main className="flex h-screen">
            <Sidebar fullName={fullName} avatar={avatarPlaceholderUrl} email={email} />

            <section className="flex h-full flex-1 flex-col">
                <MobileNavigation fullName={fullName} avatar={avatarPlaceholderUrl} email={email} />
                <Header />

                <div className="main-content">{children}</div>
            </section>
        </main>
    )
}
export default Layout