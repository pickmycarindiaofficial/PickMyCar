# Database Setup Instructions

## Phase 1: Authentication & Roles Schema

To set up the authentication and roles system, you need to run the SQL migration file in your Supabase dashboard.

### Steps:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/tfmaotjdfpqtnsghdwnl/sql/new

2. Copy the contents of `supabase/migrations/20240101000000_create_authentication_schema.sql`

3. Paste it into the SQL Editor

4. Click "Run" to execute the migration

5. After running, go to Settings > API and click "Refresh" to update the TypeScript types

### What this migration creates:

- **app_role enum**: Defines all available roles (powerdesk, website_manager, dealer, sales, finance, inspection, user)
- **profiles table**: Stores user profile information (extends auth.users)
- **user_roles table**: Stores user-to-role mappings (CRITICAL: separate for security)
- **permission_modules table**: Defines all available modules/features
- **role_permissions table**: Maps roles to module permissions
- **user_permission_overrides table**: Allows PowerDesk to override permissions per user
- **Security functions**: `has_role()`, `get_user_roles()`, `has_module_permission()`
- **Trigger**: Automatically creates profile and assigns role on user signup
- **RLS Policies**: Ensures proper data access control

### Testing the setup:

After running the migration, you can test by:

1. Navigate to `/auth` on your application
2. Click "Sign Up"
3. Select a role (try "Customer/User" first)
4. Fill in username, full name, phone, and password
5. Sign up and then sign in
6. You should be redirected to the dashboard

### Troubleshooting:

If you encounter errors:
- Make sure the migration ran successfully without errors
- Check that RLS is enabled on all tables
- Verify the trigger is created properly
- Check the Supabase logs for any authentication errors
