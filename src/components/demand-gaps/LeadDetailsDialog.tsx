import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DemandGapTableRow } from '@/hooks/useDemandGapsTable';
import { ShareButtons } from './ShareButtons';
import { StatusDropdown } from './StatusDropdown';
import { formatDistanceToNow } from 'date-fns';
import { Phone, Mail, MapPin, Calendar, TrendingUp, Eye, MessageSquare, MessageCircle } from 'lucide-react';

interface LeadDetailsDialogProps {
  lead: DemandGapTableRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailsDialog({ lead, open, onOpenChange }: LeadDetailsDialogProps) {
  if (!lead) return null;

  const getPriorityLabel = (score: number) => {
    if (score >= 80) return { text: '🔥 HOT', color: 'bg-red-500' };
    if (score >= 50) return { text: '📌 WARM', color: 'bg-orange-500' };
    return { text: '❄️ COLD', color: 'bg-gray-500' };
  };

  const priority = getPriorityLabel(lead.priority_score);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Lead Details</span>
            <div className="flex items-center gap-2">
              <Badge className={priority.color}>{priority.text}</Badge>
              <StatusDropdown currentStatus={lead.status} leadId={lead.id} />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{lead.user_name[0]}</AvatarFallback>
              </Avatar>
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="font-medium">{lead.user_name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone Number</Label>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{lead.user_phone}</p>
                  {lead.user_phone !== 'Not provided' && (
                    <Button size="sm" variant="ghost" className="h-6 px-2" asChild>
                      <a href={`tel:${lead.user_phone}`}>
                        <Phone className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Location</Label>
                <p className="font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {lead.city || 'Not specified'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Lead Date</Label>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Car Requirements */}
          <div className="space-y-3">
            <h3 className="font-semibold">Car Requirements</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-primary/5 rounded-lg">
                <Label className="text-xs text-muted-foreground">Budget Range</Label>
                <p className="font-semibold text-primary">
                  ₹{lead.budget_min?.toLocaleString() || '0'} - ₹{lead.budget_max?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <Label className="text-xs text-muted-foreground">Fuel Type</Label>
                <p className="font-medium">{lead.fuel_type_names}</p>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <Label className="text-xs text-muted-foreground">Year Range</Label>
                <p className="font-medium">
                  {lead.year_min && lead.year_max ? `${lead.year_min} - ${lead.year_max}` : 'Any'}
                </p>
              </div>
            </div>

            {lead.note && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Label className="text-xs text-muted-foreground">Customer Note / Requirements</Label>
                <p className="mt-1 text-sm">{lead.note}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Lead Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg text-center">
              <Eye className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{lead.view_count}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <MessageSquare className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{lead.response_count}</p>
              <p className="text-xs text-muted-foreground">Responses</p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{lead.priority_score}</p>
              <p className="text-xs text-muted-foreground">Priority Score</p>
            </div>
          </div>

          <Separator />

          {/* Dealer Responses */}
          {lead.dealer_responses && lead.dealer_responses.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Dealer Responses ({lead.dealer_responses.length})</h3>
              {lead.dealer_responses.map((response: any, idx: number) => (
                <div key={idx} className="p-3 bg-[#edf1ff] border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{response.dealer_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{response.dealer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(response.responded_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-500">
                      {response.response_type === 'have_cars' ? '✓ Has Cars' :
                       response.response_type === 'can_source' ? '🔍 Can Source' : '❌ No Match'}
                    </Badge>
                  </div>
                  {response.message && (
                    <p className="text-sm mt-2">{response.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <ShareButtons lead={lead} />
            <div className="flex gap-2">
              {lead.user_phone !== 'Not provided' && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${lead.user_phone}`}>
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://wa.me/${lead.user_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      WhatsApp
                    </a>
                  </Button>
                </>
              )}
              <Button variant="default" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
