-- AMOST role policy v1
-- Global user roles:
-- 1. super_admin
-- 2. staff_amost
-- 3. umum
--
-- Official Event is NOT a global role.
-- Official Event will be implemented later as an event-level assignment table.

-- Normalize known legacy/variant role values.
UPDATE users
SET role = 'super_admin'
WHERE LOWER(COALESCE(role, '')) IN (
  'super_admin',
  'superadmin',
  'super admin',
  'admin_super',
  'admin'
);

UPDATE users
SET role = 'staff_amost'
WHERE LOWER(COALESCE(role, '')) IN (
  'staff_amost',
  'staff amost',
  'staff',
  'official_amost',
  'official amost',
  'amost_staff'
);

UPDATE users
SET role = 'umum'
WHERE role IS NULL
   OR TRIM(role) = ''
   OR LOWER(COALESCE(role, '')) IN (
    'umum',
    'public',
    'member',
    'user',
    'peserta'
  );

-- Optional safety check. Run manually only after confirming all current role values are clean.
-- SELECT role, COUNT(*) FROM users GROUP BY role ORDER BY role;
-- ALTER TABLE users
--   ADD CONSTRAINT users_role_check
--   CHECK (role IN ('super_admin', 'staff_amost', 'umum'));
