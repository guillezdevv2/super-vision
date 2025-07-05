/*
  # Fix Users Table Policies

  1. Security Changes
    - Remove all custom policies from users table that cause infinite recursion
    - Keep only essential policies for basic authentication
    - Ensure users can read their own profile data
    - Allow service role to manage users

  2. Notes
    - This fixes the infinite recursion error during login
    - Removes complex policies that reference the same table
    - Maintains basic security while allowing authentication to work
*/

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Allow user profile access" ON users;
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can read their own profile" ON users;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role full access (for admin operations)
CREATE POLICY "Service role can manage users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);