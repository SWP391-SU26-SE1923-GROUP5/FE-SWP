import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { BrainCircuit, FileText } from "lucide-react";
import Search from "@/components/Search";
import FileUploader from "@/components/FileUploader";
import { signOutUser } from "@/lib/actions/user.actions";
import { getSubjects } from "@/lib/actions/file.actions";

const Header = async () => {
    const subjects = await getSubjects();

    return (
        <header className="header">
            <Search />

            <div className="header-wrapper flex items-center gap-4">
                <Link href="/quizzes">
                    <Button
                        className="flex items-center gap-2 rounded-full py-6 px-5 border border-slate-200 bg-white text-brand [&:hover]:bg-slate-100 [&:hover]:text-brand transition-colors cursor-pointer shadow-sm"
                    >
                        <BrainCircuit className="h-5 w-5 text-brand" />
                        <span className="hidden sm:block font-medium text-brand">Quizzes</span>
                    </Button>
                </Link>

                <Link href="/flashcards">
                    <Button
                        className="flex items-center gap-2 rounded-full py-6 px-5 border border-slate-200 bg-white text-brand [&:hover]:bg-slate-100 [&:hover]:text-brand transition-colors cursor-pointer shadow-sm"
                    >
                        <FileText className="h-5 w-5 text-brand" />
                        <span className="hidden sm:block font-medium text-brand">Flashcards</span>
                    </Button>
                </Link>

                <FileUploader subjects={subjects} />

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
        </header>
    )
}

export default Header;