-- scripts/promote-admin.sql
-- Promote an existing user to the admin role. Replace the email below.
UPDATE users SET role = 'admin', updated_at = NOW() WHERE LOWER(email) = LOWER('admin@smartstore.local');

-- (Optional) Show the result:
-- SELECT id, email, full_name, role FROM users ORDER BY role DESC, created_at DESC;
