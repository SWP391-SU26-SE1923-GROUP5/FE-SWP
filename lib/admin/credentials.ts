/**
 * Hardcoded frontend admin account.
 *
 * Mirrors the Admin seed credentials declared in
 * `BE-SWP/AIStudyHub.API/appsettings.json` (`AdminSeed` section) so the
 * FE-side sign-in and the BE-side seeded account share the same email.
 *
 * This account is verified directly in `signInUser` (user.actions.ts)
 * without any backend call — intended for development/demo environments
 * only. The `ADMIN_EMAILS` env var in `.env.local` must include this
 * address so `isAdminEmail()` recognises the role.
 *
 * To change the password, edit PASSWORD below; the BE-side `AdminSeed`
 * config must be kept in sync.
 */
export const ADMIN_EMAIL = "admin@aistudyhub.local";
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "AdminTest21@";
