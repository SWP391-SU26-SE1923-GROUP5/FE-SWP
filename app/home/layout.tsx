import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import Header from "@/components/Header";
import {getCurrentUser} from "@/lib/actions/user.actions";
import {redirect} from "next/navigation";

const Layout = async ({ children }: { children: React.ReactNode}) => {
    const currentUser = await getCurrentUser();
    if(!currentUser) return redirect("/sign-in")

    return (
        <main className="flex h-screen">
            <Sidebar fullName={currentUser.fullName} avatar={currentUser.avatar} email={currentUser.email} />

            <section className="flex h-full flex-1 flex-col">
                <MobileNavigation ownerId={currentUser.$id} accountId={currentUser.accountId} fullName={currentUser.fullName} avatar={currentUser.avatar} email={currentUser.email} />
                <Header userId={currentUser.$id} accountId={currentUser.accountId}/>

                <div className="main-content">{children}</div>
            </section>
        </main>
    )
}
export default Layout
