import {Button} from "@/components/ui/button";
import Image from "next/image";
import Search from "@/components/Search";
import FileUploader from "@/components/FileUploader";
import { signOutUser } from "@/lib/actions/user.actions";
import GlobalAIFeatures from "@/components/GlobalAIFeatures";

const Header = () => {
    return (
        <header className="header">
            <Search />

            <div className="header-wrapper">
                <GlobalAIFeatures />

                <FileUploader />

                <form action={async () => {
                    "use server"
                    await signOutUser()
                }}>
                    <Button type="submit" className="sign-out-button py-6 cursor-pointer rounded-full bg-red-200 hover:bg-red-300 transition">
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