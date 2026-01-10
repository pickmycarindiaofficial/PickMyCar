import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
  features?: string[];
}

export default function PlaceholderPage({ title, description, features }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-primary" />
            Under Development
          </CardTitle>
          <CardDescription>
            This module is currently being built and will be available soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {features && features.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Planned Features:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="pt-4">
            <Button variant="outline">
              Request Early Access
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
