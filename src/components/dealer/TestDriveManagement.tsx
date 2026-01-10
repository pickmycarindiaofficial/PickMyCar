import { useState } from 'react';
import { useTestDriveBookings } from '@/hooks/useTestDriveBookings';
import { useUpdateTestDriveStatus } from '@/hooks/useUpdateTestDriveStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Phone, User, Car, MapPin, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export function TestDriveManagement() {
  const { data: bookings = [], isLoading } = useTestDriveBookings();
  const updateStatus = useUpdateTestDriveStatus();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [action, setAction] = useState<'confirm' | 'reschedule' | 'cancel' | null>(null);
  const [notes, setNotes] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');

  const statusColors = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-green-500',
    rescheduled: 'bg-blue-500',
    cancelled: 'bg-red-500',
    completed: 'bg-gray-500',
    no_show: 'bg-orange-500',
  };

  const pendingBookings = bookings.filter((b: any) => b.status === 'pending');
  const upcomingBookings = bookings.filter((b: any) => 
    ['confirmed', 'rescheduled'].includes(b.status) && new Date(b.preferred_date) >= new Date()
  );
  const pastBookings = bookings.filter((b: any) => 
    ['completed', 'cancelled', 'no_show'].includes(b.status) || new Date(b.preferred_date) < new Date()
  );

  const handleAction = (booking: any, actionType: 'confirm' | 'reschedule' | 'cancel') => {
    setSelectedBooking(booking);
    setAction(actionType);
    setNotes('');
    setNewDate('');
    setNewTimeSlot('');
  };

  const handleSubmit = () => {
    if (!selectedBooking || !action) return;

    const statusMap = {
      confirm: 'confirmed' as const,
      reschedule: 'rescheduled' as const,
      cancel: 'cancelled' as const,
    };

    updateStatus.mutate({
      bookingId: selectedBooking.id,
      status: statusMap[action],
      notes,
      newDate: action === 'reschedule' ? newDate : undefined,
      newTimeSlot: action === 'reschedule' ? newTimeSlot : undefined,
    }, {
      onSuccess: () => {
        setSelectedBooking(null);
        setAction(null);
      }
    });
  };

  const BookingCard = ({ booking }: { booking: any }) => {
    const carInfo = booking.car_listings;
    const customer = booking.profiles;
    const photoUrl = carInfo?.photos?.[0] || '/placeholder.svg';

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <img 
              src={photoUrl} 
              alt="Car" 
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {carInfo?.brands?.name} {carInfo?.models?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{carInfo?.variant}</p>
                </div>
                <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                  {booking.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{customer?.full_name || 'Guest'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{customer?.phone_number || booking.guest_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{format(new Date(booking.preferred_date), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{booking.time_slot}</span>
                </div>
              </div>

              {booking.notes && (
                <p className="text-sm text-muted-foreground italic">{booking.notes}</p>
              )}

              {booking.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleAction(booking, 'confirm')}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Confirm
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAction(booking, 'reschedule')}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reschedule
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleAction(booking, 'cancel')}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading bookings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Drive Management</h1>
        <p className="text-muted-foreground">Manage your test drive appointments</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending bookings
              </CardContent>
            </Card>
          ) : (
            pendingBookings.map((booking: any) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No upcoming bookings
              </CardContent>
            </Card>
          ) : (
            upcomingBookings.map((booking: any) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastBookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No past bookings
              </CardContent>
            </Card>
          ) : (
            pastBookings.map((booking: any) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!action} onOpenChange={() => setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'confirm' && 'Confirm Test Drive'}
              {action === 'reschedule' && 'Reschedule Test Drive'}
              {action === 'cancel' && 'Cancel Test Drive'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {action === 'reschedule' && (
              <>
                <div>
                  <Label>New Date</Label>
                  <Input 
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label>New Time Slot</Label>
                  <Input 
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    placeholder="e.g., 10:00-10:30"
                  />
                </div>
              </>
            )}

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for the customer..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={action === 'reschedule' && (!newDate || !newTimeSlot)}
            >
              {action === 'confirm' && 'Confirm'}
              {action === 'reschedule' && 'Reschedule'}
              {action === 'cancel' && 'Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
