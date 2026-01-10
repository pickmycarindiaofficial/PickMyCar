import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DealerFullProfile } from '@/hooks/useDealerFullProfile';

interface DealerAboutSectionProps {
  dealer: DealerFullProfile;
}

export function DealerAboutSection({ dealer }: DealerAboutSectionProps) {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const aboutText = dealer.about_text ||
    `${dealer.dealership_name} is a trusted name in the ${dealer.city} automotive market${
      dealer.year_established ? `, serving customers since ${dealer.year_established}` : ''
    }. We specialize in providing quality pre-owned vehicles with complete transparency and excellent after-sales support.`;

  return (
    <div className="space-y-3">
      {/* About Us - Collapsible */}
      {dealer.show_about !== false && (
        <Collapsible open={isAboutOpen} onOpenChange={setIsAboutOpen}>
          <Card>
            <CardContent className="p-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <span className="font-semibold text-sm">About {dealer.dealership_name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isAboutOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>{aboutText}</p>
                  {dealer.certifications && dealer.certifications.length > 0 && (
                    <div className="pt-2 border-t">
                      <span className="font-semibold text-foreground">Certifications: </span>
                      {dealer.certifications.join(', ')}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </CardContent>
          </Card>
        </Collapsible>
      )}

    </div>
  );
}
