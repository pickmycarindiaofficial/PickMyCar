import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, Flame, Users, Eye } from 'lucide-react';
import { RealTimeLead } from '@/hooks/useRealTimeLeads';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActiveLeadsFeedProps {
  leads: RealTimeLead[];
  onLeadClick: (userId: string) => void;
}

export function ActiveLeadsFeed({ leads, onLeadClick }: ActiveLeadsFeedProps) {
  const getIntentColor = (level: string) => {
    switch (level) {
      case 'hot': return 'destructive';
      case 'warm': return 'default';
      case 'cold': return 'secondary';
      default: return 'default';
    }
  };

  const getIntentIcon = (score: number) => {
    if (score >= 80) return <Flame className="h-4 w-4 text-red-500" />;
    if (score >= 60) return <Flame className="h-4 w-4 text-orange-500" />;
    return <Flame className="h-4 w-4 text-gray-400" />;
  };

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Active Leads
          <Badge variant="outline" className="ml-auto">{leads.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-3 p-6">
            {leads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active leads found</p>
                <p className="text-sm">Adjust filters to see more leads</p>
              </div>
            ) : (
              leads.map((lead) => (
                <Card
                  key={lead.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onLeadClick(lead.user_id)}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{lead.user_name}</h4>
                          {lead.is_active_now && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              Active Now
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {getIntentIcon(lead.intent_score)}
                        <span className="text-sm font-medium">{lead.intent_score}</span>
                      </div>
                    </div>

                    {/* Car Interest */}
                    <div className="mb-3">
                      <p className="text-sm font-medium">{lead.car_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{lead.car_year}</span>
                        <span>•</span>
                        <span>₹{(lead.car_price / 100000).toFixed(2)}L</span>
                      </div>
                    </div>

                    {/* Contact & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={getIntentColor(lead.intent_level)}>
                          {lead.intent_level}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          {lead.competing_dealers_count} dealers
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://wa.me/${lead.user_phone}`, '_blank');
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${lead.user_phone}`, '_blank');
                          }}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
