-- scripts/promote-admin.sql
-- Promote an existing user to the admin role. Replace the email below.
-- Keep in sync with BE-SWP/AIStudyHub.API/appsettings.json → AdminSeed.Email
UPDATE users SET role = 'admin', updated_at = NOW() WHERE LOWER(email) = LOWER('admin@aistudyhub.local');

-- (Optional) Show the result:
-- SELECT id, email, full_name, role FROM users ORDER BY role DESC, created_at DESC;
