import { useNavigate } from 'react-router-dom';
import { Car, Calendar, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserCarStatus } from '@/hooks/useUserCarStatus';
import { Navbar } from '@/components/layout/Navbar';

export default function MyCarStatus() {
  const navigate = useNavigate();
  const { data, isLoading } = useUserCarStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-100 text-green-700';
      case 'pending_verification': return 'bg-yellow-100 text-yellow-700';
      case 'verified': return 'bg-blue-100 text-blue-700';
      case 'sold': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={() => {}} onNavigate={(view) => navigate(view === 'home' ? '/' : `/${view}`)} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Car className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">My Car Status</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Track your car activities and interests
          </p>
        </div>

        <Tabs defaultValue="selling" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="selling">Cars I'm Selling</TabsTrigger>
            <TabsTrigger value="interested">Cars I'm Interested In</TabsTrigger>
          </TabsList>

          <TabsContent value="selling" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : data?.selling && data.selling.length > 0 ? (
              <div className="grid gap-4">
                {data.selling.map((car: any) => (
                  <Card key={car.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {car.brands?.name} {car.models?.name} {car.year_of_make}
                              </h3>
                              <p className="text-sm text-muted-foreground">ID: {car.listing_id}</p>
                            </div>
                            <Badge className={getStatusColor(car.status)}>
                              {car.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div>
                              <p className="text-2xl font-bold">₹{car.expected_price?.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">Price</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{car.view_count || 0}</p>
                              <p className="text-sm text-muted-foreground">Views</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{car.enquiry_count || 0}</p>
                              <p className="text-sm text-muted-foreground">Enquiries</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No cars listed yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start selling your car to see it here
                </p>
                <Button onClick={() => navigate('/sell-car')}>Sell Your Car</Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="interested" className="space-y-6">
            {/* Test Drives */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Test Drive Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.testDrives && data.testDrives.length > 0 ? (
                  <div className="space-y-4">
                    {data.testDrives.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">
                            {booking.car_listings?.brands?.name} {booking.car_listings?.models?.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(booking.preferred_date).toLocaleDateString()} at {booking.preferred_time}
                          </p>
                        </div>
                        <Badge>{booking.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No test drives booked</p>
                )}
              </CardContent>
            </Card>

            {/* Conversations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  My Enquiries
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.conversations && data.conversations.length > 0 ? (
                  <div className="space-y-4">
                    {data.conversations.map((conv: any) => (
                      <div key={conv.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => navigate('/dashboard/messages')}>
                        <div>
                          <h4 className="font-medium">{conv.title || 'Conversation'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(conv.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No enquiries yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
