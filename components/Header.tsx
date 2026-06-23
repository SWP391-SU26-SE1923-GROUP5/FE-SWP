import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import Search from "@/components/Search";
import FileUploader from "@/components/FileUploader";
import { signOutUser } from "@/lib/actions/user.actions";

const Header = () => {
    return (
        <header className="header">
            <Search />

            <div className="header-wrapper flex items-center gap-4">
                <Link href="/quizzes">
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 rounded-full py-6 px-5 border border-slate-200 bg-white text-brand cursor-pointer shadow-sm"
                    >
                        <BrainCircuit className="h-5 w-5 text-brand" />
                        <span className="hidden sm:block font-medium">My Quizzes</span>
                    </Button>
                </Link>

                <FileUploader />

                <form action={async () => {
                    "use server"
                    await signOutUser()
                }}>
                    <Button type="submit" className="sign-out-button py-6 cursor-pointer rounded-full bg-red-200">
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
        </header>
    )
}
export default Header