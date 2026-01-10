import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  isDealer?: boolean;
  index?: number;
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
  className,
  isDealer = false,
  index = 0
}: StatsCardProps) {
  return isDealer ? (
    <Card className="shadow-sm border-0" style={{
      background: index === 0 
        ? 'linear-gradient(135deg, hsl(var(--dealer-card-gradient-start)) 0%, hsl(var(--dealer-card-gradient-end)) 100%)'
        : 'white',
      color: index === 0 ? 'white' : 'hsl(var(--dealer-text-primary))',
      borderRadius: '12px',
    }}>
      <CardContent className="p-5">
        {index === 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <Icon className="h-8 w-8 opacity-90" />
            </div>
            <p className="text-sm font-medium mb-2 opacity-90">{title}</p>
            <p className="text-3xl font-bold mb-2">{value}</p>
            <p className="text-xs opacity-70">All running and completed projects</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: index === 1 
                    ? 'hsl(var(--dealer-accent-green) / 0.15)' 
                    : index === 2 
                    ? 'hsl(var(--dealer-accent-purple) / 0.15)' 
                    : 'hsl(var(--dealer-accent-orange) / 0.15)'
                }}
              >
                <Icon 
                  className="h-5 w-5" 
                  style={{ 
                    color: index === 1 
                      ? 'hsl(var(--dealer-accent-green))' 
                      : index === 2 
                      ? 'hsl(var(--dealer-accent-purple))' 
                      : 'hsl(var(--dealer-accent-orange))' 
                  }} 
                />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{value}</p>
            <p className="text-xs font-medium" style={{ color: 'hsl(var(--dealer-text-secondary))' }}>
              {title}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  ) : (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend && (
              <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
                {trend.value}
              </span>
            )}
            {description && (
              <span className={trend ? 'ml-1' : ''}>
                {description}
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
