-- FIX DEALER VISIBILITY (Allow Frontend to Read New Dealer Accounts)
-- The new dealer system `dealer_accounts` was locked down (Service Role only).
-- We need to allow the Public to read basic dealer info (Name, City, Phone) for the Profile Page.

BEGIN;

-- 1. UNLOCK DEALER ACCOUNTS (Read Only)
ALTER TABLE public.dealer_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dealer accounts are viewable by everyone" ON public.dealer_accounts;

CREATE POLICY "Dealer accounts are viewable by everyone"
ON public.dealer_accounts
FOR SELECT
TO public
USING (true);

-- 2. ENSURE SEARCH IS POSSIBLE (Indexes for faster lookup by ID)
CREATE INDEX IF NOT EXISTS idx_dealer_accounts_id ON public.dealer_accounts(id);

-- 3. ENSURE CITY DATA IS READABLE (For Location)
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities are viewable by everyone"
ON public.cities
FOR SELECT
TO public
USING (true);

COMMIT;

SELECT 'New Dealer Accounts are now visible to the public.' as status;
