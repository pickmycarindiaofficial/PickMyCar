import { ActivityLogViewer } from '@/components/powerdesk/ActivityLogViewer';
import { RoleSwitcher } from '@/components/powerdesk/RoleSwitcher';

export default function ActivityMonitor() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Monitor</h1>
        <p className="text-muted-foreground">
          Real-time monitoring of all system activities
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <ActivityLogViewer />
        <RoleSwitcher />
      </div>
    </div>
  );
}
