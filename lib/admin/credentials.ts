/**
 * Hardcoded frontend admin account.
 *
 * This account is verified directly in `signInUser` (user.actions.ts) without
 * any backend or database call.  It is intended solely for development /
 * demonstration environments.
 *
 * To change the password, edit USERNAME and PASSWORD below — no other file
 * needs to be updated.
 */
export const ADMIN_USERNAME = "admintest";
export const ADMIN_PASSWORD = "smarts1123";
export const ADMIN_EMAIL = `${ADMIN_USERNAME}@smartstore.local`;
