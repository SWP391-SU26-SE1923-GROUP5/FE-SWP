import {auth} from "@/auth";
import {NextResponse} from "next/server";

export default auth((req) => {
    const {nextUrl} = req;
    const isLoggedIn = !!req.auth;
    const isAdmin = req.auth?.user?.role === "ADMIN";

    const isProtectedRoute =
        nextUrl.pathname.startsWith("/home")

    const isAdminRoute = nextUrl.pathname.startsWith("/admin");
    const isAdminLoginPage = nextUrl.pathname === "/admin/sign-in";

    const isAuthPage =
        nextUrl.pathname.startsWith("/sign-in") ||
        nextUrl.pathname.startsWith("/sign-up");

    if (isProtectedRoute && !isLoggedIn) {
        const loginUrl = new URL("/sign-in", nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isAdminLoginPage) {
        if (isLoggedIn && isAdmin) {
            return NextResponse.redirect(new URL("admin/dashboard", nextUrl.origin));
        }
        return NextResponse.next();
    }

    if (isAdminRoute && (!isLoggedIn || !isAdmin)) {
        return NextResponse.redirect(new URL("/admin/sign-in", nextUrl.origin));
    }

    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL("/home", nextUrl.origin));
    }

    return NextResponse.next();
});