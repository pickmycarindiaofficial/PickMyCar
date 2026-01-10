import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, FileText } from "lucide-react";
import StockListTab from "@/components/print/StockListTab";
import SpecSheetTab from "@/components/print/SpecSheetTab";
import { useAuth } from "@/contexts/AuthContext";

export default function PrintStockList() {
  const { roles } = useAuth();
  const isPowerDesk = roles?.includes('powerdesk');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Print Stock List</h1>
          <p className="text-muted-foreground mt-1">
            Export inventory lists or generate spec sheets for windshield display
          </p>
        </div>
        <Badge variant={isPowerDesk ? "default" : "secondary"}>
          {isPowerDesk ? "PowerDesk Admin" : "Dealer"}
        </Badge>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="stock-list" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="stock-list" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Stock List
            </TabsTrigger>
            <TabsTrigger value="spec-sheet" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Spec Sheet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock-list" className="space-y-6">
            <StockListTab />
          </TabsContent>

          <TabsContent value="spec-sheet" className="space-y-6">
            <SpecSheetTab />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
