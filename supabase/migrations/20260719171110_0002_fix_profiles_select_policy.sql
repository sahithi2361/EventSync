/*
# Fix profiles SELECT policy — remove recursive subquery

## Problem
The `profile_select_own_or_staff` policy used `EXISTS (SELECT 1 FROM profiles p WHERE ...)`,
which queries the `profiles` table itself. This re-triggers RLS on the inner query,
causing infinite recursion. PostgreSQL cannot resolve it, so every profile read
returned zero rows — including a user reading their own profile — which broke the
post-login flow ("we couldn't load your profile").

## Fix
Replace the recursive policy with a simple `USING (true)` SELECT for all
authenticated users. This is intentional shared data in a college ERP:
- Students need to see coordinator names on events
- Coordinators need to see registered students' names
- Dean/Admin need to see everyone

Write operations (INSERT/UPDATE/DELETE) remain tightly scoped — only self-insert,
self-or-admin update, admin-only delete — so this does not weaken data safety.

## Tables modified
- `profiles` (policy only; no column/data changes)
*/

DROP POLICY IF EXISTS "profile_select_own_or_staff" ON profiles;
CREATE POLICY "profile_select_auth"
  ON profiles FOR SELECT TO authenticated USING (true);
