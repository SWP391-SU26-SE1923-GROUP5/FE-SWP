export interface NavItem {
    name: string;
    icon: string;
    url: string;
    section: "main" | "insights" | "ai";
}

export const navItems: NavItem[] = [
    {
        name: "Dashboard",
        icon: "/assets/icons/dashboard.svg",
        url: "/home",
        section: "main",
    },
    {
        name: "Documents",
        icon: "/assets/icons/documents.svg",
        url: "/home/documents",
        section: "main",
    },
    {
        name: "Images",
        icon: "/assets/icons/images.svg",
        url: "/home/images",
        section: "main",
    },
    {
        name: "Media",
        icon: "/assets/icons/video.svg",
        url: "/home/media",
        section: "main",
    },
    {
        name: "Others",
        icon: "/assets/icons/others.svg",
        url: "/home/others",
        section: "main",
    },
    {
        name: "Trash Bin",
        icon: "/assets/icons/others.svg",
        url: "/trash",
        section: "main",
    },
    {
        name: "Analytics",
        icon: "/assets/icons/others.svg",
        url: "/analytics",
        section: "insights",
    },
    {
        name: "Notifications",
        icon: "/assets/icons/others.svg",
        url: "/notifications",
        section: "insights",
    },
    {
        name: "AI Chat",
        icon: "/assets/icons/others.svg",
        url: "/chat",
        section: "ai",
    },
    {
        name: "Leaderboard",
        icon: "/assets/icons/others.svg",
        url: "/leaderboard",
        section: "insights",
    },
];