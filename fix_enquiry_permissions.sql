-- 1. Enable RLS on car_enquiries
alter table public.car_enquiries enable row level security;

-- 2. Drop existing policies to remove conflicts
drop policy if exists "Users can create enquiries" on public.car_enquiries;
drop policy if exists "Authenticated users can create enquiries" on public.car_enquiries;
drop policy if exists "Enable insert for authenticated users only" on public.car_enquiries;
drop policy if exists "Users can view own enquiries" on public.car_enquiries;
drop policy if exists "Dealers can view enquiries for their listings" on public.car_enquiries;

-- 3. Create INSERT policy: Allow any authenticated user to create an enquiry
-- Enforcing user_id = auth.uid() ensures users can only create enquiries for themselves
create policy "Authenticated users can create enquiries"
on public.car_enquiries
for insert
to authenticated
with check (
  auth.uid() = user_id
);

-- 4. Create SELECT policy: Users can see their own enquiries
create policy "Users can view own enquiries"
on public.car_enquiries
for select
to authenticated
using (
  auth.uid() = user_id
);

-- 5. Create SELECT policy: Dealers can see enquiries for their listings
create policy "Dealers can view enquiries for their listings"
on public.car_enquiries
for select
to authenticated
using (
  exists (
    select 1 from public.car_listings
    where car_listings.id = car_enquiries.car_listing_id
    and car_listings.seller_id = auth.uid()
  )
);

-- 6. Ensure activity_logs allows insertion (used by triggering logic)
alter table public.activity_logs enable row level security;

drop policy if exists "System can insert activity logs" on public.activity_logs;
drop policy if exists "Authenticated users can insert activity logs" on public.activity_logs;

create policy "Authenticated users can insert activity logs"
on public.activity_logs
for insert
to authenticated
with check (true);

-- 7. Grant access to sequences if needed (usually auto-handled but good to ensure)
grant usage, select on all sequences in schema public to authenticated;
