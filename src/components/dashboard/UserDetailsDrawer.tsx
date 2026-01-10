import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  User, Phone, Mail, MapPin, Calendar, 
  TrendingUp, Car, Heart, GitCompare, 
  Phone as PhoneCall, TestTube, Wallet, Search, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface UserDetailsDrawerProps {
  user: any | null;
  onClose: () => void;
}

export const UserDetailsDrawer = ({ user, onClose }: UserDetailsDrawerProps) => {
  if (!user) return null;
  
  const intentConfig = {
    hot: { icon: '🔥', color: 'bg-red-100 text-red-700 border-red-300', label: 'Hot' },
    warm: { icon: '🌤', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'Warm' },
    cold: { icon: '❄️', color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Cold' },
  };
  
  const intent = intentConfig[user.intent as keyof typeof intentConfig] || intentConfig.cold;
  
  return (
    <Sheet open={!!user} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[600px]">
        <ScrollArea className="h-full pr-4">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl">User Intelligence</SheetTitle>
            <p className="text-muted-foreground">{user.full_name}</p>
          </SheetHeader>
          
          {/* Incomplete Profile Alert */}
          {!user.quiz_completed && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900">Incomplete Profile</AlertTitle>
              <AlertDescription className="text-amber-800">
                User registered before onboarding quiz was implemented. 
                Key preferences like intent, budget, and buying mode are missing.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Profile Information */}
          <div className="space-y-6">
            <Section title="Profile Information">
              <InfoRow icon={<User className="h-4 w-4" />} label="Full Name" value={user.full_name} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={user.phone_number} />
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Username" value={user.username} />
              <InfoRow 
                icon={<Calendar className="h-4 w-4" />} 
                label="Registered" 
                value={format(new Date(user.registered_at), 'dd MMM yyyy')} 
              />
              <InfoRow 
                icon={<Calendar className="h-4 w-4" />} 
                label="Last Seen" 
                value={user.last_seen ? format(new Date(user.last_seen), 'dd MMM yyyy, HH:mm') : 'Never'} 
              />
              
              {user.city_name && user.city_name !== 'Unknown' && (
                <InfoRow 
                  icon={<MapPin className="h-4 w-4" />} 
                  label="Location" 
                  value={`${user.city_name}${user.state_name && user.state_name !== 'Unknown' ? `, ${user.state_name}` : ''}`}
                />
              )}
            </Section>
            
            <Separator />
            
            {/* Buying Intent */}
            <Section title="Buying Intent">
              <div className="flex items-center gap-2 mb-4">
                <Badge className={intent.color} variant="outline">
                  <span className="mr-1">{intent.icon}</span>
                  {intent.label}
                </Badge>
                {user.quiz_completed && (
                  <Badge variant="outline" className="bg-[#edf1ff] text-blue-700 border-blue-300">
                    ✅ Quiz Completed
                  </Badge>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Engagement Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          user.engagement_score >= 70 ? 'bg-green-500' : 
                          user.engagement_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(user.engagement_score, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{user.engagement_score || 0}</span>
                  </div>
                </div>
                
                <InfoRow label="Budget" value={user.budget_band || 'Not set'} />
                <InfoRow 
                  label="Buying Mode" 
                  value={
                    user.buying_mode === 'cash' ? '💳 Cash Purchase' :
                    user.buying_mode === 'loan' ? '🏦 Loan Required' :
                    user.buying_mode === 'undecided' ? '? Undecided' :
                    'Not set'
                  } 
                />
              </div>
            </Section>
            
            <Separator />
            
            {/* Preferences */}
            {user.preferred_brands && user.preferred_brands.length > 0 && (
              <>
                <Section title="Preferences">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Preferred Brands</p>
                      <div className="flex flex-wrap gap-2">
                        {user.preferred_brands.map((brand: string) => (
                          <Badge key={brand} variant="secondary">{brand}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    {user.body_type_affinity && Object.keys(user.body_type_affinity).length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Body Types</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(user.body_type_affinity).map((type: string) => (
                            <Badge key={type} variant="outline">{type}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Section>
                
                <Separator />
              </>
            )}
            
            {/* Behavioral Data */}
            <Section title="Behavioral Analytics">
              <div className="grid grid-cols-2 gap-4">
                <MetricCard icon={<Car />} label="Viewed" value={user.cars_viewed} />
                <MetricCard icon={<Heart />} label="Shortlisted" value={user.cars_shortlisted} />
                <MetricCard icon={<GitCompare />} label="Compared" value={user.cars_compared} />
                <MetricCard icon={<PhoneCall />} label="Contacts" value={user.dealer_contacts} />
                <MetricCard icon={<TestTube />} label="Test Drives" value={user.test_drives_requested} />
                <MetricCard icon={<Wallet />} label="Loan Checks" value={user.loan_checks} />
                <MetricCard icon={<Search />} label="Searches" value={user.searches_performed} />
                <MetricCard icon={<TrendingUp />} label="Sessions" value={user.total_sessions} />
              </div>
            </Section>
            
            <Separator />
            
            {/* Unmet Demand */}
            {user.unmet_demand_note && (
              <>
                <Section title="Unmet Demand">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                        {user.unmet_demand_urgency === 'hot' ? '🔥 Hot' :
                         user.unmet_demand_urgency === 'warm' ? '🌤 Warm' : '❄️ Cold'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Submitted {format(new Date(user.unmet_demand_submitted_at), 'dd MMM yyyy')}
                      </span>
                    </div>
                    <p className="text-sm mb-3">{user.unmet_demand_note}</p>
                    
                    {user.unmet_demand_specs && (
                      <div className="space-y-2">
                        {user.unmet_demand_specs.body_types?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground">Body Types:</span>
                            {user.unmet_demand_specs.body_types.map((type: string) => (
                              <Badge key={type} variant="secondary" className="text-xs">{type}</Badge>
                            ))}
                          </div>
                        )}
                        {user.unmet_demand_specs.fuel_types?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground">Fuel:</span>
                            {user.unmet_demand_specs.fuel_types.map((fuel: string) => (
                              <Badge key={fuel} variant="secondary" className="text-xs">{fuel}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Section>
                
                <Separator />
              </>
            )}
            
            {/* Actions */}
            <div className="flex flex-col gap-2 pb-6">
              <Button className="w-full">
                <Phone className="mr-2 h-4 w-4" />
                Contact User
              </Button>
              <Button variant="outline" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

// Helper components
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="font-semibold mb-3">{title}</h3>
    {children}
  </div>
);

const InfoRow = ({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

const MetricCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="border rounded-lg p-3 text-center bg-card">
    <div className="flex justify-center mb-1 text-muted-foreground">
      {icon}
    </div>
    <p className="text-2xl font-bold">{value || 0}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);
