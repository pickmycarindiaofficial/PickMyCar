# Security & Permissions Guide

## Phase 8: Security Infrastructure

This document explains the security and permissions infrastructure implemented in Phase 8.

## Overview

Phase 8 implements comprehensive role-based access control (RBAC) with:
- Server-side role validation
- Row-Level Security (RLS) policies
- Security audit logging
- Frontend permission checking

## User Roles

The system supports four role types:

- **user**: Regular end users (buyers)
- **dealer**: Car dealers/sellers
- **admin**: System administrators
- **powerdesk**: Super admins with full access

## Database Security

### User Roles Table

```sql
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);
```

### Security Functions

#### `has_role(_user_id, _role)`
Checks if a user has a specific role (SECURITY DEFINER function).

#### `current_user_has_role(_role)`
Checks if the authenticated user has a specific role.

#### `is_admin_or_powerdesk(_user_id)`
Checks if a user is an admin or powerdesk user.

#### `log_security_event(_action, _resource_type, _resource_id, _details)`
Logs security events to the audit trail.

### RLS Policies

All sensitive tables have RLS enabled with policies:

1. **Lead Enrichment**: Dealers can view their own leads, admins can view all
2. **Market Signals**: Dealers and admins can view, only admins can insert
3. **AI Suggestions**: Users can view their own suggestions, admins can view all
4. **Demand Gap Notifications**: Dealers can view and update their own
5. **Car Enquiries**: Users see their enquiries, dealers see enquiries for their listings
6. **Notifications**: Users can view and update their own notifications

## Frontend Usage

### Using the RoleCheck Hook

```typescript
import { useRoleCheck } from '@/hooks/useRoleCheck';

function MyComponent() {
  const { permissions, hasRole, hasAnyRole, isLoading } = useRoleCheck();

  if (isLoading) return <div>Loading...</div>;

  if (!hasRole('dealer')) {
    return <div>Access denied</div>;
  }

  return <div>Dealer content</div>;
}
```

### Using the RoleGate Component

```typescript
import { RoleGate } from '@/components/common/RoleGate';

function App() {
  return (
    <RoleGate allowedRoles={['dealer', 'admin']}>
      <DealerDashboard />
    </RoleGate>
  );
}
```

### Require All Roles

```typescript
<RoleGate 
  allowedRoles={['dealer', 'admin']} 
  requireAll={true}
>
  <SuperSecretContent />
</RoleGate>
```

### Custom Fallback

```typescript
<RoleGate 
  allowedRoles={['admin']} 
  fallback={<div>Please contact admin for access</div>}
>
  <AdminPanel />
</RoleGate>
```

## Security Audit Logging

### Log Security Events

```typescript
import { useSecurityAudit } from '@/hooks/useSecurityAudit';

function MyComponent() {
  const { logEvent } = useSecurityAudit();

  const handleSensitiveAction = async () => {
    await logEvent({
      action: 'delete_listing',
      resourceType: 'car_listing',
      resourceId: listingId,
      details: { reason: 'User requested deletion' }
    });
    
    // Perform the action
  };
}
```

### View Audit Logs (Admins Only)

```sql
SELECT 
  user_id,
  action,
  resource_type,
  resource_id,
  details,
  created_at
FROM security_audit_log
ORDER BY created_at DESC
LIMIT 100;
```

## Assigning Roles

### Via SQL (Admin Access Required)

```sql
-- Assign dealer role to a user
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'dealer');

-- Assign multiple roles
INSERT INTO user_roles (user_id, role) VALUES
  ('user-uuid-here', 'dealer'),
  ('user-uuid-here', 'admin');
```

### Programmatically (Future Feature)

A UI for role management will be added in a future phase.

## Best Practices

### 1. Always Use Server-Side Validation

❌ **WRONG**: Client-side only checks
```typescript
if (localStorage.getItem('isAdmin') === 'true') {
  // Show admin content
}
```

✅ **CORRECT**: Server-side role validation
```typescript
const { hasRole } = useRoleCheck();
if (hasRole('admin')) {
  // Show admin content
}
```

### 2. Protect Edge Functions

Always check roles in edge functions:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(/* ... */);

// Get authenticated user
const { data: { user } } = await supabase.auth.getUser();

// Check role using security definer function
const { data: hasPermission } = await supabase
  .rpc('current_user_has_role', { _role: 'admin' });

if (!hasPermission) {
  return new Response('Forbidden', { status: 403 });
}
```

### 3. Log Sensitive Operations

Always log actions that:
- Modify sensitive data
- Grant/revoke permissions
- Delete records
- Export data

```typescript
await logEvent({
  action: 'export_user_data',
  resourceType: 'users',
  details: { count: users.length }
});
```

### 4. Use RoleGate for UI Components

Protect entire sections of UI:

```typescript
<RoleGate allowedRoles={['dealer', 'admin']}>
  <SensitiveStats />
</RoleGate>
```

### 5. Combine with PermissionGate

For fine-grained control, use both role and permission checks:

```typescript
<RoleGate allowedRoles={['dealer']}>
  <PermissionGate resource="lead" action="view">
    <LeadsList />
  </PermissionGate>
</RoleGate>
```

## Testing Security

### Test RLS Policies

```sql
-- Test as a specific user
SET request.jwt.claims.sub = 'user-uuid-here';

-- Try to access data
SELECT * FROM lead_enrichment;

-- Reset
RESET request.jwt.claims.sub;
```

### Test Role Functions

```sql
-- Check if user has role
SELECT has_role('user-uuid-here', 'dealer');

-- Get all roles for user
SELECT * FROM get_user_roles('user-uuid-here');
```

## Security Considerations

1. **Never store roles in localStorage or client-side storage**
2. **Always validate roles server-side** using security definer functions
3. **Use RLS policies** to protect data at the database level
4. **Log all sensitive operations** to the audit trail
5. **Review audit logs regularly** for suspicious activity
6. **Grant least privilege** - only assign roles needed
7. **Use SECURITY DEFINER carefully** - only for role-checking functions

## Migration Steps

To apply Phase 8 security:

1. Run `phase8_security_permissions.sql` in Supabase SQL Editor
2. Verify all functions were created successfully
3. Assign initial roles to users
4. Test role-based access in the application
5. Monitor audit logs for any issues

## Troubleshooting

### User Can't Access Content

1. Check user has required role:
```sql
SELECT * FROM user_roles WHERE user_id = 'user-uuid';
```

2. Check RLS policies allow access:
```sql
SELECT * FROM pg_policies WHERE tablename = 'table_name';
```

### Functions Not Working

1. Ensure functions are SECURITY DEFINER:
```sql
SELECT routine_name, security_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%role%';
```

2. Check function search path is set to 'public'

### Audit Logs Not Recording

1. Verify audit log table exists and has RLS enabled
2. Check if `log_security_event` function exists
3. Ensure function is called with correct parameters

## Support

For security issues or questions:
1. Check the audit logs for error details
2. Review RLS policies and function definitions
3. Test with a known working user/role combination
4. Contact system administrator
