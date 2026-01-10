import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DemandGapsLeads from './DemandGapsLeads';
import DemandGapsAnalytics from './DemandGapsAnalytics';

export default function DemandGapsWrapper() {
  return (
    <div className="w-full">
      <Tabs defaultValue="leads" className="w-full">
        <div className="border-b px-6 pt-6">
          <TabsList className="h-12">
            <TabsTrigger value="leads" className="text-base">
              📋 Leads
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-base">
              📊 Analytics
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="leads" className="m-0">
          <DemandGapsLeads />
        </TabsContent>
        <TabsContent value="analytics" className="m-0">
          <DemandGapsAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
