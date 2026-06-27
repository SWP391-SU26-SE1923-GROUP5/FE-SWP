import { Pool } from "pg";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const SALT_ROUNDS = 12;
const ADMIN = {
    email: "admintest@smartstore.local",
    fullName: "admintest",
    password: "admintest",
    role: "admin",
};

async function seed() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        // Check if already exists
        const existing = await pool.query(
            "SELECT id, role FROM users WHERE email = $1",
            [ADMIN.email]
        );

        if (existing.rows.length > 0) {
            const user = existing.rows[0];
            console.log(`User ${ADMIN.email} already exists (id=${user.id}, role=${user.role})`);

            if (user.role !== "admin") {
                await pool.query("UPDATE users SET role = $1 WHERE email = $2", [
                    ADMIN.role,
                    ADMIN.email,
                ]);
                console.log(`Updated role to '${ADMIN.role}'`);
            }
            console.log("Admin user is ready.");
            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(ADMIN.password, SALT_ROUNDS);
        console.log(`Password hashed (${SALT_ROUNDS} rounds)`);

        // Insert user
        const id = uuidv4();
        const result = await pool.query(
            `INSERT INTO users (id, account_id, email, full_name, username, avatar, password_hash, role, created_at, updated_at)
             VALUES ($1, $1, $2, $3, $4, NULL, $5, $6, NOW(), NOW())
             RETURNING id, email, full_name, role, created_at`,
            [id, ADMIN.email, ADMIN.fullName, ADMIN.fullName.toLowerCase(), passwordHash, ADMIN.role]
        );

        const row = result.rows[0];
        console.log(`\nAdmin user created successfully!`);
        console.log(`  ID:       ${row.id}`);
        console.log(`  Email:    ${row.email}`);
        console.log(`  Name:     ${row.full_name}`);
        console.log(`  Role:     ${row.role}`);
        console.log(`  Created:  ${row.created_at}`);
        console.log(`\nYou can now sign in at http://localhost:3000/sign-in`);
    } catch (err: any) {
        console.error("Seed failed:", err?.message || err?.code || JSON.stringify(err));
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seed();
