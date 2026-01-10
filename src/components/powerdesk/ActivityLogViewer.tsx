import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import {
  Activity,
  User,
  Database,
  FileText,
  Settings,
  AlertCircle,
} from 'lucide-react';

const ACTION_ICONS: Record<string, any> = {
  create: Database,
  update: FileText,
  delete: AlertCircle,
  login: User,
  logout: User,
  view: Activity,
  default: Settings,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-500/10 text-green-500',
  update: 'bg-blue-500/10 text-blue-500',
  delete: 'bg-red-500/10 text-red-500',
  login: 'bg-purple-500/10 text-purple-500',
  logout: 'bg-gray-500/10 text-gray-500',
  view: 'bg-cyan-500/10 text-cyan-500',
};

export function ActivityLogViewer() {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');

  const { logs, loading } = useActivityLogs({
    action: actionFilter === 'all' ? undefined : actionFilter,
    entityType: entityTypeFilter === 'all' ? undefined : entityTypeFilter,
    limit: 200,
  });

  const getActionIcon = (action: string) => {
    const Icon = ACTION_ICONS[action] || ACTION_ICONS.default;
    return Icon;
  };

  const getActionColor = (action: string) => {
    return ACTION_COLORS[action] || 'bg-gray-500/10 text-gray-500';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Activity Monitor</CardTitle>
        <div className="flex gap-4 mt-4">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="view">View</SelectItem>
            </SelectContent>
          </Select>

          <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="car">Cars</SelectItem>
              <SelectItem value="lead">Leads</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="master_data">Master Data</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No activity logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const Icon = getActionIcon(log.action);
                return (
                  <div
                    key={log.id}
                    className="flex gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(
                        log.action
                      )}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize">
                          {log.action}
                        </Badge>
                        <Badge variant="secondary">{log.entity_type}</Badge>
                        {log.user && (
                          <span className="text-sm text-muted-foreground">
                            by {log.user.username}
                          </span>
                        )}
                      </div>
                      {log.details && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {typeof log.details === 'string'
                            ? log.details
                            : JSON.stringify(log.details, null, 2)}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        {log.ip_address && <span>IP: {log.ip_address}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
