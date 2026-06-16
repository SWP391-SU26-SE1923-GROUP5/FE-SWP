'use client'
import Link from "next/link";
import Image from "next/image";
import {navItems} from "@/constants/nav";
import {usePathname} from "next/navigation";
import {cn} from "@/lib/utils";
import {avatarPlaceholderUrl} from "@/constants/avatar";

interface Props {
    fullName: string;
    avatar: string;
    email: string;
}

const Sidebar = ({fullName, avatar, email}: Props) => {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            <Link href="/home" className="shrink-0">
                <Image
                    src="/assets/icons/logo-full-brand.svg"
                    alt="logo"
                    width={160}
                    height={50}
                    className="hidden h-auto lg:block"
                />

                <Image
                    src="/assets/icons/logo-brand.svg"
                    alt="logo"
                    width={52}
                    height={52}
                    className="lg:hidden"
                />
            </Link>

            <nav className="sidebar-nav shrink-0">
                {navItems.map(({url, name, icon}) => (
                    <Link key={name} href={url} className="lg:w-full">
                        <li
                            className={cn(
                                "sidebar-nav-item",
                                pathname === url && "shad-active",
                            )}
                        >
                            <Image
                                src={icon}
                                alt={name}
                                width={24}
                                height={24}
                                className={cn(
                                    "nav-icon",
                                    pathname === url && "nav-icon-active",
                                )}
                            />
                            <p className="hidden lg:block">{name}</p>
                        </li>
                    </Link>
                ))}
            </nav>

            <div className="hidden lg:flex flex-1 min-h-0 items-center justify-center w-full my-4 relative">
                <Image
                    src="/assets/images/files-2.png"
                    alt="illustration"
                    fill
                    className="object-contain"
                />
            </div>

            <div className="sidebar-user-info shrink-0 mt-auto">
                <Image
                    src={avatarPlaceholderUrl}
                    alt="Avatar"
                    width={44}
                    height={44}
                    className="sidebar-user-avatar"
                />

                <div className="hidden lg:block truncate">
                    <p className="subtitle-2 capitalize truncate">{fullName}</p>
                    <p className="caption truncate">{email}</p>
                </div>
            </div>
        </aside>
    )
}
export default Sidebar