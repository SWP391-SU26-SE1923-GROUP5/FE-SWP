"use client"

import Image from "next/image";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {useState} from "react";
import {usePathname} from "next/navigation";
import {avatarPlaceholderUrl} from "@/constants/avatar";
import {Separator} from "@/components/ui/separator";
import {navItems} from "@/constants/nav";
import Link from "next/link";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import FileUploader from "@/components/FileUploader";
import {signOutUser} from "@/lib/actions/user.actions";
import { BarChart3, Bell, Trophy } from "lucide-react";

interface Props {
    fullName: string;
    avatar: string;
    email: string;
}

const renderNavIcon = (name: string, icon: string, isActive: boolean) => {
    if (name === "Analytics") {
        return <BarChart3 className={cn("w-[24px] h-[24px] text-slate-400 transition-colors shrink-0", isActive && "text-brand")} />;
    }
    if (name === "Notifications") {
        return <Bell className={cn("w-[24px] h-[24px] text-slate-400 transition-colors shrink-0", isActive && "text-brand")} />;
    }
    if (name === "Leaderboard") {
        return <Trophy className={cn("w-[24px] h-[24px] text-amber-500 transition-colors shrink-0", isActive && "text-brand")} />;
    }
    return (
        <Image
            src={icon}
            alt={name}
            width={24}
            height={24}
            className={cn(
                "nav-icon shrink-0",
                isActive && "nav-icon-active",
            )}
        />
    );
};

const MobileNavigation = ({fullName, avatar, email}: Props) => {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    const mainNavItems = navItems.filter((item) => item.section === "main");
    const insightNavItems = navItems.filter((item) => item.section === "insights");

    return (
        <header className="mobile-header">
            <Image
                src="/assets/icons/logo-full-brand.svg"
                alt="logo"
                width={120}
                height={52}
                className="h-auto"
            />

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger>
                    <Image
                        src="/assets/icons/menu.svg"
                        alt="Search"
                        width={30}
                        height={30}
                    />
                </SheetTrigger>
                <SheetContent className="shad-sheet h-full px-3 overflow-y-auto">
                    <SheetTitle>
                        <div className="header-user">
                            <Image
                                src={avatarPlaceholderUrl}
                                alt="avatar"
                                width={44}
                                height={44}
                                className="header-user-avatar"
                            />

                            <div className="sm:hidden lg:block">
                                <p className="subtitle-2 capitalize">
                                    {fullName}
                                </p>

                                <p className="caption">
                                    {email}
                                </p>
                            </div>
                        </div>

                        <Separator className="mb-4 bg-light-200/20"/>
                    </SheetTitle>

                    <nav className="mobile-nav space-y-4">
                        <div>
                            <p className="px-6 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Storage</p>
                            <ul className="mobile-nav-list gap-2 mt-1">
                                {mainNavItems.map(({ url, name, icon }) => {
                                    const isActive = pathname === url;
                                    return (
                                        <Link key={name} href={url} className="lg:w-full block">
                                            <li className={cn("mobile-nav-item !h-11", isActive && "shad-active")}>
                                                {renderNavIcon(name, icon, isActive)}
                                                <p>{name}</p>
                                            </li>
                                        </Link>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60">
                            <p className="px-6 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Activity & Insights</p>
                            <ul className="mobile-nav-list gap-2 mt-1">
                                {insightNavItems.map(({ url, name, icon }) => {
                                    const isActive = pathname === url;
                                    return (
                                        <Link key={name} href={url} className="lg:w-full block">
                                            <li className={cn("mobile-nav-item !h-11", isActive && "shad-active")}>
                                                {renderNavIcon(name, icon, isActive)}
                                                <p>{name}</p>
                                            </li>
                                        </Link>
                                    );
                                })}
                            </ul>
                        </div>
                    </nav>

                    <Separator className="my-5 bg-light-200/20"/>

                    <div className="flex flex-col justify-between gap-5 pb-5">
                        <FileUploader />

                        <Button type="submit" className="mobile-sign-out-button bg-red-800 rounded-full py-6" onClick={async () => await signOutUser()}>
                            <Image
                                src="/assets/icons/logout.svg"
                                alt="logo"
                                width={24}
                                height={24}
                            />

                            <p className="text-rose-100 font-bold">Logout</p>
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </header>
    )
}
export default MobileNavigation
