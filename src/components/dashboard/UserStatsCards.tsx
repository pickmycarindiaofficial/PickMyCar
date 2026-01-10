import { Card } from '@/components/ui/card';
import { Flame, Sun, Snowflake, UserPlus } from 'lucide-react';

interface UserStatsCardsProps {
  stats?: {
    hot: number;
    warm: number;
    cold: number;
    new: number;
    total: number;
  };
}

export const UserStatsCards = ({ stats }: UserStatsCardsProps) => {
  return (
    <div className="flex gap-4 min-w-max">
      <Card className="min-w-[240px] p-5 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Hot Leads</p>
            <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-1">{stats?.hot || 0}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">Ready to buy now</p>
          </div>
          <Flame className="h-10 w-10 text-red-500" />
        </div>
      </Card>
      
      <Card className="min-w-[240px] p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Warm Leads</p>
            <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">{stats?.warm || 0}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">Within 30 days</p>
          </div>
          <Sun className="h-10 w-10 text-yellow-500" />
        </div>
      </Card>
      
      <Card className="min-w-[240px] p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Cold Leads</p>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{stats?.cold || 0}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Just exploring</p>
          </div>
          <Snowflake className="h-10 w-10 text-blue-500" />
        </div>
      </Card>
      
      <Card className="min-w-[240px] p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-300">New Users</p>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">{stats?.new || 0}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">Last 7 days</p>
          </div>
          <UserPlus className="h-10 w-10 text-green-500" />
        </div>
      </Card>
    </div>
  );
};
