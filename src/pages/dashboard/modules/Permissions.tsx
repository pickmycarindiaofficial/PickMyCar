import PlaceholderPage from '../PlaceholderPage';

export default function Permissions() {
  return (
    <PlaceholderPage
      title="Permission Manager"
      description="Configure role-based access control"
      features={[
        'Role permissions management',
        'Module access control',
        'User-specific overrides',
        'Permission templates',
        'Audit trail',
        'Bulk permission updates',
      ]}
    />
  );
}
