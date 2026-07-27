import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PROTECTED_ROUTES = [
    "/home",
    "/chat",
    "/quizzes",
    "/flashcards",
    "/analytics",
    "/leaderboard",
    "/notifications",
    "/profile",
    "/trash"
];

export default auth((req) => {
    const { nextUrl } = req;

    const isLoggedIn = !!req.auth && !req.auth.error;
    const isAdmin = req.auth?.user?.role?.toLowerCase() === "admin";

    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
        nextUrl.pathname.startsWith(route)
    );

    const isAdminRoute = nextUrl.pathname.startsWith("/admin");

    const isAuthPage =
        nextUrl.pathname.startsWith("/sign-in") ||
        nextUrl.pathname.startsWith("/sign-up");

    if (isAdminRoute && !isLoggedIn) {
        const loginUrl = new URL("/sign-in", nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isAdminRoute && isLoggedIn && !isAdmin) {
        return NextResponse.redirect(new URL("/home", nextUrl.origin));
    }

    if (isProtectedRoute && !isLoggedIn) {
        const loginUrl = new URL("/sign-in", nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(
            new URL(isAdmin ? "/admin/dashboard" : "/home", nextUrl.origin)
        );
    }

    if (nextUrl.pathname.startsWith("/home") && isLoggedIn && isAdmin) {
        return NextResponse.redirect(new URL("/admin/dashboard", nextUrl.origin));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};