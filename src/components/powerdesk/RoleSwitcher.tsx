import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppRole, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ROLE_ORDER: AppRole[] = [
  'powerdesk',
  'website_manager',
  'dealer',
  'sales',
  'finance',
  'inspection',
  'user',
];

export function RoleSwitcher() {
  const { hasRole } = useAuth();

  if (!hasRole('powerdesk')) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role View Switcher
        </CardTitle>
        <CardDescription>
          Preview the dashboard from different role perspectives
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <Eye className="h-4 w-4" />
          <AlertDescription>
            As PowerDesk admin, you can view the system from any role's perspective.
            This helps you understand user experiences and permissions.
          </AlertDescription>
        </Alert>
        <div className="grid gap-3">
          {ROLE_ORDER.map((role) => (
            <Card key={role} className="hover:bg-muted/50 transition-colors">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{ROLE_LABELS[role]}</CardTitle>
                    <CardDescription className="text-sm">
                      {ROLE_DESCRIPTIONS[role]}
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View As
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
