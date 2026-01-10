import PlaceholderPage from '../PlaceholderPage';

export default function Inventory() {
  return (
    <PlaceholderPage
      title="My Inventory"
      description="Manage your car listings"
      features={[
        'Add new car listings',
        'Edit car details',
        'Upload car images',
        'Set pricing',
        'Manage availability',
        'View listing performance',
        'Bulk operations',
      ]}
    />
  );
}
