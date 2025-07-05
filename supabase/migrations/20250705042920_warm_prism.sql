/*
  # Fix Users Table Policies - Simple Implementation

  1. Security
    - Drop all existing policies that might cause recursion
    - Create simple, non-recursive policies
    - Allow basic user operations without complex queries

  2. Policies
    - Users can read their own profile
    - Users can update their own profile
    - Service role has full access for admin operations
*/

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Allow user profile access" ON users;
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can read their own profile" ON users;

-- Create simple policies without recursion
CREATE POLICY "enable_read_own_profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "enable_update_own_profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Service role policy for admin operations
CREATE POLICY "enable_all_for_service_role" ON users
  FOR ALL USING (auth.role() = 'service_role');