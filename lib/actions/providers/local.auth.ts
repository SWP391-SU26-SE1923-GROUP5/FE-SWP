import { IAuthService, CreateAccountProps, SignInProps, User } from "@/types";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { avatarPlaceholderUrl } from "@/constants/avatar";
import { auth, signOut } from "@/auth";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export class LocalAuth implements IAuthService {
    async getUserById(id: string | undefined): Promise<User | null> {
        if (!id) return null;
        try {
            const res = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
            return res.rows.length ? this.mapToUser(res.rows[0]) : null;
        } catch { return null; }
    }

    async getUserFullName(id: string | undefined) {
        const user = await this.getUserById(id);
        return user ? user.fullName : null;
    }

    async getUserByEmail(email: string): Promise<User | null> {
        try {
            const res = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
            return res.rows.length ? this.mapToUser(res.rows[0]) : null;
        } catch { return null; }
    }

    async createAccount({ fullName, username, email, password }: CreateAccountProps) {
        const existingUser = await this.getUserByEmail(email);
        const accountId = uuidv4();

        if (!existingUser) {
            const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
            await pool.query(
                "INSERT INTO users (account_id, email, full_name, username, avatar, password_hash) VALUES ($1, $2, $3, $4, $5, $6)",
                [accountId, email, fullName, username, avatarPlaceholderUrl, hashedPassword]
            );
        }
        return JSON.parse(JSON.stringify({ accountId: existingUser ? existingUser.accountId : accountId }));
    }

    async signInUser({ email, password }: SignInProps) {
        const res = await pool.query("SELECT password_hash, account_id FROM users WHERE email = $1 LIMIT 1", [email]);
        const user = res.rows[0];

        if (!user || !user.password_hash || !password) return { accountId: null };

        const passwordsMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordsMatch) return { accountId: null };

        const cookieStore = await cookies();
        cookieStore.set("user-session", user.account_id, {
            path: "/", httpOnly: true, sameSite: "strict",
            secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7
        });

        return JSON.parse(JSON.stringify({ accountId: user.account_id }));
    }

    async getCurrentUser(): Promise<User | null> {
        try {
            const nextAuthSession = await auth();
            if (nextAuthSession?.user?.email) {
                const user = await this.getUserByEmail(nextAuthSession.user.email);
                if (user) return user;
            }

            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get("user-session");

            if (sessionCookie?.value) {
                const res = await pool.query("SELECT * FROM users WHERE account_id = $1 LIMIT 1", [sessionCookie.value]);
                if (res.rows.length) return this.mapToUser(res.rows[0]);
            }
            return null;
        } catch { return null; }
    }

    async signOutUser() {
        const cookieStore = await cookies();
        cookieStore.delete("user-session");
        await signOut({ redirectTo: "/sign-in" });
    }

    private mapToUser(row: any): User {
        return {
            $id: row.id,
            accountId: row.account_id,
            email: row.email,
            fullName: row.full_name,
            username: row.username,
            avatar: row.avatar,
            password_hash: row.password_hash
        } as User;
    }
}