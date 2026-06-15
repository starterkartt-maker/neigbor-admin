-- =======================================================================
-- NEIGHBORCART - ADMIN ROLE SETUP SCRIPT
-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR (https://supabase.com)
-- =======================================================================

-- 1. Create a table to track authorized administrators if you haven't already.
CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS) on public tables to protect admin functionality.
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 3. Provision direct admin access for f8674836-fb2b-4dc4-88f5-c3792538d9c4 user
-- This inserts the admin record. If the email is known, update 'admin@neighborcart.com' with the user's register email.
INSERT INTO public.admins (user_id, email)
VALUES ('f8674836-fb2b-4dc4-88f5-c3792538d9c4', 'owner@neighborcart.com')
ON CONFLICT (user_id) DO UPDATE 
SET email = EXCLUDED.email;

-- 4. Create an admin policy to ensure only this admin can run write operations (INSERT, UPDATE, DELETE).
-- Update your existing RLS policies on 'products' and 'categories' to permit write ops only if auth.uid() matches admins.user_id:
-- Example for categories table:
CREATE POLICY "Admins can maintain categories" 
ON public.categories
FOR ALL 
USING (auth.uid() = 'f8674836-fb2b-4dc4-88f5-c3792538d9c4');

-- Example for products table:
CREATE POLICY "Admins can maintain products" 
ON public.products
FOR ALL 
USING (auth.uid() = 'f8674836-fb2b-4dc4-88f5-c3792538d9c4');

-- 5. Optional Helper: Grant admin custom user claim or user metadata 
-- Run this if you want user.app_metadata to have an admin flag:
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'
WHERE id = 'f8674836-fb2b-4dc4-88f5-c3792538d9c4';
