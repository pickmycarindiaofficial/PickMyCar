import { forwardRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ZoomIn, ZoomOut } from "lucide-react";
import StandardTemplate from "./SpecSheetTemplates/StandardTemplate";
import CompactTemplate from "./SpecSheetTemplates/CompactTemplate";
import PremiumTemplate from "./SpecSheetTemplates/PremiumTemplate";

interface SpecSheetPreviewProps {
  carData: any;
  dealerProfile: any;
  template: 'standard' | 'compact' | 'premium';
  selectedFields: string[];
  showPreview: boolean;
}

const SpecSheetPreview = forwardRef<HTMLDivElement, SpecSheetPreviewProps>(
  ({ carData, dealerProfile, template, selectedFields, showPreview }, ref) => {
    const [zoomLevel, setZoomLevel] = useState(0.65);

    if (!showPreview) {
      return (
        <Card className="p-12 flex flex-col items-center justify-center h-full text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="font-semibold mb-2">No Preview Available</h3>
            <p className="text-sm text-muted-foreground">
              Select a car and click "Preview Spec Sheet" to see the layout
            </p>
          </div>
        </Card>
      );
    }

    if (!carData) {
      return (
        <Card className="p-12 flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Loading car details...</p>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-muted/50 px-4 py-2 rounded-lg flex items-center justify-between">
          <span className="text-sm">
            <span className="font-semibold">Preview Mode:</span> What you see is what you print
          </span>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setZoomLevel(prev => Math.max(0.3, prev - 0.1))}
              className="h-7 w-7 p-0"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            
            <span className="text-xs font-mono bg-background px-2 py-1 rounded">
              {Math.round(zoomLevel * 100)}%
            </span>
            
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.1))}
              className="h-7 w-7 p-0"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setZoomLevel(0.65)}
              className="h-7 px-2 text-xs"
            >
              Reset
            </Button>
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden flex items-start justify-center" style={{ minHeight: 'calc(100vh - 16rem)' }}>
          <div 
            className="spec-sheet-preview-wrapper"
            style={{ '--zoom-level': zoomLevel } as React.CSSProperties}
          >
            <div ref={ref}>
              {template === 'standard' && (
                <StandardTemplate
                  carData={carData}
                  dealerProfile={dealerProfile}
                  selectedFields={selectedFields}
                />
              )}
              {template === 'compact' && (
                <CompactTemplate
                  carData={carData}
                  dealerProfile={dealerProfile}
                  selectedFields={selectedFields}
                />
              )}
              {template === 'premium' && (
                <PremiumTemplate
                  carData={carData}
                  dealerProfile={dealerProfile}
                  selectedFields={selectedFields}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SpecSheetPreview.displayName = 'SpecSheetPreview';

export default SpecSheetPreview;
